export interface Tile {
    row: number;
    column: number;
    mark: string;
    enabled: boolean;
}

export class TicTacToeTile implements Tile {
    row: number;
    column: number;
    mark: string;
    enabled: boolean;
}
