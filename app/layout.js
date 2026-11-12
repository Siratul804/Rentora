import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SkyBackground } from "@/components/theme/SkyBackground";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Rentora — Multi-Tenant Rental Operations & Service Dispatch",
  description:
    "Multi-tenant SaaS platform for managing rental properties, tenants, digital leases, automated rent invoices via SSLCommerz, and on-demand service dispatch.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-emerald-500/20">
        <Script id="rentora-theme-bootstrap" strategy="beforeInteractive">
          {`(function(){try{var theme=localStorage.getItem("rentora-theme");if(theme!=="light"&&theme!=="dark")theme="dark";var root=document.documentElement;root.dataset.theme=theme;root.classList.toggle("dark",theme==="dark");}catch(_){document.documentElement.classList.add("dark");}})();`}
        </Script>
        <ThemeProvider>
          <SkyBackground />
          <div className="app-content">{children}</div>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
