import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { config } from './lib/utils/env';

export default defineConfig({
    dialect: 'postgresql',
    schema: './lib/database/schema.ts',
    out: './drizzle',
    breakpoints: false,
    dbCredentials: {
        url: config.databaseUrl,
    },
});
