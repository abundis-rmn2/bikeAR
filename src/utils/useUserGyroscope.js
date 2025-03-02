import { useState, useEffect } from "react";

const useUserGyroscope = () => {
  const [gyroscope, setGyroscope] = useState(null);

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      console.error("DeviceOrientationEvent is not supported by this browser.");
      return;
    }

    const handleOrientation = (event) => {
      setGyroscope({
        alpha: event.alpha, // Rotation around Z-axis
        beta: event.beta,   // Rotation around X-axis
        gamma: event.gamma, // Rotation around Y-axis
      });
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  return gyroscope;
};

export default useUserGyroscope;