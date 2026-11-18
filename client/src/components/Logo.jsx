import React from 'react';

// Text version of the Project X Experience wordmark
const Logo = ({ size = 'md' }) => {
    const big = size === 'lg';
    return (
        <span className="inline-flex flex-col items-center leading-none select-none">
            <span className={`font-display uppercase text-bone ${big ? 'text-5xl' : 'text-2xl'} tracking-tight`}>
                Project<span className="text-brand ml-1">X</span>
            </span>
            <span className={`uppercase text-bone/80 font-semibold ${big ? 'text-xs tracking-[0.6em] mt-2' : 'text-[0.5rem] tracking-[0.55em] mt-1'}`}>
                Experience
            </span>
        </span>
    );
};

export default Logo;
