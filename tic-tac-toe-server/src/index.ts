//
// This is a modification of https://github.com/JonnyFox/websocket-node-express
//

import * as express from 'express';
import * as http from 'http';
import { AddressInfo } from 'ws';
import * as WebSocket from 'ws';
import { TicTacToeMessage as Message, Move, Player, ConnectionStatus } from './tic-tac-toe-message';

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
        ws.send(this.createMessage({ success: true, message: "successful Connection" }));
    }

    private addHandlers(ws: WebSocket): void {
        ws.on('close', (code: number, reason: string) => {
            this.onClose(ws as ExtWebSocket, code, reason);
        });
        ws.on('message', (msg: string) => this.onMessage(ws, msg));
        ws.on('pong', () => (ws as ExtWebSocket).isAlive = true);
    }

    private onClose(extWs: ExtWebSocket, code: number, reason: string): void {
        console.log(`socket ${extWs.player.name} closed. Code ${code} Reason ${reason}`);
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
        let sendMessage = this.createMessage('Waiting for an opponent');
        console.log(`current client ${ws.player.name}`);
        this.wss.clients
            .forEach(client => {
                const extClient = client as ExtWebSocket;
                console.log(`filtering clients ${extClient.player.name}`);
                const playerStarts = Math.random() > 0.5 ? true : false;
                if (client !== ws && !extClient.player.opponent) {
                    player.isStarter = playerStarts;
                    extClient.player.isStarter = !playerStarts;
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

    private processMoveMessage(ws: ExtWebSocket, move: Move) {
        const msg = this.createMessage(move);
        console.log(`send move ${msg}`);
        ws.opponentSocket!.send(msg);
    }

    private setPing(): void {
        setInterval(() => {
            this.wss.clients.forEach((ws: WebSocket) => {
                const extWs = ws as ExtWebSocket;
                if (!extWs.isAlive) {
                    console.log(`ping/pong terminating ${extWs.player.name}`);
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
        string,
        sender = 'NS'): string {
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

    private isPlayer(message: Move | Player | ConnectionStatus | string): message is Player {
        return (message as Player).name !== undefined;
    }

    private isMove(message: Move | Player | ConnectionStatus | string): message is Player {
        return (message as Move).col !== undefined;
    }
}

interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    player: Player;
    opponentSocket?: WebSocket;
}

const socket = new SocketWrapper();
