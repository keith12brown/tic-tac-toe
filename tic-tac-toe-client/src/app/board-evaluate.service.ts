import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BoardEvaluateService {

  private board: Tile[][] = new Array();

  constructor() {
    for (let i = 0; i < 3; i++) {
      this.board[i] = [];
      for (let j = 0; j < 3; j++) {
        this.board[i][j] = { row: i, col: j, mark: undefined };
      }
    }
  }

  evaluate(tile: Tile): { mark: string, tiles: Tile[] } | null {

    this.board[tile.row][tile.col].mark = tile.mark;

    let result: { mark: string, tiles: Tile[] } = null;

    let markedTiles = 0;
    this.board.forEach(row => row.forEach(col => {
      col.mark ? markedTiles++ : markedTiles += 0;
    }));
    if (markedTiles < 5) {
      return;
    }

    for (let index = 0; result == null && index < 3; index++) {
      result = this.evalAdjacentCells(this.board[index]);
    }

    for (let col = 0; result == null && col < 3; ++col) {
      const tileVector = new Array();
      for (let row = 0; row < 3; ++row) {
        tileVector.push(this.board[row][col]);
      }
      result = this.evalAdjacentCells(tileVector);
    }

    if (result == null) {
      const tileVector = new Array();
      tileVector.push(this.board[0][0]);
      tileVector.push(this.board[1][1]);
      tileVector.push(this.board[2][2]);
      result = this.evalAdjacentCells(tileVector);
    }

    if (result == null) {
      const tileVector = new Array();
      tileVector.push(this.board[2][0]);
      tileVector.push(this.board[1][1]);
      tileVector.push(this.board[0][2]);
      result = this.evalAdjacentCells(tileVector);
    }

    if (result) {
      this.clearBoard();
    }
    return result;
  }

  clearBoard(): void {
    this.board.forEach((element: Tile[]) => {
      element.forEach((tile) => tile.mark = '');
    });
  }

  private evalAdjacentCells(tiles: Tile[]): { mark: string, tiles: Tile[] } {
    try {
      const mark = tiles[0] && tiles[0].mark ? tiles[0].mark : null;
      if (mark) {
        for (let i = 1; i < tiles.length; ++i) {
          if (!tiles[i].mark || tiles[i].mark !== mark) {
            return null;
          }
        }
      }
      return mark ? { mark, tiles } : null;
    } catch (error) {
      console.log(error);
    }
  }
}

interface Tile {
  row: number; col: number; mark: string;
}
