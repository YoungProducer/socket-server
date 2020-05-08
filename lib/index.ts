import express, { Request, NextFunction, Response } from 'express';
import dotenv from 'dotenv';

import { parseEnv, EnvConfigInput } from './utils/parse-env';

const server: express.Application = express();

const envConfig = dotenv.config() as EnvConfigInput;

parseEnv(server, envConfig);

server.get('/', async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).send('Hello world!');
});

export default server;
