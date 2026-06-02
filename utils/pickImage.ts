import * as ImagePicker from "expo-image-picker";

export const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });

  if (result.canceled) return null;

  return result.assets[0];
};
