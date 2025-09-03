import { Navigation } from "@/components/ui/navigation";
import TiptapEditor from "@/components/ui/tiptap-editor";

export default function WritePage() {
  return (
    <div className="w-full h-screen bg-black">
      <Navigation />
      <div className="flex h-full">
        <div className="w-64 bg-neutral-900 border-r border-neutral-800"></div>
        <div className="flex-1 pt-3 px-8 pb-8">
          <TiptapEditor />
        </div>
      </div>
    </div>
  );
}
