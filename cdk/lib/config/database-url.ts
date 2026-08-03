export const getDatabaseUrl = () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required');
    }

    let parsedUrl: URL;

    try {
        parsedUrl = new URL(databaseUrl);
    } catch {
        throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
    }

    if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
        throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
    }

    return databaseUrl;
}
