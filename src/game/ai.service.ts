import { Injectable } from '@nestjs/common';
import { GameLogicService } from './game-logic.service';
import { GameState } from './types';

export interface AiAction {
  type: 'play-card' | 'attack' | 'end-turn';
  cardId?: string;
  boardIndex?: number;
  attackerId?: string;
  targetId?: string;
}

@Injectable()
export class AiService {
  constructor(private logic: GameLogicService) {}

  computeActions(state: GameState): AiAction[] {
    const actions: AiAction[] = [];
    const ai = state.players.ai;

    const playableCards = [...ai.hand]
      .filter((c) => c.manaCost <= ai.mana)
      .sort((a, b) => b.manaCost - a.manaCost);

    let remainingMana = ai.mana;
    for (const card of playableCards) {
      if (card.manaCost <= remainingMana && ai.board.length < 7) {
        actions.push({ type: 'play-card', cardId: card.id, boardIndex: ai.board.length });
        remainingMana -= card.manaCost;
      }
    }

    for (const minion of ai.board) {
      if (minion.canAttack && !minion.exhausted) {
        const enemyBoard = state.players.human.board;
        if (enemyBoard.length > 0) {
          const target = enemyBoard[Math.floor(Math.random() * enemyBoard.length)];
          actions.push({ type: 'attack', attackerId: minion.id, targetId: target.id });
        } else {
          actions.push({ type: 'attack', attackerId: minion.id, targetId: 'hero' });
        }
      }
    }

    actions.push({ type: 'end-turn' });
    return actions;
  }
}
