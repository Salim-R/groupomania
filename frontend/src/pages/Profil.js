import React, { useContext } from 'react';
import Log from '../components/Log'
import { UidContext } from '../components/AppContext';
import UptdateProfil from '../components/Profil/UptdateProfil';
import LeftNav from '../components/LeftNav';

const Profil = () => {
    const Uid = useContext(UidContext);

    return (
        <div className="profil-page">
            <LeftNav />
            {Uid ? (
                <UptdateProfil />
            ) : (
                <div className="img-container">
                    <Log singin={false} signup={true} />

                </div>
            )}
        </div >
    )
};

export default Profil;