import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Save } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { api, appsDomain } from '@/lib/api'

const subdomainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

export function ProjectDomainPage() {
  const { projectId = '' } = useParams()
  const queryClient = useQueryClient()
  const [subdomain, setSubdomain] = useState('')
  const [saved, setSaved] = useState('')
  const project = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.getProject(projectId),
    enabled: Boolean(projectId),
  })
  const save = useMutation({
    mutationFn: () => api.updateProjectDomain(projectId, subdomain),
    onSuccess: result => {
      setSubdomain(result.subdomain)
      setSaved(result.subdomain)
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      toast({ variant: 'success', title: 'Domain updated' })
    },
    onError: (error: Error) => {
      toast({ variant: 'error', title: error.message })
    },
  })

  const current = project.data?.subdomain

  useEffect(() => {
    if (current === undefined) return
    setSubdomain(current)
    setSaved(current)
  }, [current])

  if (project.error) {
    return (
      <Alert variant="danger">
        <AlertDescription>{project.error.message}</AlertDescription>
      </Alert>
    )
  }

  if (project.isLoading) {
    return <Skeleton className="h-48 w-full" />
  }

  const isDirty = subdomain !== saved
  const isValid = subdomainPattern.test(subdomain)
  const liveUrl = `https://${saved}.${appsDomain}`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Domain</h2>
        <p className="text-sm text-muted-foreground">
          Your app is served over HTTPS at this address. Changes take effect
          within a few seconds, without a rebuild.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subdomain">Subdomain</Label>
        <div className="flex items-center gap-2">
          <Input
            id="subdomain"
            value={subdomain}
            placeholder="my-app"
            spellCheck={false}
            autoCapitalize="none"
            className="font-mono"
            onChange={event =>
              setSubdomain(event.target.value.toLowerCase().trim())
            }
          />
          <span className="shrink-0 font-mono text-sm text-muted-foreground">
            .{appsDomain}
          </span>
        </div>
        {subdomain && !isValid ? (
          <p className="text-xs text-destructive">
            Use lowercase letters, numbers and hyphens. It cannot start or end
            with a hyphen.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers and hyphens, up to 63 characters.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => save.mutate()}
          loading={save.isPending}
          disabled={!isDirty || !isValid}
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
        {saved ? (
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm hover:underline"
          >
            {liveUrl}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        The certificate is issued on the first request to a new address, so it
        can take a few seconds to load the first time.
      </p>
    </div>
  )
}
