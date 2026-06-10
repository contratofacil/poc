import type { MetadataRoute } from "next";

const BASE_URL = "https://frontend-production-167a.up.railway.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-06-10");

  return [
    // Public — haute priorité
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/cabinet`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },

    // Services (product landing)
    { url: `${BASE_URL}/nif`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/contracts`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/compliance`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/assistant`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },

    // Auth
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },

    // Content
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },

    // Legal
    { url: `${BASE_URL}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/mentions`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },

    // Blog articles
    { url: `${BASE_URL}/blog/comment-obtenir-nif-portugais-2026`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog/5-erreurs-bail-nrau`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/blog/nhr-regime-fiscal-non-residents`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/blog/creer-societe-lda-portugal`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/blog/rgpd-pme-portugaises-2026`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/blog/freelance-portugal-quel-statut`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
