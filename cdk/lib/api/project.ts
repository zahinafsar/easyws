import { LambdaIntegration, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

export class ProjectApi {
    constructor(api: LambdaRestApi, handler: IFunction) {
        const projects = api.root.addResource('projects');
        projects.addMethod('GET', new LambdaIntegration(handler))
        projects.addMethod('POST', new LambdaIntegration(handler))

        const project = projects.addResource('{projectId}');
        project.addMethod('GET', new LambdaIntegration(handler))
        project.addMethod('PATCH', new LambdaIntegration(handler))
        project.addMethod('DELETE', new LambdaIntegration(handler))

        const domain = project.addResource('domain');
        domain.addMethod('PUT', new LambdaIntegration(handler))

        const env = project.addResource('env');
        env.addMethod('PUT', new LambdaIntegration(handler))

        const builds = project.addResource('builds');
        builds.addMethod('GET', new LambdaIntegration(handler))
        builds.addMethod('POST', new LambdaIntegration(handler))

        const build = builds.addResource('{buildId}');
        build.addMethod('GET', new LambdaIntegration(handler))

        const logs = build.addResource('logs');
        logs.addMethod('GET', new LambdaIntegration(handler))
    }
}
