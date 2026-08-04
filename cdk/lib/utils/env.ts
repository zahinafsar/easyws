import { z } from 'zod/mini';

const required = (data?: string) => {
    return z.string().parse(data)
}

export const config = {
    databaseUrl: required(process.env.DATABASE_URL),
    codeBuildProjectName: 'easyws-project-builder',
}
