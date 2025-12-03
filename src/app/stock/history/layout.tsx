export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sidebar is already rendered by parent /stock/layout.tsx
  return <>{children}</>;
}

