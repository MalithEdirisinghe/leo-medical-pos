import React, { useState } from 'react';
import { db } from '../firebaseConfig'; // Ensure this points to the correct firebaseConfig file
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import '../css/ChangeAdmin.css'; // Import custom CSS for styling

function ChangeAdmin() {
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: '',
  });

  const [cashierAccount, setCashierAccount] = useState({
    username: '',
    password: '',
  });

  const [message, setMessage] = useState('');

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleCashierChange = (e) => {
    const { name, value } = e.target;
    setCashierAccount((prev) => ({ ...prev, [name]: value }));
  };

  const updateAdminCredentials = async () => {
    if (adminCredentials.username && adminCredentials.password) {
      try {
        const adminDocRef = doc(db, 'users', 'admin');
        await setDoc(adminDocRef, adminCredentials);
        setMessage('Admin credentials updated successfully!');
      } catch (error) {
        setMessage('Error updating admin credentials: ' + error.message);
      }
    } else {
      setMessage('All fields are required to update admin credentials.');
    }
  };

  const createCashierAccount = async () => {
    if (cashierAccount.username && cashierAccount.password) {
      try {
        const cashierCollectionRef = collection(db, 'users');
        await addDoc(cashierCollectionRef, {
          ...cashierAccount,
          role: 'cashier',
        });
        setMessage(`Cashier account '${cashierAccount.username}' created successfully!`);
        setCashierAccount({ username: '', password: '' });
      } catch (error) {
        setMessage('Error creating cashier account: ' + error.message);
      }
    } else {
      setMessage('All fields are required to create a cashier account.');
    }
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">Admin Dashboard</h2>
      <p className="admin-welcome">Welcome to the Admin Dashboard. Here you can manage the POS system.</p>

      <hr />

      <div className="form-section">
        <h3 className="form-title">Update Admin Credentials</h3>
        <label>
          Username:
          <input
            type="text"
            name="username"
            value={adminCredentials.username}
            onChange={handleAdminChange}
            className="form-input"
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            name="password"
            value={adminCredentials.password}
            onChange={handleAdminChange}
            className="form-input"
          />
        </label>
        <button onClick={updateAdminCredentials} className="form-button">
          Update Admin Credentials
        </button>
      </div>

      <hr />

      <div className="form-section">
        <h3 className="form-title">Create New Cashier Account</h3>
        <label>
          Username:
          <input
            type="text"
            name="username"
            value={cashierAccount.username}
            onChange={handleCashierChange}
            className="form-input"
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            name="password"
            value={cashierAccount.password}
            onChange={handleCashierChange}
            className="form-input"
          />
        </label>
        <button onClick={createCashierAccount} className="form-button">
          Create Cashier Account
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default ChangeAdmin;