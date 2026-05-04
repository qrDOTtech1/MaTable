import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.06] py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-6">
        
        {/* Contact Banner */}
        <div className="flex flex-col md:flex-row items-center gap-4 px-6 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
          <span className="text-orange-400 font-bold tracking-widest text-xs uppercase">Besoin d'aide ?</span>
          <div className="flex items-center gap-4 font-mono text-sm">
            <a href="tel:+33757835777" className="text-white hover:text-orange-400 transition-colors font-bold">
              📞 +33 7 57 83 57 77
            </a>
            <span className="text-white/20">•</span>
            <a href="mailto:contact@matable.pro" className="text-white hover:text-orange-400 transition-colors font-bold">
              ✉️ contact@matable.pro
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
