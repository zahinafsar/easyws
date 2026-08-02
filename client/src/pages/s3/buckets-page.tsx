import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Plus, Trash2, ExternalLink, Database } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { confirm } from '@/components/ui/confirm-modal'
import { toast } from '@/components/ui/toast'

function useBuckets() {
  return useQuery({
    queryKey: ['s3', 'buckets'],
    queryFn: api.listFolders,
  })
}

export function BucketsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useBuckets()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const create = useMutation({
    mutationFn: async (bucketName: string) => {
      return api.createFolder(bucketName)
    },
    onSuccess: () => {
      toast({ variant: 'success', title: 'Bucket created' })
      setOpen(false)
      setName('')
      qc.invalidateQueries({ queryKey: ['s3', 'buckets'] })
    },
    onError: (e: Error) => toast({ variant: 'error', title: e.message }),
  })

  const remove = useMutation({
    mutationFn: async (bucketName: string) => {
      return api.deleteFolder(bucketName)
    },
    onSuccess: () => {
      toast({ variant: 'success', title: 'Bucket deleted' })
      qc.invalidateQueries({ queryKey: ['s3', 'buckets'] })
    },
    onError: (e: Error) => toast({ variant: 'error', title: e.message }),
  })

  const buckets = data?.Buckets ?? []

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Buckets</h1>
          <p className="text-sm text-muted-foreground">
            Manage your S3 buckets
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New bucket
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : buckets.length === 0 ? (
        <EmptyState
          icon={<Database className="h-10 w-10" />}
          title="No buckets yet"
          description="Create your first S3 bucket to get started."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              New bucket
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {buckets.map((b) => (
              <TableRow key={b.Name}>
                <TableCell>
                  <Link
                    to={`/s3/${b.Name}`}
                    className="font-medium hover:underline"
                  >
                    {b.Name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {b.CreationDate
                    ? new Date(b.CreationDate).toLocaleString()
                    : '—'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          (window.location.href = `/s3/${b.Name}`)
                        }
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          confirm({
                            title: `Delete ${b.Name}?`,
                            message:
                              'This permanently deletes the bucket. The bucket must be empty.',
                            variant: 'danger',
                            confirmText: 'Delete',
                            onConfirm: () => remove.mutate(b.Name!),
                          })
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) create.mutate(name.trim())
          }}
        >
          <h2 className="text-lg font-semibold">New bucket</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bucket names must be globally unique.
          </p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="bucket-name">Name</Label>
            <Input
              id="bucket-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-app-uploads"
              autoFocus
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
