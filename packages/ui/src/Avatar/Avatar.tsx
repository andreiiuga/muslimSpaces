import { colors, fontWeights } from "../tokens";
import { getInitials, type AvatarProps } from "./Avatar.types";

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: colors.primaryLight,
    flexShrink: 0,
  } as const;

  if (uri) {
    return <img src={uri} alt={name ?? "Avatar"} style={style} />;
  }

  return (
    <div style={style}>
      <span style={{ color: colors.primaryDark, fontWeight: fontWeights.semibold, fontSize: size * 0.4 }}>
        {getInitials(name)}
      </span>
    </div>
  );
}
