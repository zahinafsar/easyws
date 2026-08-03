import { LambdaIntegration, Resource } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

export class ProjectApi {
    constructor(api: Resource, handler: IFunction) {
        const projects = api.addResource('projects');
        projects.addMethod('GET', new LambdaIntegration(handler))
        projects.addMethod('POST', new LambdaIntegration(handler))
        projects.addMethod('DELETE', new LambdaIntegration(handler))
    }
}
