import * as Sharing from "expo-sharing";

export const shareImage = async (uri: string) => {
  await Sharing.shareAsync(uri);
};
