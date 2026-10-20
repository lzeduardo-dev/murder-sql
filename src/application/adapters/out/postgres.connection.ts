import { Pool } from 'pg';
import { requireEnv } from '../../../config/env.js';

export function createPostgresPool(): Pool {
    return new Pool({
        host: requireEnv('DB_HOST'),
        port: Number(requireEnv('DB_PORT')),
        user: requireEnv('DB_USER'),
        password: requireEnv('DB_PASSWORD'),
        database: requireEnv('DB_NAME'),
    });
}