export interface Move {
    row: number;
    col: number;
    mark: Mark;
}

export interface Player {
    name: string;
    opponent?: Player;
    mark: Mark;
    quit: boolean;
}

export interface ConnectionStatus {
    success: boolean;
    message?: string;
}

export class TicTacToeMessage {
    constructor(public content: Move | Player | ConnectionStatus  | string, public sender: string) { }
}

export type Mark = 'X' | 'O' | '?' | '';