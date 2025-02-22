import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as LocAR from 'locar';

const BikeAR = () => {
    const containerRef = useRef(null);
    const [scene] = useState(new THREE.Scene());
    const [camera] = useState(new THREE.PerspectiveCamera(80, window.innerWidth/window.innerHeight, 0.001, 1000));
    const [renderer] = useState(new THREE.WebGLRenderer());
    const [indexedObjects] = useState({});
    const [firstPosition, setFirstPosition] = useState(true);

    useEffect(() => {
        if (!containerRef.current) return;

        // Setup renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Initialize LocAR components
        const locar = new LocAR.LocationBased(scene, camera);
        const deviceControls = new LocAR.DeviceOrientationControls(camera);
        const cam = new LocAR.WebcamRenderer(renderer);
        const clickHandler = new LocAR.ClickHandler(renderer);

        // Create bike station geometry
        const stationGeometry = new THREE.BoxGeometry(20, 20, 20);
        const stationMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green for bike stations

        // Handle GPS updates and fetch bike stations
        locar.on("gpsupdate", async (pos, distMoved) => {
            if (firstPosition || distMoved > 100) {
                try {
                    // Fetch bike station data
                    const [infoRes, statusRes] = await Promise.all([
                        fetch("https://guadalajara.publicbikesystem.net/customer/ube/gbfs/v1/en/station_information").then(res => res.json()),
                        fetch("https://guadalajara.publicbikesystem.net/customer/ube/gbfs/v1/en/station_status").then(res => res.json())
                    ]);

                    const stationsInfo = infoRes.data.stations;
                    const stationsStatus = statusRes.data.stations;

                    // Merge station info with status
                    const mergedStations = stationsInfo.map(station => ({
                        ...station,
                        ...(stationsStatus.find(s => s.station_id === station.station_id) || {})
                    }));

                    // Add stations to AR scene
                    mergedStations.forEach(station => {
                        if (!indexedObjects[station.station_id]) {
                            const mesh = new THREE.Mesh(stationGeometry, stationMaterial);
                            locar.add(mesh, station.lon, station.lat, 0, {
                                name: station.name,
                                bikes: station.num_bikes_available || 0,
                                docks: station.num_docks_available || 0,
                                charging: station.is_charging_station
                            });
                            indexedObjects[station.station_id] = mesh;
                        }
                    });

                    setFirstPosition(false);
                } catch (error) {
                    console.error("Error fetching bike stations:", error);
                }
            }
        });

        // Start GPS tracking
        locar.startGps();

        // Handle clicks on stations
        const handleClick = () => {
            const objects = clickHandler.raycast(camera, scene);
            if (objects.length) {
                const station = objects[0].object.properties;
                alert(
                    `Station: ${station.name}\n` +
                    `Available Bikes: ${station.bikes}\n` +
                    `Available Docks: ${station.docks}\n` +
                    `Charging Station: ${station.charging ? 'Yes' : 'No'}`
                );
            }
        };

        document.addEventListener('click', handleClick);

        // Animation loop
        const animate = () => {
            cam.update();
            deviceControls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('click', handleClick);
            containerRef.current?.removeChild(renderer.domElement);
            scene.clear();
        };
    }, []);

    return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default BikeAR;