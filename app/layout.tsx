import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-config";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - 国风命理融合平台`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/api/og?module=home",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/api/og?module=home"],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": SITE_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script src="/clear-sw.js?v=3" defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem("yidao-theme")||"auto";var r=m==="night"||(m==="auto"&&window.matchMedia("(prefers-color-scheme: dark)").matches)?"night":"light";document.documentElement.dataset.theme=r;var L=localStorage.getItem("yidao-locale");if(L==="en"||L==="zh"){document.documentElement.lang=L==="en"?"en":"zh-CN";document.cookie="locale="+L+"; Path=/; Max-Age=31536000; SameSite=Lax";}}catch(e){}})();`,
          }}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="apple-touch-startup-image" href="/icons/splash.svg" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
