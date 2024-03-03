import useKmzPlacesStore from '../store/kmzPlacesStore';
import { useTranslation } from 'next-i18next';
// import { Place } from '../types';

const KmzPlacesList = ({ places = '',  onPlaceClick = (e)=>{} }) => {
  const { t } = useTranslation('common'); 

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
        <p className="bg-green-100 p-1 shadow-md w-48"> {t('kmz-hint')}</p>
        <ul className="mt-4">
          {(places as any).map((place, index) => (
            <li key={index} className="mt-2 border-b border-gray-200 pb-2 " onClick={() => onPlaceClick(place)}>
              <h3 className="font-semibold text-gray-800">{place.name}</h3>
              <p className="text-gray-600">{place.description}</p>
              <p className="text-sm text-gray-500">{t('kmz-tag')}{place.tags.join(', ')}</p>
              <p className="text-sm text-gray-500">{t('kmz-coordinates')}{place.coordinates.lat}, {place.coordinates.lng}</p>
              <div className="flex justify-start space-x-3">
                <div key={index} className="mt-2 text-center cursor-pointer bg-green-400 w-36 text-amber-900 transition-all p-2 rounded-full 
                                          hover:bg-white hover:text-green-500 border-2 border:green-500" 
                    onClick={() => handlePlaceClick(place)}>
                    {t('kmz-show-on-map')}
                </div>
                <div key={index} className="mt-2 text-center cursor-pointer bg-red-400 w-36 text-white p-2 rounded-full transition-all hover:bg-white 
                              hover:text-red-500 border-2 border:red-500" 
                    onClick={() => handlePlaceCancelClick()}>
                    {t('kmz-cancel-show-on-map')}
                </div>
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
