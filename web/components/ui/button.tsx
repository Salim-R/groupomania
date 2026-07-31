import Link from 'next/link';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-brass text-on-brass hover:bg-brass-strong',
  secondary: 'border border-rule-strong bg-paper-raised text-ink hover:bg-paper-sunken',
  ghost: 'text-ink-muted hover:text-ink',
  danger: 'border border-alert text-alert hover:bg-alert-wash',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />;
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={`${base} ${variants[variant]} ${className}`} />;
}
