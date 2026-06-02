import { create } from "zustand";

interface ImageStore {
  selectedImage: string | null;
  resultImage: string | null;

  setSelectedImage: (uri: string) => void;
  setResultImage: (uri: string) => void;
}

export const useImageStore = create<ImageStore>((set) => ({
  selectedImage: null,
  resultImage: null,

  setSelectedImage: (uri) => set({ selectedImage: uri }),

  setResultImage: (uri) => set({ resultImage: uri }),
}));
