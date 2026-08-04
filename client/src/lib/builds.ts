export const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export const formatDuration = (startedAt: string, completedAt?: string | null) => {
  const start = new Date(startedAt).getTime()
  const end = completedAt ? new Date(completedAt).getTime() : Date.now()
  const totalSeconds = Math.max(0, Math.round((end - start) / 1000))

  if (totalSeconds < 60) return `${totalSeconds}s`

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

export const getRepositoryName = (repositoryUrl: string) => {
  const segments = repositoryUrl.replace(/\/$/, '').split('/')
  return segments.slice(-2).join('/')
}
