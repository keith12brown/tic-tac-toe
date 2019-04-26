import { Injectable } from '@angular/core';
import { WebSocketSubject } from 'rxjs/internal-compatibility';
import { ConfigurationService } from './configuration.service';
import {
  TicTacToeMessage as Message,
  Move,
  Opponent,
  ConnectionStatus,
  Player
} from '../../projects/tic-tac-toe-message/src/lib/tic-tac-toe-message';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private socket$: WebSocketSubject<Message> = null;

  message$: Subject<string> = new Subject<string>();

  connected$: Subject<boolean> = new Subject<boolean>();

  opponentConnected$: Subject<Opponent> = new Subject<Opponent>();

  opponentMove$: Subject<Move> = new Subject<Move>();

  constructor(private config: ConfigurationService) {
  }

  connect() {
    this.socket$ = new WebSocketSubject<Message>(this.config.getSocketUrl());
    this.socket$.subscribe(
      (message) => this.processMessage(message),
      (error: Event) => {
        this.message$.next(`Failed to connect to server. ${(<WebSocket>error.target)}`);
      } ,
      () => console.log('done')
    );
  }

  send(message: Message) {
    this.socket$.next(message);
  }

  processMessage(message: Message): void {
    const content = message.content;
    if (this.isConnectionStatus(content)) {
      const connectionStatus = <ConnectionStatus>content;
      let msg = 'Connection Error';
      if (connectionStatus.success) {
        msg = 'Connected';
        this.connected$.next(true);
      }
      this.message$.next(`${msg} ${(<ConnectionStatus>content).message}`);
    } else if (this.isOpponent(content)) {
      this.opponentConnected$.next(content);
    } else if (this.isMove(content)) {
      this.opponentMove$.next(content);
    } else if (typeof content === 'string') {
      this.message$.next(<string>content);
    }
  }

  registerPlayer(player: Player | string): void {
    let name = '';
    if (typeof player === 'string') {
      name = <string>player;
      player = { name: name };
    } else {
      name = (<Player>player).name;
    }
    this.socket$.next({ content: player, sender: name });
  }

  isMove(message: Move | Opponent | ConnectionStatus | Player | string): message is Move {
    return (<Move>message).column !== undefined;
  }

  isConnectionStatus(message: Move | Opponent | ConnectionStatus | Player | string): message is ConnectionStatus {
    return (<ConnectionStatus>message).success !== undefined;
  }

  isOpponent(message: Move | Opponent | ConnectionStatus | Player | string): message is Opponent {
    return (<Opponent>message).opponent !== undefined;
  }
}
