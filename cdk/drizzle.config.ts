import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { getDatabaseUrl } from './lib/config/database-url';

export default defineConfig({
    dialect: 'postgresql',
    schema: './lib/database/schema.ts',
    out: './drizzle',
    breakpoints: false,
    dbCredentials: {
        url: getDatabaseUrl(),
    },
});
