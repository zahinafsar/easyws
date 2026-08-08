import { CaddyStack } from '../caddy/stack';
import { encodeBase64 } from '../utils/base64';
import { required } from '../utils/env';

export class CaddyService {
    appsDomain: string;

    private static readonly ReloadCommands = [
        'docker exec caddy caddy reload --config /etc/caddy/Caddyfile || docker restart caddy',
    ];

    constructor() {
        this.appsDomain = required(process.env.APPS_DOMAIN)
    }

    hostname(subdomain: string) {
        return `${subdomain}.${this.appsDomain}`;
    }

    private sitePath(projectId: string) {
        return `${CaddyStack.SitesDirectory}/${projectId}.caddy`;
    }

    private renderSite(subdomain: string, port: number) {
        return `${this.hostname(subdomain)} {\n\treverse_proxy 127.0.0.1:${port}\n}\n`;
    }

    publishCommands(projectId: string, subdomain: string, port: number) {
        return [
            `mkdir -p ${CaddyStack.SitesDirectory}`,
            `printf %s '${encodeBase64(this.renderSite(subdomain, port))}' | base64 -d > ${this.sitePath(projectId)}`,
            ...CaddyService.ReloadCommands,
        ];
    }

    removeCommands(projectId: string) {
        return [
            `rm -f ${this.sitePath(projectId)}`,
            ...CaddyService.ReloadCommands,
        ];
    }
}
