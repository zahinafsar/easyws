import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { getRepositoryName } from '@/lib/builds'

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: api.listProjects,
  })
  const createProject = useMutation({
    mutationFn: ({ projectName, url }: { projectName: string; url: string }) =>
      api.createProject(projectName, url),
    onSuccess: () => {
      setDialogOpen(false)
      setName('')
      setRepositoryUrl('')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast({ variant: 'success', title: 'Project created' })
    },
    onError: (error: Error) => {
      toast({ variant: 'error', title: error.message })
    },
  })

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage projects and builds
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {projects.error ? (
        <Alert variant="danger" className="mb-6">
          <AlertDescription>{projects.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {projects.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : projects.data?.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Repository</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.data.map(project => (
              <TableRow key={project.id}>
                <TableCell>
                  <Link
                    to={`/projects/${project.id}`}
                    className="font-medium hover:underline"
                  >
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:underline"
                  >
                    {getRepositoryName(project.repositoryUrl)}
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={<Boxes className="h-10 w-10" />}
          title="No projects yet"
          description="Create your first project to get started."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New project
            </Button>
          }
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <form
          onSubmit={event => {
            event.preventDefault()
            const projectName = name.trim()
            const url = repositoryUrl.trim()
            if (projectName && url) createProject.mutate({ projectName, url })
          }}
        >
          <h2 className="text-lg font-semibold">New project</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each project builds a single public GitHub repository.
          </p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Marketing site"
              autoFocus
            />
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="repository-url">Repository URL</Label>
            <Input
              id="repository-url"
              type="url"
              value={repositoryUrl}
              onChange={event => setRepositoryUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createProject.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
