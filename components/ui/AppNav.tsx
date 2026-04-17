import Link from "next/link";

interface Props {
  initials: string;
  isAdmin?: boolean;
  name?: string;
  programs?: string[];
}

export default function AppNav({ initials, isAdmin, name, programs }: Props) {
  return (
    <nav className="sticky top-0 z-50 bg-cream border-b border-border">
      <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-ink">
            Ecclesia
          </span>
          <span
            className="text-[7px] text-ink opacity-40 mt-0.5"
            style={{ letterSpacing: "3.5px", marginLeft: "-3.5px" }}
          >
            CHURCH
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-5">
          <NavLink href="/dashboard">Home</NavLink>
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        </div>

        {/* Avatar mit Hover-Popover */}
        <div className="relative group">
          <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center cursor-default flex-shrink-0">
            <span className="text-[10px] font-bold text-white">{initials}</span>
          </div>

          {/* Popover */}
          <div className="absolute right-0 top-10 w-48 bg-white border border-border rounded-xl shadow-md p-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150">
            {name && (
              <p className="font-semibold text-sm text-ink truncate">{name}</p>
            )}
            {programs && programs.length > 0 && (
              <p className="text-xs text-gray-mid mt-0.5">
                {programs.join(", ")}
              </p>
            )}
            <div className="border-t border-border mt-2 pt-2">
              <Link
                href="/einstellungen"
                className="text-xs text-teal hover:underline"
              >
                Einstellungen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-[11px] font-medium text-gray-mid hover:text-teal transition-colors"
    >
      {children}
    </Link>
  );
}
