
const key = (key: string) => {
    const env = process.env[key];
    return {
        optional: (value?: string) => {
            return env || value;
        },
        required: () => {
            if (!env) throw new Error(`Missing required env: ${key}`)
            return env
        }
    }
};

export const env = {
    awsRegion: key("AWS_REGION").required(),
    awsAccesskey: key("AWS_ACCESS_KEY").required(),
    awsSecretKey: key("AWS_SECRET_KEY").required(),
}