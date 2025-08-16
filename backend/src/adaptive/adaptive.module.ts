import { Module } from '@nestjs/common';
import { AdaptiveController } from './adaptive.controller';
import { AdaptiveService } from './adaptive.service';
import { ContextualBanditService } from './contextual-bandit.service';
import { AiContentService } from './ai-content.service';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CurriculumModule, UsersModule],
  controllers: [AdaptiveController],
  providers: [AdaptiveService, ContextualBanditService, AiContentService],
  exports: [AdaptiveService, ContextualBanditService, AiContentService],
})
export class AdaptiveModule {}
