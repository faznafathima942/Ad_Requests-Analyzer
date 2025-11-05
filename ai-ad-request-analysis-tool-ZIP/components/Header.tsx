
import React from 'react';

const Header: React.FC = () => (
  <header className="text-center mb-10 md:mb-12">
    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
      AI Ad Request Analyzer
    </h1>
    <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
      Unlock revenue potential by identifying missing bid parameters in your ad requests.
    </p>
  </header>
);

export default Header;
