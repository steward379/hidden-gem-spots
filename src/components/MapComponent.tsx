// pages/components/MapComponent.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import L from 'leaflet';
import 'leaflet-minimap';
import 'leaflet-routing-machine';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css'; // geosearch_css
import 'leaflet-minimap/dist/Control.MiniMap.min.css'; // minimap_css
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// function
import { decimalToDms } from '../utils/decimalCoordinates'
// conponents
import AlertModal from './AlertModal';
// zustand
import useGooglePlacesStore from '../store/googlePlacesStore';

import { categoryMapping } from '../constants';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: '/images/marker-add.png', 
  iconRetinaUrl: '/images/marker-add.png',
  shadowUrl: '/images/marker-shadow.png',
  // iconSize: [25, 41], 
  iconSize: [25, 35], 
  iconAnchor: [12, 35],
  popupAnchor: [-3, -36], 
  shadowSize: [20, 20] 
});

const formatCoordinates = (lat, lng) => {
  const latText = Math.round(lat * 10000) / 10000;
  const lngText = Math.round(lng * 10000) / 10000;

  // const latText = roundedLat >= 0 ? `${roundedLat} N` : `${Math.abs(roundedLat)} S`;
  // const lngText = roundedLng >= 0 ? `${roundedLng} E` : `${Math.abs(roundedLng)} W`;

  return `${latText}, ${lngText}`;
};

// TypeScript Options

// interface MapComponentProps {
//   // ... 其他 props
//   selectedPlace: Place | null;
// }

