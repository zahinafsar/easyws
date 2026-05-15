import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { S3ServiceException } from '@aws-sdk/client-s3';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const onError: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  if (err instanceof S3ServiceException) {
    const status = (err.$metadata.httpStatusCode ?? 500) as ContentfulStatusCode;
    return c.text(err.message, status);
  }

  console.error(err);
  return c.text(err.message || 'Internal Server Error', 500);
};
