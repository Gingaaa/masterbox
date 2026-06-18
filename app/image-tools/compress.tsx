import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";

const DEFAULT_QUALITY = 30;
const { height } = Dimensions.get("window");

export default function CompressScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [compressedUri, setCompressedUri] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressionQuality, setCompressionQuality] = useState(DEFAULT_QUALITY);
  const [compressionMode, setCompressionMode] = useState<"quality" | "target">(
    "quality",
  );
  const [targetSizeKB, setTargetSizeKB] = useState("500");
  const [imageInfo, setImageInfo] = useState({
    fileName: "",
    width: 0,
    height: 0,
    mimeType: "",
  });
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [showInfoNote, setShowInfoNote] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [previewTitle, setPreviewTitle] = useState("");
  const [estimating, setEstimating] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["95%"], []);

  const calculateSavings = (original: number, compressed: number) => {
    if (!original) return "0.00";

    const saving = ((original - compressed) / original) * 100;

    return Math.max(0, saving).toFixed(2);
  };

  const savedPercentage = calculateSavings(originalSize, compressedSize);
  const openPreview = (uri: string, title: string) => {
    // console.log("Preview URI:", uri);
    setPreviewImage(uri);
    setPreviewTitle(title);

    requestAnimationFrame(() => {
      bottomSheetRef.current?.snapToIndex(1);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const getFileSize = async (uri: string): Promise<number> => {
    try {
      const file = new File(uri);

      return file.size ?? 0;
    } catch {
      return 0;
    }
  };

  const getAspectRatio = () => {
    if (!imageInfo.width || !imageInfo.height) return "-";

    const ratio = imageInfo.width / imageInfo.height;

    if (Math.abs(ratio - 1) < 0.1) return "1:1";

    if (Math.abs(ratio - 1.33) < 0.1) return "4:3";

    if (Math.abs(ratio - 1.77) < 0.1) return "16:9";

    return ratio.toFixed(2);
  };

  const pickImage = async () => {
    resetImageData();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      const asset = result.assets[0];

      setImageInfo({
        fileName: asset.fileName || "Unknown",
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType || "Unknown",
      });

      const fileInfo = await getFileSize(uri);
      setOriginalSize(fileInfo);

      setImageUri(uri);
      setCompressedUri(null);
      await estimateCompression(uri, DEFAULT_QUALITY);
    }
  };

  const getRecommendation = () => {
    const mb = originalSize / 1024 / 1024;

    const kb = originalSize / 1024;

    if (kb < 500) {
      return "This image is already optimized. Compression may not reduce size significantly.";
    }

    if (mb > 10) {
      return "Large file. Recommended compression 40-60%.";
    }

    if (mb > 5) {
      return "Medium file. Recommended compression 60-80%.";
    }

    return "Small file. Light compression recommended.";
  };

  const getDisplayEstimatedSize = () => {
    if (compressionQuality === 100) {
      return originalSize;
    }

    return estimatedSize ?? 0;
  };

  const getDisplayEstimatedSavings = () => {
    if (compressionQuality === 100) {
      return "0.00";
    }

    if (!estimatedSize || !originalSize) {
      return "0.00";
    }

    return calculateSavings(originalSize, estimatedSize);
  };

  const estimateCompression = async (uri: string, quality: number) => {
    if (!uri) return;
    if (originalSize < 500 * 1024 && quality > 70) {
      setEstimatedSize(originalSize);
      return;
    }

    setEstimating(true);

    try {
      const context = ImageManipulator.manipulate(uri);

      if (quality < 100) {
        context.resize({
          width: 1080,
        });
      }

      const image = await context.renderAsync();

      const compressed = await image.saveAsync({
        compress: quality / 100,
        format: SaveFormat.JPEG,
      });

      const size = await getFileSize(compressed.uri);

      setEstimatedSize(Math.min(size, originalSize));
    } catch (err) {
      console.log(err);
    }

    setEstimating(false);
  };

  const getQualityLabel = () => {
    if (compressionQuality <= 20) return "Maximum Compression";

    if (compressionQuality <= 50) return "Balanced";

    if (compressionQuality <= 80) return "High Quality";

    return "Near Original";
  };

  const compressImage = async () => {
    if (!imageUri) return;
    setIsCompressing(true);

    try {
      if (compressionMode === "target") {
        const target = Number(targetSizeKB);

        const result = await compressToTargetSize(imageUri, target);
        if (result) {
          setCompressedUri(result.uri);
          setCompressedSize(result.size);
        }

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({
            animated: true,
          });
        }, 300);

        Toast.show({
          type: "success",
          text1: "Image Compressed",
        });

        return;
      } else {
        const context = ImageManipulator.manipulate(imageUri);

        if (compressionQuality < 100) {
          context.resize({
            width: 1080,
          });
        }

        const image = await context.renderAsync();
        const compressed = await image.saveAsync({
          compress: compressionQuality / 100,
          format: SaveFormat.JPEG,
        });

        // console.log("Original Size:", originalSize);

        const size = await getFileSize(compressed.uri);

        // console.log("Compressed Size:", size);

        setCompressedSize(size);
        setCompressedUri(compressed.uri);

        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({
            animated: true,
          });
        }, 300);

        Toast.show({
          type: "success",
          text1: "Image Compressed",
        });

        // console.log("Compressed:", compressed.uri);
      }
    } catch (error) {
      console.log("Compression Error:", error);

      Toast.show({
        type: "error",
        text1: "Compression Failed",
        text2: "Please try again",
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const compressToTargetSize = async (uri: string, targetKB: number) => {
    if (targetKB < 20) {
      Toast.show({
        type: "warning",
        text1: "Target size too small",
      });
      return;
    }
    let low = 0.05;
    let high = 1;

    let bestUri = uri;
    let bestSize = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < 8; i++) {
      const quality = (low + high) / 2;

      const context = ImageManipulator.manipulate(uri);

      const image = await context.renderAsync();

      const compressed = await image.saveAsync({
        compress: quality,
        format: SaveFormat.JPEG,
      });

      const size = await getFileSize(compressed.uri);

      const sizeKB = size / 1024;

      if (Math.abs(sizeKB - targetKB) < Math.abs(bestSize / 1024 - targetKB)) {
        bestUri = compressed.uri;
        bestSize = size;
      }

      if (sizeKB > targetKB) {
        high = quality;
      } else {
        low = quality;
      }
    }

    return {
      uri: bestUri,
      size: bestSize,
    };
  };

  const saveImage = async () => {
    if (!compressedUri) return;

    await MediaLibrary.requestPermissionsAsync();

    await MediaLibrary.saveToLibraryAsync(compressedUri);

    Toast.show({
      type: "success",
      text1: "Image Saved",
      text2: "Saved to your gallery",
    });
  };

  const shareImage = async () => {
    if (!compressedUri) return;

    await Sharing.shareAsync(compressedUri);
  };

  const resetCompression = () => {
    Alert.alert("Start New Compression", "Current results will be removed.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Continue",
        onPress: () => {
          setOriginalSize(0);
          setCompressedSize(0);
          setImageUri(null);
          setCompressedUri(null);
        },
      },
    ]);
  };

  const resetImageData = () => {
    setImageUri(null);
    setCompressedUri(null);

    setOriginalSize(0);
    setCompressedSize(0);

    setEstimatedSize(null);
    setEstimating(false);
  };

  useEffect(() => {
    if (previewImage) {
      bottomSheetRef.current?.expand();
    }
  }, [previewImage]);

  return (
    <>
      <ScrollView className="flex-1 bg-white p-5" ref={scrollViewRef}>
        <Text className="text-2xl font-bold mb-5">Compress Image</Text>

        <Pressable onPress={pickImage} className="bg-black rounded-xl p-4 mb-5">
          <Text className="text-white text-center font-semibold">
            Select Image
          </Text>
        </Pressable>

        {imageUri && (
          <>
            <Text className="font-semibold mb-2">Original Image</Text>

            <Pressable onPress={() => openPreview(imageUri!, "Original Image")}>
              <Image
                source={{ uri: imageUri }}
                className="w-full h-72 rounded-xl mb-5"
              />
            </Pressable>

            <View className="bg-gray-100 rounded-xl p-4 mb-5">
              <Text>File Name: {imageInfo.fileName}</Text>

              <Text>File Size: {formatFileSize(originalSize)}</Text>

              <Text>
                Resolution: {imageInfo.width} × {imageInfo.height}
              </Text>

              <Text>Format: {imageInfo.mimeType}</Text>

              <Text>Aspect Ratio: {getAspectRatio()}</Text>
              <Text className="text-blue-600 mt-2">{getRecommendation()}</Text>
            </View>

            <View className="mb-4">
              <Text className="font-semibold mb-3">Compression Method</Text>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setCompressionMode("quality")}
                  className={`px-4 py-3 rounded-xl ${
                    compressionMode === "quality"
                      ? "bg-blue-600"
                      : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={
                      compressionMode === "quality"
                        ? "text-white"
                        : "text-black"
                    }
                  >
                    Quality
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setCompressionMode("target")}
                  className={`px-4 py-3 rounded-xl ${
                    compressionMode === "target" ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={
                      compressionMode === "target" ? "text-white" : "text-black"
                    }
                  >
                    Target Size
                  </Text>
                </Pressable>
              </View>
            </View>

            {compressionMode === "quality" && (
              <View className="mb-6">
                <Text className="text-lg font-semibold mb-2">
                  Compression Quality
                </Text>

                <View className="flex-row justify-between mb-2">
                  <Text>{compressionQuality}%</Text>

                  <Text className="text-gray-500">{getQualityLabel()}</Text>
                </View>

                <Slider
                  minimumValue={5}
                  maximumValue={100}
                  step={1}
                  value={compressionQuality}
                  onSlidingComplete={(value) => {
                    setCompressionQuality(value);

                    if (imageUri) {
                      estimateCompression(imageUri, value);
                    }
                  }}
                />
                <View className="bg-blue-50 rounded-xl p-4 mt-4">
                  <Text className="font-semibold mb-2">Estimated Result</Text>

                  {estimating ? (
                    <Text>Calculating...</Text>
                  ) : (
                    <>
                      <Text>
                        Estimated Size:
                        {formatFileSize(getDisplayEstimatedSize())}
                      </Text>

                      <Text>
                        Estimated Saving: {getDisplayEstimatedSavings()}%
                      </Text>
                    </>
                  )}
                </View>
              </View>
            )}

            {compressionMode === "target" && (
              <View className="mb-5">
                <Text className="mb-2">Target Size (KB)</Text>

                <TextInput
                  value={targetSizeKB}
                  onChangeText={setTargetSizeKB}
                  keyboardType="numeric"
                  placeholder="500"
                  className="border border-gray-300 rounded-xl p-3"
                />
              </View>
            )}

            <Pressable
              disabled={isCompressing}
              onPress={compressImage}
              className="bg-blue-600 rounded-xl p-4 mb-5"
            >
              <Text className="text-white text-center font-semibold">
                {isCompressing ? "Compressing..." : "Compress Image"}
              </Text>
            </Pressable>
          </>
        )}

        {!isCompressing && compressedUri && (
          <>
            <View className="bg-gray-100 p-4 rounded-xl mb-5">
              <Text className="text-base mb-2">
                Original Size:{" "}
                <Text className="font-bold">
                  {formatFileSize(originalSize)}
                </Text>
              </Text>

              <Text className="text-base mb-2">
                Output File:{" "}
                <Text className="font-bold">
                  {formatFileSize(compressedSize)}
                </Text>
              </Text>

              <Text className="text-base">
                Space Saved:{" "}
                <Text className="font-bold text-green-600">
                  {savedPercentage}%
                </Text>
              </Text>
            </View>

            <View className="mb-5">
              <Pressable
                onPress={() => setShowInfoNote(!showInfoNote)}
                className="flex-row items-center justify-between"
              >
                <Text className="text-blue-600 font-medium">
                  How is output size calculated?
                </Text>

                <Text>{showInfoNote ? "▲" : "▼"}</Text>
              </Pressable>

              {showInfoNote && (
                <View className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-2">
                  <Text className="text-xs text-gray-600 leading-5">
                    Output size is measured directly from the generated file
                    before it is saved to your photo library. Some gallery apps
                    may report a different size after import due to metadata and
                    device-specific processing.
                  </Text>
                </View>
              )}
            </View>
            <Text className="font-semibold mb-2">Compressed Image</Text>

            <Pressable
              onPress={() => openPreview(compressedUri!, "Compressed Image")}
            >
              <Image
                source={{ uri: compressedUri }}
                className="w-full h-72 rounded-xl mb-5"
              />
            </Pressable>

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
            <Pressable
              onPress={resetCompression}
              className="bg-gray-200 p-4 rounded-xl mt-5 mb-10"
            >
              <Text className="text-center font-semibold">
                Compress Another Image
              </Text>
            </Pressable>
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
