import { getTutorialById } from "@/lib/db/programs";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutorial = await getTutorialById(id);
  if (!tutorial) notFound();

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="javascript:history.back()"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Zurück
      </Link>
      <h1 className="text-3xl font-bold mb-2">{tutorial.title}</h1>
      <p className="text-gray-600 mb-6">{tutorial.description}</p>
      <iframe
        src={tutorial.video_url}
        className="w-full aspect-video rounded-lg"
        allowFullScreen
      />
    </main>
  );
}
