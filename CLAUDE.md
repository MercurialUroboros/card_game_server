# Server — NestJS + Socket.IO

## Structure

```
src/
  main.ts                    — Bootstrap, CORS, port 3000
  app.module.ts              — Imports GameModule
  game/
    types.ts                 — All shared interfaces (GameState, Card, PlayerState, ClientGameState, payloads)
    card-pool.ts             — 15 card definitions (2 copies each = 30 card deck)
    game-state.service.ts    — Game creation, turn start, draw, fatigue, toClientState
    game-logic.service.ts    — playCard, attack, endTurn (all validation + mutation)
    game-logic.service.spec.ts
    game-state.service.spec.ts
    ai.service.ts            — Computes AI actions (play cards expensive-first, attack random targets)
    ai.service.spec.ts
    game.gateway.ts          — WebSocket gateway: room management, event handlers, AI turn execution
    game.module.ts           — Wires all providers
```

## Key Patterns

- **GameStateService**: Manages `Map<roomId, GameState>`. Creates games, starts turns (mana/draw/wake), converts to client view.
- **GameLogicService**: Pure game logic. Returns `{ success, error? }`. Mutates state in place.
- **AiService**: `computeActions(state)` returns `AiAction[]`. Does NOT execute — gateway executes with delays.
- **GameGateway**: Room-scoped socket.io gateway. Validates `currentPlayer === 'human'` before processing human actions. AI turns run async with 800ms delays.

## State Update Format

All `state-update` events include action metadata:
```typescript
{ state: ClientGameState, action?: { type: string, player: string, data?: { attackerId?, targetId?, cardId?, boardIndex? } } }
```

## Testing

```bash
npx jest --no-coverage          # All tests
npx jest src/game/FILE --no-coverage  # Specific file
```

Tests instantiate services directly (no NestJS DI in tests). 23 tests across 3 suites.

## Game Rules

- 30 HP per player, mana increments by 1/turn (cap 10), refills each turn
- Summoning sickness: minions can't attack the turn they're played
- Simultaneous combat damage, dead minions removed immediately
- Max 7 minions on board, max 10 cards in hand
- Fatigue: cumulative damage (1, 2, 3...) when deck is empty
