import { LambdaIntegration, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

export class ProjectApi {
    constructor(api: LambdaRestApi, handler: IFunction) {
        const projects = api.root.addResource('projects');
        projects.addMethod('GET', new LambdaIntegration(handler))
        projects.addMethod('POST', new LambdaIntegration(handler))

        const project = projects.addResource('{projectId}');
        project.addMethod('DELETE', new LambdaIntegration(handler))

        const builds = project.addResource('builds');
        builds.addMethod('GET', new LambdaIntegration(handler))
        builds.addMethod('POST', new LambdaIntegration(handler))
    }
}
