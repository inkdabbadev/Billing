'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCompanyConfig } from '@/lib/config/companies'

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { company } = useParams<{ company: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const config = getCompanyConfig(company)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!config) router.replace('/')
  }, [config, router])

  // Close drawer on navigation
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  if (!config) return null

  const { theme } = config
  const base = `/${company}`
  const nav = [
    { href: `${base}/dashboard`,  label: 'Dashboard',        icon: '⊞' },
    { href: `${base}/invoices`,   label: 'Invoices',         icon: '⟨⟩' },
    { href: `${base}/companies`,  label: 'Companies',        icon: '⊙' },
    { href: `${base}/items`,      label: 'Items & Services', icon: '≡' },
    { href: `${base}/payments`,   label: 'Payments',         icon: '₹' },
  ]

  const cssVars = {
    '--t-primary':       theme.primary,
    '--t-primary-hover': theme.primaryHover,
    '--t-primary-soft':  theme.primarySoft,
    '--t-app-bg':        theme.appBg,
    '--t-border':        theme.cardBorder,
    '--t-text':          theme.textMain,
  } as React.CSSProperties

  function NavLinks() {
    return (
      <>
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== `${base}/dashboard` && pathname.startsWith(item.href))
          const hovered = hoveredNav === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: active
                  ? theme.navActiveBg
                  : hovered
                  ? theme.navHoverBg
                  : 'transparent',
                color: active ? theme.navActiveText : theme.navInactiveText,
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={() => setHoveredNav(item.href)}
              onMouseLeave={() => setHoveredNav(null)}
            >
              <span className="text-base leading-none w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </>
    )
  }

  function SidebarFooter() {
    return (
      <div className="px-4 py-4 border-t" style={{ borderTopColor: theme.sidebarBorder }}>
        <Link
          href="/"
          className="text-[10px] transition-opacity"
          style={{ color: theme.accentLink }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          ← Switch Company
        </Link>
        {config.pdf.gstin && (
          <p className="text-[10px] leading-tight mt-1" style={{ color: theme.subText }}>
            {config.pdf.gstin}
          </p>
        )}
        <p className="text-[10px] leading-tight mt-0.5" style={{ color: theme.subText }}>
          {config.pdf.email}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ ...cssVars, backgroundColor: theme.appBg }}>

      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30"
        style={{ backgroundColor: theme.sidebarBg, borderBottomColor: theme.sidebarBorder }}
      >
        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col justify-center gap-1.5 p-1 -ml-1"
          aria-label="Open menu"
        >
          <span className="block w-5 h-0.5 rounded" style={{ backgroundColor: theme.navInactiveText }} />
          <span className="block w-5 h-0.5 rounded" style={{ backgroundColor: theme.navInactiveText }} />
          <span className="block w-5 h-0.5 rounded" style={{ backgroundColor: theme.navInactiveText }} />
        </button>

        {/* Logo + name */}
        <div className="flex items-center gap-2">
          <Image src={config.logo} alt={config.name} width={26} height={26} className="object-contain" />
          <span className="text-sm font-bold" style={{ color: theme.logoText }}>{config.name}</span>
        </div>

        {/* Quick new invoice */}
        <Link
          href={`${base}/invoices/new`}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: theme.primary, color: '#fff' }}
        >
          + New
        </Link>
      </header>

      {/* ── Mobile drawer backdrop ──────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile slide-in drawer ──────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col md:hidden transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: theme.sidebarBg, borderRight: `1px solid ${theme.sidebarBorder}` }}
      >
        {/* Drawer header with close */}
        <div
          className="px-4 py-4 flex items-center justify-between border-b"
          style={{ borderBottomColor: theme.sidebarBorder }}
        >
          <div className="flex items-center gap-3">
            <Image src={config.logo} alt={config.name} width={32} height={32} className="object-contain" />
            <div>
              <p className="text-sm font-bold leading-none" style={{ color: theme.logoText }}>{config.name}</p>
              <p className="text-[10px] mt-0.5" style={{ color: theme.subText }}>Invoicing</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-xl leading-none p-1"
            style={{ color: theme.navInactiveText }}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>
        <SidebarFooter />
      </aside>

      {/* ── Desktop layout ──────────────────────────────────────────────── */}
      <div className="flex min-h-screen md:min-h-0">
        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex w-56 flex-col shrink-0 border-r sticky top-0 h-screen"
          style={{ backgroundColor: theme.sidebarBg, borderRightColor: theme.sidebarBorder }}
        >
          {/* Logo */}
          <div
            className="px-4 py-5 flex items-center gap-3 border-b"
            style={{ borderBottomColor: theme.sidebarBorder }}
          >
            <Image src={config.logo} alt={config.name} width={36} height={36} className="object-contain" />
            <div>
              <p className="text-sm font-bold leading-none" style={{ color: theme.logoText }}>{config.name}</p>
              <p className="text-[10px] mt-0.5" style={{ color: theme.subText }}>Invoicing</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <NavLinks />
          </nav>
          <SidebarFooter />
        </aside>

        {/* Page content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
