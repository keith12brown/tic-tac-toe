import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { TicTacToeMessage as Message, Move, Opponent, Player, ConnectionStatus } from './tic-tac-toe-message';

require('dotenv').config()

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    player: Player;
    opponentSocket?: WebSocket;
}

function createMessage(content:
    Move |
    Opponent |
    Player |
    ConnectionStatus |
    string,
    sender = 'NS'): string {
    return JSON.stringify(new Message(content, sender));
}

function isPlayer(message: Move | Player | Opponent | ConnectionStatus | string): message is Player {
    return (<Player>message).name !== undefined;
}

function isMove(message: Move | Player | Opponent | ConnectionStatus | string): message is Player {
    return (<Move>message).column !== undefined;
}

wss.on('connection', (ws: WebSocket) => {

    const extWs = ws as ExtWebSocket;

    extWs.isAlive = true;

    ws.on('pong', () => {
        extWs.isAlive = true;
    });

    //connection is up, let's add a simple simple event
    ws.on('message', (msg: string) => {
        const message = JSON.parse(msg) as Message;
        if (isPlayer(message.content)) {
            extWs.player = message.content;
            extWs.opponentSocket = undefined;
            console.log(`play registering ${extWs.player.name}`)
        }

        setTimeout(() => {
            let sendMessage = createMessage('Waiting for an oppenent');
            //send back the message to the other clients
            if (isPlayer(message.content)) {
                console.log(`current client ${extWs.player.name}`)
                wss.clients
                    .forEach(client => {
                        let extClient = client as ExtWebSocket;
                        if (isPlayer) {
                            console.log(`filtering clients ${extClient.player.name}`);
                            const playerStarts = Math.random() > 0.5 ? true : false;
                            if (client != ws && !extClient.player.opponent && !extWs.player.opponent) {
                                extClient.player.opponent = { opponent: extWs.player.name, isStarter: playerStarts };
                                extClient.opponentSocket = ws;
                                extWs.opponentSocket = extClient;
                                extWs.player.opponent = { opponent: extClient.player.name, isStarter: !playerStarts };
                                const msg = createMessage(<Opponent>extClient.player.opponent);
                                console.log(`sending oppent message = ${msg}`)
                                extClient.send(msg);
                                sendMessage = createMessage(<Opponent>extWs.player.opponent);
                            }
                        }
                    });

                if (sendMessage) {
                    console.log(`sending ws message = ${sendMessage}`);
                    ws.send(sendMessage);
                }
            }
            else if (isMove(message.content) && extWs.opponentSocket) {
                const msg = createMessage(message.content);
                console.log(`send move ${msg}`);
                extWs.opponentSocket.send(createMessage(message.content));
            }
        }, 0);

    });

    //send immediatly a feedback to the incoming connection
    ws.send(createMessage({ success: true, message: "successful Connection" }));

    ws.on('error', (err) => {
        console.warn(`Client disconnected - reason: ${err}`);
    })
});

setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
        const extWs = ws as ExtWebSocket;
        if (!extWs.isAlive) return ws.terminate();
        extWs.isAlive = false;
        ws.ping(null, undefined);
    });
}, 10000);

//start our server
server.listen({ port: process.env.PORT || 8999, host: process.env.HOST || 'localhost' }, () => {
    console.log(`Server started on host ${(server.address() as WebSocket.AddressInfo).address} port ${(<WebSocket.AddressInfo>server.address()).port} :)`);
});
