"use client";

import { VaporizeAnimationText } from "@/components/ui/vaporize-animation-text";
import { Navigation } from "@/components/ui/navigation";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FileText, Folder, Home as HomeIcon, Settings, HelpCircle } from "lucide-react";
import Link from "next/link";
export default function Home() {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="w-full min-h-screen bg-black">
          <Navigation />
          <VaporizeAnimationText texts={["Noted"]} />
        </div>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-48">
        <ContextMenuItem asChild>
          <Link href="/write">
            <FileText className="mr-2 h-4 w-4" />
            Start Writing
          </Link>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem asChild>
          <Link href="/write">
            <Folder className="mr-2 h-4 w-4" />
            Create Folder
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
  );
}
