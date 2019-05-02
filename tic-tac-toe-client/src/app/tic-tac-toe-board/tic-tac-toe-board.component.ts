import { Component, OnInit, ViewChildren, QueryList, AfterViewInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { WebSocketService } from '../websocket.service';
import { Opponent, Move, TicTacToeMessage } from 'projects/tic-tac-toe-message/src/lib/tic-tac-toe-message';
import { TicTacToeTileComponent } from '../tic-tac-toe-tile/tic-tac-toe-tile.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatButton, MatButtonModule, MatFormFieldModule, MatIconRegistry, MatIconModule } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-tic-tac-toe-board',
  templateUrl: './tic-tac-toe-board.component.html',
  styleUrls: ['./tic-tac-toe-board.component.css']
})
export class TicTacToeBoardComponent implements OnInit, AfterViewInit {

  result: {
    message: string,
    mark: string
  } = null;

  opponent: Opponent;

  public get mark(): string {
    return this.opponent ? (this.opponent.isStarter ? 'o' : 'x') : '';
  }

  public get opponentMark(): string {
    return this.opponent.isStarter ? 'x' : 'o';
  }

  tiles: TicTacToeTileComponent[][] = [];

  @ViewChildren(TicTacToeTileComponent) ticTacToeTileComponents: QueryList<TicTacToeTileComponent>;

  @Input() player = '';

  connected = false;

  private replay = false;

  constructor(private socket: WebSocketService, iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon(
      'cloud',
      sanitizer.bypassSecurityTrustResourceUrl('assets/graphics/baseline-cloud-24px.svg'));
    iconRegistry.addSvgIcon(
      'cloud-off',
      sanitizer.bypassSecurityTrustResourceUrl('assets/graphics/baseline-cloud_off-24px.svg'));
    iconRegistry.addSvgIcon(
      'x',
      sanitizer.bypassSecurityTrustResourceUrl('assets/graphics/x.svg'));
    iconRegistry.addSvgIcon(
      'o',
      sanitizer.bypassSecurityTrustResourceUrl('assets/graphics/o.svg'));
    iconRegistry.addSvgIcon(
      'hourglass-full',
      sanitizer.bypassSecurityTrustResourceUrl('assets/graphics/baseline-hourglass_full-24px.svg'));
  }

  ngAfterViewInit(): void {
    this.ticTacToeTileComponents.forEach((tile) => {
      if (!this.tiles[tile.row]) {
        this.tiles[tile.row] = [];
      }
      this.tiles[tile.row][tile.column] = tile;
    });
  }

  ngOnInit() {
    this.socket.opponentConnected$.subscribe((opp) => {
      this.opponent = opp;
      this.enableDisableTiles(!opp.isStarter);
    });

    this.socket.message$.subscribe((message) => console.log(message));

    this.socket.connected$.subscribe((value) => {
      this.connected = value;
      this.socket.registerPlayer(this.player);
      this.replay = false;
    });

    this.socket.opponentMove$.subscribe((oppMove) => {
      this.setTile(oppMove);
      this.enableDisableTiles(true);
      this.detectWinner();
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

  onKeyUp(event) {
    const target = <HTMLInputElement>event.target;
    this.player = target.value;
  }

  tileClick(move: Move) {
    const tiles = this.ticTacToeTileComponents.filter((tile) => tile.column === move.column && tile.row === move.row);
    if (tiles && tiles.length > 0) {
      move.mark = this.mark;
      const message: TicTacToeMessage = new TicTacToeMessage(move, this.player);
      this.socket.send(message);
      const tile = tiles[0];
      this.enableDisableTiles(false);
      tile.mark = this.mark;
      this.detectWinner();
    }
  }

  private clearBoard(): void {
    this.ticTacToeTileComponents.forEach((tile) => tile.mark = null);
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 3; ++j) {
        this.tiles[i][j].mark = null;
      }
    }
    this.result = null;
    this.opponent = null;
  }

  private setTile(move: Move): void {
    const tile = this.ticTacToeTileComponents.find((tileToMark) => tileToMark.row === move.row && tileToMark.column === move.column);
    if (tile) {
      tile.mark = move.mark;
    }
  }

  private enableDisableTiles(value: boolean = true) {
    this.ticTacToeTileComponents.forEach((tile) => {
      if (!tile.mark) {
        tile.enabled = value;
      } else if (!value) {
        tile.enabled = value;
      }
    });
  }

  private detectWinner(): void {
    let result: string = null;

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
      this.result = { message: 'The Winner', mark: result };
    }

    if (!this.result) {
      let count = 0;
      this.tiles.forEach((row) => row.forEach((col) => col.mark ? ++count : count += 0));
      if (count === 9) {
        this.result = { message: 'Tie', mark: 'X/O' };
      }
    }

    if (this.result) {
      this.enableDisableTiles(false);
      this.replay = true;
    }
  }

  evalAdjacentCells(tiles: TicTacToeTileComponent[]): string {
    const marker = tiles[0] && tiles[0].mark ? tiles[0].mark : null;
    if (marker) {
      for (let i = 1; i < tiles.length; ++i) {
        if (!tiles[i].mark || tiles[i].mark !== marker) {
          return null;
        }
      }
    }
    return marker;
  }
}
