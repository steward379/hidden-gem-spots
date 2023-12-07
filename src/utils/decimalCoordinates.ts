export const decimalToDms = (decimalLat: number, decimalLng: number): string => {

    // 緯度轉換
    const degreesLat = parseInt(decimalLat.toString());
    const minutesLat = parseInt(((decimalLat - degreesLat) * 60).toString());
    const secondsLat = (((decimalLat - degreesLat) * 3600) % 60).toFixed(1);

    // 經度轉換
    const degreesLng = parseInt(decimalLng.toString());
    const minutesLng = parseInt(((decimalLng - degreesLng) * 60).toString());
    const secondsLng = (((decimalLng - degreesLng) * 3600) % 60).toFixed(1);

    // 組合成度分秒格式
    const latDirection = decimalLat >= 0 ? "N" : "S";
    const lngDirection = decimalLng >= 0 ? "E" : "W";

    return `${Math.abs(degreesLat)}°${Math.abs(minutesLat)}'${secondsLat}"${latDirection}+${Math.abs(degreesLng)}°${Math.abs(minutesLng)}'${secondsLng}"${lngDirection}`;
};

export const formatCoordinates = (lat, lng) => {
    const latText = Math.round(lat * 10000) / 10000;
    const lngText = Math.round(lng * 10000) / 10000;
  
    // const latText = roundedLat >= 0 ? `${roundedLat} N` : `${Math.abs(roundedLat)} S`;
    // const lngText = roundedLng >= 0 ? `${roundedLng} E` : `${Math.abs(roundedLng)} W`;
  
    return `${latText}, ${lngText}`;
};


// export default decimalToDms;