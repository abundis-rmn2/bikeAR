import React, { useState, useEffect } from "react";

const Compass = () => {
    const [heading, setHeading] = useState(0);

    const startListening = () => {
        window.addEventListener("deviceorientation", (event) => {
            let newHeading = 0;

            // Check if iOS provides absolute north (webkitCompassHeading)
            if (event.webkitCompassHeading !== undefined) {
                newHeading = event.webkitCompassHeading; // Already corrected for true north
            } else {
                // Fallback: Use `alpha` and correct for platform differences
                newHeading = event.alpha || 0;

                const isiOS = /(iPhone|iPad|iPod)/i.test(navigator.userAgent);
                if (isiOS) {
                    newHeading = (360 - newHeading) % 360; // Flip for iOS
                } else {
                    newHeading = (newHeading + 90) % 360; // Fix Android offset
                }
            }

            setHeading(newHeading);
        });
    };

    useEffect(() => {
            startListening();
        
    }, []);

    return (
        <div className="compass" style={{position:"fixed", top:70, right: 60, zIndex: 999999}} >
                <>
                    <h1>🧭 Compass</h1>
                    <h2>Direction: {Math.round(heading)}°</h2>
                    <div
                        style={{
                            width: "100px",
                            height: "100px",
                            border: "2px solid black",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            margin: "20px auto"
                        }}
                    >
                        {/* Rotating Arrow */}
                        <div
                            style={{
                                width: "0",
                                height: "0",
                                borderLeft: "10px solid transparent",
                                borderRight: "10px solid transparent",
                                borderBottom: "30px solid red",
                                position: "absolute",
                                top: "20px",
                                transform: `rotate(${heading}deg)`,
                                transformOrigin: "50% 100%",
                                transition: "transform 0.2s ease-out",
                            }}
                        ></div>
                    </div>
                </>
        </div>
    );
};

export default Compass;
