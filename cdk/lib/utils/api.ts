import type { APIGatewayProxyEvent } from 'aws-lambda';
import z from "zod"

export class Response {
    constructor(status: number, res: any) {
        return {
            statusCode: status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(res),
        }
    }
}

export const parseBody = <T extends z.ZodObject>(body: any, schema: T) => {
    try {
        return schema.parse(typeof body === 'string' ? JSON.parse(body) : body) as z.infer<T>
    } catch (error) {
        throw Error("Invalid body")
    }
}

export const parseUpload = async (event: APIGatewayProxyEvent) => {
    const contentType = Object.entries(event.headers ?? {}).find(
        ([key]) => key.toLowerCase() === 'content-type',
    )?.[1];

    if (!contentType?.toLowerCase().startsWith('multipart/form-data')) {
        throw Error('Content-Type must be multipart/form-data');
    }

    if (!event.body) throw Error('Request body is required');

    const body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : Buffer.from(event.body, 'utf8');

    const request = new Request('https://easyws.local', {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body: Uint8Array.from(body),
    });

    const form = await request.formData();
    const file = form.get('file');

    if (!file || typeof file === 'string') {
        throw Error('File is required');
    }

    return {
        body: new Uint8Array(await file.arrayBuffer()),
        contentType: file.type || 'application/octet-stream',
    }
}
