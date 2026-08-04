import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/app-shell'
import { BucketsPage } from '@/pages/s3/buckets-page'
import { BucketPage } from '@/pages/s3/bucket-page'
import { LambdaPage } from '@/pages/lambda-page'
import { ProjectsPage } from '@/pages/projects/projects-page'
import { ProjectPage } from '@/pages/projects/project-page'
import { BuildPage } from '@/pages/projects/build-page'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectPage />} />
        <Route path="projects/:projectId/builds/:buildId" element={<BuildPage />} />
        <Route path="s3" element={<BucketsPage />} />
        <Route path="s3/:name" element={<BucketPage />} />
        <Route path="lambda" element={<LambdaPage />} />
      </Route>
    </Routes>
  )
}
