// import React, { useState, useEffect } from 'react';
// import { query, collection, where, getDocs } from 'firebase/firestore';
// import { db } from '../firebaseConfig';
// import { useNavigate } from 'react-router-dom';
// import '../css/AdminLogin.css';

// const CashierLogin = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   // Check authentication status on component mount
//   useEffect(() => {
//     const cashierAuthenticated = localStorage.getItem('cashierAuthenticated');
//     if (cashierAuthenticated) {
//       navigate('/cashier-dashboard', { replace: true });
//     }

//     // Prevent browser back/forward navigation
//     const preventNavigation = (e) => {
//       window.history.pushState(null, '', window.location.href);
//     };

//     window.history.pushState(null, '', window.location.href);
//     window.addEventListener('popstate', preventNavigation);

//     return () => {
//       window.removeEventListener('popstate', preventNavigation);
//     };
//   }, [navigate]);

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError('');

//     try {
//       const userQuery = query(
//         collection(db, 'users'),
//         where('username', '==', username),
//         where('password', '==', password)
//       );
//       const querySnapshot = await getDocs(userQuery);

//       if (!querySnapshot.empty) {
//         const userDoc = querySnapshot.docs[0];
//         const userData = userDoc.data();

//         if (userData.role === 'cashier') {
//           // Store authentication status and cashier's name
//           localStorage.setItem('cashierAuthenticated', 'true');
//           localStorage.setItem('cashierName', userData.username);

//           // Navigate and replace history
//           navigate('/cashier-dashboard', { replace: true });
//         } else {
//           setError('Unauthorized: This account does not have cashier access.');
//         }
//       } else {
//         setError('Invalid username or password. Please try again.');
//       }
//     } catch (error) {
//       setError('Login failed: ' + error.message);
//     }
//   };

//   return (
//     <div className="login-container">
//       <h2 className="login-title">Cashier Login</h2>
//       <form onSubmit={handleLogin} className="login-form">
//         <div className="form-group">
//           <label>Username:</label>
//           <input
//             type="text"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             required
//             className="form-input"
//           />
//         </div>
//         <div className="form-group">
//           <label>Password:</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             className="form-input"
//           />
//         </div>
//         {error && <p className="error-text">{error}</p>}
//         <button type="submit" className="login-button">Login</button>
//       </form>
//     </div>
//   );
// };

// export default CashierLogin;

import React, { useState, useEffect } from 'react';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import '../css/AdminLogin.css'; // reusing styles

const CashierLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // ✅ loading state
  const navigate = useNavigate();

  useEffect(() => {
    const cashierAuthenticated = localStorage.getItem('cashierAuthenticated');
    if (cashierAuthenticated) {
      navigate('/cashier-dashboard', { replace: true });
    }

    const preventNavigation = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventNavigation);

    return () => {
      window.removeEventListener('popstate', preventNavigation);
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // ✅ start spinner

    try {
      const userQuery = query(
        collection(db, 'users'),
        where('username', '==', username),
        where('password', '==', password)
      );
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.role === 'cashier') {
          localStorage.setItem('cashierAuthenticated', 'true');
          localStorage.setItem('cashierName', userData.username);
          navigate('/cashier-dashboard', { replace: true });
        } else {
          setError('Unauthorized: This account does not have cashier access.');
        }
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch (error) {
      setError('Login failed: ' + error.message);
    } finally {
      setLoading(false); // ✅ stop spinner
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Cashier Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="form-input"
            disabled={loading} // ✅ disabled during loading
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
            disabled={loading} // ✅ disabled during loading
          />
        </div>
        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="login-button" disabled={loading}>
          {loading && <div className="login-spinner" />}
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <button
          type="button"
          className="login-button"
          onClick={() => navigate('/')}
          disabled={loading}
          style={{ marginTop: '10px' }}
        >
          Home
        </button>
      </form>
    </div>
  );
};

export default CashierLogin;
