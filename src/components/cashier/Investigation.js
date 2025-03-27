import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import '../../css/InvestigationAdmin.css';
import Header from '../Header';

const generateSaleId = () => {
  return 'INV' + Math.floor(100000 + Math.random() * 900000);
};

const Investigation = () => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [message, setMessage] = useState('');
  const [percentageFilter, setPercentageFilter] = useState('');
  const [allInvestigations, setAllInvestigations] = useState([]);
  const [cart, setCart] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cash, setCash] = useState('');
  const [balance, setBalance] = useState(0);
  const saleIdRef = useRef(generateSaleId());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const investigationsRef = collection(db, 'investigations');
      const snapshot = await getDocs(investigationsRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllInvestigations(data);
      setResults(data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = allInvestigations;

    if (percentageFilter !== '') {
      filtered = filtered.filter(item => item.percentage.toString() === percentageFilter);
    }

    if (search.trim() !== '') {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setResults(filtered);
  }, [search, percentageFilter, allInvestigations]);

  const handleAddToCart = (item) => {
    if (!cart.find(i => i.id === item.id)) {
      setCart([...cart, item]);
    }
  };

  const handleCheckout = () => {
    if (!customerName.trim()) {
      alert('Please enter customer name before checkout.');
      return;
    }

    if (cart.length === 0) {
      alert('Cart is empty.');
      return;
    }

    setShowModal(true); // Open confirmation modal
  };

  const handlePrintAndSave = async () => {
    if (isLoading) return; // ✅ Prevent multiple clicks
  
    try {
      setIsLoading(true);
      const saleId = saleIdRef.current;
  
      const saleData = {
        cartItems: cart,
        customerName,
        saleId,
        cash: Number(cash),
        balance: Number(balance),
        timestamp: serverTimestamp()
      };
  
      await addDoc(collection(db, 'investigationSales'), saleData); // ✅ Save only ONCE
  
      const printContent = document.getElementById('bill-section').innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head><title>Print Invoice</title></head>
          <body onload="window.print(); window.close();">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
  
      setCart([]);
      setCustomerName('');
      setCash('');
      setBalance(0);
      setShowModal(false);
      setMessage(`Checkout complete! ${cart.length} item(s) sold.`);
    } catch (error) {
      console.error('Printing or saving failed:', error);
      alert('Something went wrong while processing the invoice.');
    } finally {
      setIsLoading(false); // 🧹 Reset loading
    }
  };  

  const handleRemoveFromCart = (id) => {
    const updatedCart = cart.filter(item => item.id !== id);
    setCart(updatedCart);
  };

  const uniquePercentages = [...new Set(allInvestigations.map(item => item.percentage.toString()))];

  return (
    <div>
      <Header />
      <div className="investigation-container">
        <h2>Investigation Sales</h2>

        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={percentageFilter} onChange={(e) => setPercentageFilter(e.target.value)}>
            <option value="">Filter by Percentage</option>
            {uniquePercentages.map((percent, idx) => (
              <option key={idx} value={percent}>{percent}</option>
            ))}
          </select>
        </div>

        <div className="main-layout">
          <div className="table-box">
            <h3>🧪 Investigations</h3>
            <div className="scroll-area">
              <table className="investigation-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Percentage</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.percentage}</td>
                      <td>Rs.{item.price}</td>
                      <td>
                        <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-box">
            <h3>🛒 Cart</h3>
            <div className="scroll-area">
              <table className="investigation-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Percentage</th>
                    <th>Price</th>
                    <th>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.percentage}</td>
                      <td>Rs.{item.price}</td>
                      <td>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="cart-remove-btn"
                        >
                          ❌ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="cart-total">
                Total: <strong>Rs.{cart.reduce((total, item) => total + Number(item.price), 0)}</strong>
              </p>
              <div className="checkout-box">
                <input
                  type="text"
                  placeholder="Enter Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <button onClick={handleCheckout}>Checkout</button>
              </div>
            </div>
          </div>
        </div>
        {message && <p className="success">{message}</p>}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="custom-modal">
            <h2>Checkout</h2>

            <div className="modal-row">
              <span>Total Cart Value:</span>
              <span>Rs.{cart.reduce((t, i) => t + Number(i.price), 0)}</span>
            </div>

            <div className="modal-row">
              <span>Customer Name:</span>
              <span>{customerName}</span>
            </div>

            <div className="modal-row">
              <span>Cash Amount:</span>
              <input
                type="number"
                placeholder="Enter Cash"
                value={cash}
                onChange={(e) => {
                  setCash(e.target.value);
                  setBalance(e.target.value - cart.reduce((t, i) => t + Number(i.price), 0));
                }}
              />
            </div>

            <div className="modal-row">
              <span>Balance:</span>
              {/* <span>Rs.{balance >= 0 ? balance : 0}</span> */}
              <span>Rs.{balance}</span>
            </div>
            <div className="modal-buttons">
              <button
                className="print"
                onClick={handlePrintAndSave}
                disabled={isLoading} // 🔒 Disable while saving
                style={{ opacity: isLoading ? 0.5 : 1 }}
              >
                {isLoading ? (
                  <div className="spinners" style={{ width: '20px', height: '20px' }}></div>
                ) : (
                  '🖨️ Print'
                )}
              </button>

              <button
                className="cancel"
                onClick={() => setShowModal(false)}
                disabled={isLoading} // 🔒 Disable while saving
                style={{ opacity: isLoading ? 0.5 : 1 }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable bill for thermal printing */}
      <div id="bill-section" style={{ display: 'none' }}>
        <pre style={{
          fontFamily: 'Courier, monospace',
          fontSize: '12px',
          width: '3in',
          margin: '0 auto',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          textAlign: 'left'
        }}>
          {`LEO Medical POS
  Investigation Bill
  Sale ID      : ${saleIdRef.current}
  Patient     : ${customerName}
  -------------------------------
  ${cart.map(item => (
            `${item.name.padEnd(15)} ${item.percentage} Rs.${item.price}`
          )).join('\n')}
  -------------------------------
  Total Amount : Rs. ${cart.reduce((t, i) => t + Number(i.price), 0)}
  Cash Amount  : Rs. ${cash}
  Balance      : Rs. ${balance}
  -------------------------------
  Thank you!`}
        </pre>
      </div>
    </div>
  );
};

export default Investigation;
