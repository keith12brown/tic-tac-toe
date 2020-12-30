import { Component, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';
import { Move, Mark, createMove, Player } from 'projects/tic-tac-toe-lib/src/lib/tic-tac-toe-message';
import { Subject } from 'rxjs';

export class Tile {

    isWinner$: Subject<boolean> = new Subject<boolean>();

    isQuitter$: Subject<boolean> = new Subject<boolean>();

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

    @Input() player: Player;

    @Output() clicked: EventEmitter<Move> = new EventEmitter();

    isInWinner = false;

    isInQuitter = false;

    private get notAllowedCursor(): boolean {
        return this.tile.mark !== undefined;
    }

    onClick(): void {
        this.clicked.emit(createMove({
            row: this.tile.row,
            col: this.tile.col,
            mark: this.tile.mark,
            player: this.player
        }));
    }

    ngAfterViewInit(): void {
        this.tile.isWinner$.subscribe((winner) => {
            this.isInWinner = winner;
        });

        this.tile.isQuitter$.subscribe((quitter) => {
            this.isInQuitter = quitter;
        });
    }
}
