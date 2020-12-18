import { Injectable } from '@angular/core';
import { WebSocketSubject } from 'rxjs/internal-compatibility';
import { ConfigurationService } from './configuration.service';
import {
    TicTacToeMessage as Message,
    Move,
    ConnectionStatus,
    Player,
    createPlayer
} from '../../projects/tic-tac-toe-lib/src/lib/tic-tac-toe-message';
import { Subject } from 'rxjs';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {

    private socket$: WebSocketSubject<Message> = null;

    message$: Subject<string> = new Subject<string>();

    error$: Subject<string> = new Subject<string>();

    connected$: Subject<boolean> = new Subject<boolean>();

    opponentConnected$: Subject<Player> = new Subject<Player>();

    opponentMove$: Subject<Move> = new Subject<Move>();

    opponentQuit$: Subject<Player> = new Subject<Player>();

    constructor(private config: ConfigurationService) {
    }

    connect() {
        this.socket$ = new WebSocketSubject<Message>(this.config.getSocketUrl());
        this.socket$.subscribe(
            (message) => {
                this.processMessage(message);
                this.error$.next('');
            },
            (error: Event) => {
                this.message$.next(`Failed to connect to server. ${(<WebSocket>error.target)}`);
                this.error$.next('Failed to connect');
            },
            () => console.log('done')
        );
    }

    send(message: Message) {
        this.socket$.next(message);
    }

    processMessage(message: Message): void {
        console.log(JSON.stringify(message));
        const content = message.content;
        switch (content.kind) {
            case 'connectionStatus': {
                let msg = 'Connection Error';
                if (content.success) {
                    msg = 'Connected';
                    this.connected$.next(true);
                }
                this.message$.next(`${msg} ${content.message}`);
                break;
            }
            case 'player' : {
                if (!content.quit) {
                    this.opponentConnected$.next(content);
                } else {
                    this.opponentQuit$.next(content);
                }
                break;
            }
            case 'move' : {
                this.opponentMove$.next(content);
                break;
            }
            case 'info': {
                this.message$.next(content.info);
                break;
            }
        }
    }

    registerPlayer(player: Player | string): void {
        let name = '';
        if (typeof player === 'string') {
            name = player;
            player = createPlayer( name, false );
        } else {
            name = name;
        }
        this.socket$.next({ content: player, sender: name });
    }
}
