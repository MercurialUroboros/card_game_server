import { GameLogicService } from './game-logic.service';
import { GameStateService } from './game-state.service';
import { GameState } from './types';

describe('GameLogicService', () => {
  let logic: GameLogicService;
  let stateService: GameStateService;
  let state: GameState;

  beforeEach(() => {
    stateService = new GameStateService();
    logic = new GameLogicService();
    state = stateService.createGame('room-1');
    state.players.human.mana = 5;
    state.players.human.maxMana = 5;
  });

  describe('playCard', () => {
    it('should move card from hand to board at specified index', () => {
      const card = state.players.human.hand[0];
      card.manaCost = 1;
      const handSize = state.players.human.hand.length;
      const result = logic.playCard(state, 'human', card.id, 0);
      expect(result.success).toBe(true);
      expect(state.players.human.board[0].id).toBe(card.id);
      expect(state.players.human.hand.length).toBe(handSize - 1);
    });

    it('should deduct mana cost', () => {
      const card = state.players.human.hand[0];
      card.manaCost = 3;
      logic.playCard(state, 'human', card.id, 0);
      expect(state.players.human.mana).toBe(2);
    });

    it('should fail if not enough mana', () => {
      const card = state.players.human.hand[0];
      card.manaCost = 10;
      const result = logic.playCard(state, 'human', card.id, 0);
      expect(result.success).toBe(false);
      expect(result.error).toContain('mana');
    });

    it('should fail if board is full (7 minions)', () => {
      state.players.human.board = Array.from({ length: 7 }, (_, i) => ({
        id: `m${i}`, definitionId: 'wolf', name: 'Wolf',
        manaCost: 2, attack: 3, health: 2, maxHealth: 2,
        color: '#696969', canAttack: true, exhausted: false,
      }));
      const card = state.players.human.hand[0];
      card.manaCost = 1;
      const result = logic.playCard(state, 'human', card.id, 0);
      expect(result.success).toBe(false);
      expect(result.error).toContain('board');
    });

    it('should set summoning sickness', () => {
      const card = state.players.human.hand[0];
      card.manaCost = 1;
      logic.playCard(state, 'human', card.id, 0);
      expect(state.players.human.board[0].canAttack).toBe(false);
      expect(state.players.human.board[0].exhausted).toBe(false);
    });

    it('should insert at correct board index', () => {
      const card1 = state.players.human.hand[0];
      card1.manaCost = 0;
      logic.playCard(state, 'human', card1.id, 0);
      const card2 = state.players.human.hand[0];
      card2.manaCost = 0;
      logic.playCard(state, 'human', card2.id, 1);
      const card3 = state.players.human.hand[0];
      card3.manaCost = 0;
      logic.playCard(state, 'human', card3.id, 1);
      expect(state.players.human.board[0].id).toBe(card1.id);
      expect(state.players.human.board[1].id).toBe(card3.id);
      expect(state.players.human.board[2].id).toBe(card2.id);
    });
  });

  describe('attack', () => {
    beforeEach(() => {
      state.players.human.board = [{
        id: 'h1', definitionId: 'knight', name: 'Knight',
        manaCost: 3, attack: 3, health: 3, maxHealth: 3,
        color: '#C0C0C0', canAttack: true, exhausted: false,
      }];
      state.players.ai.board = [{
        id: 'a1', definitionId: 'footman', name: 'Footman',
        manaCost: 2, attack: 2, health: 3, maxHealth: 3,
        color: '#4682B4', canAttack: false, exhausted: false,
      }];
      state.currentPlayer = 'human';
    });

    it('should deal damage to both minions when attacking a minion', () => {
      const result = logic.attack(state, 'human', 'h1', 'a1');
      expect(result.success).toBe(true);
      expect(state.players.human.board[0].health).toBe(1);
      expect(state.players.ai.board.length).toBe(0);
    });

    it('should remove dead minions from both sides', () => {
      state.players.human.board[0].health = 2;
      state.players.human.board[0].attack = 3;
      state.players.ai.board[0].health = 3;
      state.players.ai.board[0].attack = 5;
      logic.attack(state, 'human', 'h1', 'a1');
      expect(state.players.human.board.length).toBe(0);
      expect(state.players.ai.board.length).toBe(0);
    });

    it('should deal damage to hero when targeting hero', () => {
      const result = logic.attack(state, 'human', 'h1', 'hero');
      expect(result.success).toBe(true);
      expect(state.players.ai.hp).toBe(27);
    });

    it('should mark attacker as exhausted', () => {
      logic.attack(state, 'human', 'h1', 'hero');
      expect(state.players.human.board[0].exhausted).toBe(true);
    });

    it('should fail if attacker has summoning sickness', () => {
      state.players.human.board[0].canAttack = false;
      const result = logic.attack(state, 'human', 'h1', 'a1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('attack');
    });

    it('should fail if attacker is exhausted', () => {
      state.players.human.board[0].exhausted = true;
      const result = logic.attack(state, 'human', 'h1', 'a1');
      expect(result.success).toBe(false);
    });

    it('should set winner when hero HP reaches 0', () => {
      state.players.ai.hp = 2;
      logic.attack(state, 'human', 'h1', 'hero');
      expect(state.players.ai.hp).toBe(-1);
      expect(state.phase).toBe('finished');
      expect(state.winner).toBe('human');
    });
  });

  describe('endTurn', () => {
    it('should switch current player', () => {
      state.currentPlayer = 'human';
      logic.endTurn(state);
      expect(state.currentPlayer).toBe('ai');
    });

    it('should toggle back to human', () => {
      state.currentPlayer = 'ai';
      logic.endTurn(state);
      expect(state.currentPlayer).toBe('human');
    });
  });
});
