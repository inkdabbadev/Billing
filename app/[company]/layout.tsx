'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCompanyConfig } from '@/lib/config/companies'

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { company } = useParams<{ company: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const config = getCompanyConfig(company)

  useEffect(() => {
    if (!config) router.replace('/')
  }, [config, router])

  if (!config) return null

  const base = `/${company}`
  const nav = [
    { href: `${base}/dashboard`, label: 'Dashboard', icon: '⊞' },
    { href: `${base}/invoices`, label: 'Invoices', icon: '⟨⟩' },
    { href: `${base}/companies`, label: 'Companies', icon: '⊙' },
    { href: `${base}/items`, label: 'Items & Services', icon: '≡' },
    { href: `${base}/payments`, label: 'Payments', icon: '₹' },
  ]

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-3">
          <Image
            src={config.logo}
            alt={config.name}
            width={36}
            height={36}
            className="object-contain"
          />
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">{config.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Invoicing</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== `${base}/dashboard` && pathname.startsWith(item.href))
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

        <div className="px-4 py-4 border-t border-gray-100">
          <Link href="/" className="text-[10px] text-blue-500 hover:text-blue-700">
            ← Switch Company
          </Link>
          {config.pdf.gstin && (
            <p className="text-[10px] text-gray-400 leading-tight mt-1">{config.pdf.gstin}</p>
          )}
          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{config.pdf.email}</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}
