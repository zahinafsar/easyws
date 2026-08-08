import * as CodeBuild from 'aws-cdk-lib/aws-codebuild';
import * as cdk from 'aws-cdk-lib/core';
import * as Ec2 from 'aws-cdk-lib/aws-ec2';
import * as Ecr from 'aws-cdk-lib/aws-ecr';
import * as Iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { config } from '../utils/env';

export interface CodeBuildStackProps extends cdk.StackProps {
    repository: Ecr.Repository;
    hostInstance: Ec2.Instance;
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
                INSTANCE_ID: {
                    value: props.hostInstance.instanceId,
                },
                CONTAINER_PORT: {
                    value: String(config.containerPort),
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
                            'echo Deploying to the application host...',
                            [
                                'REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com"',
                                'IMAGE_URI="$REGISTRY/$IMAGE_REPO_NAME:$IMAGE_TAG"',
                                'CONTAINER_NAME="app-$PROJECT_ID"',
                                'cat > /tmp/deploy.sh <<EOF',
                                'set -euo pipefail',
                                'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $REGISTRY',
                                'docker pull $IMAGE_URI',
                                'docker rm -f $CONTAINER_NAME 2>/dev/null || true',
                                'docker run -d --name $CONTAINER_NAME --restart unless-stopped --memory 512m -p $PORT:$CONTAINER_PORT $IMAGE_URI',
                                'docker image prune -af --filter until=24h',
                                'EOF',
                                'jq -n --rawfile script /tmp/deploy.sh \'{ commands: [$script] }\' > /tmp/deploy-parameters.json',
                                'COMMAND_ID=$(aws ssm send-command --instance-ids "$INSTANCE_ID" --document-name AWS-RunShellScript --comment "easyws deploy $PROJECT_ID" --parameters file:///tmp/deploy-parameters.json --query Command.CommandId --output text)',
                                'echo "SSM command $COMMAND_ID"',
                                'DEPLOY_STATUS=Pending',
                                'while true; do',
                                '  DEPLOY_STATUS=$(aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --query Status --output text 2>/dev/null || echo Pending)',
                                '  case "$DEPLOY_STATUS" in Pending|InProgress|Delayed) sleep 3 ;; *) break ;; esac',
                                'done',
                                'aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --query StandardOutputContent --output text',
                                'aws ssm get-command-invocation --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID" --query StandardErrorContent --output text',
                                'echo "Deploy finished with status $DEPLOY_STATUS"',
                                'test "$DEPLOY_STATUS" = Success',
                            ].join('\n'),
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

        this.project.addToRolePolicy(new Iam.PolicyStatement({
            actions: ['ssm:SendCommand'],
            resources: [
                `arn:${cdk.Aws.PARTITION}:ec2:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:instance/${props.hostInstance.instanceId}`,
                `arn:${cdk.Aws.PARTITION}:ssm:${cdk.Aws.REGION}::document/AWS-RunShellScript`,
            ],
        }));

        this.project.addToRolePolicy(new Iam.PolicyStatement({
            actions: ['ssm:GetCommandInvocation', 'ssm:ListCommandInvocations'],
            resources: ['*'],
        }));
    }
}
