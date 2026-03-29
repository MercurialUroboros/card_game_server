import { AiService } from './ai.service';
import { GameLogicService } from './game-logic.service';
import { GameState } from './types';

describe('AiService', () => {
  let ai: AiService;
  let logic: GameLogicService;

  beforeEach(() => {
    logic = new GameLogicService();
    ai = new AiService(logic);
  });

  it('should return a list of actions the AI wants to take', () => {
    const state: GameState = {
      roomId: 'room-1', turn: 1, currentPlayer: 'ai', phase: 'playing',
      players: {
        human: { hp: 30, mana: 0, maxMana: 0, fatigue: 0, hand: [], board: [], deck: [] },
        ai: {
          hp: 30, mana: 3, maxMana: 3, fatigue: 0,
          hand: [{
            id: 'c1', definitionId: 'recruit', name: 'Recruit',
            manaCost: 1, attack: 1, health: 2, maxHealth: 2,
            color: '#8B4513', canAttack: false, exhausted: false,
          }],
          board: [], deck: [],
        },
      },
    };
    const actions = ai.computeActions(state);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[actions.length - 1].type).toBe('end-turn');
  });

  it('should attack with available minions', () => {
    const state: GameState = {
      roomId: 'room-1', turn: 2, currentPlayer: 'ai', phase: 'playing',
      players: {
        human: { hp: 30, mana: 0, maxMana: 0, fatigue: 0, hand: [], board: [], deck: [] },
        ai: {
          hp: 30, mana: 2, maxMana: 2, fatigue: 0, hand: [],
          board: [{
            id: 'a1', definitionId: 'wolf', name: 'Wolf',
            manaCost: 2, attack: 3, health: 2, maxHealth: 2,
            color: '#696969', canAttack: true, exhausted: false,
          }],
          deck: [],
        },
      },
    };
    const actions = ai.computeActions(state);
    const attackAction = actions.find((a) => a.type === 'attack');
    expect(attackAction).toBeDefined();
  });
});
