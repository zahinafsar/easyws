import * as CodeBuild from 'aws-cdk-lib/aws-codebuild';
import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { config } from '../utils/env';

export class CodeBuildStack extends cdk.Stack {
    readonly project: CodeBuild.Project;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.project = new CodeBuild.Project(this, 'ProjectBuilder', {
            projectName: config.codeBuildProjectName,
            buildSpec: CodeBuild.BuildSpec.fromObjectToYaml({
                version: '0.2',
                phases: {
                    install: {
                        'runtime-versions': {
                            nodejs: 22,
                        },
                    },
                    pre_build: {
                        commands: [
                            'git clone --depth 1 "$REPOSITORY_URL" source',
                            'test -f source/package.json',
                            'test -f source/package-lock.json',
                            'cd source && npm ci',
                        ],
                    },
                    build: {
                        commands: [
                            'cd source && npm run build',
                        ],
                    },
                },
            }),
            environment: {
                buildImage: CodeBuild.LinuxBuildImage.STANDARD_7_0,
                computeType: CodeBuild.ComputeType.SMALL,
                privileged: false,
            },
            timeout: cdk.Duration.minutes(15),
            queuedTimeout: cdk.Duration.minutes(10),
            concurrentBuildLimit: 2,
            grantReportGroupPermissions: false,
        });
    }
}
