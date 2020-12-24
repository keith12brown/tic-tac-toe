import {
    Component,
    OnInit,
} from '@angular/core';
import { WebSocketService } from '../websocket.service';
import {
    Move,
    Player,
    TicTacToeMessage,
    Mark,
    createPlayer,
} from 'projects/tic-tac-toe-lib/src/lib/tic-tac-toe-message';
import { Tile } from '../tic-tac-toe-tile/tic-tac-toe-tile.component';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { BoardEvaluateService } from '../board-evaluate.service';
import { FormControl } from '@angular/forms';

@Component({
    selector: 'app-tic-tac-toe-board',
    templateUrl: './tic-tac-toe-board.component.html',
    styleUrls: ['./tic-tac-toe-board.component.css']
})
export class TicTacToeBoardComponent implements OnInit {

    player: Player;

    private tiles: Tile[] = new Array<Tile>();

    showDelay = new FormControl(500);
    hideDelay = new FormControl(1000);

    private get opponent(): Player | undefined {
        return this.player ? this.player.opponent : undefined;
    }

    public get mark(): Mark {
        return this.player ? this.player.mark : '';
    }

    public get opponentMark(): Mark {
        return this.player && this.opponent ? this.opponent.mark : '';
    }

    public get thisPlayerState(): string {
        if (this.winner === this.player) {
            return 'player-winner';
        }
        return !this.canPlay() ? (this.enabled ? 'player-go' : 'player-stop') : 'player-stop';
    }

    public get oppPlayerState(): string {
        if (this.winner === this.player.opponent) {
            return 'player-winner';
        }
        return !this.canPlay() ? (!this.enabled ? 'player-go' : 'player-stop') : 'player-stop';
    }

    // public get thisPlayerGoStop(): string {
    //     return !this.canPlay() ? (this.enabled ? 'player-go' : 'player-stop') : 'player-stop';
    // }

    // public get oppPlayerGoStop(): string {
    //     return !this.canPlay() ? (!this.enabled ? 'player-go' : 'player-stop') : 'player-stop';
    // }

    private playerName = '';

    private _connectionColor: string;
    public get connectionColor(): string {
        if (!this.connected && this.error) {
            this._connectionColor = 'warn';
        } else if (!this.connected) {
            this._connectionColor = 'disabled';
        } else if (this.connected) {
            this._connectionColor = 'primary';
        }
        return this._connectionColor;
    }

    public get cursorClass(): string {
        let returnValue = '';
        if ((!this.enabled && !this.mark) || this.winner) {
            returnValue = 'not-allowed';
        } else if (!this.enabled && this.mark) {
            returnValue = 'wait';
        } else {
            returnValue = '';
        }
        return returnValue;
    }

    private connected = false;

    private error = false;

    private replay = false;

    private _enabled = false;
    public get enabled(): boolean {
        return this._enabled;
    }
    public set enabled(value: boolean)  {
        this._enabled = value;
    }

    private winner: Player = undefined;

    constructor(
        private evaluationService: BoardEvaluateService,
        private socket: WebSocketService,
        iconRegistry: MatIconRegistry,
        sanitizer: DomSanitizer
    ) {
        iconRegistry.addSvgIcon(
            'cloud',
            sanitizer.bypassSecurityTrustResourceUrl(
                'assets/graphics/baseline-cloud-24px.svg'
            )
        );
        iconRegistry.addSvgIcon(
            'cloud-off',
            sanitizer.bypassSecurityTrustResourceUrl(
                'assets/graphics/baseline-cloud_off-24px.svg'
            )
        );
        iconRegistry.addSvgIcon(
            'X',
            sanitizer.bypassSecurityTrustResourceUrl('assets/graphics/x.svg')
        );
        iconRegistry.addSvgIcon(
            'O',
            sanitizer.bypassSecurityTrustResourceUrl('assets/graphics/o.svg')
        );
        iconRegistry.addSvgIcon(
            'hourglass-full',
            sanitizer.bypassSecurityTrustResourceUrl(
                'assets/graphics/baseline-hourglass_full-24px.svg'
            )
        );

        let index = 0;
        for (let row = 0; row < 3; ++row) {
            for (let col = 0; col < 3; ++col) {
                const t = new Tile(row, col);
                this.tiles[index++] = t;
            }
        }
    }

