import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/app-shell'
import { BucketsPage } from '@/pages/s3/buckets-page'
import { BucketPage } from '@/pages/s3/bucket-page'
import { LambdaPage } from '@/pages/lambda-page'
import { ProjectsPage } from '@/pages/projects/projects-page'
import { ProjectLayout } from '@/pages/projects/project-layout'
import { ProjectPage } from '@/pages/projects/project-page'
import { ProjectEnvPage } from '@/pages/projects/project-env-page'
import { ProjectSettingsPage } from '@/pages/projects/project-settings-page'
import { ProjectDomainPage } from '@/pages/projects/project-domain-page'
import { BuildPage } from '@/pages/projects/build-page'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<ProjectPage />} />
          <Route path="env" element={<ProjectEnvPage />} />
          <Route path="domain" element={<ProjectDomainPage />} />
          <Route path="settings" element={<ProjectSettingsPage />} />
        </Route>
        <Route path="projects/:projectId/builds/:buildId" element={<BuildPage />} />
        <Route path="s3" element={<BucketsPage />} />
        <Route path="s3/:name" element={<BucketPage />} />
        <Route path="lambda" element={<LambdaPage />} />
      </Route>
    </Routes>
  )
}
