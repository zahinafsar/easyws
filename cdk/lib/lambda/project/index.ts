import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as CodeBuild from 'aws-cdk-lib/aws-codebuild';
import * as Iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { config } from '../../utils/env';

export interface ProjectLambdaStackProps extends cdk.StackProps {
    buildProject: CodeBuild.IProject;
}

export class ProjectLambdaStack extends cdk.Stack {
    handler: Lambda.IFunction;

    constructor(scope: Construct, id: string, props: ProjectLambdaStackProps) {
        super(scope, id, props);

        this.handler = new NodejsFunction(this, 'project', {
            runtime: Lambda.Runtime.NODEJS_24_X,
            entry: path.join(__dirname, 'project.ts'),
            handler: 'handler',
            environment: {
                DATABASE_URL: config.databaseUrl,
            },
        })

        this.handler.addToRolePolicy(new Iam.PolicyStatement({
            actions: ['codebuild:StartBuild', 'codebuild:BatchGetBuilds'],
            resources: [props.buildProject.projectArn],
        }))
    }
}
