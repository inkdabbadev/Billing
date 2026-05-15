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

  useEffect(() => {
    if (!config) router.replace('/')
  }, [config, router])

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

  return (
    <div className="min-h-screen flex" style={{ ...cssVars, backgroundColor: theme.appBg }}>
      <aside
        className="w-56 flex flex-col shrink-0 border-r"
        style={{
          backgroundColor: theme.sidebarBg,
          borderRightColor: theme.sidebarBorder,
        }}
      >
        {/* Logo / company header */}
        <div
          className="px-4 py-5 flex items-center gap-3 border-b"
          style={{ borderBottomColor: theme.sidebarBorder }}
        >
          <Image
            src={config.logo}
            alt={config.name}
            width={36}
            height={36}
            className="object-contain"
          />
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: theme.logoText }}>
              {config.name}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: theme.subText }}>
              Invoicing
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== `${base}/dashboard` && pathname.startsWith(item.href))
            const hovered = hoveredNav === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
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
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer info */}
        <div
          className="px-4 py-4 border-t"
          style={{ borderTopColor: theme.sidebarBorder }}
        >
          <Link
            href="/"
            className="text-[10px] transition-colors"
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
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}
