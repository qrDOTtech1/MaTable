import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.06] py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-6">
        
        {/* Contact Banner */}
        <div className="w-full sm:w-auto flex flex-col items-center gap-3 px-5 py-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 sm:flex-row sm:gap-5 sm:px-6 sm:py-3">
          <span className="text-orange-400 font-bold tracking-widest text-xs uppercase">Besoin d'aide ?</span>
          <div className="flex flex-col items-center gap-2 text-sm sm:flex-row sm:gap-4">
            <a
              href="tel:+33757835777"
              aria-label="Appeler le +33 7 57 83 57 77"
              className="text-white hover:text-orange-400 transition-colors font-bold inline-flex items-center gap-2 whitespace-nowrap"
            >
              <span aria-hidden>📞</span>
              <span className="tabular-nums tracking-tight">+33 7 57 83 57 77</span>
            </a>
            <span className="hidden sm:inline text-white/20" aria-hidden>•</span>
            <a
              href="mailto:contact@matable.pro"
              aria-label="Envoyer un email à contact@matable.pro"
              className="text-white hover:text-orange-400 transition-colors font-bold inline-flex items-center gap-2 whitespace-nowrap break-all"
            >
              <span aria-hidden>✉️</span>
              <span>contact@matable.pro</span>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-white/40">
          <Link href="/cgv" className="hover:text-white transition-colors">CGV</Link>
          <Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialite</Link>
          <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions legales</Link>
        </div>
        
        <p className="text-xs text-white/30">
          © {new Date().getFullYear()} MaTable Pro — Tous droits reserves ·{" "}
          <a href="https://novavivo.online" target="_blank" rel="noopener noreferrer" className="text-orange-400/50 hover:text-orange-400 transition-colors">
            Novavivo.online
          </a>
        </p>
      </div>
    </footer>
  );
}
