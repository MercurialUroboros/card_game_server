export interface CardDefinition {
  id: string;
  name: string;
  manaCost: number;
  attack: number;
  health: number;
  color: string;
}

export interface Card {
  id: string;
  definitionId: string;
  name: string;
  manaCost: number;
  attack: number;
  health: number;
  maxHealth: number;
  color: string;
  canAttack: boolean;
  exhausted: boolean;
}

export interface PlayerState {
  hp: number;
  mana: number;
  maxMana: number;
  fatigue: number;
  hand: Card[];
  board: Card[];
  deck: Card[];
}

export interface GameState {
  roomId: string;
  turn: number;
  currentPlayer: 'human' | 'ai';
  phase: 'waiting' | 'playing' | 'finished';
  winner?: 'human' | 'ai';
  players: {
    human: PlayerState;
    ai: PlayerState;
  };
}

export interface ClientGameState {
  roomId: string;
  turn: number;
  currentPlayer: 'human' | 'ai';
  phase: 'waiting' | 'playing' | 'finished';
  winner?: 'human' | 'ai';
  player: {
    hp: number;
    mana: number;
    maxMana: number;
    hand: Card[];
    board: Card[];
    deckSize: number;
  };
  opponent: {
    hp: number;
    mana: number;
    maxMana: number;
    handSize: number;
    board: Card[];
    deckSize: number;
  };
}

export interface PlayCardPayload {
  cardId: string;
  boardIndex: number;
}

export interface AttackPayload {
  attackerId: string;
  targetId: string;
}

export interface GameAction {
  type: 'play-card' | 'attack' | 'end-turn' | 'draw-card' | 'turn-start' | 'fatigue' | 'minion-death' | 'hero-death';
  player: 'human' | 'ai';
  data?: any;
}
