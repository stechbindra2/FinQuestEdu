import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import { SUPABASE_CLIENT } from '../database/database.module';
import { CreateUserDto, LoginDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password, full_name, grade, role = 'student' } = createUserDto;

    // Check if user already exists
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new ConflictException(`Registration failed: ${authError.message}`);
    }

    // Create user profile
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        grade: role === 'student' ? grade : null,
        role,
      })
      .select()
      .single();

    if (userError) {
      // Cleanup auth user if profile creation fails
      await this.supabase.auth.admin.deleteUser(authData.user.id);
      throw new ConflictException(`Profile creation failed: ${userError.message}`);
    }

    // Initialize user stats for students
    if (role === 'student') {
      await this.usersService.initializeUserStats(userData.id);
      await this.usersService.createUserProfile(userData.id);
    }

    const payload = { sub: userData.id, email: userData.email, role: userData.role };
    const token = this.jwtService.sign(payload);

    return {
      user: userData,
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Authenticate with Supabase
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user profile
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      throw new UnauthorizedException('User profile not found');
    }

    // Update last activity
    await this.usersService.updateLastActivity(userData.id);

    const payload = { sub: userData.id, email: userData.email, role: userData.role };
    const token = this.jwtService.sign(payload);

    return {
      user: userData,
      access_token: token,
    };
  }

  async validateUser(userId: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async refreshToken(userId: string) {
    const user = await this.validateUser(userId);
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
    };
  }
}
