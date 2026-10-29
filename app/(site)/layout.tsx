import { InkWashBg } from "@/components/site/Decorations";
import { MobileNav } from "@/components/site/MobileNav";
import { PwaRegister, SplashMeta } from "@/components/site/PwaRegister";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { UserProvider } from "@/components/site/UserProvider";
import { LocaleProvider } from "@/components/site/LocaleProvider";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WeChatBodyClass, WeChatShareHint } from "@/components/site/WeChatShareHint";
import { buildMetadataForPath } from "@/lib/seo/build-metadata";
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
  const locale = await getRequestLocale();
  return (
    <ThemeProvider>
      <LocaleProvider initialLocale={locale}>
        <UserProvider>
          <WeChatBodyClass />
          <PwaRegister />
          <SplashMeta />
          <div className="site-shell">
            <InkWashBg />
            <SiteHeader />
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
