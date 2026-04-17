import { SlideUp } from "@/components/motion/slide-up";

export default function SettingsWorkspacePage() {
  return (
    <div className="p-6">
      <SlideUp>
        <h2 className="text-lg font-medium text-zinc-100">Workspace</h2>
        <p className="text-sm text-zinc-500">Configurações do workspace em breve.</p>
      </SlideUp>
    </div>
  );
}
