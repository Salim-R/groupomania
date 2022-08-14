import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Home from '../../pages/Home';
import Tendance from '../../pages/Tendance';
import Profil from '../../pages/Profil';
import Navbar from '../Navbar';
import { BrowserRouter } from "react-router-dom";
const index = () => {
    return (

        <BrowserRouter>

            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tendance" element={<Tendance />} />
                <Route path="/profil" element={<Profil />} />
                <Route path="/" element={< Navigate replace to="/" />} />
            </Routes>

        </BrowserRouter>

    );
};

export default index;