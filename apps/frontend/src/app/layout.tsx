import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ConsentProvider } from "@/lib/consent/context";
import { ConsentBanner } from "@/components/ui/ConsentBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

const siteUrl = "https://frontend-production-167a.up.railway.app";

export const metadata: Metadata = {
  title: {
    default: "EasyLaw — NIF portugais, contrats & conformité juridique",
    template: "%s | EasyLaw",
  },
  description:
    "Obtenez votre NIF portugais en 48h, générez des contrats conformes NRAU et pilotez vos obligations légales PME — supervisé par Oliveira & Carneiro Advogados, inscrits à l'Ordem dos Advogados. À partir de 99 €.",
  keywords: [
    "NIF portugais",
    "obtenir NIF Portugal",
    "Número de Identificação Fiscal",
    "contrat droit portugais",
    "bail NRAU",
    "compliance PME Portugal",
    "avocat portugais",
    "Ordem dos Advogados",
    "EasyLaw",
    "droit portugais expatrié",
    "assistant IA juridique portugais",
  ],
  authors: [{ name: "Oliveira & Carneiro Advogados" }],
  creator: "EasyLaw",
  publisher: "EasyLaw",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
    languages: {
      "fr": `${siteUrl}`,
      "pt": `${siteUrl}`,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "EasyLaw",
    title: "EasyLaw — NIF portugais, contrats & conformité juridique",
    description:
      "Obtenez votre NIF portugais en 48h, générez des contrats conformes et pilotez votre conformité PME — supervisé par un cabinet d'avocats agréé.",
    locale: "pt_PT",
    alternateLocale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "EasyLaw — NIF portugais, contrats & conformité juridique",
    description:
      "NIF en 48h • Contrats conformes NRAU • Compliance Dashboard PME • IA juridique 24/7 — supervisé par Oliveira & Carneiro Advogados.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: "EasyLaw",
  url: "https://frontend-production-167a.up.railway.app",
  description:
    "Plateforme juridique intelligente pour le Portugal. NIF en 48h, contrats conformes NRAU, compliance PME, assistant IA juridique — supervisé par Oliveira & Carneiro Advogados.",
  areaServed: "PT",
  serviceType: ["NIF registration", "Legal contracts", "Compliance monitoring", "Legal AI assistant"],
  provider: {
    "@type": "LegalService",
    name: "Oliveira & Carneiro Advogados",
    memberOf: { "@type": "Organization", name: "Ordem dos Advogados" },
    foundingDate: "2011",
  },
  offers: [
    {
      "@type": "Offer",
      name: "NIF & Starter Pack",
      price: "99",
      priceCurrency: "EUR",
      description: "Obtention du NIF portugais en 48h",
    },
    {
      "@type": "Offer",
      name: "Générateur de contrats",
      price: "49",
      priceCurrency: "EUR",
      description: "Génération de contrats conformes au droit portugais",
    },
    {
      "@type": "Offer",
      name: "Compliance Dashboard",
      price: "29",
      priceCurrency: "EUR",
      description: "Surveillance mensuelle des obligations légales PME",
    },
    {
      "@type": "Offer",
      name: "Luso-Legal — IA juridique",
      price: "19",
      priceCurrency: "EUR",
      description: "Assistant IA juridique 24/7 spécialisé droit portugais",
    },
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EasyLaw",
  url: "https://frontend-production-167a.up.railway.app",
  inLanguage: ["pt", "fr"],
  potentialAction: {
    "@type": "SearchAction",
    target: "https://frontend-production-167a.up.railway.app/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt"
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--surface-page)] text-[var(--text-primary)]">
        <ConsentProvider>
          <Providers>{children}</Providers>
          <ConsentBanner />
        </ConsentProvider>
      </body>
    </html>
  );
}
