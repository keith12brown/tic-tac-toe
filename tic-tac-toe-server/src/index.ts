// This is a modification of https://github.com/JonnyFox/websocket-node-express
//

import * as express from 'express';
import * as http from 'http';
import { AddressInfo } from 'ws';
import * as WebSocket from 'ws';
import {
    ConnectionStatus,
    createConnectionStatus,
    createInformation,
    Information,
    Move,
    Player,
    TicTacToeMessage as Message,
} from './tic-tac-toe-message';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

export class SocketWrapper {

    private wss: WebSocket.Server;

    constructor() {
        const server = http.createServer(express());
        this.wss = new WebSocket.Server({ server });
        this.wss.on('connection', (ws: WebSocket) => this.onConnection(ws));
        this.setPing();
        server.listen({ port: process.env.PORT || 8999, host: process.env.HOST || 'localhost' }, () => {
            const addressInfo: AddressInfo = server.address() as AddressInfo;
            console.log(`Server started on host ${addressInfo.address} port ${addressInfo.port}`);
        });
    }

    private onConnection(ws: WebSocket) {
        this.addHandlers(ws);
        (ws as ExtWebSocket).isAlive = true;
        ws.send(this.createMessage(createConnectionStatus({ success: true, message: "successful Connection" })));
    }

    private addHandlers(ws: WebSocket): void {
        ws.on('close', (code: number, reason: string) => {
            this.onClose(ws as ExtWebSocket, code, reason);
        });
        ws.on('message', (msg: string) => this.onMessage(ws, msg));
        ws.on('pong', () => (ws as ExtWebSocket).isAlive = true);
    }

    private onClose(extWs: ExtWebSocket, code: number, reason: string): void {
        console.log(`socket ${extWs.player?.name} closed. Code ${code} Reason ${reason}`);
        try {
            if (extWs.opponentSocket && extWs.opponentSocket.readyState === 1) {
                extWs.player.quit = true;
                extWs.opponentSocket.send(this.createMessage(extWs.player));
                (extWs.opponentSocket as ExtWebSocket).opponentSocket = undefined;
            }
        } catch (error) {
            console.log(error);
        }
    }

    private onMessage(ws: WebSocket, msg: string): void {
        const message = JSON.parse(msg) as Message;
        const extWs = ws as ExtWebSocket;
        if (this.isPlayer(message.content)) {
            this.registerPlayer(ws as ExtWebSocket, message.content);
        }
        else if (this.isMove(message.content)) {
            this.processMoveMessage(extWs, message.content as Move);
        }
    }

    private registerPlayer(ws: ExtWebSocket, player: Player) {
        ws.player = player;
        player.opponent = undefined;
        ws.opponentSocket = undefined;
        console.log(`player registering ${ws.player.name}`);
        let sendMessage = this.createMessage(createInformation({ info: 'Waiting for an opponent' }), player.name);
        console.log(`current client ${ws.player.name}`);
        this.wss.clients
            .forEach(client => {
                const extClient = client as ExtWebSocket;
                console.log(`filtering clients ${extClient.player.name}`);
                const mark = Math.random() > 0.5 ? 'X' : 'O';
                if (client !== ws && !extClient.player.opponent) {
                    player.mark = mark;
                    extClient.player.mark = mark === 'X' ? 'O' : 'X';
                    extClient.player.opponent = player;
                    player.opponent = extClient.player;
                    extClient.opponentSocket = ws;
                    ws.opponentSocket = extClient;
                    const msg = this.createMessage(extClient.player.opponent);
                    console.log(`sending opponent message = ${msg}`);
                    extClient.send(msg);
                    sendMessage = this.createMessage(ws.player.opponent as Player);
                }
            });

        if (sendMessage) {
            console.log(`sending ws message = ${sendMessage}`);
            ws.send(sendMessage);
        }
    }

    private processMoveMessage(ws: ExtWebSocket, move: Move): void {
        const msg = this.createMessage(move);
        console.log(`send move ${msg}`);
        if (ws.opponentSocket) {
            ws.opponentSocket.send(msg);
        }
    }

    private setPing(): void {
        setInterval(() => {
            this.wss.clients.forEach((ws: WebSocket) => {
                const extWs = ws as ExtWebSocket;
                if (!extWs.isAlive) {
                    console.log(`ping/pong terminating ${extWs?.player?.name}`);
                    ws.terminate();
                }
                else {
                    extWs.isAlive = false;
                    ws.ping(null, undefined);
                }
            });
        }, 10000);
    }

    private createMessage(content:
        Move |
        Player |
        ConnectionStatus |
        Information,
        sender = ''): string {
        sender = sender ? sender : (this.isPlayer(content) ? content.name : 'server');
        const msg = new Message(content, sender);
        const cache = new WeakSet();
        return JSON.stringify(msg, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) {
                    return;
                }
                cache.add(value);
            }
            return value;
        });
    }

    private isPlayer(message: Move | Player | ConnectionStatus | Information): message is Player {
        return message.kind === 'player';
    }

    private isMove(message: Move | Player | ConnectionStatus | Information): message is Player {
        return message.kind === 'move';
    }
}

interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    player: Player;
    opponentSocket?: WebSocket;
}

new SocketWrapper();
