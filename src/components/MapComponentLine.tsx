import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'images/marker-icon-2x.png',
  iconUrl: 'images/marker-icon.png',
  shadowUrl: 'images/marker-shadow.png',
  
});

const MapComponent = ({ onMarkerPlaced, isAddingMarker }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  const [polyline, setPolyline] = useState(null);

  useEffect(() => { 
    if (typeof window !== "undefined" && mapRef.current && !map) {

      // import("leaflet").then(L => {
      
        const initializedMap = L.map(mapRef.current).setView([25.0330, 121.5654], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(initializedMap);

        // initializedMap.on('click', function (e) {
        //   const marker = L.marker(e.latlng).addTo(initializedMap);
        //   onMarkerPlaced(e.latlng, marker);
        // });

        setMap(initializedMap);

        const poly = L.polyline([], { color: 'red' }).addTo(initializedMap);
        setPolyline(poly);
      // });
    }
  // }, [map, onMarkerPlaced]);
}, [map]);

useEffect(() => {
  if (!map) return;

  // const polyline = L.polyline([], { color: 'red' }).addTo(map);

  const onClick = (e) => {
    console.log("Map clicked", e.latlng)
    const marker = L.marker(e.latlng, {
      icon: L.icon({
        // iconUrl: require('leaflet/dist/images/marker-icon.png'),
        // shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
        iconRetinaUrl: 'images/marker-icon-2x.png',
        iconUrl: 'images/marker-icon.png',
        shadowUrl: 'images/marker-shadow.png',
        iconSize: [25, 41], // 這是標記圖標的大小，您可能需要根據您的圖標進行調整
        iconAnchor: [12, 41], // 這會確保標記的尖端正確指向位置
      }),
    }).addTo(map);

    // polyline.addLatLng(e.latlng);
    onMarkerPlaced(e.latlng, polyline, marker);
  };

  map.on('click', onClick);

  return () => {
    map.off('click', onClick);
    // polyline.remove();
  };
}, [map, onMarkerPlaced, isAddingMarker]);

return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};
export default MapComponent;
