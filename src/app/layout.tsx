import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Maxx Instagram Analytics',
  description: 'Dashboard de métricas do Instagram @maxxessencial',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
          {children}
        </main>
        <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100 bg-white">
          Maxx Instagram Analytics · @maxxessencial
        </footer>
      </body>
    </html>
  )
}
