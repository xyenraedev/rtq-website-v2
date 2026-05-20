import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Fredoka } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from 'next-themes'
import NextTopLoader from 'nextjs-toploader'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import { VisitorTracker } from '@/components/tracker/visitor-tracker'
import './globals.css'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fredoka',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'RTQ Al-Hikmah Ngurensiti',
    template: '%s | RTQ Al-Hikmah Ngurensiti',
  },

  description: "Lembaga pendidikan Al-Qur'an",

  openGraph: {
    title: 'RTQ Al-Hikmah Ngurensiti',
    description: "Lembaga pendidikan Al-Qur'an",
    url: SITE_URL,
    siteName: 'RTQ Al-Hikmah Ngurensiti',
    images: ['/images/logo-rtq.png'],
    locale: 'id_ID',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'RTQ Al-Hikmah Ngurensiti',
    description: "Lembaga pendidikan Al-Qur'an",
    images: ['/images/logo-rtq.png'],
  },

  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={fredoka.variable}>
      <body
        suppressHydrationWarning
        className="font-fredoka antialiased bg-background text-foreground overflow-x-hidden"
      >
        <Suspense fallback={null}>
          <VisitorTracker />
        </Suspense>

        <NextTopLoader color="var(--primary)" showSpinner={false} />

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ConditionalLayout>{children}</ConditionalLayout>

          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
