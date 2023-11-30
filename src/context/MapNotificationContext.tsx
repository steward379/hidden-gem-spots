// src/context/MapNotificationContext.js
import React, { createContext, useContext, useState } from 'react';

const MapNotificationContext = createContext({
    notifications: [], // 空通知列表作為預設值
    addNotification: (notification) => {}// 空函數作為預設值
});

export const useMapNotification = () => useContext(MapNotificationContext);

export const MapNotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (notification) => {
        setNotifications([...notifications, notification]);
    };

    console.log("共享 notifications", notifications)

    return (
        <MapNotificationContext.Provider value={{ notifications, addNotification }}>
            {children}
        </MapNotificationContext.Provider>
    );
};