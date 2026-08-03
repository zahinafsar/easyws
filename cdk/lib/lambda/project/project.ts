import type {
    APIGatewayProxyEvent,
} from 'aws-lambda';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { Response } from '../../utils/api';

exports.handler = async (event: APIGatewayProxyEvent) => {
    try {
        if (event.requestContext.resourcePath === '/projects') {
            if (event.requestContext.httpMethod === 'GET') {
            }

            if (event.requestContext.httpMethod === 'POST') {
            }

            if (event.requestContext.httpMethod === 'DELETE') {
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
