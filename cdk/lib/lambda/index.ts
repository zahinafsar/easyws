import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class LambdaStack extends cdk.Stack {
    get: Lambda.IFunction;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.get = new NodejsFunction(this, 'storage', {
            runtime: Lambda.Runtime.NODEJS_24_X,
            entry: path.join(__dirname, 'storage.ts'),
            handler: 'get',
        })
    }
}
