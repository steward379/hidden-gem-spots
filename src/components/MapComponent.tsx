import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'images/marker-icon-2x.png',
  iconUrl: 'images/marker-icon.png',
  shadowUrl: 'images/marker-shadow.png',
});

const MapComponent = ({ places, onMarkerPlaced, isAddingMarker, onCancel, onMarkerClick, onMapClick }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null)
  const [newMarker, setNewMarker ] = useState(null)
  const [markers, setMarkers] = useState([]);

  // Initialize
  useEffect(() => { 
    if (typeof window !== "undefined" && mapRef.current && !map) {
      
        const initializedMap = L.map(mapRef.current).setView([25.0330, 121.5654], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(initializedMap);

        setMap(initializedMap);
    }
}, [map]);


// database 'places' rendering
useEffect(() => {
  if (map && places) {

    markers.forEach(marker => {
      marker.remove();
    });

    setMarkers([]); 

    const newMarkers = places.map(place => {
      if (place.coordinates) { 

        const categoryMapping = {
          eat: { color: 'bg-yellow-200', text: '吃的' },
          play: { color: 'bg-green-200', text: '玩的' },
        };

        const category = categoryMapping[place.category] || { color: 'bg-gray-200', text: '不明' }; 

        const popupContent = `
        <div class="text-center" style="width:150px">
        <b class="text-lg">${place.name}</b>
        <p>${place.description}</p>
        <p class="text-sm text-gray-500 ${category.color} p-1 rounded">${category.text}</p>
        <div class="flex flex-wrap gap-2 mt-2">
          ${place.tags.map(tag => `<span class="text-xs bg-blue-200 px-2 py-1 rounded-full">${tag}</span>`).join(' ')}
        </div>
      </div>
      `;

        return L.marker(place.coordinates).addTo(map)
                .bindPopup(popupContent)
                .on('click', () => onMarkerClick(place));
      }
      return null;
    }).filter(marker => marker !== null);

    setMarkers(newMarkers); 
  }
}, [map, places, onMarkerClick]);

// when users hit cancel button
useEffect(() => {
  if (!isAddingMarker && newMarker) {
    newMarker.remove(); 
    setNewMarker(null); 
    onCancel(); 
  }
}, [isAddingMarker, newMarker, onCancel]);

useEffect(() => {
  if (!map) return;

  const onClick = (e) => {
    onMapClick();

    if (isAddingMarker) {
      if (newMarker) {
        newMarker.setLatLng(e.latlng); // 改變位置
      } else {
        const marker = L.marker(e.latlng, {
        icon: L.icon({
          // iconUrl: require('leaflet/dist/images/marker-icon.png'),
          // shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
          iconRetinaUrl: 'images/marker-icon-2x.png',
          iconUrl: 'images/marker-icon.png',
          shadowUrl: 'images/marker-shadow.png',
          iconSize: [25, 41], // 標記圖標的大小，
          iconAnchor: [12, 41], // 尖端正確指向位置
        }),
      }).addTo(map);

      setNewMarker(marker);
    }

      onMarkerPlaced(e.latlng);
    }
  };


  map.on('click', onClick);

  return () => {
    map.off('click', onClick);
  };
}, [map, onMarkerPlaced, isAddingMarker, newMarker, onMapClick]);

return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};
export default MapComponent;
