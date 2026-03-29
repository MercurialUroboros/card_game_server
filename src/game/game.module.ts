import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameStateService } from './game-state.service';
import { GameLogicService } from './game-logic.service';
import { AiService } from './ai.service';

@Module({
  providers: [GameGateway, GameStateService, GameLogicService, AiService],
})
export class GameModule {}
