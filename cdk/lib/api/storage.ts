import { LambdaIntegration, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

export class StorageApi {
    constructor(api: LambdaRestApi, handler: IFunction) {
        const folders = api.root.addResource('folder');
        folders.addMethod('GET', new LambdaIntegration(handler))
        folders.addMethod('POST', new LambdaIntegration(handler))

        const folder = folders.addResource('{folderName}');
        folder.addMethod('GET', new LambdaIntegration(handler))
        folder.addMethod('POST', new LambdaIntegration(handler))
        folder.addMethod('PUT', new LambdaIntegration(handler))
        folder.addMethod('DELETE', new LambdaIntegration(handler))

        const media = folder.addResource('{mediaId}')
        media.addMethod('GET', new LambdaIntegration(handler))
        media.addMethod('DELETE', new LambdaIntegration(handler))
    }
}
