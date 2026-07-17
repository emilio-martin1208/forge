import Link from "next/link";

export function Nav() {
  return (
    <nav className="border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Forge
        </Link>
        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="/dashboard" className="hover:text-foreground transition">
            Dashboard
          </Link>
          <Link href="/create" className="hover:text-foreground transition">
            New idea
          </Link>
          <Link href="/connect" className="hover:text-foreground transition">
            Connect repo
          </Link>
        </div>
      </div>
    </nav>
  );
}
