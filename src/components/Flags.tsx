import type { Flag } from "@/lib/engine/types";

export function Flags({ flags }: { flags: Flag[] }) {
  if (flags.length === 0) return <p className="badge">No rule problems</p>;
  return (
    <div>
      {flags.map((flag) => (
        <p key={flag.message} className={flag.severity}>
          {flag.message}
        </p>
      ))}
    </div>
  );
}
