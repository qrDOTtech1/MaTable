export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.06] py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-8 text-center">
        <p className="text-sm text-white/50">
          créé avec <span className="text-red-500">❤️</span> pour les restaurateurs du monde entier par{" "}
          <a href="https://snhtech.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-semibold">
            SNHTech
          </a>
          {" & "}
          <a href="https://novavivo.online" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 font-semibold">
            Novavivo.online
          </a>
        </p>
      </div>
    </footer>
  );
}
