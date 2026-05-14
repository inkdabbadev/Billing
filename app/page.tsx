import Link from 'next/link'

const companies = [
  {
    id: 'etc',
    href: '/etc/dashboard',
    pcImage: '/pcetc.png',
    mobImage: '/mobetc.png',
    alt: 'ETC',
  },
  {
    id: 'inkdabba',
    href: '/inkdabba/dashboard',
    pcImage: '/pcink.png',
    mobImage: '/mobink.png',
    alt: 'Ink Dabba',
  },
  {
    id: 'seyon-studio',
    href: '/seyon-studio/dashboard',
    pcImage: '/pcseyon.png',
    mobImage: '/mobseyon.png',
    alt: 'Seyon Studio',
  },
]

export default function LandingPage() {
  return (
    <main className="flex flex-col md:flex-row h-screen overflow-hidden bg-black">
      {companies.map((c) => (
        <Link
          key={c.id}
          href={c.href}
          className="relative flex-1 overflow-hidden group"
        >
          <picture className="absolute inset-0 w-full h-full">
            <source media="(min-width: 768px)" srcSet={c.pcImage} />
            <img
              src={c.mobImage}
              alt={c.alt}
              className="w-full h-full object-cover transition-transform duration-500 ease-out md:group-hover:scale-[1.03]"
            />
          </picture>
          <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/5 transition-colors duration-500" />
        </Link>
      ))}
    </main>
  )
}
