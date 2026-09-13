import { Image, Text, View } from "react-native";
import { colors, fontWeights } from "../tokens";
import { getInitials, type AvatarProps } from "./Avatar.types";

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
    backgroundColor: colors.primaryLight,
  };

  if (uri) {
    return <Image source={{ uri }} style={style} />;
  }

  return (
    <View style={style}>
      <Text style={{ color: colors.primaryDark, fontWeight: fontWeights.semibold, fontSize: size * 0.4 }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
