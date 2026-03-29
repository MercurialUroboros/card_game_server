import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Card, PlayerState, ClientGameState } from './types';
import { CARD_POOL } from './card-pool';

@Injectable()
export class GameStateService {
  private games = new Map<string, GameState>();

  createGame(roomId: string): GameState {
    const state: GameState = {
      roomId,
      turn: 0,
      currentPlayer: 'human',
      phase: 'playing',
      players: {
        human: this.createPlayer(),
        ai: this.createPlayer(),
      },
    };

    for (let i = 0; i < 3; i++) {
      this.drawCard(state.players.human);
      this.drawCard(state.players.ai);
    }

    this.games.set(roomId, state);
    return state;
  }

  getGame(roomId: string): GameState | undefined {
    return this.games.get(roomId);
  }

  removeGame(roomId: string): void {
    this.games.delete(roomId);
  }

  startTurn(state: GameState): void {
    const player = state.players[state.currentPlayer];

    state.turn++;

    if (player.maxMana < 10) {
      player.maxMana++;
    }
    player.mana = player.maxMana;

    this.drawCard(player);

    for (const minion of player.board) {
      minion.canAttack = true;
      minion.exhausted = false;
    }
  }

  drawCard(player: PlayerState): Card | null {
    if (player.deck.length === 0) {
      player.fatigue++;
      player.hp -= player.fatigue;
      return null;
    }
    const card = player.deck.pop()!;
    if (player.hand.length < 10) {
      player.hand.push(card);
      return card;
    }
    return null;
  }

  toClientState(state: GameState): ClientGameState {
    return {
      roomId: state.roomId,
      turn: state.turn,
      currentPlayer: state.currentPlayer,
      phase: state.phase,
      winner: state.winner,
      player: {
        hp: state.players.human.hp,
        mana: state.players.human.mana,
        maxMana: state.players.human.maxMana,
        hand: state.players.human.hand,
        board: state.players.human.board,
        deckSize: state.players.human.deck.length,
      },
      opponent: {
        hp: state.players.ai.hp,
        mana: state.players.ai.mana,
        maxMana: state.players.ai.maxMana,
        handSize: state.players.ai.hand.length,
        board: state.players.ai.board,
        deckSize: state.players.ai.deck.length,
      },
    };
  }

  private createPlayer(): PlayerState {
    return {
      hp: 30,
      mana: 0,
      maxMana: 0,
      fatigue: 0,
      hand: [],
      board: [],
      deck: this.createDeck(),
    };
  }

  private createDeck(): Card[] {
    const deck: Card[] = [];
    for (const def of CARD_POOL) {
      for (let i = 0; i < 2; i++) {
        deck.push({
          id: uuidv4(),
          definitionId: def.id,
          name: def.name,
          manaCost: def.manaCost,
          attack: def.attack,
          health: def.health,
          maxHealth: def.health,
          color: def.color,
          canAttack: false,
          exhausted: false,
        });
      }
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
}
