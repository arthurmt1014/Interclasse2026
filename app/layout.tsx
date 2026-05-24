import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Interclasse 2026',
  description: 'Sistema oficial do Interclasse 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: '#07111f', color: '#e2e8f0', fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
