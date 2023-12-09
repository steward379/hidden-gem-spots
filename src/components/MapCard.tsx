import React from 'react';
import Link from 'next/link';
import { formatDate } from '../helpers/formDate';

const MapCard = ({ map, userId, isCurrentUser = false }) => {
    const dynamicBackground = (imageUrl) => ({
        backgroundImage: `url('${imageUrl}')`
    });

    return (
        <div 
            className="skew-card bg-cover bg-center hover:bg-yellow-500 transition duration-300 ease-in-out rounded-3xl bg-purple-400 h-72" 
            style={dynamicBackground(map.coverImage)}
        >
            <div className="relative p-4 w-full h-full bg-gradient-to-t from-transparent to-blue-600 opacity-100 rounded-3xl hover:bg-yellow-400 hover:bg-opacity-50">
                {/* {isCurrentUser && (
                <button title="delete-map" className="absolute right-0 top-0 delete-button w-20 h-20 rounded-full backdrop-blur-sm" 
                        onClick={(e) => handleDeleteMap(e, map.id)}>
                    <i className="scale-2 fas fa-times text-xl text-white"></i> 
                </button>
                )} */}
                <Link href={`/publishedMaps/${userId}/maps/${map.id}`}>
                    <h2 className="text-2xl font-semibold text-amber-400 cursor-pointer">{map.title}</h2>
                    <p className="text-gray-600 text-sm">by {map.authorName}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(map.tags || []).map((tag, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    <p className=" text-amber-200 font-bold">{formatDate(map.publishDate)}</p>
                    <div className="h-full w-full"></div>
                </Link>
            </div>
        </div>
    );
};

export default MapCard;

