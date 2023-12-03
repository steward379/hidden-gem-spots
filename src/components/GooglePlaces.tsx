import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { categoryMapping } from '@/src/constants';

// zustand
import useGooglePlacesStore from '../store/googlePlacesStore'

const GooglePlaces = ({ latitude, longitude, isFetchingAPI = false, 
  onLatitudeChange=(e)=>{}, onLongitudeChange=(e)=>{}, 
  onSelectPlace = null,
  placeName = '',
}) => {
    const [allData, setAllData] = useState(null); // 存儲 API 返回的完整數據

    const [data, setData] = useState(null);
    const [displayData, setDisplayData] = useState(null); // 存儲當前頁面要顯示的數據

    const [error, setError] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

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
            setAllData(data);
            setError('');
          } catch (error) {
            setError('Fetching Error: ' + error.message);
          }
        };
        if (isFetchingAPI && latitude && longitude) {
          fetchPlaces();
        }

    }, [latitude, longitude, isFetchingAPI]);

    useEffect(() => {
      if (allData && allData.results) {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedData = allData.results.slice(startIndex, startIndex + itemsPerPage);
        setDisplayData({ ...allData, results: paginatedData });
      }
    }, [allData, currentPage, itemsPerPage]);

    const totalPages = allData ? Math.ceil(allData.results.length / itemsPerPage) : 0;

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
        { placeName ? (<div><h3 className="text-lg"> {placeName} 附近有 </h3></div> ): ''}
        {displayData && displayData.status === 'ZERO_RESULTS' && <p>No results found</p>}
        {displayData && displayData.results.map((place, index) => (
          <div key={index} className="p-4 border border-gray-300 rounded shadow space-y-1">
            <p className="text-sm">緯度 {place.geometry.location.lat}, 經度 {place.geometry.location.lng}</p>
            <h4 className="font-bold text-lg">{place.name}</h4>
            <div className="flex space-x-3">            
              <Image className="w-5 h-5" src={place.icon} alt={place.name} width="100" height="100" />
              <p  className="text-sm">{place.vicinity}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => mapGooglePlaceToPlace(place)}
                className=" bg-amber-600 text-white px-4 py-1 rounded hover:bg-green-600 mt-2">
                <div className="flex">
                  <p className="hidden lg:block mr-2">查看位置</p>
                  <p>
                    <i className="fas fa-map-marker-alt"></i>
                  </p>
                </div>
              </button>
              <Link 
                  href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-2">

                <div className="flex space-x-2">
                  <i className="fab fa-google"></i> 
                  <i className="fas fa-map-marker-alt"></i>
                  <i className="fas fa-external-link-alt ml-1"></i>
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="pagination-controls mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`mx-1 px-3 py-1 rounded-3xl ml-2
                          ${currentPage === i + 1 
                            ? 'bg-sky-500 text-white' 
                            : 'bg-white text-black border-gray-300'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
    </div>
  );
};
export default GooglePlaces;