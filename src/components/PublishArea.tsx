// components/PublishArea.tsx
import React from 'react';
import { useDrop } from 'react-dnd';
import { Place } from '../types/Place';

const PublishArea = ({ publishedPlaces, onAddToPublish, onRemoveFromPublish }) => {
    
    const [, drop] = useDrop({
      accept: 'place',
      drop: (item: Place, monitor) => {
        if (!monitor.didDrop() && !publishedPlaces.some(p => p.id === item.id)) {
          // 只有當拖動的項目在 drop 區域釋放時，才處理添加邏輯
          onAddToPublish(item);
        }
      },
      collect: monitor => ({
        isOver: !!monitor.isOver(),
      }),
    });

    
    return (
        <div ref={drop} className="text-black" style={{ minHeight: '50px', width: '100%', backgroundColor: '#eeeeee' }}>
            <h3 className="mb-3 text-xl">發佈區</h3>
            <ul>
            {publishedPlaces.map(place => (
                <li className="flex justify-between" key={place.id}>
                  <span> {place.name}</span>
                  <button onClick={() => onRemoveFromPublish(place.id)}>移除</button>
                </li>
            ))}
            </ul>
        </div>
    );
};

  export default PublishArea;