import { getInitials, type AvatarProps } from "./Avatar.types";

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  // size is an arbitrary per-instance pixel value (not a token), so
  // width/height/radius/fontSize stay inline — Tailwind's JIT can't scan a
  // dynamically built arbitrary-value class like `w-[${size}px]`.
  const dynamicStyle = { width: size, height: size, borderRadius: size / 2 };
  const className = "flex shrink-0 items-center justify-center overflow-hidden bg-primaryLight";

  if (uri) {
    return <img src={uri} alt={name ?? "Avatar"} className={className} style={dynamicStyle} />;
  }

  return (
    <div className={className} style={dynamicStyle}>
      <span className="font-semibold text-primaryDark" style={{ fontSize: size * 0.4 }}>
        {getInitials(name)}
      </span>
    </div>
  );
}
