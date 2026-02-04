import React from 'react';
import Hero from '../Sections/Hero';
import About from '../Sections/About';
import Menu from '../Sections/Menu';
import Locations from '../Sections/Locations';

const MainGroup = () => {
    return (
        <div className="w-full">
            <Hero />
            <About />
            <Menu />
            <Locations />
        </div>
    );
};

export default MainGroup;
