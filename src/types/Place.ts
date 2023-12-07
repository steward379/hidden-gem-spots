export interface Place {
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