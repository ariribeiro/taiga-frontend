import { Avatar } from "@/components/ui/primitives";
import type { Person } from "@/lib/api/types";

/** Foto e nome de quem tem o papel Scrum Master no projeto (rótulo acima do nome). Não aparece se ninguém tiver esse papel. */
export function ScrumMaster({ people }: { people: Person[] }) {
  if (!people.length) return null;
  return (
    <div className="sm">
      {people.map((p) => (
        <div key={p.name} className="sm-who">
          <Avatar name={p.name} src={p.photo} size={38} />
          <span className="sm-txt"><span className="sm-label">Scrum Master</span><strong>{p.name}</strong></span>
        </div>
      ))}
    </div>
  );
}
