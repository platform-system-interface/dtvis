import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'reactflow/dist/style.css';
import './globals.css'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Device Tree Visualizer',
  description: 'Visualize a Device Tree as per https://devicetree.org',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
