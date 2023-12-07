import { createSlice } from '@reduxjs/toolkit';

interface Place {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  images: string[];
  createdTime?: string;
  updatedTime?: string;
  likes?: number;
  likedBy?: string[];
  duplicates?: number;
  duplicatedBy?: string[];
}

export const placesSlice = createSlice({
  name: 'places',
  initialState: {
    places: [],
  },
  reducers: {
    setPlacesRedux: (state, action) => {
      state.places = action.payload;
    },
    // other reducers
  },
});

// Actions
export const { setPlacesRedux } = placesSlice.actions;

// Selector
export const selectPlacesRedux = (state) => state.places.places;

export default placesSlice.reducer;