import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, History, Search } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="glass-panel navbar">
      <div className="nav-brand">
        <ShieldCheck className="brand-icon" size={28} />
        <h2>NewsScanner</h2>
      </div>
      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          <Search size={20} />
          <span>Scan</span>
        </Link>
        <Link 
          to="/history" 
          className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
        >
          <History size={20} />
          <span>History</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
