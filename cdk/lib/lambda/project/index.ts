import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { getDatabaseUrl } from '../../config/database-url';

export class ProjectLambdaStack extends cdk.Stack {
    handler: Lambda.IFunction;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.handler = new NodejsFunction(this, 'project', {
            runtime: Lambda.Runtime.NODEJS_24_X,
            entry: path.join(__dirname, 'project.ts'),
            handler: 'handler',
            environment: {
                DATABASE_URL: getDatabaseUrl(),
            },
        })
    }
}
