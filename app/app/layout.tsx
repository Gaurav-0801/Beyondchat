import type { Metadata } from "next"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "BeyondChats - AI-Powered Blog Article Management",
  description: "Automatically scrape, transform, and optimize your blog articles using state-of-the-art LLMs",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}

