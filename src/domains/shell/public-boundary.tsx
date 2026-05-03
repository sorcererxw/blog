import styles from "@/styles/route-boundary.module.css";

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
    <section className={styles.boundary}>
      <div className="space-y-5">
        <p className="shell-eyebrow">{eyebrow}</p>
        <h1 className="publication-home-title text-4xl">{title}</h1>
        <p className="publication-home-summary">{message}</p>
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <a key={action.label} className="publication-link" href={action.href}>
              {action.label}
            </a>
          ))}
        </div>
        {note ? <p className="publication-note">{note}</p> : null}
      </div>
    </section>
  );
}
