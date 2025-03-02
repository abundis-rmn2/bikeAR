import React, { useEffect, useRef } from "react";
import useUserLocation from "./useUserLocation";
import useUserGyroscope from "./useUserGyroscope";

const UserSensor = ({ setUserData }) => {
  const location = useUserLocation();
  const gyroscope = useUserGyroscope();
  
  // Store previous data to prevent unnecessary state updates
  const prevDataRef = useRef({ location: null, gyroscope: null });

  useEffect(() => {
    const newData = { location, gyroscope };

    // Prevent redundant updates if data hasn't changed
    if (
      JSON.stringify(prevDataRef.current) !== JSON.stringify(newData) &&
      (location || gyroscope) // Ensure at least one sensor is available
    ) {
      setUserData(newData);
      prevDataRef.current = newData; // Update stored reference
    }
  }, [location, gyroscope, setUserData]);

  return <div>Tracking user sensors...</div>;
};

export default UserSensor;
