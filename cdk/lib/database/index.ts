import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getDatabaseUrl } from '../config/database-url';
import * as schema from './schema';

const client = postgres(getDatabaseUrl(), {
    max: 1,
    prepare: false,
});

export const database = drizzle(client, { schema });
