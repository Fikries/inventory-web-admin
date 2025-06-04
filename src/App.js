import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import StockForm from './components/StockForm';
import Dashboard from './components/Dashboard';
import Report from './components/Report';
import Login from "./components/Login";
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard'); // ← track selected page

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) return <p className="loading-text">Loading...</p>;

  if (!user) {
    return <Login onLogin={() => setUser(auth.currentUser)} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Inventory Admin Panel</h1>
        <div>
          <button onClick={() => setPage('dashboard')} className="btn-nav">Dashboard</button>
          <button onClick={() => setPage('stockform')} className="btn-nav">Form</button>
          <button onClick={() => setPage('report')} className="btn-nav">Report</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <main>
        {page === 'dashboard' && (
          <>
            <Dashboard />
            <div className="spacer" />
          </>
        )}
        {page === 'stockform' && <StockForm />}
        {page === 'report' && <Report />}
      </main>
    </div>
  );
};

export default App;
