import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import '../../css/InvestigationAdmin.css';
import qz from 'qz-tray';

const generateUniqueSaleId = async () => {
  let isUnique = false;
  let newSaleId = "";

  const salesSnapshot = await getDocs(collection(db, 'investigationSales'));
  const existingSaleIds = salesSnapshot.docs.map(doc => doc.data().saleId);

  while (!isUnique) {
    const candidateId = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    if (!existingSaleIds.includes(candidateId)) {
      newSaleId = candidateId;
      isUnique = true;
    }
  }

  return newSaleId;
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
  const [isLoading, setIsLoading] = useState(false);
  const [negativeBalanceSales, setNegativeBalanceSales] = useState([]);
  const [negativeSearch, setNegativeSearch] = useState('');
  const [settlingSaleId, setSettlingSaleId] = useState('');
  const cashierName = localStorage.getItem('cashierName') || 'Unknown';

  useEffect(() => {
    const fetchData = async () => {
      const investigationsRef = collection(db, 'investigations');
      const snapshot = await getDocs(investigationsRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllInvestigations(data);
      setResults(data);
    };
    fetchData();
    qz.websocket.connect().catch((err) => console.error("QZ Errors:", err));
  }, []);

  useEffect(() => {
    if (!qz.websocket.isActive()) {
      qz.security.setCertificatePromise(() => Promise.resolve(""));
      qz.security.setSignaturePromise(() => Promise.resolve(""));
      qz.websocket.connect().then(() => console.log("QZ Connected"));
    }
  }, []);

  useEffect(() => {
    const fetchNegativeSales = async () => {
      const salesSnapshot = await getDocs(collection(db, 'investigationSales'));
      const allSales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allSales.filter(sale => sale.balance < 0 && !sale.settleStatus);
      setNegativeBalanceSales(filtered);
    };
    fetchNegativeSales();
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
    if (isLoading) return;

    try {
      setIsLoading(true);

      // const saleId = saleIdRef.current;
      const saleId = await generateUniqueSaleId();
      const total = cart.reduce((t, i) => t + Number(i.price || 0), 0); // Fallback to 0
      const parsedCart = cart.map(item => ({
        ...item,
        price: Number(item.price || 0),
      }));

      const saleData = {
        cartItems: parsedCart,
        customerName,
        saleId,
        total,
        cash: Number(cash),
        balance: Number(balance),
        cashierName,
        timestamp: serverTimestamp(),
        settleStatus: balance < 0 ? false : true,
      };

      console.log("💾 Saving sale:", saleData);
      await addDoc(collection(db, 'investigationSales'), saleData);

      // ⏸️ Print only if cart is valid
      if (!parsedCart.length) {
        throw new Error("Cart is empty, nothing to print.");
      }

      // 🖨️ Prepare thermal print content
      const config = qz.configs.create("XP-58 (copy 1)");
      const now = new Date();
      const formattedDateTime = now.toLocaleString();

      const data = [
        "\x1B\x45\x01",        // Bold ON
        "\x1D\x21\x11",        // Double width + height
        "LEO DOCTOR HOUSE\n\n",
        "\x1D\x21\x00",        // Back to normal size
        "\x1B\x45\x01",

        "  --- Investigation Bill ---\n",
        "-----------------------------\n",
        "\x1B\x45\x00",
        `Sale ID    : ${saleId}\n`,
        `Patient    : ${customerName || "N/A"}\n`,
        `Cashier    : ${cashierName}\n`,
        "-----------------------------\n",

        ...cart.map(item => `${item.name}:   Rs.${item.price}\n`),

        "-----------------------------\n",
        "\x1B\x45\x01", // Bold ON
        `Cash       : Rs. ${cash}\n`,
        `Total      : Rs. ${total}\n`,
        `Balance    : Rs. ${balance}\n`,
        "\x1B\x45\x00", // Bold OFF
        "-----------------------------\n",
        `Date : ${formattedDateTime}\n\n`,
        " Thank you and get well soon!\n\n\n",
        "\x1D\x56\x01"
      ];

      console.log("🧾 Final Print Payload:", data);
      console.log("🛒 Cart Debug:", cart);

      await qz.print(config, data);

      // ❌ Avoid using cart or any dynamic state directly after this line
      const soldCount = cart.length; // ✅ Safe to store now

      // 🧹 Reset UI
      setCart([]);
      setCustomerName('');
      setCash('');
      setBalance(0);
      setShowModal(false);

      // 🛑 This might be failing if cart is already cleared
      setMessage(`Checkout complete! ${soldCount} item(s) sold.`);

    } catch (error) {
      console.error("❌ Print or Save Failed:", error);
      alert("Failed to complete transaction.\n" + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromCart = (id) => {
    const updatedCart = cart.filter(item => item.id !== id);
    setCart(updatedCart);
  };

  const handleSettleBalance = async (saleIdToSettle) => {
    try {
      setSettlingSaleId(saleIdToSettle);

      const salesSnapshot = await getDocs(collection(db, 'investigationSales'));
      const matchedDoc = salesSnapshot.docs.find(doc => doc.data().saleId === saleIdToSettle);

      if (matchedDoc) {
        const sale = matchedDoc.data();
        const updatedCash = Number(sale.cash) + Math.abs(Number(sale.balance));

        // 1. ✅ Update `investigationSales` doc
        await updateDoc(doc(db, 'investigationSales', matchedDoc.id), {
          settleStatus: true,
        });

        // 2. ✅ Insert into `investigationSettle` collection
        await addDoc(collection(db, 'investigationSettle'), {
          saleId: sale.saleId,
          customerName: sale.customerName,
          settledAmount: Math.abs(Number(sale.balance)),
          cashierName: localStorage.getItem('cashierName') || 'Unknown',
          settledAt: serverTimestamp()
        });

        // 3. ✅ Refresh UI
        const updatedSales = negativeBalanceSales.map(s =>
          s.saleId === saleIdToSettle
            ? { ...s, balance: 0, cash: updatedCash }
            : s
        );
        setNegativeBalanceSales(updatedSales.filter(s => s.balance < 0));
      } else {
        alert('Sale ID not found!');
      }
    } catch (error) {
      console.error('Error settling balance:', error);
      alert('Failed to settle balance.');
    } finally {
      setSettlingSaleId('');
    }
  };

  const uniquePercentages = [...new Set(allInvestigations.map(item => item.percentage.toString()))];

  return (
    <div>
      {/* <Header /> */}
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

        <div className="tables-scroll-container">
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
          <div className="negative-balance-container">
            <div className="table-box">
              <h3>📉 Negative Balance Sales</h3>
              <div className="negative-search-wrapper">
                <input
                  type="text"
                  placeholder="Search by Patient or Sale ID"
                  value={negativeSearch}
                  onChange={(e) => setNegativeSearch(e.target.value)}
                  className="negative-search"
                />
              </div>
              <div className="scroll-area">
                <table className="investigation-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Sale ID</th>
                      <th>Price</th>
                      <th>Cash</th>
                      <th>Balance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {negativeBalanceSales
                      .filter((sale) =>
                        sale.customerName.toLowerCase().includes(negativeSearch.toLowerCase()) ||
                        sale.saleId.toLowerCase().includes(negativeSearch.toLowerCase())
                      )
                      .map((sale, idx) => (
                        <tr key={idx}>
                          <td>{sale.customerName}</td>
                          <td>{sale.saleId}</td>
                          <td>Rs.{sale.total}</td>
                          <td>Rs.{sale.cash}</td>
                          <td style={{ color: 'red' }}>Rs.{sale.balance}</td>
                          <td>
                            <button
                              className="settle-btn"
                              onClick={() => handleSettleBalance(sale.saleId)}
                              disabled={settlingSaleId === sale.saleId}
                              style={{ opacity: settlingSaleId === sale.saleId ? 0.5 : 1 }}
                            >
                              {settlingSaleId === sale.saleId ? (
                                <div className="spinners" style={{ width: '16px', height: '16px' }}></div>
                              ) : (
                                'Settle'
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
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
              <span>Patient Name:</span>
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
    </div>
  );
};

export default Investigation;
