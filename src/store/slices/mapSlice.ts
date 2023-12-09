import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
    updatedTine?: string;
    likes?: number;
    likedBy?: string[];
    duplicates?: number;
    duplicatedBy?: string[];
}

interface MapState {
    mapDataRedux: {
        title: string;
        content: string;
        tags: string[];
        coverImage: string;
        authorName: string;
        publishedPlaces: Place[];
        publishDate: string;
        updatedDate: string;
    } | null;
}

const initialState: MapState = {
  mapDataRedux: null,
};

export const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMapDataRedux: (state, action: PayloadAction<MapState['mapDataRedux']>) => {
      state.mapDataRedux = action.payload;
    },
    // 其他 reducers...
  },
});

export const { setMapDataRedux } = mapSlice.actions;

export default mapSlice.reducer;
