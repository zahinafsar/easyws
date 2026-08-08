import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { api, type ProjectSettings } from '@/lib/api'

const emptySettings: ProjectSettings = {
  installCommand: '',
  buildCommand: '',
  startCommand: '',
}

const toSettings = (project: Partial<ProjectSettings>): ProjectSettings => ({
  installCommand: project.installCommand ?? '',
  buildCommand: project.buildCommand ?? '',
  startCommand: project.startCommand ?? '',
})

const fields = [
  {
    key: 'installCommand',
    label: 'Install command',
    placeholder: 'npm install',
    hint: 'Runs first, before your source is built.',
  },
  {
    key: 'buildCommand',
    label: 'Build command',
    placeholder: 'npm run build',
    hint: 'Leave empty if the app needs no build step.',
  },
  {
    key: 'startCommand',
    label: 'Start command',
    placeholder: 'npm start',
    hint: 'Must start a server listening on port 3000.',
  },
] as const

export function ProjectSettingsPage() {
  const { projectId = '' } = useParams()
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<ProjectSettings>(emptySettings)
  const [saved, setSaved] = useState<ProjectSettings>(emptySettings)
  const project = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: Boolean(projectId),
  })
  const save = useMutation({
    mutationFn: () => api.updateProject(projectId, settings),
    onSuccess: result => {
      const next = toSettings(result)
      setSettings(next)
      setSaved(next)
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      toast({ variant: 'success', title: 'Build settings saved' })
    },
    onError: (error: Error) => {
      toast({ variant: 'error', title: error.message })
    },
  })

  const data = project.data

  useEffect(() => {
    if (!data) return
    const next = toSettings(data)
    setSettings(next)
    setSaved(next)
  }, [data])

  if (project.error) {
    return (
      <Alert variant="danger">
        <AlertDescription>{project.error.message}</AlertDescription>
      </Alert>
    )
  }

  if (project.isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  const isDirty = fields.some(field => settings[field.key] !== saved[field.key])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Build settings</h2>
        <p className="text-sm text-muted-foreground">
          These commands become the image that runs your app. A Dockerfile in the
          repository is not used.
        </p>
      </div>

      {fields.map(field => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          <Input
            id={field.key}
            value={settings[field.key]}
            placeholder={field.placeholder}
            spellCheck={false}
            className="font-mono"
            onChange={event =>
              setSettings(current => ({
                ...current,
                [field.key]: event.target.value,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">{field.hint}</p>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button
          onClick={() => save.mutate()}
          loading={save.isPending}
          disabled={!isDirty || !settings.startCommand.trim()}
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
        <span className="text-sm text-muted-foreground">
          Applied on the next build.
        </span>
      </div>
    </div>
  )
}
