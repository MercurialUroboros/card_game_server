import { Injectable } from '@nestjs/common';
import { GameState } from './types';

export interface ActionResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class GameLogicService {
  playCard(state: GameState, player: 'human' | 'ai', cardId: string, boardIndex: number): ActionResult {
    const playerState = state.players[player];
    const cardIndex = playerState.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };
    const card = playerState.hand[cardIndex];
    if (card.manaCost > playerState.mana) return { success: false, error: 'Not enough mana' };
    if (playerState.board.length >= 7) return { success: false, error: 'board is full' };
    playerState.mana -= card.manaCost;
    playerState.hand.splice(cardIndex, 1);
    card.canAttack = false;
    card.exhausted = false;
    const clampedIndex = Math.max(0, Math.min(boardIndex, playerState.board.length));
    playerState.board.splice(clampedIndex, 0, card);
    return { success: true };
  }

  attack(state: GameState, player: 'human' | 'ai', attackerId: string, targetId: string): ActionResult {
    const playerState = state.players[player];
    const opponentKey = player === 'human' ? 'ai' : 'human';
    const opponentState = state.players[opponentKey];
    const attacker = playerState.board.find((c) => c.id === attackerId);
    if (!attacker) return { success: false, error: 'Attacker not found on board' };
    if (!attacker.canAttack) return { success: false, error: 'Minion cannot attack (summoning sickness)' };
    if (attacker.exhausted) return { success: false, error: 'Minion already attacked this turn' };

    if (targetId === 'hero') {
      opponentState.hp -= attacker.attack;
      attacker.exhausted = true;
      if (opponentState.hp <= 0) {
        state.phase = 'finished';
        state.winner = player;
      }
      return { success: true };
    }

    const target = opponentState.board.find((c) => c.id === targetId);
    if (!target) return { success: false, error: 'Target not found on opponent board' };
    target.health -= attacker.attack;
    attacker.health -= target.attack;
    attacker.exhausted = true;
    if (target.health <= 0) opponentState.board = opponentState.board.filter((c) => c.id !== targetId);
    if (attacker.health <= 0) playerState.board = playerState.board.filter((c) => c.id !== attackerId);
    return { success: true };
  }

  endTurn(state: GameState): void {
    state.currentPlayer = state.currentPlayer === 'human' ? 'ai' : 'human';
  }
}
