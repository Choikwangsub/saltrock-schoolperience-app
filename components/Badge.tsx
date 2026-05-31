interface BadgeProps {
  label: string;
}

export function Badge({ label }: BadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-primary ring-1 ring-brand-primary/15">
      {label}
    </span>
  );
}
