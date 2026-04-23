import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-orange-500/20 mb-2">404</p>
        <h1 className="text-2xl font-bold text-white mb-3">Page introuvable</h1>
        <p className="text-white/40 mb-8">Cette page n'existe pas ou a été déplacée.</p>
        <Link href="/" className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold transition-all">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
