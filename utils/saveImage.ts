import * as MediaLibrary from "expo-media-library";

export const saveImage = async (uri: string) => {
  await MediaLibrary.requestPermissionsAsync();

  await MediaLibrary.saveToLibraryAsync(uri);
};
