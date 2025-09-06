import { VaporizeAnimationText } from "@/components/ui/vaporize-animation-text";
import { Navigation } from "@/components/ui/navigation";
export default function Home() {
  return (
    <div className="w-full min-h-screen bg-black">
      <Navigation />
      <VaporizeAnimationText texts={["Noted"]} />
    </div>
  );
}