// const MapComponent: React.FC<MapComponentProps> = ({ 
const MapComponent = ({ 
  // places
  places = [], 
  selectedPlace = null,
  // interaction
  onMapClick = undefined, 
  onMarkerPlaced  = undefined, 
  isAddingMarker = false, 
  onMarkerClick = undefined, 
  onCancel = undefined, 
  // status
  isEditing = false, 
  isPublishing = false,
  onAddToPublish = undefined,
  // onRemoveFromPublish = undefined,
  // publishedPlaces = [],
  // like and duplicate
  allowLikes = false, 
  allowDuplicate = false,
  showInteract = true,
  handlePlaceLikeClick = (string) => {},
  handlePlaceDuplicate = (string) => {},
  // routing machine mode
  setIsRoutingMode = null,
  isRoutingMode = false,
  isFreeMode = false,
  onRouteCalculated = undefined,
  onModeChange = undefined
}) => {

  // zustand
  const { googlePlace, clearGooglePlace } = useGooglePlacesStore();

  // Taipei as default
  const defaultLat = 25.0330;
  const defaultLng = 121.5654;

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [ showDeleteConfirm, setShowDeleteConfirm ] = useState(false);
  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

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

  // routing machine
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [routingControl, setRoutingControl] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);
  const [freeModeMarkers, setFreeModeMarkers] = useState([]);

  const [isRoutingPaused, setIsRoutingPaused] = useState(false);

  // 當 routeWaypoints 改變時，更新路徑
  useEffect(() => {
    if (routingControl) {
      routingControl.setWaypoints(routeWaypoints);
    }
  }, [routeWaypoints, routingControl, isRoutingPaused]);

  // kill new markers while canceling
  useEffect(() => {
    if (!isAddingMarker && newMarker ) {
      newMarker.remove(); // 移除標記
      setNewMarker(null); // 重置 newMarker 狀態
    }
  }, [isAddingMarker, newMarker, map]);

  const customFreeIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: '/images/marker-free.png', 
      iconRetinaUrl: '/images/marker-free.png',
      shadowUrl: '/images/marker-shadow.png',
      
      // iconSize: [25, 41], 
      iconSize: [25, 35], 
      iconAnchor: [12, 35],
      popupAnchor: [-3, -36], 
      shadowSize: [41, 41] 
    });
  }, []); 

  const customGoogleIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: '/images/marker-icon-2x.png', 
      iconRetinaUrl: '/images/marker-icon-2x.png',
      shadowUrl: '/images/marker-shadow.png',
      
      // iconSize: [25, 41], 
      iconSize: [25, 35], 
      iconAnchor: [12, 35],
      popupAnchor: [-3, -36], 
      shadowSize: [41, 41] 
    });
  }, []); 

  // const [googleMarkers, setGoogleMarkers] = useState([]);

  // const removeGoogleMarker = (markerToRemove) => {
  //   setGoogleMarkers(prevMarkers => {
  //     const updatedMarkers = prevMarkers.filter(marker => marker !== markerToRemove);
  //     markerToRemove.remove(); 
  //     return updatedMarkers; 
  //   });
  // };

    // const clearGoogleMarkers = () => {
  //   googleMarkers.forEach(marker => marker.remove());
  //   setGoogleMarkers([]);
  // };

  useEffect(() => {
    if (map && googlePlace) {
      const tempMarker = L.marker([googlePlace.coordinates.lat, googlePlace.coordinates.lng], {
        icon: customGoogleIcon,
      }).addTo(map);
  
      const popupContent = `
        <div class="text-center z-20" style="width:150px">
          <b class="text-lg">${googlePlace.name}</b>
          <p>${googlePlace.description == undefined ? '' : googlePlace.description }</p>
          <div class="${categoryMapping[googlePlace.category]?.color || 'bg-gray-200'} p-2 rounded mb-4 w-full">
            ${categoryMapping[googlePlace.category]?.text || '不明'}
          </div>
          <div class="coordinates-container p-2">
            <span>${formatCoordinates(googlePlace.coordinates.lat, googlePlace.coordinates.lng)}</span>
          </div>
          <button id="delete-temp-marker-btn" class="mt-2 bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 focus:outline-none">刪除標記</button>
        </div>
      `;
  
      // tempMarker.bindPopup(popupContent).openPopup();
      tempMarker.bindPopup(popupContent);

      // setTimeout(() => {
      //   const deleteButton = document.getElementById('delete-marker-btn');
      //   if (deleteButton) {
      //     deleteButton.addEventListener('click', () => {
      //       tempMarker.remove();
      //     });
      //   }
      // }, 0);

      tempMarker.on('popupopen', () => {
        const deleteButton = document.getElementById('delete-temp-marker-btn');
        if (deleteButton) {
          deleteButton.onclick = () => {
            tempMarker.remove();
            clearGooglePlace();
          };
        }
      });

      // setGoogleMarkers(prevMarkers => [...prevMarkers, tempMarker]);
  
      // 清理效果
      return () => {
        tempMarker.remove();
      };
    }
  }, [map, googlePlace, customGoogleIcon, clearGooglePlace]);

  // fetch user location while permitted
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

  // Initialize the map
  useEffect(()  => {
    let newMap = null;

    if (map || !mapRef.current) return;
    if (typeof window !== "undefined" && mapRef.current && !map) {

      const newMap = L.map(mapRef.current).setView(userPosition || [defaultLat, defaultLng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap);

        // 設置路徑規劃控件但不設置路徑
        // @ts-ignore
      const newRoutingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true
      }).addTo(newMap);

      setMap(newMap);
      setRoutingControl(newRoutingControl);
    }
    return () => {
      if (newMap) {
        newMap.remove();
      }
    };
  }, [mapRef, map, userPosition]);

  const customIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: '/images/marker.png', 
      iconRetinaUrl: '/images/marker.png',
      shadowUrl: '/images/marker-shadow.png',
      
      // iconSize: [25, 41], 
      iconSize: [25, 35], 
      iconAnchor: [12, 35],
      popupAnchor: [-3, -36], 
      shadowSize: [41, 41] 
    });
  }, []); 

  const updateRoute = useCallback((place) => {
    if (isRoutingMode && !isRoutingPaused) {
      // 處理添加到路徑的邏輯
      setRouteWaypoints(prev => [...prev, L.latLng(place.coordinates.lat, place.coordinates.lng)]);
      if (onRouteCalculated) {
        onRouteCalculated([...routeWaypoints, L.latLng(place.coordinates.lat, place.coordinates.lng)]);
      }
    } else if (!isRoutingMode)  {
      // 非路徑模式時的默認行為（顯示詳情）
      onMarkerClick(place);
    }
  }, [isRoutingMode, onRouteCalculated, routeWaypoints, onMarkerClick, isRoutingPaused]);

  //search bar & mini map 
  useEffect(() => {
    if(!map)  return;

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

            <a href=${`https://www.google.com/maps/place/${decimalToDms(marker.getLatLng().lat, marker.getLatLng().lng)}`} target="_blank" passHref>
              <button className="bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                在 G 中查看
              </button>
            </a>
            <button id="delete-marker-btn" class="mt-2 bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 focus:outline-none">刪除標記</button>
          </div>
        `;

        // marker.bindPopup(popupContent).openPopup();
        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          const deleteButton = marker.getPopup().getElement().querySelector('#delete-marker-btn');
          if (deleteButton) {
            deleteButton.onclick = () => {
              marker.remove();
            };
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
  }, [map, isEditing, customIcon]);

  // const [placesUpdated, setPlacesUpdated] = useState(false);

  // 'places' rendering
  useEffect(() => {
    if (!map || !places) return;
    // if (map && places) {

    // markers.forEach(marker => {
    //   marker.remove();
    // });

    const newMarkers = places.map(place => {
      if (!place.coordinates) return null;

      const category = categoryMapping[place.category] || { color: 'bg-gray-200', text: '不明' }; 

      const latestImages = place.images.slice(-2);
      const imageElements = latestImages.map(image => 
        `<div style="margin: 5px;">
            <img src=${image} alt="${place.name}" style="max-width:100%; max-height:100px;" />
          </div>`
      ).join('');

      // function copyCoordinates(elementId) {
      //   const coords = document.getElementById(elementId).innerText;
      //   navigator.clipboard.writeText(coords)
      //     .then(() => showAlert('座標已複製到剪貼簿'))
      //     .catch(err => console.error('無法複製座標:', err));
      // }

      const popupContent = `
      <div key=${place.id} class="text-center z-20" style="width:150px">
        <b class="text-lg">${place.name}</b>
        <p>${place.description}</p>
        ${imageElements}

        <div class="mt-3 mb-3 text-sm text-gray-500 ${category.color} p-1 rounded">${category.text}</div>
        <div class="flex flex-wrap gap-2" >
        ${
          place.tags && place.tags.filter(tag => tag.trim().length > 0).length > 0 
          ? place.tags.map(tag => `<span class="text-xs bg-blue-200 px-2 py-1 rounded-full">${tag}</span>`).join(' ')
          : ''
        }
        </div>
        ${!isPublishing && showInteract ? `
          <div class="flex items-center justify-center mt-2 ">
            <div class="like-section flex items-center justify-center mr-2">
              ${allowLikes ? `<button class="like-button" data-place-id="${place.id}">
                <i class="fas fa-heart text-lg text-red-300 hover:text-red-500"></i>
              </button>` : ''}
              <span class="like-count ml-2"> ${place.likes} 枚</span>
            </div>
            <div class="duplicate-section flex items-center justify-center">
              ${allowDuplicate ? `<button class="duplicate-button mr-2" data-place-id="${place.id}">
                <i class="fas fa-copy text-lg text-gray-600 hover:text-green-500"></i>
              </button>` : ''}
              <span class="duplicate-count">${place.duplicates} 次</span>
            </div>
          </div>` : ''
      }
        <div class="coordinates-container p-2">
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

      markerElement.on('click', () => updateRoute(place));

      return markerElement;

    })
    // }).filter(marker => marker !== null);
    
    // setMarkers(newMarkers); 

    // return () => {
    //   newMarkers.forEach(marker => marker.remove());
    // };

    setMarkers(prevMarkers => {
      // 移除舊的標記
      prevMarkers.forEach(marker => {
        if (!newMarkers.includes(marker) && !freeModeMarkers.includes(marker)) {
          marker.remove();
        }
      });
      return newMarkers;
    });
  
  }, [map, places, allowDuplicate, allowLikes, freeModeMarkers, isPublishing, onMarkerClick, onAddToPublish, showInteract, updateRoute]);
  

  useEffect(() => {
    places.forEach(place => {
      const marker = markers.find(marker => marker.options.id === place.id);
      const popup = marker?.getPopup();
  
      if (popup) {
        const htmlContent = popup.getContent();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const likeIcon = doc.querySelector('.like-button i');
  
        if (likeIcon) {
          if (place.isLiked) {
            likeIcon.classList.remove('far', 'fa-heart');
            likeIcon.classList.add('fas', 'fa-heart', 'text-red-200');
          } else {
            likeIcon.classList.remove('fas', 'fa-heart', 'text-red-200');
            likeIcon.classList.add('far', 'fa-heart');
          }
          popup.setContent(doc.documentElement.innerHTML);
        }
      }
    });
  }, [places, markers]);
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

  // click like or duplicate button
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

  // MapLink routing machine
  const updateFreeModeRoute = useCallback((freeMarkers) => {
    if (!isRoutingPaused) {
      // const waypoints = freeModeMarkers.map(marker => marker.getLatLng());
      const waypoints = freeMarkers.map(freeMarker => freeMarker.getLatLng());

      if (routingControl) {
        routingControl.setWaypoints(waypoints);
      }
    }
  }, [routingControl, isRoutingPaused]);

  // 自由模式下移除標記的函數，未使用
  const removeMarker = useCallback((marker) => {
    marker.remove();
    setFreeModeMarkers(prev => {
      const updatedMarkers = prev.filter(m => m !== marker);
      if (!isRoutingPaused) {
        updateFreeModeRoute(updatedMarkers); // 只有當不在暫停模式時才更新路徑
      }
      return updatedMarkers;
    });
  }, [updateFreeModeRoute, isRoutingPaused]);

  // 自由模式下添加標記的函數，未使用
  const onRouteMapClick = useCallback((event) => {
    if (!isRoutingMode && !isFreeMode) return;

    if (isRoutingMode  && !isRoutingPaused) {

      // if (!startMarker) {
       
      //   const marker = L.marker(event.latlng, {
      //     draggable: true
      //   }).addTo(map);

      //   setStartMarker(marker);

      // } else if (!endMarker) {
        
      //   const marker = L.marker(event.latlng, {
      //     draggable: true
      //   }).addTo(map);

      //   setEndMarker(marker);

      //   if (routingControl) {
      //     routingControl.setWaypoints([
      //       startMarker.getLatLng(), 
      //       marker.getLatLng()
      //     ]);
      //   }
    
      //   if (onRouteCalculated) {
      //     onRouteCalculated([startMarker.getLatLng(), marker.getLatLng()]);
      //   }
      // }
    } else if (isFreeMode && !isRoutingPaused){
    // } else if (isFreeMode){

      const existingMarker = freeModeMarkers.find(marker => marker.getLatLng().equals(event.latlng));

      if (!existingMarker) {
      const newMarker = L.marker(event.latlng, {
        icon: customFreeIcon,
        draggable: true
      }).addTo(map);

      // @ts-ignore
      // newMarker._leaflet_id = L.Util.stamp(newMarker); // 給新標記一個唯一ID

      const popupContent = `
      <p>經度: ${event.latlng.lng.toFixed(5)}</p>
      <p>緯度: ${event.latlng.lat.toFixed(5)}</p>
      <button class="delete-marker-btn">刪除標記</button>
      `;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = popupContent;
      const deleteButton = tempDiv.querySelector('.delete-marker-btn');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => removeMarker(newMarker));
      }

      newMarker.bindPopup(tempDiv);

      // setFreeModeMarkers(prev => [...prev, newMarker]);
      // updateFreeModeRoute();
      setFreeModeMarkers(prev => {
        const updatedMarkers = [...prev, newMarker];

        updateFreeModeRoute(updatedMarkers); // 立即更新路徑

        return updatedMarkers;
      });
    }
    }     
  }, [map, isRoutingMode, isFreeMode, updateFreeModeRoute, removeMarker, isRoutingPaused, freeModeMarkers, customFreeIcon]);


  useEffect(() => {
    if (!map) return;

    map.on('click', onRouteMapClick);

    return () => map.off('click', onRouteMapClick);
  }, [map, startMarker, endMarker, isRoutingMode, routingControl, onRouteCalculated, isFreeMode, updateFreeModeRoute, customIcon, onRouteMapClick]);
  
  // would be replaced
  useEffect(() => {
    freeModeMarkers.forEach(marker => {
      marker.setIcon(customIcon);
    });
  }, [freeModeMarkers, customIcon]);

    // setWaypoints(prev => {
  //   const newWaypoints = prev.length === 2 ? [] : [...prev];
  //   newWaypoints.push(event.latlng);
  //   return newWaypoints;
  // });
  
  // useEffect(() => {
  //   if (routingControl && waypoints.length === 2) {
  //     routingControl.setWaypoints(waypoints);
  //   }
  // }, [routingControl, waypoints]);

  // 清理路徑和標記
  useEffect(() => {
    if (!isRoutingMode && !isFreeMode && routingControl) {
      routingControl.setWaypoints([]);

      if (startMarker) {
        startMarker.remove();
        setStartMarker(null);
      }
      if (endMarker) {
        endMarker.remove();
        setEndMarker(null);
      }
    }
  }, [isRoutingMode, routingControl, startMarker, endMarker, isFreeMode]);

  // add marker
  useEffect(() => {
    if (!map) return;

    const onClick = (e) => {
      if (isEditing) return;

      if (onMapClick && typeof onMapClick === 'function') {
        onMapClick(); // 確保 onMapClick 存在且是一個函數
      }

      if (isAddingMarker && !isFreeMode) {
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
  }, [map, onMarkerPlaced, isAddingMarker, newMarker, onMapClick, isEditing, onCancel, isFreeMode]);


  //  search marker
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

  // useEffect(() => {
  //   if(isLoading) {
  //     showLoadingAlert('Loading');
  //   }
  // }, [isLoading]); 

  // routing machine
  const confirmEraseRouting = () => {

    if (isFreeMode) {
      freeModeMarkers.forEach(marker => marker.remove()); // 移除所有自由模式的標記
      setFreeModeMarkers([]); // 清空標記數組
    }
    setRouteWaypoints([]);
    setShowDeleteConfirm(false);

    if (onRouteCalculated) {
      onRouteCalculated([]);
    }
  };

  const pauseRouting = () => {
    setIsRoutingPaused(prev => !prev);
    if (isFreeMode && !isRoutingPaused) {
      setFreeModeMarkers([]); // 清空自由模式的標記數組
    } 
  };

  useEffect(() => {
    if (!isRoutingMode) {
      // 清理路徑
      if (routingControl) {
        routingControl.setWaypoints([]);
      }
      if (onRouteCalculated) {
        onRouteCalculated([]);
      }
      setRouteWaypoints([]);
  
      // 移除開始和結束標記
      if (startMarker) {
        startMarker.remove();
        setStartMarker(null);
      }
      if (endMarker) {
        endMarker.remove();
        setEndMarker(null);
      }
      setIsRoutingPaused(false);
  
      // 如果有其他與路徑模式相關的狀態或設置，也在這裡重設
    }
  }, [isRoutingMode, routingControl, startMarker, endMarker, onRouteCalculated]);

  const clearMarkersAndRoute = useCallback(() => {
    freeModeMarkers.forEach(marker => marker.remove());
    setFreeModeMarkers([]);
    if (routingControl) {
      routingControl.setWaypoints([]);
    }
  }, [freeModeMarkers, routingControl]);


// 模式切換函數
const toggleMode = () => {
  setIsRoutingMode(prev => !prev);
  // setIsFreeMode(prev => !prev);
  clearMarkersAndRoute(); // 切換模式時清除自由模式的標記和路徑
};

  // useEffect(() => {
  //   if (!isFreeMode && !isRoutingMode) {
  //     clearMarkersAndRoute();
  //   }
  // }, [isFreeMode, isRoutingMode, clearMarkersAndRoute]);

  return (
    <div className="relative h-full w-full min-h-[600px] text-black">
      {isLoading && 
      <AlertModal
        isOpen={isLoading}
        message= "Loading"
        isALoadingAlert={true}
      />
      }
      <div ref={mapRef} className="z-10 h-full w-full min-h-[600px] flex-1" />
        <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <Image src="/images/marker.png" alt="Marker" 
                  className="h-9 w-6" width="25" height="35" />
        </div>
        <button
          title="location-fetch" 
          className="absolute top-0 left-10 z-10 m-3 border-b bg-white text-black py-4 px-1 rounded hover:bg-green-300 shadow"
          onClick={handleFetchLocationClick}
        >
          <Image src="/images/map-cursor.png" alt="Fetch-Location" className="h-7 w-7" width="30" height="30" />
        </button>
        { (isRoutingMode || isFreeMode) && (
          <div className="">
            <button 
              title="stop-routing"
              className="flex-column absolute top-0 left-20 z-10 m-3 border-b bg-white text-black py-2 px-1 rounded hover:bg-green-300 shadow"
              onClick={pauseRouting}>
                <i className="fas fa-pause"></i>
                <div className="text-sm">{isRoutingPaused ? "繼續路線" : "暫停路線"}</div>
            </button>
            <button 
              title="stop-routing"
              className="flex-column absolute top-0 left-40 z-10 m-3 border-b bg-white text-black py-2 px-2 rounded hover:bg-green-300 shadow"
              onClick={()=>setShowDeleteConfirm(true)}>
                <i className="fas fa-trash"></i>
                <div className="text-sm">清除路線</div>
            </button>
            <button
              title="toggle-mode"
              className="flex-column absolute top-0 left-60 z-10 m-3 border-b bg-white text-black py-2 px-2 rounded hover:bg-green-300 shadow"
              onClick={toggleMode}
            >
              <i className={`fas ${isRoutingMode ? 'fa-fire' : 'fa-road'}`}></i>
              <div className="text-sm">{isRoutingMode ? '自由模式' : '路線模式'}</div>
            </button>
          </div>
        )} 
        <AlertModal
          isOpen={isAlertOpen}
          onClose={() => setIsAlertOpen(false)}
          message={alertMessage}
        />
        <AlertModal 
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmEraseRouting}
          message="您確定要清除路線嗎？"
          showConfirmButton={true}
        />
    </div>
  );
};
export default MapComponent;