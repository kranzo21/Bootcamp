import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
      <Image
        src="/ecclesia-logo.png"
        alt="Ecclesia Church"
        width={160}
        height={105}
        className="mb-8"
        style={{ mixBlendMode: "multiply", opacity: 0.88 }}
        priority
      />
      <p className="text-[10px] tracking-[3px] uppercase text-gray-mid mb-8">
        Gewächshaus · Musikerplattform
      </p>
      <LoginForm />
    </main>
  );
}
