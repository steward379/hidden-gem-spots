export interface NewMarkerData {
  latlng: {
    lat: number;
    lng: number;
  };
  name: string;
  description: string;
  tags: string;
  category: string;
  images?: File[];
  imageUrls?: string[];
}
