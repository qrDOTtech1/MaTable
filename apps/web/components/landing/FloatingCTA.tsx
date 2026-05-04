"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const HIDDEN_PATHS = ["/register", "/login", "/dashboard"];

export function FloatingCTAWrapper() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const isHidden = HIDDEN_PATHS.some(p => pathname.startsWith(p));
  const isHomepage = pathname === "/";

  useEffect(() => {
    if (isHidden) {
      setVisible(false);
      return;
    }

    if (!isHomepage) {
      setVisible(true);
      return;
    }

    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHidden, isHomepage, pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Link
              href="/register"
              className="flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-full font-bold text-sm shadow-2xl shadow-orange-500/40 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Essai gratuit 14j →
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
