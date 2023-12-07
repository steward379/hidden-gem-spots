import useKmzPlacesStore from '../store/kmzPlacesStore';

const KmzPlacesList = ({ places = '',  onPlaceClick = (e)=>{} }) => {

    const { setKmzPlace } = useKmzPlacesStore();

    const handlePlaceClick = (place) => {
      setKmzPlace(place);
      onPlaceClick(place);
    };

    const handlePlaceCancelClick = () => {
      setKmzPlace('');
      onPlaceClick('');
    };

    return (
      <>
      {places && (
      <div className="shadow-lg p-3 rounded-xl">
        <p className="bg-green-100 p-1 shadow-md w-48"> 可收起或重新整理較為方便編輯</p>
        <ul className="mt-4">
          {(places as any).map((place, index) => (
            <li key={index} className="mt-2 border-b border-gray-200 pb-2 " onClick={() => onPlaceClick(place)}>
              <h3 className="font-semibold text-gray-800">{place.name}</h3>
              <p className="text-gray-600">{place.description}</p>
              <p className="text-sm text-gray-500">標籤：{place.tags.join(', ')}</p>
              <p className="text-sm text-gray-500">坐標：{place.coordinates.lat}, {place.coordinates.lng}</p>
              <div key={index} className="mt-2 text-center cursor-pointer bg-blue-500 w-36 text-white p-2 rounded-full hover:bg-white hover:text-blue-500 border-blue-500 border-2" onClick={() => handlePlaceClick(place)}>
                在地圖上顯示
              </div>
              <div className="mt-2 text-center cursor-pointer bg-red-400 w-36 text-white p-2 rounded-full hover:bg-white hover:text-blue-500 border-2" 
                  onClick={() => handlePlaceCancelClick()}>
                        取消地圖彈出
                </div>
            </li>
          ))}
      </ul>
    </div>
      )}
      </>
  );
};
export default KmzPlacesList;
