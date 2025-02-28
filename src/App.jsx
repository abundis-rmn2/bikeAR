import React from "react";
import BikeAR from "./components/BikeAR";
import BikeMap from "./components/BikeMap";

const App = () => {
    const [mapInstance, setMapInstance] = React.useState('libre');
    return (
        <div>
            {mapInstance === 'libre' ? (
                <BikeMap />
            ) : (
                <BikeAR />
            )}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1em', background: 'white', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => setMapInstance('libre')}>Mapa</button>
            <button onClick={() => setMapInstance('ar')}>AR</button>
            </div>
        </div>
    );
};

export default App;
