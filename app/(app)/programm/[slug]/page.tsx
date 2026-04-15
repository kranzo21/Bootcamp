// app/(app)/programm/[slug]/page.tsx
import { getProgramBySlug, getAreasByProgram } from "@/lib/db/programs";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const areas = await getAreasByProgram(program.id);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="/dashboard"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
      <p className="text-gray-600 mb-8">{program.description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {areas.map((area) => (
          <Link
            key={area.id}
            href={`/bereich/${area.slug}`}
            className="border rounded-lg p-4 hover:shadow transition"
          >
            <h2 className="font-semibold text-lg">{area.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{area.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
