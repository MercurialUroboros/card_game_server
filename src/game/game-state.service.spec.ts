import { GameStateService } from './game-state.service';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    service = new GameStateService();
  });

  describe('createGame', () => {
    it('should create a game with correct initial state', () => {
      const state = service.createGame('room-1');

      expect(state.roomId).toBe('room-1');
      expect(state.turn).toBe(0);
      expect(state.phase).toBe('playing');
      expect(state.players.human.hp).toBe(30);
      expect(state.players.ai.hp).toBe(30);
      expect(state.players.human.mana).toBe(0);
      expect(state.players.human.maxMana).toBe(0);
      expect(state.players.human.hand.length).toBe(3);
      expect(state.players.ai.hand.length).toBe(3);
      expect(state.players.human.deck.length).toBe(27);
      expect(state.players.ai.deck.length).toBe(27);
      expect(state.players.human.board).toEqual([]);
      expect(state.players.ai.board).toEqual([]);
    });

    it('should store and retrieve game by roomId', () => {
      service.createGame('room-1');
      const state = service.getGame('room-1');
      expect(state).toBeDefined();
      expect(state!.roomId).toBe('room-1');
    });
  });

  describe('startTurn', () => {
    it('should increment mana, refill, and draw a card', () => {
      const state = service.createGame('room-1');
      const handSizeBefore = state.players.human.hand.length;
      const deckSizeBefore = state.players.human.deck.length;

      service.startTurn(state);

      expect(state.turn).toBe(1);
      expect(state.players.human.maxMana).toBe(1);
      expect(state.players.human.mana).toBe(1);
      expect(state.players.human.hand.length).toBe(handSizeBefore + 1);
      expect(state.players.human.deck.length).toBe(deckSizeBefore - 1);
    });

    it('should cap maxMana at 10', () => {
      const state = service.createGame('room-1');
      state.players.human.maxMana = 10;

      service.startTurn(state);

      expect(state.players.human.maxMana).toBe(10);
      expect(state.players.human.mana).toBe(10);
    });

    it('should wake up minions from previous turn', () => {
      const state = service.createGame('room-1');
      const minion = {
        id: 'test-minion', definitionId: 'wolf', name: 'Wolf',
        manaCost: 2, attack: 3, health: 2, maxHealth: 2,
        color: '#696969', canAttack: false, exhausted: true,
      };
      state.players.human.board.push(minion);

      service.startTurn(state);

      expect(minion.canAttack).toBe(true);
      expect(minion.exhausted).toBe(false);
    });
  });

  describe('toClientState', () => {
    it('should hide AI hand cards and both decks', () => {
      const state = service.createGame('room-1');
      const clientState = service.toClientState(state);

      expect(clientState.player.hand.length).toBe(3);
      expect(clientState.opponent.handSize).toBe(3);
      expect(clientState.opponent).not.toHaveProperty('hand');
      expect(clientState.player.deckSize).toBe(27);
      expect(clientState.opponent.deckSize).toBe(27);
    });
  });
});
