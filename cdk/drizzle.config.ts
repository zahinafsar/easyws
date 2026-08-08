import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    schema: './lib/database/schema.ts',
    out: './drizzle',
    breakpoints: false,
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
