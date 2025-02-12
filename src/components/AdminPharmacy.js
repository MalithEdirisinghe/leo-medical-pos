import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, updateDoc, doc, deleteDoc, getDocs } from '../firebaseConfig.js';
import '../css/AdminPharmacy.css';
import ErrorModal from './ErrorModal.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const AdminPharmacy = () => {
  const [drugs, setDrugs] = useState([]);
  const [drugName, setDrugName] = useState('');
  const [drugPrice, setDrugPrice] = useState('');
  const [drugQty, setDrugQty] = useState('');
  const [drugBrand, setDrugBrand] = useState('');
  const [drugId, setDrugId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showLowestDrugsModal, setShowLowestDrugsModal] = useState(false);

  const fetchDrugs = async () => {
    const drugsCollection = collection(db, 'drugs');
    const drugSnapshot = await getDocs(drugsCollection);
    const drugList = drugSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDrugs(drugList);
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  const generatePDF = (drugsData, fileName) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(fileName, 14, 20);

    const columns = ['Drug Name', 'Brand', 'Price (Rs.)', 'Quantity', 'Total (Rs.)'];
    const rows = drugsData.map(drug => [
      drug.name,
      drug.brand,
      drug.price.toFixed(2),
      drug.quantity,
      calculateTotalPrice(drug.price, drug.quantity).toFixed(2),
    ]);

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 30,
      theme: 'striped',
      headStyles: {
        fillColor: [255, 0, 0],
        textColor: [255, 255, 255],
      },
      bodyStyles: {
        fontSize: 10,
      },
      margin: { top: 20 },
    });

    doc.save(fileName);
  };

  const addDrug = async () => {
    setErrorMessage('');

    if (!drugName) {
      setErrorMessage('Please fill in the Drug Name.');
      return;
    }
    if (!drugPrice) {
      setErrorMessage('Please fill in the Price.');
      return;
    }
    if (!drugQty) {
      setErrorMessage('Please fill in the Quantity.');
      return;
    }
    if (!drugBrand) {
      setErrorMessage('Please fill in the Brand.');
      return;
    }

    const price = parseFloat(drugPrice);
    const quantity = parseInt(drugQty);

    if (isNaN(price) || isNaN(quantity)) {
      setErrorMessage('Please enter valid Price and Quantity.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'drugs'), {
        name: drugName,
        price: price,
        quantity: quantity,
        brand: drugBrand,
      });
      setDrugName('');
      setDrugPrice('');
      setDrugQty('');
      setDrugBrand('');
      setErrorMessage('');
      fetchDrugs();
    } catch (error) {
      console.error("Error adding drug: ", error);
      setErrorMessage('There was an error adding the drug.');
    } finally {
      setLoading(false);
    }
  };

  const updateDrug = async () => {
    setErrorMessage('');

    if (!drugId) {
      setErrorMessage('Please select a drug to update.');
      return;
    }

    if (!drugName || !drugPrice || !drugQty || !drugBrand) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    const price = parseFloat(drugPrice);
    const quantity = parseInt(drugQty);

    if (isNaN(price) || isNaN(quantity)) {
      setErrorMessage('Please enter valid Price and Quantity.');
      return;
    }

    setLoading(true);
    try {
      const drugRef = doc(db, 'drugs', drugId);
      await updateDoc(drugRef, {
        name: drugName,
        price: price,
        quantity: quantity,
        brand: drugBrand,
      });
      setDrugName('');
      setDrugPrice('');
      setDrugQty('');
      setDrugBrand('');
      setDrugId('');
      setIsUpdating(false);
      setErrorMessage('');
      fetchDrugs();
    } catch (error) {
      console.error("Error updating drug: ", error);
      setErrorMessage('There was an error updating the drug.');
    } finally {
      setLoading(false);
    }
  };

  const deleteDrug = async (id) => {
    setLoading(true);
    try {
      const drugRef = doc(db, 'drugs', id);
      await deleteDoc(drugRef);
      fetchDrugs();
    } catch (error) {
      console.error("Error deleting drug: ", error);
      setErrorMessage('There was an error deleting the drug.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (id, name, price, quantity, brand) => {
    setDrugId(id);
    setDrugName(name);
    setDrugPrice(price.toString());
    setDrugQty(quantity.toString());
    setDrugBrand(brand);
    setIsUpdating(true);
  };

  const calculateTotalPrice = (price, quantity) => price * quantity;

  const totalPrice = drugs.reduce((total, drug) => {
    return total + calculateTotalPrice(drug.price, drug.quantity);
  }, 0);

  const filteredDrugs = drugs.filter(drug =>
    drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filterLowestDrugs = () => {
    setShowLowestDrugsModal(true);
  };

  const closeLowestDrugsModal = () => {
    setShowLowestDrugsModal(false);
  };

  const lowestQuantityDrugs = drugs.filter(drug => drug.quantity < 100);

  return (
    <div className="admin-pharmacy">
      <h1>Manage Pharmacy Drugs</h1>

      {/* Search bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by Drug Name or Brand"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} // Update search query
        />
      </div>

      {/* Display drugs form */}
      <div className="form-container">
        <input
          type="text"
          placeholder="Drug Name"
          value={drugName}
          onChange={(e) => setDrugName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Brand"
          value={drugBrand}
          onChange={(e) => setDrugBrand(e.target.value)}
        />
        <input
          type="number"
          placeholder="Price"
          value={drugPrice}
          min="0" // Prevent negative values
          onChange={(e) => {
            const value = e.target.value;
            if (value >= 0) {
              setDrugPrice(value);
            }
          }}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={drugQty}
          min="0" // Prevent negative values
          onChange={(e) => {
            const value = e.target.value;
            if (value >= 0) {
              setDrugQty(value);
            }
          }}
        />
        <button onClick={isUpdating ? updateDrug : addDrug} disabled={loading}>
          {loading ? 'Loading...' : isUpdating ? 'Update Drug' : 'Add Drug'}
        </button>
      </div>


      {/* Display error message in popup */}
      {errorMessage && (
        <ErrorModal
          message={errorMessage}
          onClose={() => setErrorMessage('')}
        />
      )}

      {/* Display drugs table */}
      <div className="drugs-list">
        <table className="drug-table">
          <thead>
            <tr>
              <th>Drug Name</th>
              <th>Brand</th>
              <th>Price (Rs.)</th>
              <th>Quantity</th>
              <th>Total (Rs.)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrugs.map((drug) => (
              <tr key={drug.id}>
                <td>{drug.name}</td>
                <td>{drug.brand}</td>
                <td>Rs.{drug.price}</td>
                <td>{drug.quantity}</td>
                <td>Rs.{calculateTotalPrice(drug.price, drug.quantity).toFixed(2)}</td>
                <td>
                  <button onClick={() => handleUpdateClick(drug.id, drug.name, drug.price, drug.quantity, drug.brand)}>Update</button>
                  <button onClick={() => deleteDrug(drug.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Display total price */}
      <div className="total-price">
        <strong>Total Price of All Drugs: Rs. {totalPrice.toFixed(2)}</strong>
      </div>

      <div className="button-group">
        {/* Get PDF for all drugs */}
        <button onClick={() => generatePDF(drugs, 'All_Drugs_List.pdf')}>
          Get PDF (All Drugs)
        </button>

        {/* View Lowest Drugs button */}
        <button onClick={filterLowestDrugs}>
          View Lowest Quantity Drugs
        </button>

        {/* Get PDF for lowest quantity drugs */}
        <button onClick={() => generatePDF(lowestQuantityDrugs, 'Lowest_Quantity_Drugs.pdf')}>
          Get PDF (Lowest Quantity Drugs)
        </button>
      </div>


      {/* Modal for lowest quantity drugs */}
      {showLowestDrugsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Lowest Quantity Drugs</h2>
            <table className="drug-table">
              <thead>
                <tr>
                  <th>Drug Name</th>
                  <th>Brand</th>
                  <th>Price (Rs.)</th>
                  <th>Quantity</th>
                  <th>Total (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {lowestQuantityDrugs.map((drug) => (
                  <tr key={drug.id}>
                    <td>{drug.name}</td>
                    <td>{drug.brand}</td>
                    <td>Rs.{drug.price}</td>
                    <td>{drug.quantity}</td>
                    <td>Rs.{calculateTotalPrice(drug.price, drug.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={closeLowestDrugsModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPharmacy;
