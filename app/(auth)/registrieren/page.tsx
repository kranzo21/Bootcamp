import { createClient } from "@/lib/supabase/server";
import RegisterForm from "@/components/auth/RegisterForm";
import Image from "next/image";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("programs")
    .select("id, name")
    .order("order");

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
      <Image
        src="/ecclesia-logo.png"
        alt="Ecclesia Church"
        width={140}
        height={92}
        className="mb-6"
        style={{ mixBlendMode: "multiply", opacity: 0.88 }}
        priority
      />
      <p className="text-[10px] tracking-[3px] uppercase text-gray-mid mb-8">
        Gewächshaus · Musikerplattform
      </p>
      <RegisterForm programs={programs ?? []} />
    </main>
  );
}
