import { SendCommandCommand, SSMClient } from '@aws-sdk/client-ssm';

export interface RunShellScriptInput {
    instanceId: string;
    commands: string[];
    comment?: string;
}

export class SsmService {
    constructor(private readonly client = new SSMClient({})) {}

    async runShellScript({ instanceId, commands, comment }: RunShellScriptInput) {
        await this.client.send(new SendCommandCommand({
            InstanceIds: [instanceId],
            DocumentName: 'AWS-RunShellScript',
            Comment: comment,
            Parameters: { commands },
        }));
    }
}
