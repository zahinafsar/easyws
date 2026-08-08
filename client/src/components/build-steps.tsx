import { Check, Circle, Loader2, X } from 'lucide-react'
import type { BuildLogEvent, BuildStep, BuildStepStatus } from '@/lib/api'
import { formatDuration, sliceLogsByPhase, stepLogPhases } from '@/lib/builds'
import { cn } from '@/lib/cn'

const logTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function StepIcon({ status }: { status: BuildStepStatus }) {
  if (status === 'in_progress') {
    return <Loader2 className="h-4 w-4 animate-spin text-foreground" />
  }

  if (status === 'succeeded') {
    return <Check className="h-4 w-4 text-emerald-600" />
  }

  if (status === 'failed') {
    return <X className="h-4 w-4 text-destructive" />
  }

  return <Circle className="h-4 w-4 text-muted-foreground/40" />
}

function StepDuration({ step }: { step: BuildStep }) {
  if (!step.startedAt) return <span className="text-muted-foreground">—</span>

  return (
    <span className="text-muted-foreground">
      {formatDuration(step.startedAt, step.completedAt)}
    </span>
  )
}

function LogPane({ events }: { events: BuildLogEvent[] }) {
  return (
    <div className="max-h-[50vh] overflow-auto border-t border-border bg-muted px-4 py-3 font-mono text-xs">
      {events.length ? (
        <div className="space-y-1">
          {events.map((event, index) => (
            <div
              key={`${event.timestamp ?? 'event'}-${index}`}
              className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3"
            >
              <span className="text-muted-foreground">
                {event.timestamp
                  ? logTimeFormatter.format(event.timestamp)
                  : '--:--:--'}
              </span>
              <span className="whitespace-pre-wrap break-words">
                {event.message}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground">Waiting for output…</span>
      )}
    </div>
  )
}

type BuildStepsProps = {
  steps: BuildStep[]
  events: BuildLogEvent[]
}

export function BuildSteps({ steps, events }: BuildStepsProps) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
      {steps.map(step => {
        const showLogs =
          step.name === 'build'
            ? step.status !== 'pending'
            : step.status === 'failed'
        const phase = stepLogPhases[step.name]

        return (
          <div key={step.name}>
            <div className="flex items-center gap-3 px-4 py-3 text-sm">
              <StepIcon status={step.status} />
              <span
                className={cn(
                  'flex-1',
                  step.status === 'pending'
                    ? 'text-muted-foreground'
                    : 'font-medium',
                )}
              >
                {step.label}
              </span>
              <StepDuration step={step} />
            </div>
            {showLogs && phase ? (
              <LogPane events={sliceLogsByPhase(events, phase)} />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
