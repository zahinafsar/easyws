import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as Iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class StorageLambdaStack extends cdk.Stack {
    handler: Lambda.IFunction;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.handler = new NodejsFunction(this, 'storage', {
            runtime: Lambda.Runtime.NODEJS_24_X,
            entry: path.join(__dirname, 'storage.ts'),
            handler: 'handler',
        })

        this.handler.addToRolePolicy(new Iam.PolicyStatement({
            actions: ['s3:ListAllMyBuckets', 's3:CreateBucket'],
            resources: ['*'],
        }))

        this.handler.addToRolePolicy(new Iam.PolicyStatement({
            actions: ['s3:DeleteBucket', 's3:ListBucket'],
            resources: ['arn:aws:s3:::*'],
        }))

        this.handler.addToRolePolicy(new Iam.PolicyStatement({
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            resources: ['arn:aws:s3:::*/*'],
        }))
    }
}
