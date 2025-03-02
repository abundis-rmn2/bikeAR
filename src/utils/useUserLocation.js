import { useState, useEffect } from "react";

const useUserLocation = () => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy, // Added accuracy info
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      {
        enableHighAccuracy: true, // Higher accuracy but may drain battery
        maximumAge: 0, // Do not use a cached location
        timeout: 5000, // Timeout after 5 seconds
      }
    );

    return () => navigator.geolocation.clearWatch(watchId); // Cleanup on unmount
  }, []);

  return location;
};

export default useUserLocation;
