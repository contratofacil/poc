/**
 * Compliance — mock data (P3, persona Miguel — Import Lda, PME Porto).
 *
 * 11 obligations : 1 urgent (red), 3 à venir (amber), 7 à jour (green).
 * Termes officiels portugais wrappés inline avec `<span lang="pt">` pour les AT
 * (`label` et `description` sont typés ReactNode, JSX permis ici via .tsx).
 *
 * À remplacer par fetch backend `/api/compliance` en P3.5 (cf. deferred-work).
 */

import type { Obligation } from "./types";

const Pt = ({ children }: { children: React.ReactNode }) => (
  <span lang="pt">{children}</span>
);

export const MOCK_OBLIGATIONS: Obligation[] = [
  // RED — urgent (1)
  {
    id: "iva-may-2026",
    label: (
      <>
        Déclaration TVA mensuelle (<Pt>IVA Periódica</Pt>)
      </>
    ),
    description: (
      <>
        Déclaration TVA du mois de mai à transmettre sur le <Pt>Portal das Finanças</Pt>{" "}
        avant le 10 juillet 2026. Pénalité minimum : 150 € de retard.
      </>
    ),
    status: "red",
    daysRemaining: 27,
    dueDate: "2026-07-09",
    isUrgent: true,
  },

  // AMBER — à venir (3)
  {
    id: "alvara-renew",
    label: (
      <>
        Renouvellement <Pt>Alvará</Pt> commercial
      </>
    ),
    description: "Expire le 15 août 2026 — démarches à entamer 60 jours avant",
    status: "amber",
    daysRemaining: 67,
    dueDate: "2026-08-15",
  },
  {
    id: "irc-acompte-q3",
    label: (
      <>
        Déclaration <Pt>IRC</Pt> (impôt sur les sociétés) — acompte
      </>
    ),
    description: "3ème acompte à régler avant le 30 septembre 2026",
    status: "amber",
    daysRemaining: 82,
    dueDate: "2026-09-30",
  },
  {
    id: "bail-commercial",
    label: "Renouvellement contrat de bail commercial",
    description: (
      <>
        Le préavis <Pt>NRAU</Pt> doit être envoyé avant le 15 septembre 2026
      </>
    ),
    status: "amber",
    daysRemaining: 88,
    dueDate: "2026-09-15",
  },

  // GREEN — à jour (7)
  {
    id: "ies-2026",
    label: (
      <>
        Certificat <Pt>IES (Informação Empresarial Simplificada)</Pt>
      </>
    ),
    description: "Déposé le 15 juin · prochaine échéance avril 2027",
    status: "green",
    daysRemaining: 306,
    dueDate: "2027-04-15",
  },
  {
    id: "rc-pro",
    label: "Assurance responsabilité civile professionnelle",
    description: "Renouvelée le 1er janvier · valide jusqu'au 31 décembre 2026",
    status: "green",
    daysRemaining: 205,
    dueDate: "2026-12-31",
  },
  {
    id: "social-seguranca",
    label: (
      <>
        Cotisations <Pt>Segurança Social</Pt>
      </>
    ),
    description: "Paiement automatique mensuel — prochain prélèvement le 20",
    status: "green",
    daysRemaining: 11,
    dueDate: "2026-06-20",
  },
  {
    id: "rgpd-audit",
    label: "Audit annuel conformité RGPD",
    description: "Réalisé en mars · valide 12 mois",
    status: "green",
    daysRemaining: 274,
    dueDate: "2027-03-15",
  },
  {
    id: "ag-annuelle",
    label: "Assemblée générale annuelle des associés",
    description: (
      <>
        Tenue le 28 mai 2026 · PV déposé sur <Pt>Portal da Empresa</Pt>
      </>
    ),
    status: "green",
    daysRemaining: 320,
    dueDate: "2027-04-30",
  },
  {
    id: "comptes-annuels",
    label: (
      <>
        Dépôt des comptes annuels (<Pt>Contas Anuais</Pt>)
      </>
    ),
    description: (
      <>
        Déposé le 12 mai · <Pt>IES</Pt> couvre ce dépôt fiscal
      </>
    ),
    status: "green",
    daysRemaining: 320,
    dueDate: "2027-04-30",
  },
  {
    id: "licences-municipales",
    label: "Renouvellement licences municipales",
    description: "Renouvellement automatique en septembre 2027",
    status: "green",
    daysRemaining: 425,
    dueDate: "2027-08-01",
  },
];
