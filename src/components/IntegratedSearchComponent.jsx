// Integrated Search Component for Map Detail Page
import React, { useState, useEffect } from "react";
import { useTranslation } from 'next-i18next';

const IntegratedSearchComponent = ({
  mapData,
  handleMarkerClick,
  handlePlaceLikeClick,
  user,
  categoryMapping,
  getCategoryText
}) => {
  const { t, i18n } = useTranslation('common');
  
  const [searchMode, setSearchMode] = useState("none"); // "none", "all", "liked"
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [likedCurrentPage, setLikedCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const pagesPerGroup = 5;
  
  const [likedPlaces, setLikedPlaces] = useState([]);
  
  // Handle toggling search modes
  const toggleSearchMode = (mode) => {
    if (searchMode === mode) {
      setSearchMode("none");
      setSearchPanelOpen(false);
    } else {
      setSearchMode(mode);
      setSearchPanelOpen(true);
    }
  };
  
  // Reset search when closing panel
  useEffect(() => {
    if (!searchPanelOpen) {
      setSearchTerm("");
      setSelectedCategory("");
    }
  }, [searchPanelOpen]);
  
  // Get liked places from map data
  useEffect(() => {
    if (!user || !mapData) return;

    const likedPlacesArray = mapData.publishedPlaces.filter(
      (place) => place.likedBy && place.likedBy.includes(user.uid)
    );

    setLikedPlaces(likedPlacesArray);
  }, [mapData, user]);
  
  // Filter places based on search terms and category
  const filteredPlaces = mapData?.publishedPlaces.filter(
    (place) =>
      (place.name
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase()) ||
        place.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )) &&
      (place.category === selectedCategory || selectedCategory === "")
  );

  const filteredLikesPlaces = likedPlaces?.filter(
    (place) =>
      (place.name
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase()) ||
        place.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )) &&
      (place.category === selectedCategory || selectedCategory === "")
  );

  // Pagination calculations
  const totalPageCount = Math.ceil(filteredPlaces?.length / itemsPerPage);
  const totalLikedPageCount = Math.ceil(filteredLikesPlaces?.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPlaces = filteredPlaces?.slice(startIndex, endIndex);

  const likedStartIndex = (likedCurrentPage - 1) * itemsPerPage;
  const likedEndIndex = likedStartIndex + itemsPerPage;
  const currentLikedPlaces = filteredLikesPlaces?.slice(likedStartIndex, likedEndIndex);
  
  // Render pagination controls
  const renderPagination = (currentPage, setPage, totalCount) => {
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const totalGroups = Math.ceil(totalPages / pagesPerGroup);
    const currentGroupIndex = Math.floor((currentPage - 1) / pagesPerGroup);

    let startPage = currentGroupIndex * pagesPerGroup + 1;
    let endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);
    
    return (
      <div className="flex justify-center items-center gap-2 mt-4">
        {currentGroupIndex > 0 && (
          <button onClick={() => setPage((currentGroupIndex - 1) * pagesPerGroup + 1)} className="pagination-prev mx-1 px-3 py-1 rounded-lg bg-sky-300 text-black">
            {t('<-')}
          </button>
        )}
        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(pageIndex => (
          <button key={pageIndex} onClick={() => setPage(pageIndex)} className={`mx-1 px-3 py-1 rounded-lg ${currentPage === pageIndex ? 'bg-sky-500 text-white' : 'bg-white text-black'}`}>
            {pageIndex}
          </button>
        ))}
        {currentGroupIndex < totalGroups - 1 && (
          <button onClick={() => setPage((currentGroupIndex + 1) * pagesPerGroup + 1)} className="pagination-next mx-1 px-3 py-1 rounded-lg bg-sky-300 text-black">
            {t('->')}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="search-component">
      {/* Search Controls */}
      <div className="flex items-center space-x-4">
        <button
          className={`flex items-center justify-center p-2 rounded-full transition-colors duration-300 ${searchMode === "all" ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => toggleSearchMode("all")}
          title={t('map-search-list')}
        >
          <i className="fas fa-search"></i>
          {/* <span className="ml-2 hidden lg:inline">{t('map-search-list')}</span> */}
        </button>
        
        <button
          className={`flex items-center justify-center p-2 rounded-full transition-colors duration-300 ${searchMode === "liked" ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => toggleSearchMode("liked")}
          title={t('map-liked-search-list')}
        >
          <i className="fas fa-heart"></i>
          <i className="fas fa-search"></i>
          {/* <span className="ml-2 hidden lg:inline">{t('map-liked-search-list')}</span> */}
        </button>
      </div>
      
      {/* Search Panel - Slides down when active */}
      <div 
        className={`search-panel overflow-hidden transition-all duration-300 ease-in-out ${
          searchPanelOpen ? 'max-h-screen opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-300">
          {/* Search Inputs */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('map-search-name-tag')}
                className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <select 
                title="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 w-full border border-gray-300 rounded-md text-black focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('map-search-cat')}</option>
                {Object.entries(categoryMapping).map(
                  ([key]) => (
                    <option key={key} value={key}>
                      {getCategoryText(key, i18n.language)}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
          
          {/* Results Section */}
          <div className="search-results">
            <h2 className="text-lg font-semibold mb-2">
              {searchMode === "all" ? t('map-search-list') : t('map-liked-search-list')}
            </h2>
            
            {/* Display filtered results */}
            {searchMode === "all" && (
              <>
                {currentPlaces && currentPlaces.length > 0 ? (
                  <>
                    {currentPlaces.map((place) => (
                      <div
                        key={place.id}
                        className="hover:bg-green-100 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer"
                        onClick={() => handleMarkerClick(place)}
                      >
                        <span className="truncate flex-1">{place.name}</span>
                        {user && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlaceLikeClick(place.id);
                            }}
                            className="ml-2 focus:outline-none"
                          >
                            {place.isLiked ? (
                              <i className="fa-solid fa-heart text-red-500"></i>
                            ) : (
                              <i className="fa-regular fa-heart"></i>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                    {renderPagination(currentPage, setCurrentPage, filteredPlaces.length)}
                  </>
                ) : (
                  <p className="text-center py-4">{t('map-search-not-found')}</p>
                )}
              </>
            )}
            
            {searchMode === "liked" && (
              <>
                {currentLikedPlaces && currentLikedPlaces.length > 0 ? (
                  <>
                    {currentLikedPlaces.map((place) => (
                      <div
                        key={place.id}
                        className="hover:bg-red-100 place-item flex justify-between items-center p-2 border border-gray-300 rounded m-2 cursor-pointer"
                        onClick={() => handleMarkerClick(place)}
                      >
                        <span className="truncate">{place.name}</span>
                      </div>
                    ))}
                    {renderPagination(likedCurrentPage, setLikedCurrentPage, filteredLikesPlaces.length)}
                  </>
                ) : (
                  <p className="text-center py-4">{t('map-liked-no-spots')}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedSearchComponent;