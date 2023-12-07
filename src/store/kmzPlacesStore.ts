// store/kmzPlacesStore.js
import { create } from 'zustand';

interface KmzPlacesState {
  kmzPlace: any; 
  setKmzPlace: (place: any) => void;
  clearKmzPlace: () => void;
}

const useKmzPlacesStore = create<KmzPlacesState>((set) => ({
  kmzPlace: null,
  setKmzPlace: (place) => set({ kmzPlace: place }),
  clearKmzPlace: () => set({ kmzPlace: null }),
}));

export default useKmzPlacesStore;