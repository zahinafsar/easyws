import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../utils/env';
import * as schema from './schema';

const client = postgres(config.databaseUrl, {
    max: 1,
    prepare: false,
});

export const database = drizzle(client, { schema });
