// store/googlePlacesStore.js
import { create } from 'zustand';

interface GooglePlacesState {
  googlePlace: any; // 暫時先用 any
  setGooglePlace: (place: any) => void; // 暫時先用 any
  clearGooglePlace: () => void;
}

const useGooglePlacesStore = create<GooglePlacesState>
(
  (set) => (
    {
      googlePlace: null,
      setGooglePlace: (place) => set({ googlePlace: place }),
      clearGooglePlace: () => set({ googlePlace: null })
    }
  )
);

export default useGooglePlacesStore;