#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { StorageLambdaStack } from './lambda/storage';
import { ApiStack } from './api';
import { ProjectLambdaStack } from './lambda/project';

const app = new cdk.App();
const storageLambda = new StorageLambdaStack(app, 'StorageLambdaStack');
const ProjectLambda = new ProjectLambdaStack(app, 'ProjectLambdaStack');
new ApiStack(app, 'ApiStack', {
    storageHandler: storageLambda.handler,
    projectHandler: ProjectLambda.handler
})