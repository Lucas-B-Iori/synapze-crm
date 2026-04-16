export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="flex h-14 items-center px-6">
          <span className="text-lg font-semibold tracking-tight">Synapze</span>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
