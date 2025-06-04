import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css'; // Optional for styling

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>📦 Inventory</h2>
      <nav>
        <ul>
          <li><Link to="/">📊 Dashboard</Link></li>
          <li><Link to="/add-stock">➕ Add Stock</Link></li>
          <li><button onClick={() => window.location.reload()}>🔄 Refresh</button></li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
