import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Cors, LambdaRestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps & { handler: IFunction }) {
    super(scope, id, props);

    if (!props?.handler) throw Error("Lambda handler required!")

    const api = new LambdaRestApi(this, 'storage', {
      handler: props?.handler,
      restApiName: 'storage',
      proxy: false,
      binaryMediaTypes: ['multipart/form-data'],
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    })

    const folders = api.root.addResource('folder');
    folders.addMethod('GET', new LambdaIntegration(props?.handler))
    folders.addMethod('POST', new LambdaIntegration(props?.handler))

    const folder = folders.addResource('{folderName}');
    folder.addMethod('GET', new LambdaIntegration(props?.handler))
    folder.addMethod('POST', new LambdaIntegration(props?.handler))
    folder.addMethod('PUT', new LambdaIntegration(props?.handler))
    folder.addMethod('DELETE', new LambdaIntegration(props?.handler))

    const media = folder.addResource('{mediaId}')
    media.addMethod('GET', new LambdaIntegration(props?.handler))
    media.addMethod('DELETE', new LambdaIntegration(props?.handler))
  }
}
