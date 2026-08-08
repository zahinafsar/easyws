import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { confirm } from '@/components/ui/confirm-modal'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

export function ProjectLayout() {
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

  const hasBuilds = Boolean(builds.data?.length)

  const tabs = [
    { to: `/projects/${projectId}`, label: 'Overview', end: true },
    { to: `/projects/${projectId}/env`, label: 'Environment', end: false },
    { to: `/projects/${projectId}/settings`, label: 'Settings', end: false },
  ]

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
            {hasBuilds ? 'Retry build' : 'Start build'}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-6 border-b border-border">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                '-mb-px border-b-2 pb-3 text-sm transition-colors',
                isActive
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
