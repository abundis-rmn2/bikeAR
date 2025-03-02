import React from "react";

const PrintSensors = ({ userData }) => {
  console.log(userData);
  return (
    <div style={{background: '#808080', position: "fixed", 
    top: 0, left: 0, padding: "1em", zIndex: 1000,
    height:'10rem', width:'100%' }}>
      <h2>User Sensors</h2>

      {userData.location ? (
        <p>
          <strong>GPS:</strong>  
          Latitude: {userData.location.latitude},  
          Longitude: {userData.location.longitude},  
          Accuracy: {userData.location.accuracy}m
        </p>
      ) : (
        <p>Fetching location...</p>
      )}

      {userData.gyroscope ? (
        <p>
          <strong>Gyroscope:</strong>  
          Alpha: {userData.gyroscope?.alpha?.toFixed(2)},  
          Beta: {userData.gyroscope?.beta?.toFixed(2)},  
          Gamma: {userData.gyroscope?.gamma?.toFixed(2)}
        </p>
      ) : (
        <p>No gyroscope data.</p>
      )}
    </div>
  );
};

export default PrintSensors;
