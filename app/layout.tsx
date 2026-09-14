import type { Metadata } from 'next'
import { Montserrat, Sora, Instrument_Serif, Space_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/lib/query/provider'
import { Toaster } from '@/components/ui/sonner'

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: '--font-montserrat'
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: '--font-sora',
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: '--font-instrument-serif',
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: '--font-space-mono',
});

export const metadata: Metadata = {
  title: 'Mirko Calzadilla',
  description: 'Producción y edición audiovisual con IA para marcas y creadores. Paquetes exclusivos por Mirko Calzadilla.',
  other: {
    'facebook-domain-verification': 'lqzg91iaq50gwivufzg1n32f0kvj5f',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/android-chrome-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/android-chrome-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark bg-black">
      <body className={`${montserrat.variable} ${sora.variable} ${instrumentSerif.variable} ${spaceMono.variable} font-sans antialiased bg-black text-white`}>
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  )
}
