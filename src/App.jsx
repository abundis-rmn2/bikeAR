import React, { useState } from "react";
import UserSensor from "./utils/userSensor";
import PrintSensors from "./components/PrintSensors";
import BikeAR from "./components/BikeAR";
import BikeMap from "./components/BikeMap";
import Compass from "./components/Compass";


const App = () => {
    const [userData, setUserData] = useState({ location: null, gyroscope: null });
    const [mapInstance, setMapInstance] = React.useState('libre');
    const [compass, setCompass] = React.useState(true);
return (
    <div>
        {!compass ? <Compass /> : null}
        <UserSensor setUserData={setUserData} />
        <PrintSensors userData={userData} />

        {mapInstance === 'libre' ? (
            <BikeMap />
        ) : (
            <BikeAR />
        )}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1em', background: 'white', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => setCompass(!compass)}>Compass</button>
            <button onClick={() => setMapInstance('libre')}>Mapa</button>
            <button onClick={() => setMapInstance('ar')}>AR</button>
        </div>
    </div>
);
};

export default App;
