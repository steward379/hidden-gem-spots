// useDragPlacesStore.ts
// zustand
import { create } from 'zustand';
// import Place from ..

// interface DragPlaceState {
//   draggedPlace: Place | null;
//   setDraggedPlace: (place: Place | null) => void;
// }

const useDragPlacesStore = create(set => ({
  draggedPlace: null,
  setDraggedPlace: (place) => set({ draggedPlace: place }),
}));

export default useDragPlacesStore;