import { getMasteryLevel } from '@/lib/sm2';

interface MasteryBadgeProps {
  interval: number;
  reviewCount: number;
  showLabel?: boolean;
}

export function MasteryBadge({ interval, reviewCount, showLabel = true }: MasteryBadgeProps) {
  const mastery = getMasteryLevel(interval, reviewCount);

  if (!showLabel) {
    return <span className="text-lg">{mastery.icon}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${mastery.color}`}>
      <span>{mastery.icon}</span>
      <span>{mastery.label}</span>
    </span>
  );
}
