// store/googlePlacesStore.js
import { create } from 'zustand';

interface GooglePlacesState {
  googlePlace: any;
  setGooglePlace: (place: any) => void;
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