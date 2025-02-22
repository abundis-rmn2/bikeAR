import React, { useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const BikeMap = () => {
    const [map, setMap] = useState(null);
    const [stations, setStations] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [userLocation, setUserLocation] = useState(null);

    const stationInfoUrl = "https://guadalajara.publicbikesystem.net/customer/ube/gbfs/v1/en/station_information";
    const stationStatusUrl = "https://guadalajara.publicbikesystem.net/customer/ube/gbfs/v1/en/station_status";

    useEffect(() => {
        // Intentar obtener la ubicación del usuario
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lon: longitude });
                },
                () => {
                    console.warn("No se pudo obtener la ubicación, usando Guadalajara.");
                    setUserLocation({ lat: 20.67, lon: -103.35 }); // Fallback a Guadalajara
                }
            );
        } else {
            console.warn("Geolocalización no soportada, usando Guadalajara.");
            setUserLocation({ lat: 20.67, lon: -103.35 }); // Fallback
        }
    }, []);

    useEffect(() => {
        if (!userLocation) return;

        const mapInstance = new maplibregl.Map({
            container: "map",
            style: "https://demotiles.maplibre.org/style.json",
            center: [userLocation.lon, userLocation.lat],
            zoom: 14
        });

        setMap(mapInstance);

        // Agregar un marcador para la ubicación del usuario
        new maplibregl.Marker({ color: "blue" })
            .setLngLat([userLocation.lon, userLocation.lat])
            .setPopup(new maplibregl.Popup().setText("Tu ubicación"))
            .addTo(mapInstance);

        return () => mapInstance.remove();
    }, [userLocation]);

    useEffect(() => {
        if (!map) return;

        const fetchStations = async () => {
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

                setStations(mergedStations);

                // Eliminar marcadores previos
                markers.forEach(marker => marker.remove());

                // Crear nuevos marcadores
                const newMarkers = mergedStations.map(station => 
                    new maplibregl.Marker()
                        .setLngLat([station.lon, station.lat])
                        .setPopup(new maplibregl.Popup().setHTML(`
                            <strong>${station.name}</strong><br>
                            🚲 Bicis disponibles: ${station.num_bikes_available || 0} <br>
                            🔌 Estación de carga: ${station.is_charging_station ? "Sí" : "No"} <br>
                            🅿️ Espacios disponibles: ${station.num_docks_available || 0}
                        `))
                        .addTo(map)
                );

                setMarkers(newMarkers);
            } catch (error) {
                console.error("Error al cargar datos:", error);
            }
        };

        fetchStations();
        const interval = setInterval(fetchStations, 10000);

        return () => clearInterval(interval);
    }, [map]);

    return <div id="map" style={{ width: "100%", height: "500px" }} />;
};

export default BikeMap;
