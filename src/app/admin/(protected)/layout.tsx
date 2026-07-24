import Link from "next/link";
import { requireAdminSession } from "@/lib/dal";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-black tracking-tight">
              Hausgeräte Pfeffer — Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin/categories" className="hover:text-primary">
                Kategorien
              </Link>
              <Link href="/admin/products" className="hover:text-primary">
                Produkte
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/70">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-screen-xl px-4 py-6">{children}</main>
    </div>
  );
}
