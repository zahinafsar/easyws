type Bucket = {
  Name?: string
  CreationDate?: string
}

type Media = {
  Key?: string
  Size?: number
  LastModified?: string
  ETag?: string
  Url?: string
}

type ListFoldersResponse = {
  Buckets?: Bucket[]
}

type ListMediaResponse = {
  Name?: string
  Contents?: Media[]
}

type ErrorResponse = {
  message: string
}

export type Project = {
  id: string
  name: string
  repositoryUrl: string
  port: number
}

export type ProjectSettings = {
  installCommand: string
  buildCommand: string
  startCommand: string
}

export type ProjectDetail = Project &
  ProjectSettings & {
    envVars: string
  }

export type BuildStepStatus = 'pending' | 'in_progress' | 'succeeded' | 'failed'

export type BuildStep = {
  name: string
  label: string
  status: BuildStepStatus
  startedAt?: string | null
  completedAt?: string | null
}

export type ProjectBuild = {
  buildId: string
  projectId: string
  status: string
  createdAt: string
  completedAt?: string | null
  steps?: BuildStep[]
}

export type BuildLogEvent = {
  timestamp?: number
  message: string
}

export type BuildLogsResponse = {
  events: BuildLogEvent[]
  nextToken?: string
}

const rawApiUrl = import.meta.env.VITE_API_URL

if (typeof rawApiUrl !== 'string' || rawApiUrl.trim() === '') {
  throw new Error('VITE_API_URL is required')
}

let apiUrl: URL

try {
  apiUrl = new URL(rawApiUrl)
} catch {
  throw new Error('VITE_API_URL must be a valid URL')
}

if (apiUrl.protocol !== 'https:' && apiUrl.protocol !== 'http:') {
  throw new Error('VITE_API_URL must use HTTP or HTTPS')
}

const baseUrl = apiUrl.toString().replace(/\/$/, '')

const isErrorResponse = (value: unknown): value is ErrorResponse =>
  typeof value === 'object' &&
  value !== null &&
  'message' in value &&
  typeof value.message === 'string'

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, init)
  const text = await response.text()
  let body: unknown

  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      if (!response.ok) throw new Error(text)
      throw new Error('API returned an invalid JSON response')
    }
  }

  if (!response.ok) {
    if (isErrorResponse(body)) throw new Error(body.message)
    throw new Error(`API request failed with status ${response.status}`)
  }

  return body as T
}

const folderPath = (folderName: string) =>
  `/folder/${encodeURIComponent(folderName)}`

const projectPath = (projectId: string) =>
  `/projects/${encodeURIComponent(projectId)}`

const buildPath = (projectId: string, buildId: string) =>
  `${projectPath(projectId)}/builds/${encodeURIComponent(buildId)}`

export const api = {
  listProjects: () => request<Project[]>('/projects'),
  getProject: (projectId: string) =>
    request<ProjectDetail>(projectPath(projectId)),
  createProject: (name: string, repositoryUrl: string) =>
    request<Project>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, repositoryUrl }),
    }),
  deleteProject: (projectId: string) =>
    request<Project>(projectPath(projectId), {
      method: 'DELETE',
    }),
  updateProject: (projectId: string, settings: ProjectSettings) =>
    request<ProjectDetail>(projectPath(projectId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }),
  updateProjectEnv: (projectId: string, content: string) =>
    request<{ projectId: string; content: string }>(
      `${projectPath(projectId)}/env`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      },
    ),
  listBuilds: (projectId: string) =>
    request<ProjectBuild[]>(`${projectPath(projectId)}/builds`),
  createBuild: (projectId: string) =>
    request<{ buildId: string; status: string }>(
      `${projectPath(projectId)}/builds`,
      {
        method: 'POST',
      },
    ),
  getBuild: (projectId: string, buildId: string) =>
    request<ProjectBuild>(buildPath(projectId, buildId)),
  getBuildLogs: (
    projectId: string,
    buildId: string,
    nextToken?: string,
  ) => {
    const query = nextToken
      ? `?${new URLSearchParams({ nextToken }).toString()}`
      : ''

    return request<BuildLogsResponse>(
      `${buildPath(projectId, buildId)}/logs${query}`,
    )
  },
  listFolders: () => request<ListFoldersResponse>('/folder'),
  createFolder: (name: string) =>
    request<{ message: string }>('/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
  deleteFolder: (folderName: string) =>
    request<{ message: string }>(folderPath(folderName), {
      method: 'DELETE',
    }),
  listMedia: (folderName: string) =>
    request<ListMediaResponse>(folderPath(folderName)),
  uploadMedia: (folderName: string, file: File) => {
    const form = new FormData()
    form.set('file', file)

    return request<Media>(folderPath(folderName), {
      method: 'POST',
      body: form,
    })
  },
  deleteMedia: (folderName: string, mediaId: string) =>
    request<{ message: string }>(
      `${folderPath(folderName)}/${encodeURIComponent(mediaId)}`,
      { method: 'DELETE' },
    ),
}
