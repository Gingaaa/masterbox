import * as ImageManipulator from "expo-image-manipulator";

export const compressImage = async (uri: string, quality: number) => {
  return await ImageManipulator.manipulateAsync(uri, [], {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });
};
