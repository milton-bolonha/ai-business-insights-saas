import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Providers } from "@/lib/providers";
import { LanguageInitializer } from "@/components/i18n/LanguageInitializer";
import { Locale } from "@/lib/stores/languageStore";

import "@fontsource-variable/inter";
import "@fontsource-variable/montserrat";
import "@fontsource-variable/oswald";
import "./globals.css";

export const metadata: Metadata = {
  title: "I/O App",
  description: "Advanced AI Platform for your business",
  icons: {
    icon: "/images/favicon-16x16.png",
    shortcut: "/images/favicon-16x16.png",
    apple: "/images/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const savedCookie = cookieStore.get("NEXT_LOCALE")?.value;
  let locale: Locale = "pt";

  if (savedCookie === "pt" || savedCookie === "en") {
    locale = savedCookie;
  } else {
    const headersList = await headers();
    const acceptLanguage = headersList.get("accept-language") || "";
    locale = acceptLanguage.toLowerCase().startsWith("en") ? "en" : "pt";
  }

  // Load translations server-side dynamically for code splitting
  const initialMessages = locale === "en"
    ? (await import("../../messages/en.json")).default
    : (await import("../../messages/pt.json")).default;

  return (
    <html lang={locale === "pt" ? "pt-BR" : "en"} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <LanguageInitializer initialLocale={locale} initialMessages={initialMessages} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

