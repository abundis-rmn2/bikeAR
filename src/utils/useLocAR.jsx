import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as LocAR from 'locar';

const useLocAR = () => {
    const [scene] = useState(new THREE.Scene());
    const [camera] = useState(new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.001, 1000));
    const [renderer] = useState(new THREE.WebGLRenderer());
    const locar = useRef(new LocAR.LocationBased(scene, camera));
    const [currentPosition, setCurrentPosition] = useState(null);

    useEffect(() => {
        const handleGpsUpdate = (pos) => {
            setCurrentPosition({ latitude: pos.latitude, longitude: pos.longitude });
        };

        locar.current.startGps();
        locar.current.on('gpsupdate', handleGpsUpdate);

        return () => {
            locar.current.stopGps();

        };
    }, []);

    return { locar: locar.current, scene, camera, renderer, currentPosition };
};

export default useLocAR;