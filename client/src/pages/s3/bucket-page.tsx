import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight, FileBox, Trash2, Upload } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { FileInput } from '@/components/ui/file-input'
import { confirm } from '@/components/ui/confirm-modal'
import { toast } from '@/components/ui/toast'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

type CardProps = {
  url: string
  k: string
  size?: number
  modified?: string
  onDelete: () => void
}

function ObjectCard({ url, k, size, modified, onDelete }: CardProps) {
  const [broken, setBroken] = useState(false)

  return (
    <div className="group relative overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-md">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block aspect-square bg-muted"
      >
        {broken ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <FileBox className="h-10 w-10" />
          </div>
        ) : (
          <img
            src={url}
            alt={k}
            loading="lazy"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover"
          />
        )}
      </a>
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
        <div className="min-w-0">
          <div className="truncate font-mono text-xs">{k}</div>
          <div className="text-[11px] text-muted-foreground">
            {typeof size === 'number' ? formatSize(size) : '—'}
            {modified ? ` · ${new Date(modified).toLocaleDateString()}` : ''}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${k}`}
          onClick={onDelete}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function BucketPage() {
  const { name = '' } = useParams<{ name: string }>()
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['s3', 'bucket', name],
    queryFn: () => api.listMedia(name),
    enabled: !!name,
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      return api.uploadMedia(name, file)
    },
    onSuccess: () => {
      toast({ variant: 'success', title: 'File uploaded' })
      qc.invalidateQueries({ queryKey: ['s3', 'bucket', name] })
    },
    onError: (e: Error) => toast({ variant: 'error', title: e.message }),
    onSettled: () => setUploading(false),
  })

  const removeObject = useMutation({
    mutationFn: async (key: string) => {
      return api.deleteMedia(name, key)
    },
    onSuccess: () => {
      toast({ variant: 'success', title: 'Object deleted' })
      qc.invalidateQueries({ queryKey: ['s3', 'bucket', name] })
    },
    onError: (e: Error) => toast({ variant: 'error', title: e.message }),
  })

  const objects = data?.Contents ?? []

  return (
    <div className="mx-auto max-w-6xl p-8">
      <nav className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/s3" className="inline-flex items-center hover:text-foreground">
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Buckets
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-muted-foreground">
            {objects.length} object{objects.length === 1 ? '' : 's'}
          </p>
        </div>
        <FileInput
          onValueChange={(files) => {
            if (!files[0]) return
            setUploading(true)
            upload.mutate(files[0])
          }}
        >
          <span className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload file'}
          </span>
        </FileInput>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : objects.length === 0 ? (
        <EmptyState
          icon={<FileBox className="h-10 w-10" />}
          title="Empty bucket"
          description="Upload a file to get started."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {objects.map((o) => (
            <ObjectCard
              key={o.Key}
              url={o.Url!}
              k={o.Key!}
              size={typeof o.Size === 'number' ? o.Size : undefined}
              modified={
                typeof o.LastModified === 'string' ? o.LastModified : undefined
              }
              onDelete={() =>
                confirm({
                  title: 'Delete object?',
                  message: o.Key,
                  variant: 'danger',
                  confirmText: 'Delete',
                  onConfirm: () => removeObject.mutate(o.Key!),
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
