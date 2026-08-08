import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Upload } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { api } from '@/lib/api'

const placeholder = `DATABASE_URL=postgresql://user:password@host:5432/db
LOG_LEVEL=info

# Comments and blank lines are allowed`

const countVariables = (content: string) =>
  content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '' && !line.startsWith('#')).length

export function ProjectEnvPage() {
  const { projectId = '' } = useParams()
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [content, setContent] = useState('')
  const [saved, setSaved] = useState('')
  const project = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: Boolean(projectId),
  })
  const save = useMutation({
    mutationFn: () => api.updateProjectEnv(projectId, content),
    onSuccess: result => {
      setContent(result.content)
      setSaved(result.content)
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      toast({ variant: 'success', title: 'Environment saved' })
    },
    onError: (error: Error) => {
      toast({ variant: 'error', title: error.message })
    },
  })

  const envVars = project.data?.envVars

  useEffect(() => {
    if (envVars === undefined) return
    setContent(envVars)
    setSaved(envVars)
  }, [envVars])

  const importFile = async (file: File) => {
    const imported = (await file.text()).replace(/\r\n?/g, '\n').trim()

    if (!imported) {
      toast({ variant: 'error', title: `${file.name} is empty` })
      return
    }

    setContent(current => {
      const existing = current.trim()
      if (!existing) return `${imported}\n`
      return `${existing}\n${imported}\n`
    })
    toast({
      variant: 'success',
      title: `Imported ${countVariables(imported)} variables from ${file.name}`,
    })
  }

  if (project.error) {
    return (
      <Alert variant="danger">
        <AlertDescription>{project.error.message}</AlertDescription>
      </Alert>
    )
  }

  if (project.isLoading) {
    return <Skeleton className="h-80 w-full" />
  }

  const isDirty = content !== saved

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Environment variables</h2>
          <p className="text-sm text-muted-foreground">
            One <code className="font-mono">KEY=value</code> per line. Values are
            passed to the container verbatim, so quotes become part of the value.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            className="sr-only"
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) importFile(file)
              event.target.value = ''
            }}
          />
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <Upload className="h-4 w-4" />
            Import .env
          </Button>
          <Button
            onClick={() => save.mutate()}
            loading={save.isPending}
            disabled={!isDirty}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <Textarea
        value={content}
        onChange={event => setContent(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        rows={18}
        className="resize-y font-mono leading-relaxed"
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {countVariables(content)} variables
          {isDirty ? ' (unsaved changes)' : null}
        </span>
        <span>Applied to the container on the next build.</span>
      </div>
    </div>
  )
}
