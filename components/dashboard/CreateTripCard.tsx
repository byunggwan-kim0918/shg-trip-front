'use client';

interface CreateTripCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  recommended?: boolean;
  gradient?: string;
}

export default function CreateTripCard({
  icon,
  title,
  description,
  onClick,
  recommended = false,
  gradient = 'from-accent to-blue-500',
}: CreateTripCardProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-start gap-4 p-6 w-full rounded-2xl border border-sidebar-border bg-card-bg hover:scale-[1.02] hover:shadow-lg transition-all duration-300 text-left cursor-pointer group"
    >
      {recommended && (
        <span className="absolute top-4 right-4 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-sm">
          추천
        </span>
      )}

      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
