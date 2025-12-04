import type { Metadata } from "next";

import { Providers } from "@/lib/providers";

import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI SaaS Platform",
  description: "Generate AI SaaS Insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
