import { Suspense } from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import '../globals.css'
import { getDictionary, locales } from './dictionaries'
import { AuthProvider } from '@/hooks/useCurrentUser'
import { AuthModalProvider } from '@/components/auth/AuthModal'
import { AppShell } from '@/components/layout/AppShell'

const geistSans = localFont({
  src: [
    { path: '../../../public/fonts/geist-latin.woff2', weight: '100 900' },
    { path: '../../../public/fonts/geist-latin-ext.woff2', weight: '100 900' },
  ],
  variable: '--font-geist-sans',
})

const geistMono = localFont({
  src: [
    { path: '../../../public/fonts/geist-mono-latin.woff2', weight: '100 900' },
    { path: '../../../public/fonts/geist-mono-latin-ext.woff2', weight: '100 900' },
  ],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Ashepashe',
  description: 'Ashepashe',
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AuthModalProvider lang={lang} dict={dict}>
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <AppShell lang={lang} dict={dict}>
                {children}
              </AppShell>
            </Suspense>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
