// src/utils/bikeStationService.js
const stationInfoUrl = "https://guadalajara.publicbikesystem.net/customer/ube/gbfs/v1/en/station_information";
const stationStatusUrl = "https://guadalajara.publicbikesystem.net/customer/ube/gbfs/v1/en/station_status";

export const fetchBikeStations = async () => {
    try {
        const [infoRes, statusRes] = await Promise.all([
            fetch(stationInfoUrl).then(res => res.json()),
            fetch(stationStatusUrl).then(res => res.json())
        ]);

        const stationsInfo = infoRes.data.stations;
        const stationsStatus = statusRes.data.stations;

        const mergedStations = stationsInfo.map(station => ({
            ...station,
            ...(stationsStatus.find(s => s.station_id === station.station_id) || {})
        }));

        return mergedStations;
    } catch (error) {
        console.error("Error fetching bike stations:", error);
        return null;
    }
};