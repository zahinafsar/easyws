import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Cors, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { StorageApi } from './storage';
import { ProjectApi } from './project';

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps & { storageHandler: IFunction, projectHandler: IFunction }) {
    super(scope, id, props);

    if (!props?.storageHandler) throw Error("Lambda handler required!")

    const api = new LambdaRestApi(this, 'easyws', {
      handler: props?.storageHandler,
      restApiName: 'easyws',
      proxy: false,
      binaryMediaTypes: ['multipart/form-data'],
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    })

    new StorageApi(api, props.storageHandler)
    new ProjectApi(api, props.projectHandler)
  }
}
