const CATEGORY_STYLES: Record<string, { gradient: string; emoji: string }> = {
  Politics: { gradient: "from-blue-600 to-blue-800", emoji: "\uD83D\uDDF3\uFE0F" },
  Economics: { gradient: "from-emerald-600 to-emerald-800", emoji: "\uD83D\uDCC8" },
  Tech: { gradient: "from-purple-600 to-purple-800", emoji: "\uD83E\uDD16" },
  Sports: { gradient: "from-orange-500 to-orange-700", emoji: "\uD83C\uDFC6" },
  Climate: { gradient: "from-teal-500 to-teal-700", emoji: "\uD83C\uDF0D" },
  Entertainment: { gradient: "from-pink-500 to-pink-700", emoji: "\u2B50" },
  Companies: { gradient: "from-slate-500 to-slate-700", emoji: "\uD83C\uDFE2" },
  World: { gradient: "from-indigo-500 to-indigo-700", emoji: "\uD83C\uDF10" },
};

const DEFAULT_STYLE = { gradient: "from-gray-600 to-gray-800", emoji: "\u2753" };

export default function MarketThumbnail({
  imageUrl,
  category,
  size = "sm",
}: {
  imageUrl: string | null;
  category: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-14 w-14 text-2xl rounded-lg",
    md: "h-24 w-24 text-4xl rounded-xl",
    lg: "h-48 w-full text-6xl rounded-xl",
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`shrink-0 object-cover ${sizeClasses[size]}`}
      />
    );
  }

  const style = CATEGORY_STYLES[category ?? ""] ?? DEFAULT_STYLE;

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${style.gradient} ${sizeClasses[size]}`}
    >
      {style.emoji}
    </div>
  );
}
