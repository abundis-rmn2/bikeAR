import React, { useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { fetchBikeStations } from '../utils/bikeStationService';

const BikeMap = () => {
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [stations, setStations] = useState([]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lon: longitude });
                },
                () => {
                    console.warn("No se pudo obtener la ubicación, usando Guadalajara.");
                    setUserLocation({ lat: 20.67, lon: -103.35 });
                }
            );
        } else {
            console.warn("Geolocalización no soportada, usando Guadalajara.");
            setUserLocation({ lat: 20.67, lon: -103.35 });
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
                const mergedStations = await fetchBikeStations();
                setStations(mergedStations);

                markers.forEach(marker => marker.remove());

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

                // Calculate distances and show tooltips for the closest 10 markers
                const distances = mergedStations.map(station => ({
                    ...station,
                    distance: Math.sqrt(
                        Math.pow(station.lat - userLocation.lat, 2) +
                        Math.pow(station.lon - userLocation.lon, 2)
                    )
                }));

                distances.sort((a, b) => a.distance - b.distance);

                distances.slice(0, 2).forEach(station => {
                    const marker = newMarkers.find(marker => {
                        const lngLat = marker.getLngLat();
                        return lngLat.lat === station.lat && lngLat.lng === station.lon;
                    });
                    if (marker) {
                        marker.togglePopup();
                    }
                });
            } catch (error) {
                console.error("Error al cargar datos:", error);
            }
        };

        fetchStations();
        const interval = setInterval(fetchStations, 10000);

        return () => clearInterval(interval);
    }, [map, userLocation]);

    return (
        <>
            <div id="map" style={{ width: "100vw", height: "100vh" }} />
            <style>
                {`
                    .maplibregl-popup-content {
                        color: black;
                    }
                `}
            </style>
        </>
    );
};

export default BikeMap;
