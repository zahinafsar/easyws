import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronRight,
  GitCommitHorizontal,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { BuildStatus } from '@/components/build-status'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { confirm } from '@/components/ui/confirm-modal'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { formatDateTime, formatDuration } from '@/lib/builds'

export function ProjectPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const project = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: Boolean(projectId),
  })
  const builds = useQuery({
    queryKey: ['projects', projectId, 'builds'],
    queryFn: () => api.listBuilds(projectId),
    enabled: Boolean(projectId),
  })
  const createBuild = useMutation({
    mutationFn: () => api.createBuild(projectId),
    onSuccess: result => {
      queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'builds'],
      })
      navigate(`/projects/${projectId}/builds/${result.buildId}`)
    },
    onError: (error: Error) => {
      toast({ variant: 'error', title: error.message })
    },
  })
  const deleteProject = useMutation({
    mutationFn: () => api.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate('/projects')
      toast({ variant: 'success', title: 'Project deleted' })
    },
    onError: (error: Error) => {
      toast({ variant: 'error', title: error.message })
    },
  })

  const history = builds.data ?? []

  return (
    <div className="mx-auto max-w-6xl p-8">
      <nav className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          to="/projects"
          className="inline-flex items-center hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Projects
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">
          {project.data?.name ?? 'Project'}
        </span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div>
          {project.isLoading ? (
            <Skeleton className="h-8 w-72" />
          ) : (
            <h1 className="text-2xl font-semibold">{project.data?.name}</h1>
          )}
          <p className="text-sm text-muted-foreground">
            {project.data ? (
              <a
                href={project.data.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {project.data.repositoryUrl}
              </a>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Delete project"
            onClick={() =>
              confirm({
                title: `Delete ${project.data?.name ?? 'project'}?`,
                message: 'This also deletes its build history.',
                variant: 'danger',
                confirmText: 'Delete',
                onConfirm: () => deleteProject.mutate(),
              })
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => createBuild.mutate()}
            loading={createBuild.isPending}
          >
            <RefreshCw className="h-4 w-4" />
            {history.length ? 'Retry build' : 'Start build'}
          </Button>
        </div>
      </div>

      {project.error || builds.error ? (
        <Alert variant="danger" className="mb-6">
          <AlertDescription>
            {project.error?.message ?? builds.error?.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {builds.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : history.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Build</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map(build => (
              <TableRow key={build.buildId}>
                <TableCell>
                  <Link
                    to={`/projects/${projectId}/builds/${build.buildId}`}
                    className="font-medium hover:underline"
                  >
                    {build.buildId}
                  </Link>
                </TableCell>
                <TableCell>
                  <BuildStatus status={build.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(build.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDuration(build.createdAt, build.completedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={<GitCommitHorizontal className="h-10 w-10" />}
          title="No builds yet"
          description="Start the first build for this repository."
          action={
            <Button
              onClick={() => createBuild.mutate()}
              loading={createBuild.isPending}
            >
              <RefreshCw className="h-4 w-4" />
              Start build
            </Button>
          }
        />
      )}
    </div>
  )
}
