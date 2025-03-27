import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from '../firebaseConfig'; // Import necessary Firebase functions
import '../css/InvestigationAdmin.css';

const InvestigationAdmin = () => {
  const [investigationName, setInvestigationName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [price, setPrice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [investigations, setInvestigations] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentInvestigationId, setCurrentInvestigationId] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [percentageFilter, setPercentageFilter] = useState(''); // New state for percentage filter

  // Fetch investigations from Firestore
  const fetchInvestigations = async () => {
    const investigationsCollection = collection(db, 'investigations');
    const snapshot = await getDocs(investigationsCollection);
    const investigationList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setInvestigations(investigationList);
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  // Filtered investigations based on both search query and percentage filter
  const filteredInvestigations = investigations.filter((investigation) => {
    const matchesName = investigation.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPercentage = percentageFilter ? investigation.percentage === percentageFilter : true;
    return matchesName && matchesPercentage;
  });

  // Add or Update Investigation
  const handleSubmit = async () => {
    setErrorMessage('');

    if (!investigationName || !percentage || !price) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    const validPercentages = ['10%', '20%', '30%'];
    if (!validPercentages.includes(percentage)) {
      setErrorMessage('Please select a valid percentage (10%, 20%, 30%).');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue)) {
      setErrorMessage('Please enter a valid price.');
      return;
    }

    setLoading(true);
    try {
      if (isUpdating) {
        // Update existing investigation
        const investigationRef = doc(db, 'investigations', currentInvestigationId);
        await updateDoc(investigationRef, {
          name: investigationName,
          percentage: percentage,
          price: priceValue
        });
        setIsUpdating(false); // Reset update flag
      } else {
        // Add new investigation
        await addDoc(collection(db, 'investigations'), {
          name: investigationName,
          percentage: percentage,
          price: priceValue
        });
      }

      // Reset form fields
      setInvestigationName('');
      setPercentage('');
      setPrice('');
      setCurrentInvestigationId('');
      fetchInvestigations();  // Refresh investigation list
    } catch (error) {
      console.error("Error adding/updating investigation: ", error);
      setErrorMessage('There was an error adding/updating the investigation.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Investigation
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this investigation?");
    if (confirmDelete) {
      setLoading(true);
      try {
        const investigationRef = doc(db, 'investigations', id);
        await deleteDoc(investigationRef);
        fetchInvestigations(); // Refresh investigation list after delete
      } catch (error) {
        console.error("Error deleting investigation: ", error);
        setErrorMessage('There was an error deleting the investigation.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Edit Investigation (Fill form for updating)
  const handleEdit = (investigation) => {
    setInvestigationName(investigation.name);
    setPercentage(investigation.percentage);
    setPrice(investigation.price.toString());
    setIsUpdating(true);
    setCurrentInvestigationId(investigation.id);
  };

  return (
    <div className="investigation-admin">
      <h1>Investigation Management</h1>

      {/* Form for adding or updating investigation */}
      <div className="form-container-invest">
        <input
          type="text"
          placeholder="Investigation Name"
          value={investigationName}
          onChange={(e) => setInvestigationName(e.target.value)}
        />
        <select
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
        >
          <option value="">Select Percentage</option>
          <option value="10%">10%</option>
          <option value="20%">20%</option>
          <option value="30%">30%</option>
        </select>
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Loading...' : isUpdating ? 'Update Investigation' : 'Add Investigation'}
        </button>
      </div>

      {/* Display error message if any */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {/* Investigations Table */}
      <div className="investigations-table">
        <h2>Investigation List</h2>

        {/* Search Bar */}
        <div className="search-containers">
          <input
            type="text"
            placeholder="Search Investigation Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query
          />
        </div>

        {/* Percentage Filter */}
        <div className="percentage-filter">
          <select
            value={percentageFilter}
            onChange={(e) => setPercentageFilter(e.target.value)} // Update percentage filter
          >
            <option value="">Select Percentage</option>
            <option value="">All</option>
            <option value="10%">10%</option>
            <option value="20%">20%</option>
            <option value="30%">30%</option>
          </select>
        </div>

        {/* Table */}
        <table className="drug-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Percentage</th>
              <th>Price (Rs.)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvestigations.map((investigation) => (
              <tr key={investigation.id}>
                <td>{investigation.name}</td>
                <td>{investigation.percentage}</td>
                <td>Rs.{investigation.price.toFixed(2)}</td>
                <td>
                  <button onClick={() => handleEdit(investigation)}>Edit</button>
                  <button onClick={() => handleDelete(investigation.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestigationAdmin;
