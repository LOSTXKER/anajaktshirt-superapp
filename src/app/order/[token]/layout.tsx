// Public layout - no sidebar, no authentication required
export default function CustomerOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

