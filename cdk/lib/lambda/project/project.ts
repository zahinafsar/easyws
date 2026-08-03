import type {
    APIGatewayProxyEvent,
} from 'aws-lambda';
import { eq } from 'drizzle-orm';
import { z } from 'zod/mini';
import { database } from '../../database';
import { projects } from '../../database/schema';
import { parseBody, Response } from '../../utils/api';

const listProjects = async () => {
    const result = await database.select().from(projects);
    return new Response(200, result);
}

const createProject = async (event: APIGatewayProxyEvent) => {
    const body = parseBody(event.body, z.object({
        name: z.string(),
    }));
    const [project] = await database.insert(projects).values(body).returning();

    return new Response(201, project);
}

const deleteProject = async (event: APIGatewayProxyEvent) => {
    const body = parseBody(event.body, z.object({
        id: z.uuid(),
    }));
    const [project] = await database
        .delete(projects)
        .where(eq(projects.id, body.id))
        .returning();

    if (!project) {
        return new Response(404, {
            message: 'Project not found',
        });
    }

    return new Response(200, project);
}

exports.handler = async (event: APIGatewayProxyEvent) => {
    try {
        if (event.requestContext.resourcePath.endsWith('/projects')) {
            if (event.requestContext.httpMethod === 'GET') {
                return await listProjects();
            }

            if (event.requestContext.httpMethod === 'POST') {
                return await createProject(event);
            }

            if (event.requestContext.httpMethod === 'DELETE') {
                return await deleteProject(event);
            }
        }

        return new Response(404, {
            message: "API not available",
        })
    } catch (error) {
        return new Response(400, {
            message: error instanceof Error ? error.message : "Invalid request",
        })
    }
};
