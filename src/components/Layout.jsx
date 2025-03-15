import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/layout.css';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <h1>TarApp</h1>
        </div>
        <nav className="navigation">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/features" className="nav-link">Features</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>
        <div className="actions">
          <button className="btn btn-primary">Get Started</button>
        </div>
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="footer">
        <div className="footer-content">
          <p>© 2023 TarApp. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
