import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib/core';
import * as Ec2 from 'aws-cdk-lib/aws-ec2';
import * as Ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { CaddyService } from '../service/caddy';

export interface CaddyStackProps extends cdk.StackProps {
    hostInstance: Ec2.Instance;
}

export class CaddyStack extends cdk.Stack {
    static readonly ConfigDirectory = '/etc/easyws/caddy';
    static readonly SitesDirectory = `${CaddyStack.ConfigDirectory}/sites`;

    constructor(scope: Construct, id: string, props: CaddyStackProps) {
        super(scope, id, props);

        const rootConfig = fs.readFileSync(path.join(__dirname, 'caddy'), 'utf8');

        new Ssm.CfnAssociation(this, 'Setup', {
            name: 'AWS-RunShellScript',
            associationName: 'easyws-caddy-setup',
            targets: [{
                key: 'InstanceIds',
                values: [props.hostInstance.instanceId],
            }],
            parameters: {
                commands: [
                    'dnf install -y docker',
                    'systemctl enable --now docker',
                    'usermod -aG docker ec2-user',
                    `mkdir -p ${CaddyStack.SitesDirectory}`,
                    `cat > ${CaddyStack.ConfigDirectory}/Caddyfile <<'EOF'\n${rootConfig}\nEOF`,
                    'docker pull caddy:2-alpine',
                    'docker rm -f caddy >/dev/null 2>&1 || true',
                    `docker run -d --name caddy --restart unless-stopped --network host -v ${CaddyStack.ConfigDirectory}:/etc/caddy -v caddy-data:/data -v caddy-config:/config caddy:2-alpine`,
                ],
            },
            waitForSuccessTimeoutSeconds: 900,
        });
    }
}
