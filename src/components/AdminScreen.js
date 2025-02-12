import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // Use useNavigate instead of useHistory
import '../css/AdminScreen.css';  // Make sure to import the CSS file

const AdminScreen = () => {
  const navigate = useNavigate();  // Initialize the navigate function

  // Handle button clicks
  const handleButtonClick = (action) => {
    switch(action) {
      case 'pharmacy':
        navigate('/admin-pharmacy');
        break;
      case 'investigationDressing':
        navigate('/admin-investigation');
        break;
      case 'income':
        navigate('/admin-investigation');
        break;
      case 'changeAdminCredentials':
        navigate('/change-admin-credentials');
        break;
      case 'action':
        navigate('/admin-action');
        break;
      case 'logout':
        // Logic for logging out (e.g., clear session, tokens, etc.)
        alert('Logged out successfully!');
        navigate('/', { replace: true });  // Redirect to login screen after logout
        break;
      default:
        break;
    }
  };

  // Prevent user from going back to the previous page after logout
  useEffect(() => {
    // On mount, check if user is logged out and prevent back navigation
    const handleBeforeUnload = () => {
      window.history.pushState(null, '', window.location.href);
    };
    
    // Add event listener for popstate (back button)
    window.addEventListener('popstate', handleBeforeUnload);

    // Cleanup function when the component is unmounted
    return () => {
      window.removeEventListener('popstate', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="admin-screen">
      <h1>Admin Dashboard</h1>
      
      <div className="button-container">
        <button onClick={() => handleButtonClick('pharmacy')}>Pharmacy</button>
        <button onClick={() => handleButtonClick('investigationDressing')}>Investigation</button>
        <button onClick={() => handleButtonClick('income')}>Income</button>
        <button onClick={() => handleButtonClick('changeAdminCredentials')}>Change Admin Credentials and Add Cashier</button>
        <button onClick={() => handleButtonClick('action')}>Action</button>
        <button onClick={() => handleButtonClick('logout')}>Logout</button>
      </div>
    </div>
  );
};

export default AdminScreen;
