import express, { Request, NextFunction, Response } from 'express';
import socket from 'socket.io';
import { Server } from 'http';
import dotenv from 'dotenv';

import { parseEnv, EnvConfigInput } from './utils/parse-env';

const app: express.Application = express();
const server = new Server(app);
const io = socket(server);

const envConfig = dotenv.config() as EnvConfigInput;

parseEnv(app, envConfig);

app.get('/', async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).send('Hello world!');
});

io.on('connection', (socket) => {
    socket.emit('matrix', { hello: 'world' });
    socket.on('my other event', (data) => {
        console.log(data);
    });
});

export default { server, app };
