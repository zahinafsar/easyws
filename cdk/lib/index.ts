#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib/core';
import { StorageLambdaStack } from './lambda/storage';
import { ApiStack } from './api';
import { ProjectLambdaStack } from './lambda/project';
import { CodeBuildStack } from './codebuild';
import { ECRStack } from './ecr';
import { Ec2HostStack } from './ec2';

const app = new cdk.App();
const ecr = new ECRStack(app, 'ECR');
const ec2Host = new Ec2HostStack(app, 'Ec2HostStack', {
    repository: ecr.repository
});
const codeBuild = new CodeBuildStack(app, 'CodeBuildStack', {
    repository: ecr.repository,
    hostInstance: ec2Host.instance,
});
const storageLambda = new StorageLambdaStack(app, 'StorageLambdaStack');
const projectLambda = new ProjectLambdaStack(app, 'ProjectLambdaStack', {
    buildProject: codeBuild.project,
    hostInstance: ec2Host.instance,
});
new ApiStack(app, 'ApiStack', {
    storageHandler: storageLambda.handler,
    projectHandler: projectLambda.handler
})
