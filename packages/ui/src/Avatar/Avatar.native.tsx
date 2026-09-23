import { Image, Text, View } from "react-native";
import { colors } from "../tokens";
import { fontFamily } from "../fonts";
import { getInitials, type AvatarProps } from "./Avatar.types";

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  // size is an arbitrary per-instance pixel value (not a token), so
  // width/height/radius stay inline — same reasoning as Avatar.tsx.
  const dynamicStyle = { width: size, height: size, borderRadius: size / 2 };
  const className = "items-center justify-center overflow-hidden bg-primaryLight";

  if (uri) {
    return <Image source={{ uri }} className={className} style={dynamicStyle} />;
  }

  return (
    <View className={className} style={dynamicStyle}>
      <Text style={{ color: colors.primaryDark, fontFamily: fontFamily("semibold"), fontSize: size * 0.4 }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
