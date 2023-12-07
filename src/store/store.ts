// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice';
import placesReducer from './slices/placesSlice';

export const store = configureStore({
  reducer: {
    map: mapReducer,
    places: placesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
