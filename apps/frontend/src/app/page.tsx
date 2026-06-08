import Link from "next/link";
import { Shield } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-4 antialiased selection:bg-[#C9A84C] selection:text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1A365D] blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C9A84C] blur-3xl"></div>
      </div>

      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-8 relative z-10 text-center">
        <div className="flex items-center justify-center gap-2 text-[#1A365D] mb-6">
          <Shield className="w-10 h-10 text-[#C9A84C]" />
          <span className="font-bold text-3xl font-serif">EasyLaw</span>
        </div>

        <h1 className="text-2xl font-bold text-[#1A365D] font-serif mb-4">
          Votre assistant juridique intelligent au Portugal
        </h1>
        <p className="text-gray-600 text-sm mb-8 leading-relaxed">
          Générez des contrats certifiés conformes NRAU, suivez vos échéances légales et discutez avec notre IA formée sur le droit portugais.
        </p>

        <Link
          href="/register"
          className="inline-block w-full py-3 px-4 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg"
        >
          Créer un compte
        </Link>
      </div>
    </main>
  );
}
