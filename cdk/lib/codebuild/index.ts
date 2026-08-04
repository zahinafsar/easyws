import * as CodeBuild from 'aws-cdk-lib/aws-codebuild';
import * as cdk from 'aws-cdk-lib/core';
import * as Ecr from 'aws-cdk-lib/aws-ecr';
import * as Iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { config } from '../utils/env';

export interface CodeBuildStackProps extends cdk.StackProps {
    repository: Ecr.Repository;
}

export class CodeBuildStack extends cdk.Stack {
    readonly project: CodeBuild.Project;

    constructor(scope: Construct, id: string, props?: CodeBuildStackProps) {
        super(scope, id, props);

        if (!props?.repository) throw Error('Repository not found')

        this.project = new CodeBuild.Project(this, 'ProjectBuilder', {
            projectName: config.codeBuildProjectName,
            environmentVariables: {
                AWS_ACCOUNT_ID: {
                    value: cdk.Aws.ACCOUNT_ID,
                },
                IMAGE_REPO_NAME: {
                    value: props?.repository.repositoryName,
                },
            },
            buildSpec: CodeBuild.BuildSpec.fromObjectToYaml({
                version: '0.2',
                phases: {
                    pre_build: {
                        commands: [
                            'echo Logging in to Amazon ECR...',
                            'aws ecr get-login-password --region "$AWS_DEFAULT_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"',
                            'git clone --depth 1 "$REPOSITORY_URL" source',
                            'test -f source/Dockerfile',
                        ],
                    },
                    build: {
                        commands: [
                            'echo Build started on `date`',
                            'cd "$CODEBUILD_SRC_DIR/source"',
                            'echo Building the Docker image...',
                            'docker build -t "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG" .',
                        ],
                    },
                    post_build: {
                        commands: [
                            'echo Build completed on `date`',
                            'echo Pushing the Docker image...',
                            'docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG"',
                        ],
                    },
                },
            }),
            environment: {
                buildImage: CodeBuild.LinuxBuildImage.STANDARD_7_0,
                computeType: CodeBuild.ComputeType.SMALL,
                privileged: true,
            },
            timeout: cdk.Duration.minutes(15),
            queuedTimeout: cdk.Duration.minutes(10),
            concurrentBuildLimit: 2,
            grantReportGroupPermissions: false,
        });

        this.project.addToRolePolicy(new Iam.PolicyStatement({
            actions: [
                'ecr:BatchCheckLayerAvailability',
                'ecr:CompleteLayerUpload',
                'ecr:InitiateLayerUpload',
                'ecr:PutImage',
                'ecr:UploadLayerPart',
            ],
            resources: [props?.repository.repositoryArn],
        }));

        this.project.addToRolePolicy(new Iam.PolicyStatement({
            actions: ['ecr:GetAuthorizationToken'],
            resources: ['*'],
        }));
    }
}
