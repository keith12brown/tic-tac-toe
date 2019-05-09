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
import { TicTacToeTileComponent, Tile, Mark } from '../tic-tac-toe-tile/tic-tac-toe-tile.component';
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

  tiles: Tile[] = new Array<Tile>();

  public get mark(): Mark {
    return this.opponent ? (this.opponent.isStarter ? 'O' : 'X') : '';
  }

  public get opponentMark(): Mark {
    return this.opponent.isStarter ? 'X' : 'O';
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

    this.socket.opponentQuit$.subscribe(oppQuit => {
      this.opponentQuit();
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
    if (event.key === 'Enter'  && this.canPlay()) {
      this.clickConnect();
    }
  }

  tileClick(move: Move) {
    const tile = this.findTile(move.row, move.col);
    if (this.enabled && !tile.mark) {
      tile.mark = this.mark;
      move.mark = this.mark;
      const message: TicTacToeMessage = new TicTacToeMessage(move, this.player);
      this.socket.send(message);
      this.detectWinner();
      this.enabled = false;
    }
  }

  private opponentQuit(): void {
    this.tiles.forEach(t => {
      if (t.mark === this.opponentMark) {
        t.mark = '?';
      }
      this.enabled = false;
      this.replay = true;
      this.opponent.opponent = 'Quit';
    });
  }

  private findTile(row: number, col: number): Tile {
    return this.tiles[row * 3 + col];
  }

  private clearBoard(): void {
    this.tiles.forEach((tile) => tile.clear());
    this.opponent = null;
    this.enabled = false;
  }

  private setTile(move: Move): void {
    const tile = this.findTile(move.row, move.col);
    if (tile) {
      tile.mark = <Mark>move.mark;
    }
  }

  private detectWinner(): void {
    let result: { mark: Mark, tiles: Tile[] } = null;

    let markedTiles = 0;
    this.tiles.map((t) => t.mark ? ++markedTiles : null);
    if (markedTiles < 5) {
      return;
    }

    for (let index = 0; result == null && index < 9; index += 3) {
      result = this.evalAdjacentCells(this.tiles.slice(index, index + 3));
    }

    for (let col = 0; result == null && col < 3; ++col) {
      const tileVector = new Array();
      for (let row = 0; row < 3; ++row) {
        tileVector.push(this.findTile(row, col));
      }
      result = this.evalAdjacentCells(tileVector);
    }

    if (result == null) {
      const tileVector = new Array();
      tileVector.push(this.findTile(0, 0));
      tileVector.push(this.findTile(1, 1));
      tileVector.push(this.findTile(2, 2));
      result = this.evalAdjacentCells(tileVector);
    }

    if (result == null) {
      const tileVector = new Array();
      tileVector.push(this.findTile(2, 0));
      tileVector.push(this.findTile(1, 1));
      tileVector.push(this.findTile(0, 2));
      result = this.evalAdjacentCells(tileVector);
    }

    if (result) {
      result.tiles.forEach(tile => tile.isWinner$.next(true));
    }

    if (result || this.tiles.every(t => t.mark ? true : false)) {
      this.replay = true;
    }
  }

  evalAdjacentCells(tiles: Tile[]): { mark: Mark, tiles: Tile[] } {
    const mark = tiles[0] && tiles[0].mark ? tiles[0].mark : null;
    if (mark) {
      for (let i = 1; i < tiles.length; ++i) {
        if (!tiles[i].mark || tiles[i].mark !== mark) {
          return null;
        }
      }
    }
    return mark ? { mark, tiles } : null;
  }
}
