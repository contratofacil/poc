// Re-exports from LanguageContext so all existing imports continue to work.
// Language state is now shared via LanguageProvider (mounted in providers.tsx),
// which prevents the per-page flash on client-side navigation.
export { useLanguage } from "./LanguageContext";
