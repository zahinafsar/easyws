import { Badge } from '@/components/ui/badge'

const statusDetails = {
  SUCCEEDED: { label: 'Succeeded', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
  FAULT: { label: 'Fault', variant: 'danger' },
  TIMED_OUT: { label: 'Timed out', variant: 'danger' },
  STOPPED: { label: 'Stopped', variant: 'warning' },
  IN_PROGRESS: { label: 'Building', variant: 'info' },
  QUEUED: { label: 'Queued', variant: 'secondary' },
} as const

export const activeBuildStatuses = new Set(['IN_PROGRESS', 'QUEUED'])

export function BuildStatus({ status }: { status: string }) {
  const details = statusDetails[status as keyof typeof statusDetails]

  if (!details) {
    return <Badge variant="outline">{status}</Badge>
  }

  return <Badge variant={details.variant}>{details.label}</Badge>
}
