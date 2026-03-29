import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameStateService } from './game-state.service';
import { GameLogicService } from './game-logic.service';
import { AiService } from './ai.service';
import { PlayCardPayload, AttackPayload } from './types';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private socketRooms = new Map<string, string>();

  constructor(
    private gameState: GameStateService,
    private gameLogic: GameLogicService,
    private ai: AiService,
  ) {}

  handleDisconnect(client: Socket) {
    const roomId = this.socketRooms.get(client.id);
    if (roomId) {
      this.gameState.removeGame(roomId);
      this.socketRooms.delete(client.id);
    }
  }

  @SubscribeMessage('create-game')
  handleCreateGame(@ConnectedSocket() client: Socket) {
    const roomId = `game-${uuidv4()}`;
    client.join(roomId);
    this.socketRooms.set(client.id, roomId);
    const state = this.gameState.createGame(roomId);
    this.gameState.startTurn(state);
    client.emit('game-start', this.gameState.toClientState(state));
  }

  @SubscribeMessage('play-card')
  handlePlayCard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PlayCardPayload,
  ) {
    const roomId = this.socketRooms.get(client.id);
    if (!roomId) return;
    const state = this.gameState.getGame(roomId);
    if (!state || state.currentPlayer !== 'human' || state.phase !== 'playing')
      return;
    const result = this.gameLogic.playCard(
      state,
      'human',
      payload.cardId,
      payload.boardIndex,
    );
    if (!result.success) {
      client.emit('error', { message: result.error });
      return;
    }
    this.server.to(roomId).emit('state-update', {
      state: this.gameState.toClientState(state),
      action: {
        type: 'play-card',
        player: 'human',
        data: { cardId: payload.cardId, boardIndex: payload.boardIndex },
      },
    });
  }

  @SubscribeMessage('attack')
  handleAttack(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AttackPayload,
  ) {
    const roomId = this.socketRooms.get(client.id);
    if (!roomId) return;
    const state = this.gameState.getGame(roomId);
    if (!state || state.currentPlayer !== 'human' || state.phase !== 'playing')
      return;
    const result = this.gameLogic.attack(
      state,
      'human',
      payload.attackerId,
      payload.targetId,
    );
    if (!result.success) {
      client.emit('error', { message: result.error });
      return;
    }
    this.server.to(roomId).emit('state-update', {
      state: this.gameState.toClientState(state),
      action: {
        type: 'attack',
        player: 'human',
        data: {
          attackerId: payload.attackerId,
          targetId: payload.targetId,
        },
      },
    });
    if ((state.phase as string) === 'finished') {
      this.server.to(roomId).emit('game-over', { winner: state.winner });
    }
  }

  @SubscribeMessage('end-turn')
  handleEndTurn(@ConnectedSocket() client: Socket) {
    const roomId = this.socketRooms.get(client.id);
    if (!roomId) return;
    const state = this.gameState.getGame(roomId);
    if (!state || state.currentPlayer !== 'human' || state.phase !== 'playing')
      return;
    this.gameLogic.endTurn(state);
    this.gameState.startTurn(state);
    this.server.to(roomId).emit('state-update', {
      state: this.gameState.toClientState(state),
      action: { type: 'turn-start', player: state.currentPlayer },
    });
    if ((state.currentPlayer as string) === 'ai') {
      this.executeAiTurn(roomId, state);
    }
  }

  private async executeAiTurn(roomId: string, state: any) {
    const actions = this.ai.computeActions(state);
    for (const action of actions) {
      await this.delay(800);
      if (state.phase === 'finished') break;
      if (action.type === 'play-card') {
        this.gameLogic.playCard(
          state,
          'ai',
          action.cardId!,
          action.boardIndex!,
        );
        this.server.to(roomId).emit('state-update', {
          state: this.gameState.toClientState(state),
          action: {
            type: 'play-card',
            player: 'ai',
            data: { cardId: action.cardId, boardIndex: action.boardIndex },
          },
        });
      } else if (action.type === 'attack') {
        this.gameLogic.attack(
          state,
          'ai',
          action.attackerId!,
          action.targetId!,
        );
        this.server.to(roomId).emit('state-update', {
          state: this.gameState.toClientState(state),
          action: {
            type: 'attack',
            player: 'ai',
            data: {
              attackerId: action.attackerId,
              targetId: action.targetId,
            },
          },
        });
        if (state.phase === 'finished') {
          this.server.to(roomId).emit('game-over', { winner: state.winner });
          return;
        }
      } else if (action.type === 'end-turn') {
        this.gameLogic.endTurn(state);
        this.gameState.startTurn(state);
        this.server.to(roomId).emit('state-update', {
          state: this.gameState.toClientState(state),
          action: { type: 'turn-start', player: state.currentPlayer },
        });
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
