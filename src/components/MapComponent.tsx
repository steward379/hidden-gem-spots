import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import L from 'leaflet';
import 'leaflet-minimap';
import 'leaflet-routing-machine';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css'; 
import 'leaflet-minimap/dist/Control.MiniMap.min.css'; 
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { decimalToDms, formatCoordinates } from '../utils/decimalCoordinates'
import AlertModal from './AlertModal';
import useGooglePlacesStore from '../store/googlePlacesStore';
import useKmzPlacesStore from '../store/kmzPlacesStore';
import useDragPlacesStore from '../store/dragPlacesStore';
import { categoryMapping } from '../constants';
import { categoryMappingEN } from '../constants';
import { useTranslation } from 'next-i18next';

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

const MapComponent = ({ 
  places = [], 
  selectedPlace = null,
  // interaction
  onMapClick = undefined, 
  onMarkerPlaced  = undefined, 
  isAddingMarker = false, 
  onMarkerClick = undefined, 
  onCancel = undefined, 
  isEditing = false, 
  isPublishing = false,
  onAddToPublish = undefined,
  onRemoveFromPublish = undefined,
  publishedPlaces = [],
  allowLikes = false, 
  allowDuplicate = false,
  showInteract = true,
  handlePlaceLikeClick = (string) => {},
  handlePlaceDuplicate = (string) => {},
  setIsRoutingMode = null,
  isRoutingMode = false,
  isFreeMode = false,
  isDragModeEnabled=false,
  onRouteCalculated = undefined,
  onModeChange = undefined,
  isTyping = false,
}) => {

  const { t, i18n } = useTranslation('common'); 

  function getCategoryText(categoryKey, language) {
    const categoryMappingNow = language === 'en-US' ? categoryMappingEN : categoryMapping;
    return categoryMappingNow[categoryKey]?.text || 'Unknown 不明';
  }

  const { googlePlace, clearGooglePlace } = useGooglePlacesStore();
  const { kmzPlace, clearKmzPlace } = useKmzPlacesStore();
  const defaultLat = 25.0330;
  const defaultLng = 121.5654;
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [ showDeleteConfirm, setShowDeleteConfirm ] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const mapRef = useRef(null);
  const [map, setMap] = useState(null)
  const [newMarker, setNewMarker ] = useState(null)
  const [markers, setMarkers] = useState([]);

  const [isLoading, setLoading] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const handleFetchLocationClick = () => {
    fetchLocation();
  };

  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [routingControl, setRoutingControl] = useState(null);
  
  // const [waypoints, setWaypoints] = useState([]);

  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);
  const [freeModeMarkers, setFreeModeMarkers] = useState([]);
  const [isRoutingPaused, setIsRoutingPaused] = useState(false);

  useEffect(() => {
    if (routingControl) {
      routingControl.setWaypoints(routeWaypoints);
    }
  }, [routeWaypoints, routingControl, isRoutingPaused]);

  const defaultIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: '/images/marker-add.png', 
      iconRetinaUrl: '/images/marker-add.png',
      shadowUrl: '/images/marker-shadow.png',
      iconSize: [25, 35], 
      iconAnchor: [12, 35],
      popupAnchor: [-3, -36], 
      shadowSize: [20, 20] 
    });
  }, []);  

  const customFreeIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: '/images/marker-free.png', 
      iconRetinaUrl: '/images/marker-free.png',
      shadowUrl: '/images/marker-shadow.png',
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
      iconSize: [25, 35], 
      iconAnchor: [12, 35],
      popupAnchor: [-3, -36], 
      shadowSize: [41, 41] 
    });
  }, []); 

  const customIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: '/images/marker.png', 
      iconRetinaUrl: '/images/marker.png',
      shadowUrl: '/images/marker-shadow.png',
      iconSize: [25, 35], 
      iconAnchor: [12, 35],
      popupAnchor: [-3, -36], 
      shadowSize: [41, 41] 
    });
  }, []); 

  const customFreePurpleIcon = useMemo(() => {
    return new L.Icon({
      iconUrl: '/images/marker-free-purple.png', 
      iconRetinaUrl: '/images/marker-free-purple.png',
      shadowUrl: '/images/marker-shadow.png',
      iconSize: [25, 35], 
      iconAnchor: [12, 35],
      popupAnchor: [-3, -36], 
      shadowSize: [41, 41] 
    });
  }, []); 

  useEffect(() => {
    if (!isAddingMarker && newMarker ) {
      newMarker.remove(); 
      setNewMarker(null); 
    }
  }, [isAddingMarker, newMarker, map]);

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

  const fetchLocation = () => {
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = [position.coords.latitude, position.coords.longitude];
        setUserPosition(newPosition);
        if (map) {
          map.setView(newPosition, 13);
        }
        setLoading(false);
      },
      (error) => {
        console.error(error);
        const defaultPosition = [defaultLat, defaultLng];
        setUserPosition(defaultPosition);
        if (map) {
          map.setView(defaultPosition, 13); 
        }
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(()  => {
    let newMap = null;

    if (map || !mapRef.current) return;
    if (typeof window !== "undefined" && mapRef.current && !map) {

      const newMap = L.map(mapRef.current).setView(userPosition || [defaultLat, defaultLng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap);
  
      const newRoutingControl = (L as any).Routing.control({
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

  const updateRoute = useCallback((place) => {
    if (isRoutingMode && !isRoutingPaused) {
      setRouteWaypoints(prev => [...prev, L.latLng(place.coordinates.lat, place.coordinates.lng)]);
      if (onRouteCalculated) {
        onRouteCalculated([...routeWaypoints, L.latLng(place.coordinates.lat, place.coordinates.lng)]);
      }
    } else if (!isRoutingMode)  {
      onMarkerClick(place);
    }
  }, [isRoutingMode, onRouteCalculated, routeWaypoints, onMarkerClick, isRoutingPaused]);

  // dragged
  const isMarkerInImageArea = useCallback((marker) => {
    const imageElem = document.querySelector('.marker-bowl-image');
    const imageRect = imageElem.getBoundingClientRect();
    // console.log(imageRect);
  
    const markerPos = map.latLngToContainerPoint(marker.getLatLng());
    // console.log(markerPos);
  
    return (
      markerPos.x >= imageRect.left -200 &&
      markerPos.x <= imageRect.right + 200 &&
      markerPos.y >= imageRect.top -200 &&
      markerPos.y <= imageRect.bottom +200
    );
  },[map]);

  const setDraggedPlace = useDragPlacesStore(state => (state as any).setDraggedPlace);

  const handleDragEnd = useCallback((originalPlace, tempMarker, originalMarker) => {
    const newCoordinates = tempMarker.getLatLng();

    if (isMarkerInImageArea(tempMarker)) {
      onAddToPublish({ ...originalPlace, coordinates: newCoordinates });
    }

    tempMarker.remove();

    setDraggedPlace(null);
  }, [onAddToPublish, setDraggedPlace, isMarkerInImageArea]);

  const handleDragStart = useCallback((place, originalMarker) => {
    const tempMarker = L.marker(place.coordinates, {
      icon: customFreeIcon,
      draggable: true,
    }).addTo(map);

    tempMarker.on('dragend', () => handleDragEnd(place, tempMarker, originalMarker));
  }, [map, customFreeIcon, handleDragEnd]);

  useEffect(() => {

    if (isPublishing && !isTyping) {
      markers.forEach(marker => {
        const isPublished = publishedPlaces.some(place => place.id === marker.options.id);
        marker.setIcon(isPublished ? customGoogleIcon : defaultIcon);
      });
    }
  }, [publishedPlaces, markers, defaultIcon, customGoogleIcon, isPublishing, isTyping]);

  useEffect(() => {
    if (!map || !places) return;

    // markers.forEach(marker => {
    //   marker.remove();
    // });

    const newMarkers = places.map(place => {
      if (!place.coordinates) return null;

      const categoryText = getCategoryText(place.category, i18n.language) || t('unknown');
      // const category = categoryMapping[place.category] || { color: 'bg-gray-200', text: 'unknown' }; 

      const latestImages = place?.images?.slice(-2);
      const imageElements = latestImages?.map(image => 
        `<div style="margin: 5px;">
            <img src=${image} alt="${place.name}" style="max-width:100%; max-height:100px;" />
          </div>`
      ).join('') || '';

      //   navigator.clipboard.writeText(coordinates)

      const popupElement = document.createElement('div');
      popupElement.innerHTML =`
      <div key=${place.id} class="text-center z-20" style="width:150px">
        <b class="text-lg">${place.name}</b>
        <p>${place.description}</p>
        ${imageElements}

        <div class="mt-3 mb-3 text-sm text-gray-500 ${categoryMapping[place.category]?.color || 'bg-gray-200'} p-1 rounded">
          ${categoryText}
        </div>

        <div class="flex flex-wrap gap-2" >
          ${
            place.tags && Array.isArray(place.tags) 
            ? place.tags.filter(tag => tag.trim().length > 0).map(tag => `<span class="text-xs bg-blue-200 px-2 py-1 rounded-full">${tag}</span>`).join(' ')
            : ''
          }
        </div>
        ${!isPublishing && showInteract ? `
          <div class="flex items-center justify-center mt-2 ">
            <div class="like-section flex items-center justify-center mr-2">
              ${allowLikes ? `<button class="like-button" data-place-id="${place.id}">

              
                <i class="fas fa-heart text-lg text-red-300 hover:text-red-500"></i>
                <span class="like-count ml-2"> ${place.likes}</span>
              </button>` : ''}
 
            </div>
            <div class="duplicate-section flex items-center justify-center">
              ${allowDuplicate ? `<button class="duplicate-button mr-2" data-place-id="${place.id}">
                <i class="fas fa-copy text-lg text-gray-600 hover:text-green-500"></i>
                <span class="duplicate-count">${place.duplicates}</span>
              </button>` : ''}
            </div>
          </div>` : ''
        }
        <div class="coordinates-container p-2">
          <span id="coords-${place.id}">${formatCoordinates(place.coordinates.lat, place.coordinates.lng)}</span>
        </div>
        ${isPublishing ?
        `<button id="add-to-publish-${place.id}" class="mt-2 bg-green-500 text-wh
        ite py-2 px-3 rounded hover:bg-green-600 focus:outline-none  text-white">
          ➕ Add
        </button>` : ''
        }
        </div>`

        if (isPublishing) {
          const addToPublishButton = popupElement.querySelector(`#add-to-publish-${place.id}`);
          addToPublishButton.addEventListener('click', () => {
            onAddToPublish(place);
          });
        }

      const markerElement = L.marker(place.coordinates, {
        // @ts-ignore
              id: place.id,
              draggable: false
      }).addTo(map)
        .bindPopup(popupElement)

      markerElement.on('click', () => onMarkerClick(place));
      markerElement.on('click', () => updateRoute(place));

      if (isDragModeEnabled) {
        markerElement.on('mouseup', () => handleDragStart(place, markerElement));
      }
      return markerElement;
    })
    // }).filter(marker => marker !== null);
    
    // setMarkers(newMarkers); 

    setMarkers(prevMarkers => {
      prevMarkers.forEach(marker => {
        if (!newMarkers.includes(marker) && !freeModeMarkers.includes(marker)) {
          marker.remove();
        }
      });
    // return () => {
    //   newMarkers.forEach(marker => marker.remove()); 
    // };
      return newMarkers;
    });
    
  }, [map, places, allowDuplicate, allowLikes, freeModeMarkers, isPublishing, onMarkerClick, onAddToPublish, showInteract, updateRoute, handleDragStart, isDragModeEnabled]);


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
      
      map.on('geosearch/showlocation', (event) => {
        const marker = event.marker;
        const locationName = event.location.label; 
    
        const popupContent = `
          <div class="text-center">
            <h5 class="font-bold">${locationName}</h5> 
            <p>${marker.getLatLng().lng.toFixed(5)}, ${marker.getLatLng().lat.toFixed(5)}</p>

            <a href=${`https://www.google.com/maps/place/${decimalToDms(marker.getLatLng().lat, marker.getLatLng().lng)}`} target="_blank" passHref>
              <button className="bg-blue-100 text-black p-2 rounded hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                Google Map
              </button>
            </a>
            <button id="delete-marker-btn" class="mt-2 bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 focus:outline-none">刪除 Delete </button>
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

      const isMobile = window.innerWidth <= 768;
      const miniMap = new (L as any).Control.MiniMap(
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'), 
        {
          toggleDisplay: true,
          minimized: isMobile,
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

  useEffect(() => {
    if (map && googlePlace ) {
      const { lat, lng, name, description } = googlePlace.coordinates;
      const categoryText = getCategoryText(googlePlace.category, i18n.language) || t('unknown');

      const tempMarker = L.marker([googlePlace.coordinates.lat, googlePlace.coordinates.lng], {
        icon: customGoogleIcon,
      }).addTo(map);
  
      const popupContent = `
        <div class="text-center z-20" style="width:150px">
          <b class="text-lg">${googlePlace.name}</b>
          <p>${googlePlace.description == undefined ? '' : googlePlace.description }</p>

          <div class="mt-3 mb-3 text-sm text-gray-500 ${categoryMapping[googlePlace.category]?.color || 'bg-gray-200'} p-1 rounded">
            ${categoryText}
          </div>

          <div class="coordinates-container p-2">
            <span>${formatCoordinates(googlePlace.coordinates.lat, googlePlace.coordinates.lng)}</span>
          </div>
          <button id="delete-temp-marker-btn" class="mt-2 bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 focus:outline-none">Delete</button>
        </div>
      `;

      tempMarker.on('popupopen', () => {
        const deleteButton = document.getElementById('delete-temp-marker-btn');
        if (deleteButton) {
          deleteButton.onclick = () => {
            tempMarker.remove();
            clearGooglePlace();
          };
        }
      });

      // tempMarker.bindPopup(popupContent).openPopup();
      tempMarker.bindPopup(popupContent).openPopup();
      map.setView([lat, lng]);
      
      return () => {
        tempMarker.remove();
      };
    }
  }, [map, googlePlace, customGoogleIcon, clearGooglePlace]);

  // kmz marker
  useEffect(() => {
    if (map && kmzPlace ) {
      const { lat, lng, name, description } = kmzPlace.coordinates;
      const categoryText = getCategoryText(kmzPlace.category, i18n.language) || t('unknown');

      const tempMarker = L.marker([kmzPlace.coordinates.lat, kmzPlace.coordinates.lng], {
        icon: customGoogleIcon,
      }).addTo(map);
  
      const popupContent = `
        <div class="text-center z-20" style="width:150px">
          <b class="text-lg">${kmzPlace.name}</b>
          <p>${kmzPlace.description == undefined ? '' : kmzPlace.description }</p>

          <div class="mt-3 mb-3 text-sm text-gray-500 ${categoryMapping[kmzPlace.category]?.color || 'bg-gray-200'} p-1 rounded">
            ${categoryText}
          </div>
          <div> 
          ${
            kmzPlace.tags && Array.isArray(kmzPlace.tags) 
            ? kmzPlace.tags.filter(tag => tag.trim().length > 0).map(tag => `<span class="text-xs bg-blue-200 px-2 py-1 rounded-full">${tag}</span>`).join(' ')
            : ''
          }
          </div>
          <div class="coordinates-container p-2">
            <span>${formatCoordinates(kmzPlace.coordinates.lat, kmzPlace.coordinates.lng)}</span>
          </div>
        </div>
      `;


      tempMarker.on('popupopen', () => {
        const deleteButton = document.getElementById('delete-temp-marker-btn');
        if (deleteButton) {
          deleteButton.onclick = () => {
            tempMarker.remove();
            clearKmzPlace();
          };
        }
      });

      // tempMarker.bindPopup(popupContent).openPopup();
      tempMarker.bindPopup(popupContent).openPopup();
      map.setView([lat, lng]);


      // setTimeout(() => {
      //   const deleteButton = document.getElementById('delete-marker-btn');
      //   if (deleteButton) {
      //     deleteButton.addEventListener('click', () => {
      //       tempMarker.remove();
      //     });
      //   }
      // }, 0);

      // setGoogleMarkers(prevMarkers => [...prevMarkers, tempMarker]);
      
      return () => {
        tempMarker.remove();
      };
    }
  }, [map, kmzPlace, customGoogleIcon, clearKmzPlace]);


  // const [placesUpdated, setPlacesUpdated] = useState(false);

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
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if (newMarker) {
          newMarker.dragging.disable(); 
        }
      } else {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();

        if (newMarker) {
          newMarker.dragging.enable(); 
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


  const removeMarker = useCallback((marker) => {
    marker.remove();
    setFreeModeMarkers(prev => {
      const updatedMarkers = prev.filter(m => m !== marker);
      if (!isRoutingPaused) {
        updateFreeModeRoute(updatedMarkers); 
      }
      return updatedMarkers;
    });
  }, [updateFreeModeRoute, isRoutingPaused]);

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

   
     // newMarker._leaflet_id = L.Util.stamp(newMarker);

      const popupContent = `
      <p>${event.latlng.lng.toFixed(5)}, ${event.latlng.lat.toFixed(5)}</p>
      <button class="delete-marker-btn">Delete</button>
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

        updateFreeModeRoute(updatedMarkers);

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
        onMapClick(); 
      }

      if (isAddingMarker && !isFreeMode) {
        if (newMarker) {
          newMarker.setLatLng(e.latlng); 
        } else {
          const marker = L.marker(e.latlng, {
            icon: L.icon({
              // iconUrl: require('leaflet/dist/images/marker-icon.png'),
              // shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
              iconRetinaUrl: 'images/marker-icon-2x.png',
              iconUrl: 'images/marker-icon.png',
              shadowUrl: 'images/marker-shadow.png',
              iconSize: [25, 41], 
              iconAnchor: [12, 41], 
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
    if (map && selectedPlace && !isTyping) {
      // map.setView(new L.LatLng(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng), 13);
      const relevantMarker = markers.find(marker => marker.options.id === selectedPlace.id);

      if (relevantMarker) {
        map.setView([selectedPlace.coordinates.lat, selectedPlace.coordinates.lng]);
        relevantMarker.openPopup();
      }
    }
  }, [map, selectedPlace, markers, isTyping]);

  // useEffect(() => {
  //   if(isLoading) {
  //     showLoadingAlert('Loading');
  //   }
  // }, [isLoading]); 

  // routing machine
  const confirmEraseRouting = () => {

    if (isFreeMode) {
      freeModeMarkers.forEach(marker => marker.remove());  
      setFreeModeMarkers([]); 
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
      setFreeModeMarkers([]);
    } 
  };

  useEffect(() => {
    if (!isRoutingMode) {
      if (routingControl) {
        routingControl.setWaypoints([]);
      }
      if (onRouteCalculated) {
        onRouteCalculated([]);
      }
      setRouteWaypoints([]);
  
      if (startMarker) {
        startMarker.remove();
        setStartMarker(null);
      }
      if (endMarker) {
        endMarker.remove();
        setEndMarker(null);
      }
      setIsRoutingPaused(false);
    }
  }, [isRoutingMode, routingControl, startMarker, endMarker, onRouteCalculated]);

  const clearMarkersAndRoute = useCallback(() => {
    freeModeMarkers.forEach(marker => marker.remove());
    setFreeModeMarkers([]);
    if (routingControl) {
      routingControl.setWaypoints([]);
    }
  }, [freeModeMarkers, routingControl]);


// const toggleMode = () => {
  // setIsRoutingMode(prev => !prev);
  // setIsFreeMode(prev => !prev);
  // clearMarkersAndRoute();
// };

  // useEffect(() => {
  //   if (!isFreeMode && !isRoutingMode) {
  //     clearMarkersAndRoute();
  //   }
  // }, [isFreeMode, isRoutingMode, clearMarkersAndRoute]);

  return (
    <div className="relative w-full h-[350px] md:h-full text-black">
      {isLoading && 
      <AlertModal
        isOpen={isLoading}
        message= "Loading..."
        isALoadingAlert={true}
      />
      }
      <div ref={mapRef} className="z-10 h-full w-full flex-1" />
        <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <LazyLoadImage effect="blur" src="/images/marker-star.png" alt="Marker" 
                  width="60" height="100" />
        </div>
        <button
          title="location-fetch" 
          className="absolute left-0 bottom-0 z-10 m-3 border-b bg-white text-black py-2 px-2 rounded hover:bg-green-300 shadow"
          onClick={handleFetchLocationClick}
        >

          <i className='fa fa-location'></i>
          <div className="text-sm hidden md:block"> {t('open-map-position')} </div>
          {/* <LazyLoadImage effect="blur" src="/images/map-cursor.png" alt="Fetch-Location" className="h-7 w-7" width="30" height="30" /> */}
        </button>
        { (isRoutingMode || isFreeMode) && (
          <div className="">
            <button 
              title="stop-routing"
              className="flex-column absolute top-16 left-0 z-10 m-3 border-b bg-white text-black py-2 px-2.5 rounded hover:bg-green-300 shadow"
              onClick={pauseRouting}>
                {isRoutingPaused ? <i className="fas fa-play"></i> : <i className="fas fa-pause"></i> }
                <div className="text-sm hidden lg:block">{isRoutingPaused ? t('route-continue') : t('route-pause')}</div>
            </button>
            <button 
              title="stop-routing"
              className="flex-column absolute md:top-32 top-28 left-0 z-10 m-3 border-b bg-white text-black py-2 px-2 rounded hover:bg-green-300 shadow"
              onClick={()=>setShowDeleteConfirm(true)}>
                <i className="fas fa-trash"></i>
                <div className="hidden lg:block text-sm">{t('route-erase')}</div>
            </button>
            {/* <button
              title="toggle-mode"
              className="flex-column absolute bottom-16 left-0 z-10 m-3 border-b bg-white text-black py-2 px-2 rounded hover:bg-green-300 shadow"
              onClick={toggleMode}
            >
              <i className={`fas ${isRoutingMode ? 'fa-fire' : 'fa-road'}`}></i>
              <div className="text-sm hidden md:block">{isRoutingMode ? '自由模式' : '路線模式'}</div>
            </button> */}
          </div>
        )}
        { isDragModeEnabled && (
          <Image src="/images/marker-bowl.png" alt="star-bowl" width={70} height={70}
                className="marker-bowl-image absolute bottom-1/3 right-0 z-10" />
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
          message={t('route-alert-erase')}
          showConfirmButton={true}
        />
    </div>
  );
};
export default MapComponent;