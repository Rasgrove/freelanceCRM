'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from '@/app/actions/auth'
import {
  LayoutDashboard, Users, FolderOpen, CalendarDays,
  Receipt, TrendingUp, StickyNote, Clock, Menu, X, LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/proyectos', label: 'Proyectos', icon: FolderOpen },
  { href: '/citas', label: 'Citas', icon: CalendarDays },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
  { href: '/caja', label: 'Caja', icon: TrendingUp },
  { href: '/notas', label: 'Notas', icon: StickyNote },
  { href: '/horas', label: 'Horas', icon: Clock },
]

function NavItem({ href, label, icon: Icon, active, onClick }: {
  href: string; label: string; icon: React.ElementType; active: boolean; onClick?: () => void
}) {
  return (
    <Link href={href} className={`nav-item${active ? ' active' : ''}`} onClick={onClick}>
      <Icon size={15} />
      {label}
    </Link>
  )
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>⬡ Freelance CRM</span>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-on-accent)', cursor: 'pointer', padding: '0.1rem' }}>
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href}
            onClick={onClose}
          />
        ))}
      </nav>

      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--accent-border)' }}>
        <form action={signOut}>
          <button type="submit" className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start' }}>
            <LogOut size={14} /> Salir
          </button>
        </form>
      </div>
    </aside>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Desktop sidebar */}
      <div className="sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay & drawer */}
      {sidebarOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 199 }}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200, width: 220 }}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      <main className="main-content">
        {/* Mobile header */}
        <div className="mobile-header">
          <button
            className="btn btn-ghost"
            onClick={() => setSidebarOpen(true)}
            style={{ padding: '0.3rem', display: 'flex', alignItems: 'center' }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>
            Freelance CRM
          </span>
          <div style={{ width: 32 }} />
        </div>

        {children}
      </main>
    </div>
  )
}

