import type {
    APIGatewayProxyEvent,
} from 'aws-lambda';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { parseBody, parseUpload, Response } from '../../utils/api';
import { z } from 'zod/mini';
import { S3Service } from '../../service/s3';

const listFolders = async () => {
    const s3 = new S3Service();
    const folders = await s3.listProjects();

    return new Response(200, folders)
}

const createFolder = async (event: APIGatewayProxyEvent) => {
    const body = parseBody(event.body, z.object({
        name: z.string()
    }))

    const s3 = new S3Service();
    await s3.createProject(body.name)

    return new Response(201, {
        message: "Folder created",
    })
}

const listMedia = async (event: APIGatewayProxyEvent) => {
    const folderName = z.string().parse(event.pathParameters?.folderName)
    const s3 = new S3Service();
    const media = await s3.listObjects(folderName);

    return new Response(200, media)
}

const uploadMedia = async (event: APIGatewayProxyEvent) => {
    const folderName = z.string().parse(event.pathParameters?.folderName)
    const file = await parseUpload(event);
    const s3 = new S3Service();
    const media = await s3.uploadObject({
        bucket: folderName,
        ...file,
    });

    return new Response(201, media)
}

const deleteFolder = async (event: APIGatewayProxyEvent) => {
    const folderName = z.string().parse(event.pathParameters?.folderName)
    const s3 = new S3Service();
    await s3.deleteProject(folderName);

    return new Response(200, {
        message: "Folder deleted",
    })
}

const getMedia = async (event: APIGatewayProxyEvent) => {
    const folderName = z.string().parse(event.pathParameters?.folderName)
    const mediaId = z.string().parse(event.pathParameters?.mediaId)
    const s3 = new S3Service();
    const media = await s3.getObject(folderName, mediaId);

    return new Response(200, media)
}

const deleteMedia = async (event: APIGatewayProxyEvent) => {
    const folderName = z.string().parse(event.pathParameters?.folderName)
    const mediaId = z.string().parse(event.pathParameters?.mediaId)
    const s3 = new S3Service();
    await s3.deleteObject(folderName, mediaId);

    return new Response(200, {
        message: "Media deleted",
    })
}

exports.handler = async (event: APIGatewayProxyEvent) => {
    try {
        if (event.requestContext.resourcePath === '/folder') {
            if (event.requestContext.httpMethod === 'GET') {
                return await listFolders()
            }

            if (event.requestContext.httpMethod === 'POST') {
                return await createFolder(event)
            }
        }

        if (event.requestContext.resourcePath === '/folder/{folderName}') {
            if (event.requestContext.httpMethod === 'GET') {
                return await listMedia(event)
            }

            if (event.requestContext.httpMethod === 'POST') {
                return await uploadMedia(event)
            }

            if (event.requestContext.httpMethod === 'PUT') {
                return new Response(405, {
                    message: "S3 folders cannot be updated in place",
                })
            }

            if (event.requestContext.httpMethod === 'DELETE') {
                return await deleteFolder(event)
            }
        }

        if (event.requestContext.resourcePath === '/folder/{folderName}/{mediaId}') {
            if (event.requestContext.httpMethod === 'GET') {
                return await getMedia(event)
            }

            if (event.requestContext.httpMethod === 'DELETE') {
                return await deleteMedia(event)
            }
        }

        return new Response(404, {
            message: "API not available",
        })
    } catch (error) {
        if (error instanceof S3ServiceException) {
            return new Response(error.$metadata.httpStatusCode ?? 500, {
                message: error.message,
            })
        }

        return new Response(400, {
            message: error instanceof Error ? error.message : "Invalid request",
        })
    }
};
