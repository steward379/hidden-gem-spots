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
    
    // 附加拖動事件處理程序
    drag(marker.getElement());

    return () => {
      marker.remove();
    };
  }, [map, place, drag]);

  return null; // 因為這是一個邏輯組件，不需要渲染任何 JSX
};
export default DraggableMarker;