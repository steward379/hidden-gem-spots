// src/context/MapNotificationContext.js
import React, { createContext, useContext, useState } from 'react';

const MapNotificationContext = createContext({
    notifications: [],
    addNotification: (notification) => {}
});

export const useMapNotification = () => useContext(MapNotificationContext);

export const MapNotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (notification) => {
        setNotifications([...notifications, notification]);
    };

    // console.log("共享 notifications", notifications)

    return (
        <MapNotificationContext.Provider value={{ notifications, addNotification }}>
            {children}
        </MapNotificationContext.Provider>
    );
};