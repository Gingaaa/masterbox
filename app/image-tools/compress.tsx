import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";

import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

export default function CompressScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [compressedUri, setCompressedUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setCompressedUri(null);
    }
  };

  const compressImage = async () => {
    if (!imageUri) return;

    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 0.3,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      setCompressedUri(result.uri);
    } catch (error) {
      Alert.alert("Error", "Failed to compress image");
    }
  };

  const saveImage = async () => {
    if (!compressedUri) return;

    await MediaLibrary.requestPermissionsAsync();

    await MediaLibrary.saveToLibraryAsync(compressedUri);

    Alert.alert("Success", "Image saved");
  };

  const shareImage = async () => {
    if (!compressedUri) return;

    await Sharing.shareAsync(compressedUri);
  };

  return (
    <ScrollView className="flex-1 bg-white p-5">
      <Text className="text-2xl font-bold mb-5">Compress Image</Text>

      <Pressable onPress={pickImage} className="bg-black rounded-xl p-4 mb-5">
        <Text className="text-white text-center font-semibold">
          Select Image
        </Text>
      </Pressable>

      {imageUri && (
        <>
          <Text className="font-semibold mb-2">Original Image</Text>

          <Image
            source={{ uri: imageUri }}
            className="w-full h-72 rounded-xl mb-5"
          />

          <Pressable
            onPress={compressImage}
            className="bg-blue-600 rounded-xl p-4 mb-5"
          >
            <Text className="text-white text-center font-semibold">
              Compress Image
            </Text>
          </Pressable>
        </>
      )}

      {compressedUri && (
        <>
          <Text className="font-semibold mb-2">Compressed Image</Text>

          <Image
            source={{ uri: compressedUri }}
            className="w-full h-72 rounded-xl mb-5"
          />

          <View className="flex-row gap-3">
            <Pressable
              onPress={saveImage}
              className="flex-1 bg-green-600 p-4 rounded-xl"
            >
              <Text className="text-white text-center">Save</Text>
            </Pressable>

            <Pressable
              onPress={shareImage}
              className="flex-1 bg-purple-600 p-4 rounded-xl"
            >
              <Text className="text-white text-center">Share</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}
