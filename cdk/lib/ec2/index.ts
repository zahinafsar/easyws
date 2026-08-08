import * as cdk from 'aws-cdk-lib/core';
import * as Ec2 from 'aws-cdk-lib/aws-ec2';
import * as Ecr from 'aws-cdk-lib/aws-ecr';
import * as Iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { config } from '../utils/env';

export interface Ec2HostStackProps extends cdk.StackProps {
    repository: Ecr.Repository;
}

export class Ec2HostStack extends cdk.Stack {
    readonly instance: Ec2.Instance;
    readonly elasticIp: Ec2.CfnEIP;

    constructor(scope: Construct, id: string, props: Ec2HostStackProps) {
        super(scope, id, props);

        const vpc = new Ec2.Vpc(this, 'HostVpc', {
            maxAzs: 1,
            natGateways: 0,
            subnetConfiguration: [{
                name: 'public',
                subnetType: Ec2.SubnetType.PUBLIC,
                cidrMask: 24,
            }],
        });

        const securityGroup = new Ec2.SecurityGroup(this, 'HostSecurityGroup', {
            vpc,
            description: 'EasyWS application host',
            allowAllOutbound: true,
        });

        securityGroup.addIngressRule(
            Ec2.Peer.anyIpv4(),
            Ec2.Port.tcpRange(config.appPortRangeStart, config.appPortRangeEnd),
            'Application containers',
        );

        const role = new Iam.Role(this, 'HostRole', {
            assumedBy: new Iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                Iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
            ],
        });

        role.addToPolicy(new Iam.PolicyStatement({
            actions: ['ecr:GetAuthorizationToken'],
            resources: ['*'],
        }));

        role.addToPolicy(new Iam.PolicyStatement({
            actions: [
                'ecr:BatchCheckLayerAvailability',
                'ecr:BatchGetImage',
                'ecr:GetDownloadUrlForLayer',
            ],
            resources: [props.repository.repositoryArn],
        }));

        const userData = Ec2.UserData.forLinux();
        userData.addCommands(
            'dnf install -y docker',
            'systemctl enable --now docker',
        );

        this.instance = new Ec2.Instance(this, 'Host', {
            vpc,
            vpcSubnets: { subnetType: Ec2.SubnetType.PUBLIC },
            instanceType: Ec2.InstanceType.of(Ec2.InstanceClass.T3, Ec2.InstanceSize.SMALL),
            machineImage: Ec2.MachineImage.latestAmazonLinux2023(),
            securityGroup,
            role,
            userData,
            blockDevices: [{
                deviceName: '/dev/xvda',
                volume: Ec2.BlockDeviceVolume.ebs(20, {
                    volumeType: Ec2.EbsDeviceVolumeType.GP3,
                    encrypted: true,
                }),
            }],
        });

        this.elasticIp = new Ec2.CfnEIP(this, 'HostAddress', {
            domain: 'vpc',
            instanceId: this.instance.instanceId,
        });

        new cdk.CfnOutput(this, 'HostInstanceId', {
            value: this.instance.instanceId,
        });

        new cdk.CfnOutput(this, 'HostPublicIp', {
            value: this.elasticIp.ref,
            description: 'Applications are reachable at http://<this ip>:<project port>',
        });
    }
}
