import { Component, OnInit, ElementRef, HostListener, Input, AfterViewInit, EventEmitter, Output, OnChanges } from '@angular/core';
import { Move } from 'projects/tic-tac-toe-message/src/lib/tic-tac-toe-message';
import { NumberFormatStyle } from '@angular/common';
import { __importDefault } from 'tslib';

@Component({
  selector: 'app-tic-tac-toe-tile',
  templateUrl: './tic-tac-toe-tile.component.html',
  styleUrls: ['./tic-tac-toe-tile.component.css']
})
export class TicTacToeTileComponent {

  enabled = false;
  mark = '';
  @Input() row = 0;
  @Input() column = 0;
  @Output() clicked: EventEmitter<{row: number, column: number}> = new EventEmitter();

  constructor() { }

  onClick() {
    if (this.enabled) {
      const info: Move = { row: this.row, column: this.column};
      this.clicked.emit(info);
    }
  }
}
