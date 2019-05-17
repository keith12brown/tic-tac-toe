export interface Move {
    row: number;
    col: number;
    mark: string;
}

export interface Opponent {
    opponent: string;
    isStarter: boolean;
}

export interface Player {
    name: string;
    opponent?: Opponent;
}

export interface OpponentQuit {
    opponent: string;
    code: number;
    reason: string;
}

export interface ConnectionStatus {
    success: boolean;
    message?: string;
}

export class TicTacToeMessage {
    constructor(public content: Move | Opponent| Player | ConnectionStatus | OpponentQuit | string, public sender: string) { }
}
