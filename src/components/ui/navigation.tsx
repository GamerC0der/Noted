"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
export function Navigation() {
  const pathname = usePathname();
  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
      <div className="relative bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 rounded-full px-2 py-2">
        <div className="flex items-center space-x-1">
          <Link href="/" className="relative px-4 py-2 rounded-full transition-colors">
            <span className={`text-sm font-medium transition-colors ${
              pathname === "/" ? "text-white" : "text-neutral-400 hover:text-neutral-300"
            }`}>
              Home
            </span>
            {pathname === "/" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white/10 border border-white/20 rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
          <Link href="/write" className="relative px-4 py-2 rounded-full transition-colors">
            <span className={`text-sm font-medium transition-colors ${
              pathname === "/write" ? "text-white" : "text-neutral-400 hover:text-neutral-300"
            }`}>
              Write
            </span>
            {pathname === "/write" && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white/10 border border-white/20 rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
