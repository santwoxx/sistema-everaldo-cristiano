import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-marca",
});

export const metadata: Metadata = {
  title: {
    default: "EC Montagens de Móveis",
    template: "%s · EC Montagens",
  },
  description:
    "Gestão financeira, ordens de serviço com assinatura digital, orçamentos e equipe para a EC Montagens de Móveis.",
  applicationName: "EC Montagens",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "EC Montagens",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={outfit.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
