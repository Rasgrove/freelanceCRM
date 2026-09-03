import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Freelance CRM',
  description: 'Panel de control privado — Operación freelance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
