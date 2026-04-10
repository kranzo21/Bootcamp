import Link from "next/link";

interface UserRow {
  id: string;
  name: string;
  email: string;
  path: string;
  instruments: string[];
  created_at: string;
  progressPercent: number;
}

interface Props {
  users: UserRow[];
}

const PATH_LABELS: Record<string, string> = {
  instrumentalist: "Instrumentalist",
  vocals: "Gesang",
  drums: "Schlagzeug",
};

function daysSince(dateString: string): number {
  return Math.floor(
    (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export default function UserTable({ users }: Props) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="py-2 pr-4">Name</th>
          <th className="py-2 pr-4">Email</th>
          <th className="py-2 pr-4">Instrumente</th>
          <th className="py-2 pr-4">Pfad</th>
          <th className="py-2 pr-4">Start</th>
          <th className="py-2 pr-4">Tage</th>
          <th className="py-2 pr-4">Fortschritt</th>
          <th className="py-2"></th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b hover:bg-gray-50">
            <td className="py-2 pr-4 font-medium">{u.name}</td>
            <td className="py-2 pr-4">{u.email}</td>
            <td className="py-2 pr-4">{u.instruments.join(", ")}</td>
            <td className="py-2 pr-4">{PATH_LABELS[u.path] ?? u.path}</td>
            <td className="py-2 pr-4">
              {new Date(u.created_at).toLocaleDateString("de-DE")}
            </td>
            <td className="py-2 pr-4">{daysSince(u.created_at)}</td>
            <td className="py-2 pr-4">
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${u.progressPercent}%` }}
                  />
                </div>
                <span>{Math.round(u.progressPercent)}%</span>
              </div>
            </td>
            <td className="py-2">
              <Link
                href={`/admin/${u.id}`}
                className="text-blue-600 hover:underline"
              >
                Details
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
