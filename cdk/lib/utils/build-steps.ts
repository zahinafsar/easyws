import type { BuildPhase } from '@aws-sdk/client-codebuild';

export type BuildStepStatus = 'pending' | 'in_progress' | 'succeeded' | 'failed';

export interface BuildStep {
    name: string;
    label: string;
    status: BuildStepStatus;
    startedAt?: string;
    completedAt?: string;
}

const stepDefinitions = [
    {
        name: 'prepare',
        label: 'Prepare',
        phases: ['SUBMITTED', 'QUEUED', 'PROVISIONING', 'DOWNLOAD_SOURCE', 'INSTALL', 'PRE_BUILD'],
    },
    {
        name: 'build',
        label: 'Build',
        phases: ['BUILD'],
    },
    {
        name: 'deploy',
        label: 'Deploy',
        phases: ['POST_BUILD', 'UPLOAD_ARTIFACTS', 'FINALIZING'],
    },
];

const failedStatuses = ['FAILED', 'FAULT', 'TIMED_OUT', 'STOPPED'];

const toStatus = (phases: BuildPhase[]): BuildStepStatus => {
    if (!phases.length) return 'pending';
    if (phases.some(phase => failedStatuses.includes(phase.phaseStatus ?? ''))) return 'failed';
    if (phases.some(phase => !phase.endTime)) return 'in_progress';
    return 'succeeded';
}

const earliest = (phases: BuildPhase[]) =>
    phases
        .map(phase => phase.startTime)
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => a.getTime() - b.getTime())[0];

const latest = (phases: BuildPhase[]) =>
    phases
        .map(phase => phase.endTime)
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => b.getTime() - a.getTime())[0];

export const toBuildSteps = (phases: BuildPhase[] = []): BuildStep[] =>
    stepDefinitions.map(definition => {
        const matched = phases.filter(phase =>
            definition.phases.includes(phase.phaseType ?? '')
        );
        const status = toStatus(matched);

        return {
            name: definition.name,
            label: definition.label,
            status,
            startedAt: earliest(matched)?.toISOString(),
            completedAt: status === 'succeeded' || status === 'failed'
                ? latest(matched)?.toISOString()
                : undefined,
        };
    });
