import { useEffect, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

import Slider from "@react-native-community/slider";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";

export default function Resize() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [resizedUri, setResizedUri] = useState<string | null>(null);

  const [resizeMode, setResizeMode] = useState<"percentage" | "dimension">(
    "percentage",
  );

  const [resizePercentage, setResizePercentage] = useState(50);

  const [customWidth, setCustomWidth] = useState("");

  const [imageInfo, setImageInfo] = useState({
    width: 0,
    height: 0,
    fileName: "",
    mimeType: "",
  });

  const [newWidth, setNewWidth] = useState(0);

  const [newHeight, setNewHeight] = useState(0);

  const { height } = Dimensions.get("window");

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [previewTitle, setPreviewTitle] = useState("");

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["95%"], []);

  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  const [customHeight, setCustomHeight] = useState("");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      setImageUri(asset.uri);

      setImageInfo({
        width: asset.width,
        height: asset.height,
        fileName: asset.fileName || "Unknown",
        mimeType: asset.mimeType || "Unknown",
      });

      setResizedUri(null);
    }
  };

  const handleWidthChange = (value: string) => {
    setCustomWidth(value);

    if (lockAspectRatio && imageInfo.width) {
      const width = Number(value);

      if (!width) {
        setCustomHeight("");
        return;
      }

      const ratio = imageInfo.height / imageInfo.width;

      setCustomHeight(Math.round(width * ratio).toString());
    }
  };

  const handleHeightChange = (value: string) => {
    setCustomHeight(value);

    if (lockAspectRatio && imageInfo.height) {
      const height = Number(value);

      if (!height) {
        setCustomWidth("");
        return;
      }

      const ratio = imageInfo.width / imageInfo.height;

      setCustomWidth(Math.round(height * ratio).toString());
    }
  };

  const openPreview = (uri: string, title: string) => {
    setPreviewImage(uri);
    setPreviewTitle(title);

    requestAnimationFrame(() => {
      bottomSheetRef.current?.snapToIndex(1);
    });
  };

  const resizeImage = async () => {
    if (!imageUri) return;

    try {
      let width = imageInfo.width;
      let height = imageInfo.height;

      if (resizeMode === "percentage") {
        width = Math.round(width * (resizePercentage / 100));

        height = Math.round(height * (resizePercentage / 100));
      } else {
        width = Number(customWidth);

        height = Number(customHeight);

        if (!width || !height) {
          Toast.show({
            type: "error",
            text1: "Enter valid dimensions",
          });

          return;
        }
      }

      const context = ImageManipulator.manipulate(imageUri);

      context.resize({
        width,
        height,
      });

      const image = await context.renderAsync();

      const result = await image.saveAsync({
        compress: 1,
        format: SaveFormat.JPEG,
      });

      setResizedUri(result.uri);

      setNewWidth(width);
      setNewHeight(height);

      Toast.show({
        type: "success",
        text1: "Image Resized Successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Resize Failed",
      });
    }
  };

  const saveImage = async () => {
    if (!resizedUri) return;

    await MediaLibrary.requestPermissionsAsync();

    await MediaLibrary.saveToLibraryAsync(resizedUri);

    Toast.show({
      type: "success",
      text1: "Image Saved",
    });
  };

  const shareImage = async () => {
    if (!resizedUri) return;

    await Sharing.shareAsync(resizedUri);
  };

  const previewWidth =
    resizeMode === "percentage"
      ? Math.round(imageInfo.width * (resizePercentage / 100))
      : Number(customWidth) || 0;

  const previewHeight =
    resizeMode === "percentage"
      ? Math.round(imageInfo.height * (resizePercentage / 100))
      : lockAspectRatio
        ? previewWidth
          ? Math.round(previewWidth * (imageInfo.height / imageInfo.width))
          : 0
        : Number(customHeight) || 0;

  useEffect(() => {
    if (previewImage) {
      bottomSheetRef.current?.expand();
    }
  }, [previewImage]);

  return (
    <>
      <ScrollView className="flex-1 bg-white p-5">
        <Text className="text-2xl font-bold mb-5">Resize Image</Text>

        <Pressable onPress={pickImage} className="bg-black rounded-xl p-4 mb-5">
          <Text className="text-white text-center font-semibold">
            Select Image
          </Text>
        </Pressable>

        {imageUri && (
          <>
            <Pressable onPress={() => openPreview(imageUri!, "Original Image")}>
              <Image
                source={{ uri: imageUri }}
                className="w-full h-72 rounded-xl mb-5"
              />
            </Pressable>

            <View className="bg-gray-100 p-4 rounded-xl mb-5">
              <Text>File: {imageInfo.fileName}</Text>

              <Text>Format: {imageInfo.mimeType}</Text>

              <Text>
                Resolution: {imageInfo.width}×{imageInfo.height}
              </Text>
            </View>

            <Text className="font-semibold mb-3">Resize Method</Text>

            <View className="flex-row gap-3 mb-5">
              <Pressable
                onPress={() => setResizeMode("percentage")}
                className={`px-4 py-3 rounded-xl ${
                  resizeMode === "percentage" ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <Text
                  className={
                    resizeMode === "percentage" ? "text-white" : "text-black"
                  }
                >
                  Percentage
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setResizeMode("dimension")}
                className={`px-4 py-3 rounded-xl ${
                  resizeMode === "dimension" ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <Text
                  className={
                    resizeMode === "dimension" ? "text-white" : "text-black"
                  }
                >
                  Dimensions
                </Text>
              </Pressable>
            </View>

            {resizeMode === "percentage" && (
              <>
                <Text className="mb-2">Resize: {resizePercentage}%</Text>

                <Slider
                  minimumValue={10}
                  maximumValue={100}
                  step={1}
                  value={resizePercentage}
                  onValueChange={setResizePercentage}
                />
              </>
            )}

            {resizeMode === "dimension" && (
              <View className="mb-5">
                <Pressable
                  onPress={() => setLockAspectRatio(!lockAspectRatio)}
                  className="flex-row items-center mb-4"
                >
                  <Text className="text-lg">
                    {lockAspectRatio ? "🔒" : "�"}
                  </Text>

                  <Text className="ml-2">Lock Aspect Ratio</Text>
                </Pressable>

                <TextInput
                  value={customWidth}
                  onChangeText={handleWidthChange}
                  keyboardType="numeric"
                  placeholder="Width"
                  className="border border-gray-300 rounded-xl p-4 mb-3"
                />

                <TextInput
                  value={customHeight}
                  onChangeText={handleHeightChange}
                  keyboardType="numeric"
                  editable={!lockAspectRatio}
                  placeholder="Height"
                  className="border border-gray-300 rounded-xl p-4"
                />
              </View>
            )}

            <View className="bg-blue-50 rounded-xl p-4 my-5">
              <Text className="font-semibold mb-2">New Resolution</Text>

              <Text>
                {previewWidth}×{previewHeight}
              </Text>
            </View>

            <Pressable
              onPress={resizeImage}
              className="bg-blue-600 rounded-xl p-4 mb-5"
            >
              <Text className="text-white text-center font-semibold">
                Resize Image
              </Text>
            </Pressable>
          </>
        )}

        {resizedUri && (
          <>
            <Text className="font-semibold mb-2">Resized Image</Text>

            <Pressable
              onPress={() => openPreview(resizedUri!, "Resized Image")}
            >
              <Image
                source={{ uri: resizedUri }}
                className="w-full h-72 rounded-xl mb-5"
              />
            </Pressable>

            <View className="bg-blue-50 rounded-xl p-4">
              <Text>
                Original:
                {imageInfo.width}×{imageInfo.height}
              </Text>

              <Text>
                New:
                {previewWidth}×{previewHeight}
              </Text>

              <Text>
                Scale:
                {Math.round((previewWidth / imageInfo.width) * 100)}%
              </Text>
            </View>

            <View className="flex-row gap-3 mb-10">
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
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        enablePanDownToClose
        snapPoints={snapPoints}
        onClose={() => {
          setPreviewImage(null);
          setPreviewTitle("");
        }}
      >
        <BottomSheetView className="flex-1 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">{previewTitle}</Text>

            <Pressable onPress={() => bottomSheetRef.current?.close()}>
              <Text className="text-xl">✕</Text>
            </Pressable>
          </View>

          <Text className="text-gray-500 mb-4">Drag down to close</Text>

          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              resizeMode="contain"
              style={{
                width: "100%",
                height: height * 0.6,
              }}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}
