import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const MapComponent: React.FC = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current === null) return;

    const map = L.map(mapRef.current).setView([25.0330, 121.5654], 13); // 這裡的坐標是台北101大樓的坐標，縮放等級是13

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 這裡可以添加更多地圖的功能，比如標記和路徑

    return () => {
      map.remove();
    };
  }, []);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default MapComponent;