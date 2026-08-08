import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GitCommitHorizontal, RefreshCw } from 'lucide-react'
import { BuildStatus } from '@/components/build-status'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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

  const history = builds.data ?? []

  if (builds.error) {
    return (
      <Alert variant="danger">
        <AlertDescription>{builds.error.message}</AlertDescription>
      </Alert>
    )
  }

  if (builds.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (!history.length) {
    return (
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
    )
  }

  return (
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
  )
}
