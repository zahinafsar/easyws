#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { LambdaStack } from './lambda';
import { ApiStack } from './api';

const app = new cdk.App();
const storageLambda = new LambdaStack(app, 'LambdaStack');
new ApiStack(app, 'ApiStack', { handler: storageLambda.get })