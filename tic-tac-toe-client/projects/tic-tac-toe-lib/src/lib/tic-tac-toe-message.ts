
export interface Move {
    kind: 'move';
    row: number;
    col: number;
    mark: Mark;
}

export interface Player {
    kind: 'player';
    name: string;
    quit: boolean;
    opponent?: Player;
    mark?: Mark;
}

export interface ConnectionStatus {
    kind: 'connectionStatus';
    success: boolean;
    message?: string;
}

export interface Information {
    kind: 'info';
    info: string;
}

export class TicTacToeMessage {
    constructor(public content: Move | Player | ConnectionStatus | Information, public sender: string) { }
}

export type Mark = 'X' | 'O' | '?' | '';

export type MessageType = Move | Player | ConnectionStatus | Information;


export function getMessageContent(message: MessageType): Move | Player | ConnectionStatus | Information {
    switch (message.kind) {
        case 'player':
            return message;
        case 'move':
            return message;
        case 'connectionStatus':
            return message;
        case 'info':
            return message;
    }
}

export function createMove(row: number, col: number, mark: Mark): Move {
    return { kind: 'move', row: row, col: col, mark: mark };
}

export function createPlayer(name: string,
    quit: boolean,
    opponent?: Player,
    mark?: Mark): Player {
    return { kind: 'player', name: name, quit: quit, opponent: opponent, mark: mark };
}

export function createConnectionStatus(success: boolean, message?: string): ConnectionStatus {
    return { kind: 'connectionStatus', success: success, message: message };
}

export function createInformation(info: string): Information {
    return { kind: 'info', info: info };
}
