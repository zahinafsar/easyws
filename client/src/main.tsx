import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { queryClient } from '@/lib/query-client'
import { Toaster } from '@/components/ui/toast'
import { ConfirmRoot } from '@/components/ui/confirm-modal'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster />
        <ConfirmRoot />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
