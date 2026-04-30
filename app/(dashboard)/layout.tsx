'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { BUSINESS_LOGO, BUSINESS } from '@/lib/config/business'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/invoices', label: 'Invoices', icon: '⟨⟩' },
  { href: '/companies', label: 'Companies', icon: '⊙' },
  { href: '/items', label: 'Items & Services', icon: '≡' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-3">
          <Image
            src={BUSINESS_LOGO}
            alt="Logo"
            width={36}
            height={36}
            className="object-contain"
          />
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">{BUSINESS.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Invoicing</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-gray-900 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Business info footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 leading-tight">{BUSINESS.gstin}</p>
          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{BUSINESS.email}</p>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}
