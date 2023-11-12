import React, { useEffect, useRef, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// npm install @types/leaflet-geosearch
import 'leaflet-geosearch/dist/geosearch.css'; // geosearch_css
import 'leaflet-minimap/dist/Control.MiniMap.min.css'; // minimap_css

import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-minimap';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'images/marker-icon-2x.png', 
  iconUrl: 'images/marker-icon.png',
  shadowUrl: 'images/marker-shadow.png',
});


// TypeScript Options

// interface MapComponentProps {
//   // ... 其他 props
//   selectedPlace: Place | null;
// }

// const MapComponent: React.FC<MapComponentProps> = ({ 
const MapComponent = ({ places, onMarkerPlaced, isAddingMarker, onCancel, onMarkerClick, onMapClick, isEditing, selectedPlace }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null)
  const [newMarker, setNewMarker ] = useState(null)
  const [markers, setMarkers] = useState([]);
  const [isLoading, setLoading] = useState(true);

  // Initialize
  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current && !map) {

      const initializeMap = (lat, lng) => {
        const initializedMap = L.map(mapRef.current).setView([lat, lng], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(initializedMap);
  
        setMap(initializedMap);
      };
      
      // 嘗試獲取使用者當前位置
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          initializeMap(latitude, longitude); // 使用使用者位置
          setLoading(false);
        },
        (error) => {
          console.error(error);
          initializeMap(25.0330, 121.5654); // 使用默認位置
          setLoading(false);
        },
        {
          enableHighAccuracy: true
        }
      );

    }
  }, [map]);

  //search bar
  useEffect(() => {
    if (map && !isEditing) {
      const provider = new OpenStreetMapProvider();
      // @ts-ignore
      const searchControl = new GeoSearchControl({
        provider: provider,
        style: 'bar',
        autoComplete: true,
        autoCompleteDelay: 250,
        showMarker: true,
        showPopup: false,
        marker: {
          icon: new L.Icon.Default(),
          draggable: false,
        },
        maxMarkers: 1,
        retainZoomLevel: false,
        animateZoom: true,
        autoClose: true,
        searchLabel: 'Enter address',
        keepResult: true,
      });

      map.addControl(searchControl);

      // 初始化迷你地圖
      const miniMap = new L.Control.MiniMap(
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'), 
        {
          toggleDisplay: true,
          minimized: false,
          position: 'bottomright'
        }
      ).addTo(map);

      return () => {
        map.removeControl(searchControl);
        miniMap.remove();
      };
    }
  }, [map, isEditing]);

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
          <div key=${place.id} class="text-center" style="width:150px">
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

  // basic map interaction
  useEffect(() => {
    if(map){
      if (isEditing) {
        // 禁用地圖的所有交互功能
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if (newMarker) {
          newMarker.dragging.disable(); // 確保新標記也不可拖動
        }
      } else {
        // 啟用地圖的所有交互功能
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();

        if (newMarker) {
          newMarker.dragging.enable(); // 確保新標記可拖動
        }
      }
    }
  }, [isEditing, map, newMarker]);


  useEffect(() => {
    if (!map) return;

    const onClick = (e) => {
      if (isEditing) return;

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
  }, [map, onMarkerPlaced, isAddingMarker, newMarker, onMapClick, isEditing]);

  useEffect(() => {
    if (map && selectedPlace) {
      // 將地圖視圖中心移動到選中地點
      // map.setView(new L.LatLng(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng), 13);
      map.setView([selectedPlace.coordinates.lat, selectedPlace.coordinates.lng], 13);
      
      // 如果有與 selectedPlace 相關的 marker，打開它的彈出窗口
      const relevantMarker = markers.find(marker => marker.options.id === selectedPlace.id);
      relevantMarker?.openPopup();
    }
  }, [map, selectedPlace, markers]);

  return (
    <div className="relative text-black" style={{ height: '100%', width: '100%', minHeight: '600px' }}>
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center text-white bg-blue-500 bg-opacity-75 z-10">
          Loading...
        </div>
      )}
      <div ref={mapRef} style={{ height: '100%', width: '100%', minHeight: '600px', flex: '1 0 auto' }} />
  </div>
  );
};

export default MapComponent;
