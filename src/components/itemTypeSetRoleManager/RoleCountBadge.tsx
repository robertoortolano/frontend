interface RoleCountBadgeProps {
  count: number;
  color: string;
}

const COLOR_CLASS_MAP: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  purple: "bg-purple-100 text-purple-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  indigo: "bg-indigo-100 text-indigo-800",
  gray: "bg-gray-100 text-gray-800",
  default: "bg-gray-100 text-gray-800",
};

export const RoleCountBadge = ({ count, color }: RoleCountBadgeProps) => {
  const colorClasses = COLOR_CLASS_MAP[color] || COLOR_CLASS_MAP.default;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClasses}`}>
      {count}
    </span>
  );
};



