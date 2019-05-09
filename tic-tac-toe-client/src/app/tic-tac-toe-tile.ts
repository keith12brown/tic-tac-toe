export interface Tile {
    row: number;
    col: number;
    mark: string;
    enabled: boolean;
}

export class TicTacToeTile implements Tile {
    row: number;
    col: number;
    mark: string;
    enabled: boolean;
}
