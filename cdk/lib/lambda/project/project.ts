import type { APIGatewayProxyEvent } from 'aws-lambda';
import { randomUUID } from 'node:crypto';
import {
    BatchGetBuildsCommand,
    CodeBuildClient,
    CodeBuildServiceException,
    StartBuildCommand,
} from '@aws-sdk/client-codebuild';
import {
    CloudWatchLogsClient,
    CloudWatchLogsServiceException,
    GetLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { SSMServiceException } from '@aws-sdk/client-ssm';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod/mini';
import { database } from '../../database';
import { builds, projects } from '../../database/schema';
import { SsmService } from '../../service/ssm';
import { parseBody, Response } from '../../utils/api';
import { decodeBase64, encodeBase64 } from '../../utils/base64';
import { renderDockerfile } from '../../utils/dockerfile';
import { normalizeEnvVars } from '../../utils/env-vars';

const codeBuild = new CodeBuildClient({});
const cloudWatchLogs = new CloudWatchLogsClient({});
const ssm = new SsmService();

const stopContainer = async (projectId: string) => {
    try {
        await ssm.runShellScript({
            instanceId: process.env.INSTANCE_ID!,
            comment: `easyws teardown ${projectId}`,
            commands: [`docker rm -f app-${projectId} 2>/dev/null || true`],
        });
    } catch (error) {
        console.error('Failed to stop container', projectId, error);
    }
}

const findProject = async (projectId: string) => {
    const [project] = await database
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

    return project;
}

const findBuild = async (projectId: string, buildId: string) => {
    const [build] = await database
        .select()
        .from(builds)
        .where(and(
            eq(builds.id, buildId),
            eq(builds.projectId, projectId),
        ))
        .limit(1);

    return build;
}

const listProjects = async () => {
    const result = await database
        .select({
            id: projects.id,
            name: projects.name,
            repositoryUrl: projects.repositoryUrl,
            port: projects.port,
        })
        .from(projects);

    return new Response(200, result);
}

const getProject = async (event: APIGatewayProxyEvent) => {
    const projectId = z.uuid().parse(event.pathParameters?.projectId);
    const project = await findProject(projectId);

    if (!project) {
        return new Response(404, {
            message: 'Project not found',
        });
    }

    return new Response(200, {
        ...project,
        envVars: decodeBase64(project.envVars),
    });
}

const createProject = async (event: APIGatewayProxyEvent) => {
    const body = parseBody(event.body, z.object({
        name: z.string().check(z.minLength(1)),
        repositoryUrl: z.url().check(z.startsWith('https://github.com/')),
    }));
    const [project] = await database.insert(projects).values(body).returning();

    return new Response(201, project);
}

const command = z.string().check(z.maxLength(512), z.regex(/^[^\n\r]*$/));

const updateProject = async (event: APIGatewayProxyEvent) => {
    const projectId = z.uuid().parse(event.pathParameters?.projectId);
    const body = parseBody(event.body, z.object({
        installCommand: command,
        buildCommand: command,
        startCommand: z.string().check(z.minLength(1), z.maxLength(512), z.regex(/^[^\n\r]*$/)),
    }));
    const [project] = await database
        .update(projects)
        .set(body)
        .where(eq(projects.id, projectId))
        .returning();

    if (!project) {
        return new Response(404, {
            message: 'Project not found',
        });
    }

    return new Response(200, {
        ...project,
        envVars: decodeBase64(project.envVars),
    });
}

const deleteProject = async (event: APIGatewayProxyEvent) => {
    const projectId = z.uuid().parse(event.pathParameters?.projectId);
    const [project] = await database
        .delete(projects)
        .where(eq(projects.id, projectId))
        .returning();

    if (!project) {
        return new Response(404, {
            message: 'Project not found',
        });
    }

    await stopContainer(projectId);

    return new Response(200, project);
}

const updateEnv = async (event: APIGatewayProxyEvent) => {
    const projectId = z.uuid().parse(event.pathParameters?.projectId);
    const body = parseBody(event.body, z.object({
        content: z.string().check(z.maxLength(16384)),
    }));
    const [project] = await database
        .update(projects)
        .set({ envVars: encodeBase64(normalizeEnvVars(body.content)) })
        .where(eq(projects.id, projectId))
        .returning();

    if (!project) {
        return new Response(404, {
            message: 'Project not found',
        });
    }

    return new Response(200, {
        projectId: project.id,
        content: decodeBase64(project.envVars),
    });
}

const listBuilds = async (event: APIGatewayProxyEvent) => {
    const projectId = z.uuid().parse(event.pathParameters?.projectId);
    const project = await findProject(projectId);

    if (!project) {
        return new Response(404, {
            message: 'Project not found',
        });
    }

    const result = await database
        .select({
            buildId: builds.id,
            projectId: builds.projectId,
            status: builds.status,
            createdAt: builds.createdAt,
            completedAt: builds.completedAt,
        })
        .from(builds)
        .where(eq(builds.projectId, projectId))
        .orderBy(desc(builds.createdAt));

    return new Response(200, result);
}

const createBuild = async (event: APIGatewayProxyEvent) => {
    const projectId = z.uuid().parse(event.pathParameters?.projectId);
    const project = await findProject(projectId);

    if (!project) {
        return new Response(404, {
            message: 'Project not found',
        });
    }

    const buildId = randomUUID();
    const result = await codeBuild.send(new StartBuildCommand({
        projectName: process.env.CODEBUILD_PROJECT_NAME!,
        environmentVariablesOverride: [
            {
                name: 'REPOSITORY_URL',
                value: project.repositoryUrl,
                type: 'PLAINTEXT',
            },
            {
                name: 'IMAGE_TAG',
                value: buildId,
                type: 'PLAINTEXT',
            },
            {
                name: 'PROJECT_ID',
                value: projectId,
                type: 'PLAINTEXT',
            },
            {
                name: 'PORT',
                value: String(project.port),
                type: 'PLAINTEXT',
            },
            {
                name: 'DOCKERFILE_B64',
                value: encodeBase64(renderDockerfile({
                    installCommand: project.installCommand,
                    buildCommand: project.buildCommand,
                    startCommand: project.startCommand,
                    envVars: decodeBase64(project.envVars),
                    containerPort: Number(process.env.CONTAINER_PORT),
                })),
                type: 'PLAINTEXT',
            },
        ],
    }));

    if (!result.build?.id || !result.build.buildStatus) {
        return new Response(502, {
            message: 'CodeBuild did not return complete build details',
        });
    }

    const [build] = await database.insert(builds).values({
        id: buildId,
        projectId,
        codeBuildBuildId: result.build.id,
        status: result.build.buildStatus,
    }).returning();

    return new Response(202, {
        buildId: build.id,
        status: build.status,
    });
}

const getBuild = async (event: APIGatewayProxyEvent) => {
    const projectId = z.uuid().parse(event.pathParameters?.projectId);
    const buildId = z.uuid().parse(event.pathParameters?.buildId);
    const buildRecord = await findBuild(projectId, buildId);

    if (!buildRecord) {
        return new Response(404, {
            message: 'Build not found',
        });
    }

    const result = await codeBuild.send(new BatchGetBuildsCommand({
        ids: [buildRecord.codeBuildBuildId],
    }));
    const [build] = result.builds ?? [];

    if (!build) {
        return new Response(404, {
            message: 'Build not found',
        });
    }

    const status = build.buildStatus ?? buildRecord.status;
    const completedAt = build.endTime ?? buildRecord.completedAt;

    await database
        .update(builds)
        .set({ status, completedAt })
        .where(eq(builds.id, buildRecord.id));

    return new Response(200, {
        buildId: buildRecord.id,
        projectId,
        status,
        createdAt: buildRecord.createdAt,
        completedAt,
    });
}

const getBuildLogs = async (event: APIGatewayProxyEvent) => {
    const projectId = z.uuid().parse(event.pathParameters?.projectId);
    const buildId = z.uuid().parse(event.pathParameters?.buildId);
    const buildRecord = await findBuild(projectId, buildId);

    if (!buildRecord) {
        return new Response(404, {
            message: 'Build not found',
        });
    }

    const buildResult = await codeBuild.send(new BatchGetBuildsCommand({
        ids: [buildRecord.codeBuildBuildId],
    }));
    const [build] = buildResult.builds ?? [];
    const groupName = build?.logs?.groupName;
    const streamName = build?.logs?.streamName;

    if (!groupName || !streamName) {
        return new Response(200, {
            events: [],
        });
    }

    const currentToken = event.queryStringParameters?.nextToken;
    const result = await cloudWatchLogs.send(new GetLogEventsCommand({
        logGroupName: groupName,
        logStreamName: streamName,
        nextToken: currentToken,
        startFromHead: true,
        limit: 10000,
    }));
    const events = (result.events ?? []).map(logEvent => ({
        timestamp: logEvent.timestamp,
        message: logEvent.message ?? '',
    }));
    const nextToken = events.length > 0 && result.nextForwardToken !== currentToken
        ? result.nextForwardToken
        : undefined;

    return new Response(200, {
        events,
        nextToken,
    });
}

exports.handler = async (event: APIGatewayProxyEvent) => {
    try {
        if (event.requestContext.resourcePath === '/projects') {
            if (event.requestContext.httpMethod === 'GET') {
                return await listProjects();
            }

            if (event.requestContext.httpMethod === 'POST') {
                return await createProject(event);
            }
        }

        if (event.requestContext.resourcePath === '/projects/{projectId}') {
            if (event.requestContext.httpMethod === 'GET') {
                return await getProject(event);
            }

            if (event.requestContext.httpMethod === 'PATCH') {
                return await updateProject(event);
            }

            if (event.requestContext.httpMethod === 'DELETE') {
                return await deleteProject(event);
            }
        }

        if (event.requestContext.resourcePath === '/projects/{projectId}/env') {
            if (event.requestContext.httpMethod === 'PUT') {
                return await updateEnv(event);
            }
        }

        if (event.requestContext.resourcePath === '/projects/{projectId}/builds') {
            if (event.requestContext.httpMethod === 'GET') {
                return await listBuilds(event);
            }

            if (event.requestContext.httpMethod === 'POST') {
                return await createBuild(event);
            }
        }

        if (event.requestContext.resourcePath === '/projects/{projectId}/builds/{buildId}') {
            if (event.requestContext.httpMethod === 'GET') {
                return await getBuild(event);
            }
        }

        if (event.requestContext.resourcePath === '/projects/{projectId}/builds/{buildId}/logs') {
            if (event.requestContext.httpMethod === 'GET') {
                return await getBuildLogs(event);
            }
        }

        return new Response(404, {
            message: 'API not available',
        })
    } catch (error) {
        if (
            error instanceof CodeBuildServiceException ||
            error instanceof CloudWatchLogsServiceException ||
            error instanceof SSMServiceException
        ) {
            return new Response(error.$metadata.httpStatusCode ?? 500, {
                message: error.message,
            })
        }

        return new Response(400, {
            message: error instanceof Error ? error.message : 'Invalid request',
        })
    }
};
