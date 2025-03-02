import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import * as LocAR from 'locar';

const BikeAR = () => {
    const containerRef = useRef(null);
    const [scene] = useState(new THREE.Scene());
    const [camera] = useState(new THREE.PerspectiveCamera(80, window.innerWidth/window.innerHeight, 0.001, 1000));
    const [renderer] = useState(new THREE.WebGLRenderer());
    const locar = useRef(new LocAR.LocationBased(scene, camera)); // useRef for locar
    const [deviceControls] = useState(new LocAR.DeviceOrientationControls(camera));
    const [cam] = useState(new LocAR.WebcamRenderer(renderer));
    const indexedObjects = useRef({});
    const [firstPosition, setFirstPosition] = useState(true);
    const gpsUpdateRef = useRef(null);
    const animationFrameRef = useRef(null); // Ref for animation frame

    // Add after scene initialization, before GPS handler
    const southMarkerGeometry = new THREE.SphereGeometry(10, 32, 32);
    const southMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const southMarker = new THREE.Mesh(southMarkerGeometry, southMarkerMaterial);
    southMarker.position.set(0, 0, 100); // 100 units south of origin
    scene.add(southMarker);

    const createTextSprite = useCallback((message) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 500;
        canvas.height = 200;

        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = 'bold 30px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';

        const lines = message.split('\n');
        lines.forEach((line, i) => {
            context.fillText(line, canvas.width/2, 50 + (i * 40));
        });

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        return new THREE.Sprite(spriteMaterial);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        // Setup renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        // Create bike station geometry
        const stationGeometry = new THREE.BoxGeometry(20, 20, 20);
        const stationMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green for bike stations

        // GPS update handler - Stored in useRef
        gpsUpdateRef.current = async (pos, distMoved) => {
            // Update south marker position relative to user
            southMarker.position.set(0, 0, 100);

            if (firstPosition || distMoved > 100) {
                try {
                    // Fetch bike station data
                    const [infoRes, statusRes] = await Promise.all([
                        fetch("https://guadalajara.publicbikesystem.net/customer/ube/gbfs/v1/en/station_information").then(res => res.json()),
                        fetch("https://guadalajara.publicbikesystem.net/customer/ube/gbfs/v1/en/station_information").then(res => res.json())
                    ]);

                    const stationsInfo = infoRes.data.stations;
                    const stationsStatus = statusRes.data.stations;

                    // Merge station info with status
                    const mergedStations = stationsInfo.map(station => ({
                        ...station,
                        ...(stationsStatus.find(s => s.station_id === station.station_id) || {})
                    }));

                    // Modify the station creation part in the mergedStations.forEach loop
                    mergedStations.forEach(station => {
                        if (!indexedObjects.current[station.station_id]) {

                            const stationID = station.name.match(/\(([^)]+)\)/)[1];
                            const stationAddress = station.name.split(') ')[1];

                            // Create station box
                            const mesh = new THREE.Mesh(stationGeometry, stationMaterial);

                            // Inside mergedStations.forEach loop, update the infoText:
                            const infoText = `${stationID}\n${stationAddress}\nBikes: ${station.num_bikes_available || 0} | Docks: ${station.num_docks_available || 0}`;
                            const textSprite = createTextSprite(infoText);
                            textSprite.scale.set(50, 20, 1);
                            textSprite.position.y = 50;


                            // Create a group to hold both mesh and text
                            const group = new THREE.Group();
                            group.add(mesh);
                            group.add(textSprite);

                            // Add the group to the AR scene
                            locar.current.add(group, station.lon, station.lat, 0, {
                                name: station.name,
                                bikes: station.num_bikes_available || 0,
                                docks: station.num_docks_available || 0,
                            });

                            indexedObjects.current[station.station_id] = group;
                        }
                    });

                    setFirstPosition(false);
                } catch (error) {
                    console.error("Error fetching bike stations:", error);
                }
            }
        };

        // Start GPS tracking
        locar.current.startGps();
        locar.current.on("gpsupdate", gpsUpdateRef.current);

        // Animation loop simplified - remove raycast check
        const animate = () => {
            cam.update();
            deviceControls.update();
            renderer.render(scene, camera);
            animationFrameRef.current = requestAnimationFrame(animate); // Store animation frame
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
            containerRef.current?.removeChild(renderer.domElement);
            scene.clear();
            locar.current.stopGps();
            cancelAnimationFrame(animationFrameRef.current); // Cancel animation frame
        };
    }, []); // Empty dependency array

    return <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default BikeAR;