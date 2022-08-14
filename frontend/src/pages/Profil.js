import React, { useContext } from 'react';
import Log from '../components/Log'
import { UidContext } from '../components/AppContext';
import UptdateProfil from '../components/Profil/UptdateProfil';

const Profil = () => {
    const Uid = useContext(UidContext);

    return (
        <div className="profil-page">
            {Uid ? (
                <UptdateProfil />
            ) : (
                <div className="img-container">
                    <Log singin={false} signup={true} />
                    <img src='./img/log.jpg' alt="img-log" />
                </div>
            )}
        </div >
    )
};

export default Profil;