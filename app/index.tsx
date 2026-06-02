import { router } from "expo-router";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-white w-full h-full">
      <ScrollView className="p-5">
        <Text className="text-3xl font-bold mb-2">MasterBox</Text>

        <Text className="text-gray-500 mb-8">All-in-One Utility Toolbox</Text>

        <Text className="text-xl font-semibold mb-4">📸 Image Tools</Text>

        <Pressable
          onPress={() => router.push("/image-tools/compress")}
          className="bg-gray-100 p-4 rounded-xl mb-3"
        >
          <Text className="text-lg font-medium">Compress Image</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/image-tools/resize")}
          className="bg-gray-100 p-4 rounded-xl mb-3"
        >
          <Text className="text-lg font-medium">Resize Image</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/image-tools/crop")}
          className="bg-gray-100 p-4 rounded-xl mb-3"
        >
          <Text className="text-lg font-medium">Crop Image</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/image-tools/convert")}
          className="bg-gray-100 p-4 rounded-xl mb-8"
        >
          <Text className="text-lg font-medium">Convert Image</Text>
        </Pressable>

        <Text className="text-xl font-semibold mb-4">📄 PDF Tools</Text>

        <Pressable
          onPress={() => router.push("/pdf-tools/image-to-pdf")}
          className="bg-gray-100 p-4 rounded-xl mb-3"
        >
          <Text className="text-lg font-medium">Image → PDF</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/pdf-tools/pdf-to-image")}
          className="bg-gray-100 p-4 rounded-xl"
        >
          <Text className="text-lg font-medium">PDF → Image</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
