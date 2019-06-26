export interface Move {
    row: number;
    col: number;
    mark: string;
}

export interface Player {
    name: string;
    opponent?: Player;
    isStarter: boolean;
    quit: boolean;
}

export interface ConnectionStatus {
    success: boolean;
    message?: string;
}

export class TicTacToeMessage {
    constructor(public content: Move | Player | ConnectionStatus  | string, public sender: string) { }
}
