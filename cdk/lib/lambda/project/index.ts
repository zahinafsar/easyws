import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as CodeBuild from 'aws-cdk-lib/aws-codebuild';
import * as Ec2 from 'aws-cdk-lib/aws-ec2';
import * as Iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import { config } from '../../utils/env';

export interface ProjectLambdaStackProps extends cdk.StackProps {
    buildProject: CodeBuild.IProject;
    hostInstance: Ec2.Instance;
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
                INSTANCE_ID: props.hostInstance.instanceId,
            },
        })

        this.handler.addToRolePolicy(new Iam.PolicyStatement({
            actions: ['codebuild:StartBuild', 'codebuild:BatchGetBuilds'],
            resources: [props.buildProject.projectArn],
        }))

        this.handler.addToRolePolicy(new Iam.PolicyStatement({
            actions: ['logs:GetLogEvents'],
            resources: [
                `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/codebuild/${config.codeBuildProjectName}:*`,
            ],
        }))

        this.handler.addToRolePolicy(new Iam.PolicyStatement({
            actions: ['ssm:SendCommand'],
            resources: [
                `arn:${cdk.Aws.PARTITION}:ec2:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:instance/${props.hostInstance.instanceId}`,
                `arn:${cdk.Aws.PARTITION}:ssm:${cdk.Aws.REGION}::document/AWS-RunShellScript`,
            ],
        }))
    }
}
