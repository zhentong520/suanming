import { InkWashBg } from "@/components/site/Decorations";
import { MoonWidget } from "@/components/site/MoonWidget";
import { MobileNav } from "@/components/site/MobileNav";
import { PwaRegister, SplashMeta } from "@/components/site/PwaRegister";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Starfield } from "@/components/site/Starfield";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { UserProvider } from "@/components/site/UserProvider";
import { LocaleProvider } from "@/components/site/LocaleProvider";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WeChatBodyClass, WeChatShareHint } from "@/components/site/WeChatShareHint";
import { buildMetadataForPath, moduleIdFromPath } from "@/lib/seo/build-metadata";
import { buildModuleJsonLd, buildWebsiteJsonLd } from "@/lib/seo/jsonld";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const locale = await getRequestLocale();
  return buildMetadataForPath(pathname, locale);
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const locale = await getRequestLocale();

  let jsonLd: Record<string, unknown> | null = null;
  if (pathname === "/" || pathname === "") {
    jsonLd = buildWebsiteJsonLd(locale);
  } else {
    const modId = moduleIdFromPath(pathname);
    if (modId) jsonLd = buildModuleJsonLd(modId, locale);
  }
  return (
    <ThemeProvider>
      <LocaleProvider initialLocale={locale}>
        <UserProvider>
          <WeChatBodyClass />
          <PwaRegister />
          <SplashMeta />
          <div className="site-shell">
            <InkWashBg />
            <Starfield />
            <MoonWidget />
            <SiteHeader />
            {jsonLd ? (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
              />
            ) : null}
            <main className="site-main site-main--with-nav">{children}</main>
            <SiteFooter />
            <MobileNav />
            <WeChatShareHint />
          </div>
        </UserProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
