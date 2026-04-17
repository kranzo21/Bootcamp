// app/admin/inhalte/neu/page.tsx
import { Suspense } from "react";
import LektionEditor from "@/components/admin/LektionEditor";
import ContentEditor from "@/components/admin/ContentEditor";

async function NeuPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  if (type === "lektion") {
    return (
      <Suspense>
        <LektionEditor />
      </Suspense>
    );
  }
  return <ContentEditor />;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  return (
    <Suspense>
      <NeuPage searchParams={searchParams} />
    </Suspense>
  );
}
