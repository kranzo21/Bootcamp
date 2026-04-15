// components/admin/AdminUserDetail.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  programs: { id: string; name: string }[];
  badges: any[];
  qualifications: any[];
  userPrograms: string[];
  userBadges: any[];
  userQuals: any[];
  progress: any[];
}

export default function AdminUserDetail({
  userId,
  programs,
  badges,
  qualifications,
  userPrograms,
  userBadges,
  userQuals,
  progress,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const enrolledSet = new Set(userPrograms);
  const badgeSet = new Set(userBadges.map((b: any) => b.badge_id));
  const qualSet = new Set(userQuals.map((q: any) => q.qualification_id));

  async function post(url: string, body: object) {
    setSaving(true);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    router.refresh();
  }

  async function del(url: string, body: object) {
    setSaving(true);
    await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Programme */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Programme</h2>
        <div className="flex flex-col gap-2">
          {programs.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between border rounded p-3"
            >
              <span>{p.name}</span>
              {enrolledSet.has(p.id) ? (
                <button
                  disabled={saving}
                  onClick={() =>
                    del("/api/admin/user-programs", { userId, programId: p.id })
                  }
                  className="text-sm text-red-600 hover:underline"
                >
                  Entfernen
                </button>
              ) : (
                <button
                  disabled={saving}
                  onClick={() =>
                    post("/api/admin/user-programs", {
                      userId,
                      programId: p.id,
                    })
                  }
                  className="text-sm text-blue-600 hover:underline"
                >
                  Hinzufügen
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Abzeichen */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Abzeichen</h2>
        <div className="flex flex-col gap-2">
          {badges.map((b: any) => (
            <div
              key={b.id}
              className="flex items-center justify-between border rounded p-3"
            >
              <span>
                {b.icon} {b.name}
              </span>
              {badgeSet.has(b.id) ? (
                <button
                  disabled={saving}
                  onClick={() =>
                    del("/api/admin/user-badges", { userId, badgeId: b.id })
                  }
                  className="text-sm text-red-600 hover:underline"
                >
                  Entziehen
                </button>
              ) : (
                <button
                  disabled={saving}
                  onClick={() =>
                    post("/api/admin/user-badges", { userId, badgeId: b.id })
                  }
                  className="text-sm text-blue-600 hover:underline"
                >
                  Vergeben
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Qualifikationen */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Qualifikationen</h2>
        <div className="flex flex-col gap-2">
          {qualifications.map((q: any) => (
            <div
              key={q.id}
              className="flex items-center justify-between border rounded p-3"
            >
              <span>🎓 {q.name}</span>
              {qualSet.has(q.id) ? (
                <span className="text-sm text-green-600">✓ Bestätigt</span>
              ) : (
                <button
                  disabled={saving}
                  onClick={() =>
                    post("/api/admin/user-qualifications", {
                      userId,
                      qualificationId: q.id,
                    })
                  }
                  className="text-sm text-blue-600 hover:underline"
                >
                  Bestätigen
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
