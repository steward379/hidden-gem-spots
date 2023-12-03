const decimalToDms = (decimalLat: number, decimalLng: number): string => {
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

export default decimalToDms;