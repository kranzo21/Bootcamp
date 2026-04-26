import { getCachedTutorialById } from "@/lib/db/cached";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import BackButton from "@/components/ui/BackButton";
import { notFound } from "next/navigation";

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tutorial = await getCachedTutorialById(id);
  if (!tutorial) notFound();

  const embedUrl = toYouTubeEmbedUrl(tutorial.video_url);

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">
        {tutorial.title}
      </h1>
      {tutorial.description && (
        <p className="text-sm text-gray-mid mb-6">{tutorial.description}</p>
      )}
      {embedUrl ? (
        <iframe
          src={embedUrl}
          className="w-full aspect-video rounded-xl"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      ) : (
        <p className="text-gray-mid text-sm">Kein Video verfügbar.</p>
      )}
    </div>
  );
}
