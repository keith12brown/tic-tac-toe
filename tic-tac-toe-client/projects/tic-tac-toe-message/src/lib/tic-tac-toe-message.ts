export interface Move {
    row: number;
    column: number;
    mark?: string;
}

export interface Opponent {
    opponent: string;
    isStarter: boolean;
}

export interface Player {
    name: string;
    opponent?: Opponent;
}

export interface ConnectionStatus {
    success: boolean;
    message?: string;
}

export class TicTacToeMessage {
    constructor(public content: Move | Opponent| Player | ConnectionStatus | string, public sender: string) { }
}