    ngOnInit(): void {
        this.socket.opponentConnected$.subscribe(opp => {
            this.player.opponent = opp;
            this.player.mark = opp.mark === 'X' ? 'O' : 'X';
            this.enabled = this.player.mark === 'X';
        });

        this.socket.error$.subscribe(error => error ? this.error = true : false);

        this.socket.message$.subscribe(message => console.log(JSON.stringify(message)));

        this.socket.connected$.subscribe(value => {
            this.connected = value;
            this.player = createPlayer({name: this.playerName, quit: false});
            this.socket.registerPlayer(this.player);
            this.replay = false;
        });

        this.socket.opponentMove$.subscribe(oppMove => {
            this.setTile(oppMove);
            this.detectWinner(oppMove);
            this.enabled = !this.replay;
        });

        this.socket.opponentQuit$.subscribe(() => {
            this.opponentQuit();
        });
    }

    playerTooltip(): string {
        let result = '';
        if (this.player) {
            if (this.opponent?.quit) {
                result = `You win. ${this.opponent.name} quit`;
            } else if (this.winner) {
                result = this.winner === this.player ? 'You win' : `${this.opponent.name} wins`;
            } else if (this.tiles.every(t => t.mark ? true : false)) {
                result = 'Tie';
            } else {
                result = this.enabled ? 'Your turn' : `Waiting on ${this.opponent ? this.opponent.name : ' new opponent'}`;
            }
        }
        return result;
    }

    canPlay(): boolean {
        return this.playerName && (!this.connected || this.replay);
    }

    clickPlay(): void {
        if (!this.connected) {
            this.socket.connect();
        } else {
            this.socket.registerPlayer(this.player);
        }
        if (this.player) {
            this.player.opponent = undefined;
            this.player.mark = '';
        }
        this.replay = false;
        this.clearBoard();
    }

    onKeyUp(event: KeyboardEvent): void {
        const target = <HTMLInputElement>event.target;
        this.playerName = target.value;
        if (event.key === 'Enter' && this.canPlay()) {
            this.clickPlay();
        }
    }

    tileClick(move: Move): void {
        const tile = this.findTile(move.row, move.col);
        if (this.enabled && !tile.mark) {
            tile.mark = this.mark;
            move.mark = this.mark;
            const message: TicTacToeMessage = new TicTacToeMessage(move, this.playerName);
            this.socket.send(message);
            this.detectWinner(move);
            this.enabled = false;
        }
    }

    private opponentQuit(): void {
        if (this.winner) {
            return;
        }

        this.tiles.forEach(t => {
            if (t.mark === this.opponentMark) {
                t.mark = '?';
            }
        });

        this.player.opponent.quit = true;
        this.enabled = false;
        this.replay = true;
    }

    private findTile(row: number, col: number): Tile {
        return this.tiles[row * 3 + col];
    }

    private clearBoard(): void {
        this.tiles.forEach((tile) => tile.clear());
        this.winner = undefined;
        if (this.player) {
            this.player.opponent = undefined;
        }
        this.enabled = false;
    }

    private setTile(move: Move): void {
        const tile = this.findTile(move.row, move.col);
        if (tile) {
            tile.mark = <Mark>move.mark;
        }
    }

    private detectWinner(move: Move): void {
        const result = this.evaluationService.evaluate(move);

        if (result) {
            this.winner = result.mark === this.mark ? this.player : this.opponent;
            result.tiles.forEach(tile => this.tiles[tile.row * 3 + tile.col].isWinner$.next(true));
        }

        if (result || this.tiles.every(t => t.mark ? true : false)) {
            this.replay = true;
        }
    }
}
