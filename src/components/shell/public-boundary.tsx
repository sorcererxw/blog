import NextLink from "next/link";

type BoundaryAction = {
  href: string;
  label: string;
};

type PublicBoundaryProps = {
  eyebrow?: string;
  title: string;
  message: string;
  actions: BoundaryAction[];
  note?: string;
};

export function PublicBoundary({
  eyebrow = "Publication boundary",
  title,
  message,
  actions,
  note,
}: PublicBoundaryProps) {
  return (
    <section className="grid w-[min(100%_-_2rem,40rem)] gap-5">
      <div className="space-y-5">
        <p className="m-0 text-xs font-semibold uppercase tracking-widest text-muted">{eyebrow}</p>
        <h1 className="publication-home-title text-4xl">{title}</h1>
        <p className="publication-home-summary">{message}</p>
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <NextLink key={action.label} className="publication-link" href={action.href}>
              {action.label}
            </NextLink>
          ))}
        </div>
        {note ? <p className="publication-note">{note}</p> : null}
      </div>
    </section>
  );
}
