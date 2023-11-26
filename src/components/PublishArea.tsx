// components/PublishArea.tsx
import React from 'react';
import { useDrop } from 'react-dnd';
import { Place } from '../types/Place';

const PublishArea = ({ publishedPlaces, onAddToPublish, onRemoveFromPublish }) => {
  const [, drop] = useDrop({
    accept: 'place',
    drop: (item: Place, monitor) => {
      const didDropInside = monitor.didDrop() && monitor.getDropResult();
      if (didDropInside) {
        if (!publishedPlaces.some(p => p.id === item.id)) {
          onAddToPublish && onAddToPublish(item);
        }
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  // 其他代碼

    
    return (
      <div ref={drop} className="mt-5 p-2 border border-gray-300 rounded">
        <h3 className="mb-3 text-xl font-semibold text-gray-700">發佈區</h3>
        <ul>
          {publishedPlaces.map(place => (
            <li key={place.id} className="flex justify-between items-center p-2 border border-gray-300 rounded m-2">
              <span className="text-gray-600"> {place.name}</span>
              <button 
                onClick={() => onRemoveFromPublish(place.id)}
                className="ml-2 bg-red-500 text-white p-2 pl-4 pr-4 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                -
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
};

  export default PublishArea;