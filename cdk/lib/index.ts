#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib/core';
import { StorageLambdaStack } from './lambda/storage';
import { ApiStack } from './api';
import { ProjectLambdaStack } from './lambda/project';
import { CodeBuildStack } from './codebuild';
import { ECRStack } from './ecr';

const app = new cdk.App();
const ecr = new ECRStack(app, 'ECR');
const codeBuild = new CodeBuildStack(app, 'CodeBuildStack', {
    repository: ecr.repository
});
const storageLambda = new StorageLambdaStack(app, 'StorageLambdaStack');
const projectLambda = new ProjectLambdaStack(app, 'ProjectLambdaStack', {
    buildProject: codeBuild.project,
});
new ApiStack(app, 'ApiStack', {
    storageHandler: storageLambda.handler,
    projectHandler: projectLambda.handler
})
