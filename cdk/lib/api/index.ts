import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ApiGateway from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps & { handler: IFunction }) {
    super(scope, id, props);

    if (!props?.handler) throw Error("Lambda handler required!")

    new ApiGateway.LambdaRestApi(this, 'storage', {
      handler: props?.handler,
      restApiName: 'get',
    })
  }
}
