const COLORS = [
  "#00A676", "#e5534b", "#60a5fa", "#a78bfa", "#fbbf24",
  "#f97316", "#ec4899", "#14b8a6", "#06b6d4", "#84cc16",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export default function AgentAvatar({
  name,
  size = 32,
}: {
  name: string;
  size?: number;
}) {
  const color = COLORS[Math.abs(hashCode(name)) % COLORS.length];
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}
