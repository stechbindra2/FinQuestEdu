import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { QuizModule } from './quiz/quiz.module';
import { AdaptiveModule } from './adaptive/adaptive.module';
import { GamificationModule } from './gamification/gamification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CurriculumModule,
    QuizModule,
    AdaptiveModule,
    GamificationModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
