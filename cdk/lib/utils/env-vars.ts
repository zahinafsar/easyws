const envVariablePattern = /^[A-Za-z_][A-Za-z0-9_]*=/;
const reservedKeys = ['PORT'];

export const normalizeEnvVars = (content: string) => {
    const normalized = content.replace(/\r\n?/g, '\n');
    const entries = normalized
        .split('\n')
        .map((line, index) => ({ value: line.trim(), number: index + 1 }))
        .filter(line => line.value !== '' && !line.value.startsWith('#'));

    const invalid = entries.find(line => !envVariablePattern.test(line.value));

    if (invalid) {
        throw new Error(`Line ${invalid.number} is not a KEY=value pair or comment`);
    }

    const reserved = entries.find(line =>
        reservedKeys.includes(line.value.slice(0, line.value.indexOf('=')))
    );

    if (reserved) {
        throw new Error(`Line ${reserved.number} sets PORT, which is managed by the platform`);
    }

    return normalized;
}
