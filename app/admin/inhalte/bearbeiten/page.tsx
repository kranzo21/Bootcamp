// app/admin/inhalte/bearbeiten/page.tsx
import { Suspense } from "react";
import LektionEditor from "@/components/admin/LektionEditor";
import ContentEditor from "@/components/admin/ContentEditor";

async function BearbeitenPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  const { type, id } = await searchParams;
  if (type === "lektion" && id) return <LektionEditor lektionId={id} />;
  return <ContentEditor />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  return (
    <Suspense>
      <BearbeitenPage searchParams={searchParams} />
    </Suspense>
  );
}
