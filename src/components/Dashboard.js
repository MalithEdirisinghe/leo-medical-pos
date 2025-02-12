import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();

  // Add this useEffect to prevent unauthorized navigation
  useEffect(() => {
    // Clear any existing navigation history
    window.history.pushState(null, '', window.location.href);

    const preventNavigation = () => {
      // Clear any authentication data to ensure they can't go back
      localStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('adminAuthenticated');
    };

    window.addEventListener('popstate', preventNavigation);
    window.addEventListener('pageshow', preventNavigation);

    return () => {
      window.removeEventListener('popstate', preventNavigation);
      window.removeEventListener('pageshow', preventNavigation);
    };
  }, []);

  // Handle user type selection
  const handleUserSelection = (userType) => {
    if (userType === 'adminlogin') {
      // Clear any existing authentication data before navigation
      localStorage.removeItem('adminAuthenticated');
      sessionStorage.removeItem('adminAuthenticated');
      navigate('/adminlogin');
    } else if (userType === 'cashier') {
      navigate('/cashier');
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome to Leo Medical POS System</h1>
      <p>This POS system is designed to simplify medical dispensary management, including inventory tracking, sales, and customer management.</p>
      <p>Please select your user type to proceed:</p>
      <div className="user-selection">
        <button onClick={() => handleUserSelection('adminlogin')} className="user-button">Admin</button>
        <button onClick={() => handleUserSelection('cashier')} className="user-button">Cashier</button>
      </div>
    </div>
  );
}

export default Dashboard;
