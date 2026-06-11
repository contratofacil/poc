import { redirect } from "next/navigation";

// Le dashboard vit sur /admin (onglet "Vue d'ensemble") — cette route
// n'existe que pour les liens historiques (sidebar, breadcrumbs).
export default function DashboardPage() {
  redirect("/admin");
}
