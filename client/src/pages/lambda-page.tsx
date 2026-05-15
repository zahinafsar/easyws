import { Zap } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export function LambdaPage() {
  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Lambda</h1>
      <EmptyState
        icon={<Zap className="h-10 w-10" />}
        title="Coming soon"
        description="Lambda support is on the roadmap."
      />
    </div>
  )
}
