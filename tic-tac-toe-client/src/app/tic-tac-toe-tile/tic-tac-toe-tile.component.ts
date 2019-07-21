import { Component, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { Move, Mark } from 'projects/tic-tac-toe-lib/src/lib/tic-tac-toe-message';
import { Subject } from 'rxjs';

export class Tile {

  isWinner$: Subject<boolean> = new Subject<boolean>();

  constructor(public row: number, public col: number, public mark?: Mark) {
  }

  clear(): void {
    this.mark = undefined;
    this.isWinner$.next(false);
  }
}

@Component({
  selector: 'app-tic-tac-toe-tile',
  templateUrl: './tic-tac-toe-tile.component.html',
  styleUrls: ['./tic-tac-toe-tile.component.css']
})
export class TicTacToeTileComponent implements AfterViewInit {

  @Input() tile: Tile;

  @Output() clicked: EventEmitter<{ row: number, col: number }> = new EventEmitter();

  isInWinner = false;

  private get notAllowedCursor(): boolean {
    return this.tile.mark !== undefined;
  }

  constructor() {
  }

  onClick() {
    this.clicked.emit({ row: this.tile.row, col: this.tile.col });
  }

  ngAfterViewInit(): void {
    this.tile.isWinner$.subscribe((winner) => {
      this.isInWinner = winner;
    });
  }
}
