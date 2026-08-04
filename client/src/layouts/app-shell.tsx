import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Boxes, Database, Zap } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
} from '@/components/ui/sidebar'

export function AppShell() {
  const { pathname } = useLocation()
  return (
    <div className="flex h-full">
      <Sidebar defaultCollapsed={false}>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              E
            </div>
            <span className="text-sm font-semibold">EasyWS</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <NavLink to="/projects" className="contents">
            {({ isActive }) => (
              <SidebarItem
                icon={<Boxes className="h-4 w-4" />}
                label="Projects"
                active={isActive || pathname.startsWith('/projects')}
              />
            )}
          </NavLink>
          <NavLink to="/s3" className="contents">
            {({ isActive }) => (
              <SidebarItem
                icon={<Database className="h-4 w-4" />}
                label="S3"
                active={isActive || pathname.startsWith('/s3')}
              />
            )}
          </NavLink>
          <div className="opacity-60 pointer-events-none">
            <SidebarItem
              icon={<Zap className="h-4 w-4" />}
              label="Lambda · Soon"
            />
          </div>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
