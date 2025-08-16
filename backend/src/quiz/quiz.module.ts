import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CurriculumModule, UsersModule],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
