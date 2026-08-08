import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { required } from './lib/utils/env';

export default defineConfig({
    dialect: 'postgresql',
    schema: './lib/database/schema.ts',
    out: './drizzle',
    breakpoints: false,
    dbCredentials: {
        url: required(process.env.DATABASE_URL),
    },
});
