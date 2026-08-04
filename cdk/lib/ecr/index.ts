import * as cdk from 'aws-cdk-lib/core';
import * as Ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class ECRStack extends cdk.Stack {
    readonly repository: Ecr.Repository;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.repository = new Ecr.Repository(this, 'BuildImages', {
            repositoryName: 'easyws-builds',
        });
    }
}
