// components/PublishArea.tsx
import React from 'react';
import { useDrop } from 'react-dnd';
import { Place } from '../types/Place';

const PublishArea = ({ publishedPlaces, onAddToPublish = undefined, onRemoveFromPublish, onSelectPlace }) => {
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
    
    return (
      <div ref={drop} className="mt-5 p-2 border border-gray-300 rounded">
        <h3 className="mb-3 text-xl font-semibold text-gray-700">發佈區</h3>
        <ul>
          {publishedPlaces.map(place => (
            <li key={place.id} className="cursor-pointer place-item flex justify-between hover:bg-green-100 items-center p-2 border border-gray-300 rounded m-2" 
                 onClick={() => onSelectPlace(place)}>
              <span className="text-gray-600 cursor-pointer" > {place.name}</span>
              <button
                title="move-out-from-publish" 
                onClick={() => onRemoveFromPublish(place.id)}
                className="ml-2 bg-red-400 text-white p-2 pl-4 pr-4 rounded hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                   <i className="fas fa-minus"></i>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
};


export default PublishArea;