export interface DockerfileInput {
    installCommand: string;
    buildCommand: string;
    startCommand: string;
    envVars: string;
    containerPort: number;
}

const escapeValue = (value: string) =>
    value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\$/g, '\\$');

const parseEnvVars = (content: string) =>
    content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '' && !line.startsWith('#'))
        .map(line => {
            const separator = line.indexOf('=');
            return {
                key: line.slice(0, separator),
                value: line.slice(separator + 1),
            };
        });

export const renderDockerfile = ({
    installCommand,
    buildCommand,
    startCommand,
    envVars,
    containerPort,
}: DockerfileInput) => {
    const lines = [
        'FROM node:20-alpine',
        'WORKDIR /app',
        ...parseEnvVars(envVars).map(
            ({ key, value }) => `ENV ${key}="${escapeValue(value)}"`,
        ),
        'COPY . .',
        `RUN ${installCommand}`,
    ];

    if (buildCommand.trim()) {
        lines.push(`RUN ${buildCommand}`);
    }

    lines.push(
        `ENV PORT=${containerPort}`,
        `EXPOSE ${containerPort}`,
        `CMD ${startCommand}`,
    );

    return `${lines.join('\n')}\n`;
}
