import React from 'react';
import Link from 'next/link';
import { formatDate } from '../helpers/formDate';

const dynamicBackground = (imageUrl) => ({
    backgroundImage: `url('${imageUrl}')`
  });

const MapCard = ({ map, userId }) => {
    return (
        <>
            <div className={`border bg-cover bg-center hover:bg-yellow-500 transition-btn rounded-3xl bg-purple-400 h-[300px]`} style={dynamicBackground(map.coverImage)}> 
                <div className="relative p-4 w-full h-full bg-gradient-to-t from-transparent to-blue-600 opacity-100 rounded-3xl 
                            hover:bg-yellow-400 hover:bg-opacity-50">
                <Link href={`/publishedMaps/${userId}/maps/${map.id}`}>
                    <h2 className="text-2xl font-semibold text-amber-400">{map.title}</h2>
                    <p className="text-amber-200 font-bold">{formatDate(map.publishDate)}</p>
                    <div className="h-full w-full"></div>
                </Link>
                </div>
            </div>
        </>
    );
};

export default MapCard;
