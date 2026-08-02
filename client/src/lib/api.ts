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

export const api = {
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
