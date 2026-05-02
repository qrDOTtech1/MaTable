import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.06] py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-8 flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-white/40">
          <Link href="/cgv" className="hover:text-white/70 transition-colors">CGV</Link>
          <Link href="/confidentialite" className="hover:text-white/70 transition-colors">Politique de confidentialite</Link>
          <Link href="/mentions-legales" className="hover:text-white/70 transition-colors">Mentions legales</Link>
          <a href="mailto:contact@novavivo.online" className="hover:text-white/70 transition-colors">Contact</a>
        </div>
        <p className="text-sm text-white/50">
          © {new Date().getFullYear()} MaTable Pro — Tous droits reserves ·{" "}
          <a href="https://novavivo.online" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-semibold">
            Novavivo.online
          </a>
        </p>
      </div>
    </footer>
  );
}
