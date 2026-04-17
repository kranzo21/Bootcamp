import Link from "next/link";

interface Props {
  initials: string;
  isAdmin?: boolean;
}

export default function AppNav({ initials, isAdmin }: Props) {
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
          <NavLink href="/programm">Programm</NavLink>
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-teal-light">
            {initials}
          </span>
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
