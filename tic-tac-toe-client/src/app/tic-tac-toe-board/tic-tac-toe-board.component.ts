import {
  Component,
  OnInit,
  Input
} from '@angular/core';
import { WebSocketService } from '../websocket.service';
import {
  Opponent,
  Move,
  TicTacToeMessage
} from 'projects/tic-tac-toe-message/src/lib/tic-tac-toe-message';
import { TicTacToeTileComponent, Tile } from '../tic-tac-toe-tile/tic-tac-toe-tile.component';
import {
  MatIconRegistry
} from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-tic-tac-toe-board',
  templateUrl: './tic-tac-toe-board.component.html',
  styleUrls: ['./tic-tac-toe-board.component.css']
})
export class TicTacToeBoardComponent implements OnInit {

  opponent: Opponent;

  private tiles: Tile[][] = new Array();

  tileArray: Tile[] = new Array<Tile>();

  public get mark(): string {
    return this.opponent ? (this.opponent.isStarter ? 'o' : 'x') : '';
  }

  public get opponentMark(): string {
    return this.opponent.isStarter ? 'x' : 'o';
  }

  public get thisPlayerGoStop(): string {
    return !this.canPlay() ? (this.enabled ? 'player-go' : 'player-stop') : 'player-stop';
  }

  public get oppPlayerGoStop(): string {
    return !this.canPlay() ? (!this.enabled ? 'player-go' : 'player-stop') : 'player-stop';
  }

  @Input() player = '';

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

  connected = false;

  error = false;

  private replay = false;

  enabled = false;

  constructor(
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
      'x',
      sanitizer.bypassSecurityTrustResourceUrl('assets/graphics/x.svg')
    );
    iconRegistry.addSvgIcon(
      'o',
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
      this.tiles[row] = [];
      for (let col = 0; col < 3; ++col) {
        const t = new Tile(row, col);
        this.tiles[row][col] = t;
        this.tileArray[index++] = t;
      }
    }
  }

  ngOnInit() {
    this.socket.opponentConnected$.subscribe(opp => {
      this.opponent = opp;
      this.enabled = !opp.isStarter;
    });

    this.socket.error$.subscribe(error => error ? this.error = true : false);

    this.socket.message$.subscribe(message => console.log(message));

    this.socket.connected$.subscribe(value => {
      this.connected = value;
      this.socket.registerPlayer(this.player);
      this.replay = false;
    }
    );

    this.socket.opponentMove$.subscribe(oppMove => {
      this.setTile(oppMove);
      this.detectWinner();
      this.enabled = !this.replay;
    });
  }

  canPlay() {
    return this.player && (!this.connected || this.replay);
  }

  clickConnect() {
    if (!this.connected) {
      this.socket.connect();
    } else {
      this.socket.registerPlayer(this.player);
    }
    this.replay = false;
    this.clearBoard();
  }

  onKeyUp(event: KeyboardEvent) {
    const target = <HTMLInputElement>event.target;
    this.player = target.value;
  }

  tileClick(move: Move) {
    const tile = this.tiles[move.row][move.column];
    if (this.enabled && !tile.mark) {
      tile.mark = move.mark = this.mark;
      const message: TicTacToeMessage = new TicTacToeMessage(move, this.player);
      this.socket.send(message);
      tile.mark = this.mark;
      this.detectWinner();
      this.enabled = false;
    }
  }

  private clearBoard(): void {
    this.tileArray.forEach((tile) => tile.clear());
    this.opponent = null;
    this.enabled = false;
  }

  private setTile(move: Move): void {
    const tile = this.tiles[move.row][move.column];
    if (tile) {
      tile.mark = move.mark;
    }
  }

  private detectWinner(): void {
    let result: {mark: string, tiles: Tile[]} = null;

    for (let row = 0; result == null && row < 3; ++row) {
      result = this.evalAdjacentCells(this.tiles[row]);
    }

    for (let col = 0; result == null && col < 3; ++col) {
      const tileVector = new Array();
      for (let row = 0; row < 3; ++row) {
        tileVector.push(this.tiles[row][col]);
      }
      result = this.evalAdjacentCells(tileVector);
    }

    if (result == null) {
      const tileVector = new Array();
      tileVector.push(this.tiles[0][0]);
      tileVector.push(this.tiles[1][1]);
      tileVector.push(this.tiles[2][2]);
      result = this.evalAdjacentCells(tileVector);
    }

    if (result == null) {
      const tileVector = new Array();
      tileVector.push(this.tiles[2][0]);
      tileVector.push(this.tiles[1][1]);
      tileVector.push(this.tiles[0][2]);
      result = this.evalAdjacentCells(tileVector);
    }

    if (result) {
      result.tiles.forEach(tile => tile.isWinner$.next(true));
    }

    if (result || this.tileArray.every( t => t.mark ? true : false)) {
      this.replay = true;
    }
  }

  evalAdjacentCells(tiles: Tile[]): { mark: string, tiles: Tile[]} {
    const mark = tiles[0] && tiles[0].mark ? tiles[0].mark : null;
    if (mark) {
      for (let i = 1; i < tiles.length; ++i) {
        if (!tiles[i].mark || tiles[i].mark !== mark) {
          return null;
        }
      }
    }
    return mark ? {mark, tiles} : null;
  }
}
