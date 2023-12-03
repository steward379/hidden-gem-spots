import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { categoryMapping } from '@/src/constants';

// zustand
import useGooglePlacesStore from '../store/googlePlacesStore'

const GooglePlaces = ({ latitude, longitude, isFetchingAPI = false, onLatitudeChange=(e)=>{}, onLongitudeChange=(e)=>{}, onSelectPlace = null }) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    // zustand
    const { setGooglePlace } = useGooglePlacesStore();

    useEffect(() => {

        const fetchPlaces = async () => {
          const lat = parseFloat(latitude);
          const lng = parseFloat(longitude);

          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            setError('Invalid latitude or longitude values');
            return;
          }

          try {
            console.log('fetching');
            const response = await fetch(`/api/googlePlaces?latitude=${lat}&longitude=${lng}`);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || 'An error occurred while fetching the data.');
            }
            setData(data);
            setError('');
          } catch (error) {
            setError('Fetching Error: ' + error.message);
          }
        };
        if (isFetchingAPI && latitude && longitude) {
          fetchPlaces();
        }

    }, [latitude, longitude, isFetchingAPI]);

    const mapGooglePlaceToPlace = (googlePlace) => {
      // 尋找第一個匹配的類別
      const foundCategory = googlePlace.types.find(type => categoryMapping[type]) || 'others';
    
      // return {
      const googlePlaceMapping = {
        name: googlePlace.name,
        description: googlePlace.vicinity, // 或自定義
        tags: googlePlace.types,
        category: foundCategory,
        coordinates: {
          lat: googlePlace.geometry.location.lat,
          lng: googlePlace.geometry.location.lng
        },
      };

      onSelectPlace(googlePlaceMapping);
      // zustand
      setGooglePlace(googlePlaceMapping);
    };
    
    // useEffect(() => {
    //   if (data && data.results) {
    //       const mappedData = data.results.map(mapGooglePlaceToPlace);
    //       setData({ ...data, results: mappedData });
    //   }
    // }, [data]);

  return (
    <div className="container mx-auto p-4">
      {/* <h1 className="text-2xl font-bold mb-4">Test Google Places API</h1>
      <div className="flex space-x-2 mb-4">
        <input
          className="p-2 border border-gray-300 rounded"
          type="text"
          value={latitude}
          onChange={e => onLatitudeChange(e.target.value)}
          placeholder="Latitude"
        />
        <input
          className="p-2 border border-gray-300 rounded"
          type="text"
          value={longitude}
          onChange={e => onLongitudeChange(e.target.value)}
          placeholder="Longitude"
        />
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={fetchPlaces}>
          Fetch Places
        </button>
      </div> */}

      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {data && data.status === 'ZERO_RESULTS' && <p>No results found</p>}
        {data && data.results.map((place, index) => (
          <div key={index} className="p-4 border border-gray-300 rounded shadow">
            <p><strong>Latitude:</strong> {place.geometry.location.lat}</p>
            <p><strong>Longitude:</strong> {place.geometry.location.lng}</p>
            <img className="w-10 h-10" src={place.icon} alt={place.name} width="100" height="100" />
            <p><strong>地點：</strong> {place.name}</p>
            <p><strong>Vicinity:</strong> {place.vicinity}</p>
            <button 
               onClick={() => mapGooglePlaceToPlace(place)}
              className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-2">
            在本地圖查看位置
            </button>
            <a 
                href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-2">
            前往 Google 地圖
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GooglePlaces;
