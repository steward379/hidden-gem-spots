// store/googlePlacesStore.js
import create from 'zustand';

const useGooglePlacesStore = create((set) => ({
  googlePlace: null,
  setGooglePlace: (place) => set({ googlePlace: place }),
  clearGooglePlace: () => set({ googlePlace: null })
}));

export default useGooglePlacesStore;