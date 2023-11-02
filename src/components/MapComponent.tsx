import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'images/marker-icon-2x.png',
  iconUrl: 'images/marker-icon.png',
  shadowUrl: 'images/marker-shadow.png',
});

const MapComponent = ({ places, onMarkerPlaced, isAddingMarker, onCancel }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null)
  const [ newMarker, setNewMarker ] = useState(null)

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
    places.forEach(place => {
      L.marker(place.coordinates).addTo(map)
        .bindPopup(`<b>${place.name}</b><br>${place.description}`);
    });
  }
}, [map, places]);

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
}, [map, onMarkerPlaced, isAddingMarker, newMarker]);

return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};
export default MapComponent;
