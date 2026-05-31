interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionTitleProps) {
  const isCenter = align === "center";

  return (
    <header className={isCenter ? "text-center" : "text-left"}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-secondary">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-2 font-heading text-3xl font-extrabold tracking-tight text-brand-primary md:text-4xl ${
          isCenter ? "mx-auto max-w-3xl" : "max-w-3xl"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-3 text-sm leading-relaxed text-foreground/80 md:text-base ${
            isCenter ? "mx-auto max-w-2xl" : "max-w-2xl"
          }`}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}
