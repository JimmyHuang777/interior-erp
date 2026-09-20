"use client";

import { useRouter } from "next/navigation";

export default function ProjectPicker({
  basePath,
  projects,
  activeProjectId,
}: {
  basePath: string;
  projects: { id: string; name: string }[];
  activeProjectId?: string;
}) {
  const router = useRouter();
  return (
    <select
      defaultValue={activeProjectId}
      onChange={(e) => router.push(`${basePath}?projectId=${e.target.value}`)}
      className="border border-slate-300 rounded px-3 py-2 text-sm"
    >
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
