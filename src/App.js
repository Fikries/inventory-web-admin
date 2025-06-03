import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import StockForm from './components/StockForm';
import Dashboard from './components/Dashboard';
import Login from "./components/Login";
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </header>

      <main>
        <Dashboard />
        <div className="spacer" />
        <StockForm />
      </main>
    </div>
  );
};

export default App;
