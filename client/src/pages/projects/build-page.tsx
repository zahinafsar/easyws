import { Link, useParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react'
import { BuildSteps } from '@/components/build-steps'
import { activeBuildStatuses, BuildStatus } from '@/components/build-status'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatDateTime, formatDuration, getRepositoryName } from '@/lib/builds'

export function BuildPage() {
  const { projectId = '', buildId = '' } = useParams()
  const project = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: Boolean(projectId),
  })
  const build = useQuery({
    queryKey: ['projects', projectId, 'builds', buildId],
    queryFn: () => api.getBuild(projectId, buildId),
    enabled: Boolean(projectId && buildId),
    refetchInterval: query =>
      query.state.data && activeBuildStatuses.has(query.state.data.status)
        ? 3000
        : false,
  })
  const isActive = build.data
    ? activeBuildStatuses.has(build.data.status)
    : build.isLoading
  const logs = useInfiniteQuery({
    queryKey: ['projects', projectId, 'builds', buildId, 'logs'],
    queryFn: ({ pageParam }) => api.getBuildLogs(projectId, buildId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: page => page.nextToken,
    enabled: Boolean(projectId && buildId),
    refetchInterval: isActive ? 3000 : false,
  })
  const logEvents = logs.data?.pages.flatMap(page => page.events) ?? []

  return (
    <div className="mx-auto max-w-6xl p-8">
      <nav className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          {project.data?.name ?? 'Project'}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Build</span>
      </nav>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {project.isLoading ? (
            <Skeleton className="h-8 w-72" />
          ) : (
            <h1 className="text-2xl font-semibold">
              {getRepositoryName(project.data?.repositoryUrl ?? '')}
            </h1>
          )}
          <p className="truncate font-mono text-xs text-muted-foreground">
            {buildId}
          </p>
        </div>
        {build.data ? <BuildStatus status={build.data.status} /> : null}
      </div>

      {project.error || build.error || logs.error ? (
        <Alert variant="danger" className="mb-6">
          <AlertDescription>
            {project.error?.message ??
              build.error?.message ??
              logs.error?.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {project.data && build.data ? (
        <dl className="mb-6 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Repository</dt>
            <dd className="mt-1">
              <a
                href={project.data.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium hover:underline"
              >
                {getRepositoryName(project.data.repositoryUrl)}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Started</dt>
            <dd className="mt-1">{formatDateTime(build.data.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Duration</dt>
            <dd className="mt-1">
              {formatDuration(build.data.createdAt, build.data.completedAt)}
            </dd>
          </div>
        </dl>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Steps</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logs.refetch()}
          disabled={logs.isRefetching}
        >
          <RefreshCw
            className={logs.isRefetching ? 'animate-spin' : undefined}
          />
          Refresh
        </Button>
      </div>

      {build.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <BuildSteps steps={build.data?.steps ?? []} events={logEvents} />
      )}

      {logs.hasNextPage ? (
        <div className="pt-3">
          <Button
            variant="outline"
            size="sm"
            loading={logs.isFetchingNextPage}
            onClick={() => logs.fetchNextPage()}
          >
            Load more output
          </Button>
        </div>
      ) : null}
    </div>
  )
}
