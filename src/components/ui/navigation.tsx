"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Home, FileText, Settings, HelpCircle } from "lucide-react";
export function Navigation() {
  const pathname = usePathname();
  return (
    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
      <ContextMenu>
        <ContextMenuTrigger asChild>
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
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-48">
          <ContextMenuItem asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </ContextMenuItem>
          <ContextMenuItem asChild>
            <Link href="/write">
              <FileText className="mr-2 h-4 w-4" />
              Go to Write
            </Link>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => window.open('https://github.com', '_blank')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </ContextMenuItem>
          <ContextMenuItem onClick={() => window.open('https://github.com', '_blank')}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
