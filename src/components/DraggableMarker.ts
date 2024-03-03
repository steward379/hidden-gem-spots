import { useEffect } from 'react';
import { useDrag } from 'react-dnd';
import L from 'leaflet';

const DraggableMarker = ({ place, map }) => {
  const [, drag] = useDrag(() => ({
    type: 'place',
    item: { id: place.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  useEffect(() => {
    const marker = L.marker(place.coordinates).addTo(map);
    
    drag(marker.getElement());

    return () => {
      marker.remove();
    };
  }, [map, place, drag]);

  return null; 
};

export default DraggableMarker;