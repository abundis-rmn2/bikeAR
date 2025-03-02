import React, { use, useEffect, useState, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { fetchBikeStations } from '../utils/bikeStationService';
import UserSensor from '../utils/userSensor'; // Import UserSensor

const BikeMap = () => {
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [stations, setStations] = useState([]);
    const [userData, setUserData] = useState(null); // Add userData state
    const userMarkerRef = useRef(null);
    const [firstPosition, setFirstPosition] = useState(true);
    const [stationFetched, setStationFetched] = useState(false);

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
                    Math.pow(station.lat - userData.location.lat, 2) +
                    Math.pow(station.lon - userData.location.lon, 2)
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

    useEffect(() => {
        if (!userData?.location || firstPosition === false) return;
        console.log("Ubicación del usuario:", userData.location);
        const mapInstance = new maplibregl.Map({
            container: "map",
            style: "https://demotiles.maplibre.org/style.json",
            center: [userData.location.longitude, userData.location.latitude],
            zoom: 14
        });
        setMap(mapInstance);
        setFirstPosition(false);
    }, [userData]);



    useEffect(() => {
        if (!userData?.location || !map) return;

        // Check if the marker already exists
        if (userMarkerRef.current) {
            // Update the marker's position
            userMarkerRef.current.setLngLat([userData.location.longitude, userData.location.latitude]);
            //alert("Actualizando ubicación del usuario...", userMarkerRef.current);
            console.log(userMarkerRef.current)
            const popup = userMarkerRef.current.getPopup();
    
            // Actualizar solo el contenido sin reemplazar el popup
            if (popup) {
                popup.setHTML(`Ubicación actual: ${userData.location.latitude}, ${userData.location.longitude}`);
            }    
            //userMarkerRef.current.addTo(map);
            //userMarkerRef.current.togglePopup();
            //map.flyTo({ center: [userData.location.longitude, userData.location.latitude] });
        } else {
            console.log("Creando marcador de usuario...");
            // Create a new marker and store it in the ref
            userMarkerRef.current = new maplibregl.Marker({ color: "blue" })
                .setLngLat([userData.location.longitude, userData.location.latitude])
                .setPopup(new maplibregl.Popup()
                    .setText(`Ubicación actual ${userData.location.latitude}, ${userData.location.longitude}`))
                .addTo(map);
                userMarkerRef.current.togglePopup();
                
        }

    }, [userData]);
    

    useEffect(() => {
        if (!map || stationFetched === true) {
            //alert("Ya se cargaron las estaciones...");
            return
        }

        console.log("Cargando estaciones de bicicletas...");
        fetchStations();
        setStationFetched(true);
        const interval = setInterval(fetchStations, 10000)
        return () => clearInterval(interval);
    }, [userData, map]);

    return (
        <>
            <div id="map" style={{ width: "100vw", height: "100vh" }} />
            <UserSensor setUserData={setUserData} /> {/* Render UserSensor */}
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