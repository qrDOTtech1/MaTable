export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.06] py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-8 text-center">
        <p className="text-sm text-white/50">
          © {new Date().getFullYear()} MaTable Pro — Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
