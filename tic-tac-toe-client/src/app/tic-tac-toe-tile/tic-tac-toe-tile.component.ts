import { Component, Input, EventEmitter, Output } from '@angular/core';
import { Move } from 'projects/tic-tac-toe-message/src/lib/tic-tac-toe-message';

export class Tile {
  constructor(public row: number, public col: number, public mark?: string) {
  }
}

@Component({
  selector: 'app-tic-tac-toe-tile',
  templateUrl: './tic-tac-toe-tile.component.html',
  styleUrls: ['./tic-tac-toe-tile.component.css']
})
export class TicTacToeTileComponent {

  @Input() tile: Tile;

  @Input() mark = '';

  @Output() clicked: EventEmitter<{ row: number, column: number }> = new EventEmitter();

  constructor() {
  }

  onClick() {
    const info: Move = { row: this.tile.row, column: this.tile.col };
    this.clicked.emit(info);
  }
}
