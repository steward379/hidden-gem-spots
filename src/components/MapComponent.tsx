import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// npm install @types/leaflet-geosearch
import 'leaflet-geosearch/dist/geosearch.css'; // geosearch_css
import 'leaflet-minimap/dist/Control.MiniMap.min.css'; // minimap_css

import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-minimap';

import { categoryMapping } from '../constants';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png', 
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});


// TypeScript Options

// interface MapComponentProps {
//   // ... 其他 props
//   selectedPlace: Place | null;
// }

// const MapComponent: React.FC<MapComponentProps> = ({ 
const MapComponent = ({ 
  places = [], 
  onMarkerPlaced  = undefined, 
  isAddingMarker = false, 
  onCancel = undefined, 
  onMarkerClick = undefined, 
  onMapClick = undefined, 
  isEditing = false, 
  selectedPlace = null,
  isPublishing = false,
  onAddToPublish = undefined,
  onRemoveFromPublish = undefined,
  publishedPlaces = [],
  allowLikes = false, 
  allowDuplicate = false,
  showInteract = true,
  handlePlaceLikeClick = (string) => {},
  handlePlaceDuplicate = (string) => {},
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null)
  const [newMarker, setNewMarker ] = useState(null)
  const [markers, setMarkers] = useState([]);

  const [isLoading, setLoading] = useState(false);
  const [userPosition, setUserPosition] = useState(null);

  const handleFetchLocationClick = () => {
    // setShouldFetchLocation(true);
    fetchLocation();
  };

  const defaultLat = 25.0330;
  const defaultLng = 121.5654;

  const [alertMessage, setAlertMessage] = useState('');
  const showAlert = (message) => {
    setAlertMessage(message);
  };

  useEffect(() => {
    if (!isAddingMarker && newMarker ) {
      newMarker.remove(); // 移除標記
      setNewMarker(null); // 重置 newMarker 狀態
    }
  }, [isAddingMarker, newMarker, map]);

  const fetchLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = [position.coords.latitude, position.coords.longitude];
        setUserPosition(newPosition);
        if (map) {
          map.setView(newPosition, 13); // 更新地圖視圖
        }
        setLoading(false);
      },
      (error) => {
        console.error(error);
        const defaultPosition = [defaultLat, defaultLng];
        setUserPosition(defaultPosition);
        if (map) {
          map.setView(defaultPosition, 13); // 更新地圖視圖
        }
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // location
  // useEffect(() => {
  //   if (!shouldFetchLocation) return;
  //   // 僅在組件掛載時執行一次
  //   // if (userPosition === null) {
  //     setLoading(true);
  //     navigator.geolocation.getCurrentPosition(
  //       (position) => {
    
  //         setUserPosition([position.coords.latitude, position.coords.longitude]);
  //         setShouldFetchLocation(false);
  //         setLoading(false);
  //       },
  //       (error) => {
  //         console.error(error);
  //         setUserPosition([defaultLat, defaultLng]);
  //         setShouldFetchLocation(false);
  //         setLoading(false);
  //       },
  //       { enableHighAccuracy: true }
  //     );
  //   // }
  // }, [userPosition, shouldFetchLocation]); // []

  // Initialize
  useEffect(()  => {
    let newMap = null;

    if (map || !mapRef.current) return;
    if (typeof window !== "undefined" && mapRef.current && !map) {

      const newMap = L.map(mapRef.current).setView(userPosition || [defaultLat, defaultLng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap);

      setMap(newMap);
    }
    return () => {
      if (newMap) {
        newMap.remove();
      }
    };
  }, [mapRef, map, userPosition]);


  //search bar
  useEffect(() => {
    if(!map)  return;

    const customIcon = new L.Icon({
      iconUrl: 'images/marker-icon-2x-blue.png', 
      iconRetinaUrl: 'images/marker-icon-2x-blue.png',
      shadowUrl: 'images/marker-shadow.png',
      iconSize: [25, 41], 
      iconAnchor: [12, 41],
      popupAnchor: [1, -34], 
      shadowSize: [41, 41] 
    });

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
          icon: customIcon,
          draggable: true,
        },
        maxMarkers: 1,
        retainZoomLevel: false,
        animateZoom: true,
        autoClose: true,
        searchLabel: 'Enter address',
        keepResult: true,
      });

      map.addControl(searchControl);
      
      map.on('geosearch/showlocation', (event) => {
        const marker = event.marker;
        const locationName = event.location.label; // 從 event 獲取位置名稱
    
        const popupContent = `
          <div class="text-center">
            <p class="font-bold">${locationName}</p> <!-- 顯示位置名稱 -->
            <p>經度: ${marker.getLatLng().lng.toFixed(5)}</p>
            <p>緯度: ${marker.getLatLng().lat.toFixed(5)}</p>
            <button id="delete-marker-btn" class="mt-2 bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 focus:outline-none">刪除標記</button>
          </div>
        `;
        marker.bindPopup(popupContent).openPopup();
    
        // 添加事件監聽器，當點擊刪除按鈕時移除標記
        marker.getPopup().on('contentupdate', () => {
          const deleteButton = document.getElementById('delete-marker-btn');
          if (deleteButton) {
            deleteButton.addEventListener('click', () => {
              marker.remove();
            });
          }
        });
      });

      // 初始化迷你地圖
      const miniMap = new (L as any).Control.MiniMap(
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'), 
        {
          toggleDisplay: true,
          minimized: false,
          position: 'bottomright'
        }
      ).addTo(map);

      return () => {
        map.removeControl(searchControl);

        map.off('geosearch/showlocation');

        miniMap.remove();
      };
    }
  }, [map, isEditing]);

  // database 'places' rendering
  useEffect(() => {
    if (!map || !places) return;
    // if (map && places) {

    //   markers.forEach(marker => {
    //     marker.remove();
    //   });

      const newMarkers = places.map(place => {
        if (!place.coordinates) return null;

          const category = categoryMapping[place.category] || { color: 'bg-gray-200', text: '不明' }; 

          const latestImages = place.images.slice(-2);
          const imageElements = latestImages.map(image => 
            `<div style="margin: 5px;">
               <img src=${image} alt="${place.name}" style="max-width:100%; max-height:100px;" />
             </div>`
          ).join('');

          const formatCoordinates = (lat, lng) => {
            const latText = Math.round(lat * 10000) / 10000;
            const lngText = Math.round(lng * 10000) / 10000;
          
            // const latText = roundedLat >= 0 ? `${roundedLat} N` : `${Math.abs(roundedLat)} S`;
            // const lngText = roundedLng >= 0 ? `${roundedLng} E` : `${Math.abs(roundedLng)} W`;
          
            return `${latText}, ${lngText}`;
          };

          function copyCoordinates(elementId) {
            const coords = document.getElementById(elementId).innerText;
            navigator.clipboard.writeText(coords)
              .then(() => alert('座標已複製到剪貼簿'))
              .catch(err => console.error('無法複製座標:', err));
          }

          const popupContent = `
          <div key=${place.id} class="text-center" style="width:150px">
            <b class="text-lg">${place.name}</b>
            <p>${place.description}</p>
            ${imageElements}

            ${!isPublishing && showInteract ? `
            <div class="like-section">
              <span class="like-count">❤ ${place.likes} 枚喜愛</span>
              ${allowLikes ? `<button class="like-button" data-place-id="${place.id}">
                <img src="/images/heart.png" alt="Like" width="20" height="20" />
              </button>` : ''}
            </div>
            <div class="duplicate-section">
              <span class="duplicate-count">${place.duplicates} 次複製</span>
              ${allowDuplicate ? `<button class="duplicate-button" data-place-id="${place.id}">
              <img src="/images/copy.png" alt="Duplicate" width="20" height="20" />
              </button>` : ''}
            </div>` : ''}
            <p class="text-sm text-gray-500 ${category.color} p-1 rounded">${category.text}</p>
            <div class="flex flex-wrap gap-2 mt-2">
            ${
              place.tags && place.tags.filter(tag => tag.trim().length > 0).length > 0 
              ? place.tags.map(tag => `<span class="text-xs bg-blue-200 px-2 py-1 rounded-full">${tag}</span>`).join(' ')
              : ''
            }
            </div>
            <div class="coordinates-container">
              <span id="coords-${place.id}">${formatCoordinates(place.coordinates.lat, place.coordinates.lng)}</span>
            </div>
          </div>
          `;

      const markerElement = L.marker(place.coordinates, {
              //@ts-ignore
                id: place.id,
                draggable: isPublishing, // 如果在發佈模式，標記可拖動
            }).addTo(map)
              .bindPopup(popupContent)

        if (isPublishing) {
          // 如果處於發佈模式，則設置拖放事件監聽
          markerElement.on('dragend', (event) => {
            const marker = event.target;
            const position = marker.getLatLng();
            onAddToPublish({ ...place, coordinates: position });
          });
        } else {
          // 如果不是發佈模式，綁定點擊事件或其他事件
          markerElement.on('click', () => onMarkerClick(place));
        }
  
        return markerElement;
      }).filter(marker => marker !== null);

      setMarkers(newMarkers); 

      return () => {
        newMarkers.forEach(marker => marker.remove());
      };
  }, [map, places, onMarkerClick, isPublishing, onAddToPublish, allowLikes, allowDuplicate, showInteract]);

  // const onMarkerDragEnd = (event, place) => {
  //   const marker = event.target;
  //   const position = marker.getLatLng();
    
  //   const markerScreenPos = map.latLngToContainerPoint(position);
  //   if (isInsidePublishArea(markerScreenPos, publishAreaRect)) {
  //     onAddToPublish({ ...place, coordinates: position });
  //   }
  // };
  
  const isInsidePublishArea = (markerPos, areaRect) => {
    if (!areaRect) return false;
    return (
      markerPos.x >= areaRect.left &&
      markerPos.x <= areaRect.right &&
      markerPos.y >= areaRect.top &&
      markerPos.y <= areaRect.bottom
    );
  };

  // when users click like button when availavle
  useEffect(() => {
    const handlePopupClick = (event) => {
      const likeButton = event.popup._contentNode.querySelector('.like-button');
      const duplicateButton = event.popup._contentNode.querySelector('.duplicate-button');
  
      if (likeButton) {
        likeButton.addEventListener('click', () => {
          const placeId = likeButton.getAttribute('data-place-id');
          handlePlaceLikeClick(placeId);
        });
      }
  
      if (duplicateButton) {
        duplicateButton.addEventListener('click', () => {
          const placeId = duplicateButton.getAttribute('data-place-id');
          handlePlaceDuplicate(placeId);
        });
      }
    };
  
    if (map) {
      map.on('popupopen', handlePopupClick);
    }
  
    return () => {
      if (map) {
        map.off('popupopen', handlePopupClick);
      }
    };
  }, [map, handlePlaceLikeClick, handlePlaceDuplicate]);
  
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

  // add marker
  useEffect(() => {
    if (!map) return;

    const onClick = (e) => {
      if (isEditing) return;

      if (onMapClick && typeof onMapClick === 'function') {
        onMapClick(); // 確保 onMapClick 存在且是一個函數
      }

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

    if (!isAddingMarker && newMarker) {
      newMarker.remove();
      setNewMarker(null);
    }

    map.on('click', onClick);

    return () => {
      map.off('click', onClick);
    };
  }, [map, onMarkerPlaced, isAddingMarker, newMarker, onMapClick, isEditing, onCancel]);

   
  useEffect(() => {
    if (map && selectedPlace) {
      // 將地圖視圖中心移動到選中地點
      // map.setView(new L.LatLng(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng), 13);
      // 如果有與 selectedPlace 相關的 marker，打開它的彈出窗口
      const relevantMarker = markers.find(marker => marker.options.id === selectedPlace.id);

      if (relevantMarker) {
        // 如果找到了相關聯的標記，則移動地圖視圖並打開其彈出窗口
        map.setView([selectedPlace.coordinates.lat, selectedPlace.coordinates.lng], 13);
        relevantMarker.openPopup();
      }
    }
  }, [map, selectedPlace, markers]);

  useEffect(() => {
    if(isLoading) {
      showAlert('Loading');
    }
  }, [isLoading]); 

  return (
    <div className="relative h-full w-full min-h-[600px] text-black">
      {isLoading && <AlertModal message={alertMessage} />}
      <div ref={mapRef} className="z-10 h-full w-full min-h-[600px] flex-1" />
        <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <Image src="/images/marker-icon.png" alt="Marker" className="h-7 w-7" width="30" height="30" />
        </div>
        <button
          title="location-fetch" 
          className="absolute top-0 left-10 z-10 m-3 border-b bg-white text-black py-4 px-1 rounded hover:bg-green-300 shadow"
          onClick={handleFetchLocationClick}
        >
          <Image src="/images/map-cursor.png" alt="Fetch-Location" className="h-7 w-7" width="30" height="30" />
        </button>
    </div>
  );
};

const AlertModal = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <p className="text-black">{message}</p>
        <div className="progress-bar w-32 h-2 bg-gray-200 relative">
            <div className="progress w-0 h-2 bg-black absolute border rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;