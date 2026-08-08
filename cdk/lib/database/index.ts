import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { required } from '../utils/env';

const client = postgres(required(process.env.DATABASE_URL), {
    max: 1,
    prepare: false,
});

export const database = drizzle(client, { schema });
