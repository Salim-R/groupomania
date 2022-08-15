import React, { useContext } from 'react';
import { UidContext } from '../components/AppContext';
import LeftNav from '../components/LeftNav';
import NewPostForm from '../components/Post/NewPostForm';
import Thread from '../components/Thread';
import Log from '../components/Log'
import Trends from '../components/Trends';
import FriendsHint from '../components/Profil/FriendsHint';
const Home = () => {
    const Uid = useContext(UidContext); //uid de l'utilisateur
    return (
        <div className="home">
            <LeftNav />
            <div className="main">
                <div className="home-header">
                    {Uid ? <NewPostForm /> : <Log signin={true} signup={false} />}
                </div>
                <Thread />
            </div>
            <div className="right-side">
                <div className="right-side-container">
                    <div className="wrapper">
                        <Trends />
                        {Uid && <FriendsHint />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;