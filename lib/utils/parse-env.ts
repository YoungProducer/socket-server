import express from 'express';

export interface EnvConfigInput {
    parsed: {
        [attr: string]: string;
    };
}

export const parseEnv = (app: express.Application, envConfig: EnvConfigInput): void => {
    Object.entries(envConfig.parsed).forEach(([key, value]) => {
        app.set(key, value);
    });
};
