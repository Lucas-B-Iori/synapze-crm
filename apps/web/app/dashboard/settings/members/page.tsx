import { SlideUp } from "@/components/motion/slide-up";

export default function SettingsMembersPage() {
  return (
    <div className="p-6">
      <SlideUp>
        <h2 className="text-lg font-medium text-zinc-100">Membros</h2>
        <p className="text-sm text-zinc-500">Gerenciamento de membros em breve.</p>
      </SlideUp>
    </div>
  );
}
