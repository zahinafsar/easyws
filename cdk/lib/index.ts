#!/usr/bin/env node
import 'dotenv/config';
import * as cdk from 'aws-cdk-lib/core';
import { StorageLambdaStack } from './lambda/storage';
import { ApiStack } from './api';
import { ProjectLambdaStack } from './lambda/project';
import { CodeBuildStack } from './codebuild';

const app = new cdk.App();
const codeBuild = new CodeBuildStack(app, 'CodeBuildStack');
const storageLambda = new StorageLambdaStack(app, 'StorageLambdaStack');
const projectLambda = new ProjectLambdaStack(app, 'ProjectLambdaStack', {
    buildProject: codeBuild.project,
});
new ApiStack(app, 'ApiStack', {
    storageHandler: storageLambda.handler,
    projectHandler: projectLambda.handler
})
