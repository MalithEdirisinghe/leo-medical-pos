import React, { useState, useEffect } from 'react';
import { collection, getDocs, db, doc, updateDoc, addDoc } from '../../firebaseConfig';
import '../../css/IndoorPharmacy.css';
import qz from 'qz-tray';
import { query, where } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const generateUniqueSaleId = async () => {
    let saleId;
    let exists = true;

    while (exists) {
        saleId = 'OUT-' + Math.floor(100000 + Math.random() * 900000);

        const q = query(collection(db, "outdoorSales"), where("saleId", "==", saleId));
        const snapshot = await getDocs(q);
        exists = !snapshot.empty;
    }

    return saleId;
};


const OutdoorPharmacy = () => {
    // State variables
    const navigate = useNavigate();
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [cart, setCart] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [cashAmount, setCashAmount] = useState('');
    const [balance, setBalance] = useState(0);
    const [isPrinting, setIsPrinting] = useState(false);
    const cashierName = localStorage.getItem("cashierName") || "Unknown";
    let isQZConnecting = false;

    // Fetch drugs from Firebase
    useEffect(() => {
        const fetchDrugs = async () => {
            try {
                const drugsCollection = collection(db, 'drugs');
                const drugSnapshot = await getDocs(drugsCollection);
                const drugList = drugSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDrugs(drugList);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching drugs: ', error);
                setLoading(false);
            }
        };

        fetchDrugs();
        qz.websocket.connect().catch((err) => console.error("QZ Errors:", err));
    }, []);

    const connectToQZ = async () => {
        if (qz.websocket.isActive() || isQZConnecting) return;

        qz.security.setCertificatePromise(() => Promise.resolve(""));
        qz.security.setSignaturePromise(() => Promise.resolve(""));

        try {
            isQZConnecting = true;
            await qz.websocket.connect();
            console.log("✅ QZ Tray connected");
        } catch (err) {
            console.error("❌ Failed to connect to QZ Tray:", err);
            throw err;
        } finally {
            isQZConnecting = false;
        }
    };

    // Filter drugs based on search query
    const filteredDrugs = drugs.filter(drug =>
        drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle row click and set selected drug
    const handleRowClick = (drug) => {
        setSelectedDrug({ ...drug, quantity: '' });
    };

    // Handle quantity change
    const handleQuantityChange = (e) => {
        const value = e.target.value;
    
        if (value === '') {
            setSelectedDrug(prevDrug => ({ ...prevDrug, quantity: '' }));
            return;
        }
    
        const newQuantity = parseInt(value, 10);
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            setSelectedDrug(prevDrug => ({ ...prevDrug, quantity: newQuantity }));
        }
    };    

    // Handle Add to Cart button click
    const handleAddToCart = () => {
        if (selectedDrug && selectedDrug.quantity > 0) {
            const existingItemIndex = cart.findIndex(item => item.id === selectedDrug.id);
            const drugIndex = drugs.findIndex(drug => drug.id === selectedDrug.id);

            if (drugIndex >= 0 && drugs[drugIndex].quantity >= selectedDrug.quantity) {
                // Update cart
                if (existingItemIndex >= 0) {
                    const updatedCart = [...cart];
                    updatedCart[existingItemIndex].quantity += selectedDrug.quantity;
                    setCart(updatedCart);
                } else {
                    setCart([...cart, selectedDrug]);
                }

                setSelectedDrug(null);
            } else {
                alert('Not enough stock available.');
            }
        } else {
            alert('Please select a valid quantity');
        }
    };

    // Handle Remove from Cart button click
    const handleRemoveFromCart = (item) => {
        const updatedCart = cart.filter(cartItem => cartItem.id !== item.id);
        setCart(updatedCart);
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    const handleSell = () => {
        if(cart.length === 0){
            alert('Cart is empty. Please add items before proceeding.');
            return;
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCashAmount(0);
        setBalance(0);
    };

    const handleCashAmountChange = (e) => {
        const enteredCash = parseFloat(e.target.value);
        setCashAmount(enteredCash);

        const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        setBalance(enteredCash - totalAmount);
    };

    const handlePrintBill = async () => {
        const saleId = await generateUniqueSaleId();
        setIsPrinting(true);
        try {
            // Update Firestore
            for (const item of cart) {
                const drugRef = doc(db, 'drugs', item.id);
                const drugSnapshot = await getDocs(collection(db, 'drugs'));
                const currentDrug = drugSnapshot.docs.find(doc => doc.id === item.id)?.data();
                if (currentDrug) {
                    const updatedQuantity = currentDrug.quantity - item.quantity;
                    if (updatedQuantity >= 0) {
                        await updateDoc(drugRef, { quantity: updatedQuantity });
                    }
                }
            }

            const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            await addDoc(collection(db, 'outdoorSales'), {
                saleId,
                timestamp: new Date(),
                cashier: localStorage.getItem('cashierName') || 'Unknown',
                cartItems: cart,
                totalAmount: cartTotal,
                cashReceived: cashAmount,
                balance: balance,
            });

            // QZ Tray print logic
            await connectToQZ();
            const now = new Date();
            const formattedDateTime = now.toLocaleString();
            const config = qz.configs.create("XP-58 (copy 1)"); // Update printer name

            const data = [
                "\x1B\x45\x01",            // Bold on
                "\x1D\x21\x11",            // Double size
                "LEO DOCTOR HOUSE\n\n",
                "\x1D\x21\x00",            // Normal
                "  --- Outdoor Pharmacy Bill ---\n",
                "--------------------------------\n",
                "\x1B\x45\x00",            // Bold off
                `Sale ID   : ${saleId}\n`,
                `Cashier   : ${cashierName}\n`,
                "--------------------------------\n",
                "Item           Qty Price Total\n",
                "--------------------------------\n",
                ...cart.map(item => {
                    const shortName = item.name.length > 13 ? item.name.slice(0, 13) + '…' : item.name;
                    const qty = item.quantity.toString().padStart(3, ' ');
                    const price = item.price.toString().padStart(5, ' ');
                    const total = (item.quantity * item.price).toString().padStart(5, ' ');
                    return `${shortName.padEnd(14)} ${qty} ${price} ${total}\n`;
                }),
                "--------------------------------\n",
                `Total     : Rs.${cartTotal.toFixed(2)}\n`,
                `Cash      : Rs.${cashAmount.toFixed(2)}\n`,
                `Balance   : Rs.${balance.toFixed(2)}\n`,
                "--------------------------------\n",
                `Date : ${formattedDateTime}\n`,
                "\nThank you for your purchase!\n\n\n",
                "\x1D\x56\x01"             // Full cut
            ];

            await qz.print(config, data);

            // UI reset
            setCart([]);
            setSelectedDrug(null);
            setCashAmount('');
            setBalance(0);
            setShowModal(false);

            // Refresh drug list
            const drugsCollection = collection(db, 'drugs');
            const drugSnapshot = await getDocs(drugsCollection);
            const drugList = drugSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDrugs(drugList);

            alert('Sale completed and printed.');
        } catch (error) {
            console.error('❌ Error during sale/print:', error);
            alert('Failed to complete sale.\n' + error.message);
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="indoor-pharmacy">
            <button
                className="back-button"
                onClick={() => navigate('/cashier-dashboard')}
            >
                ← Back
            </button>
            <h1>Outdoor Pharmacy Drugs</h1>

            {/* Search Bar */}
            <div className="search-container-indoor">
                <input
                    type="text"
                    placeholder="Search by drug name or brand"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-bar-indoor"
                />
            </div>

            <div className='Drug-table-txt'>
                <h2>Drugs Table</h2>
            </div>

            {/* Drugs Table */}
            <div className="Drugs-table-container">
                <div className="table-container">
                    <table className="drugs-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Brand</th>
                                <th>Price</th>
                                <th>Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDrugs.map(drug => (
                                <tr key={drug.id} onClick={() => handleRowClick(drug)}>
                                    <td>{drug.name}</td>
                                    <td>{drug.brand}</td>
                                    <td>Rs. {drug.price}</td>
                                    <td>{drug.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Selected Drug Details */}
                {selectedDrug && (
                    <div className="selected-drug-details">
                        <h3>Drug Details</h3>
                        <p><strong>Name:</strong> {selectedDrug.name}</p>
                        <p><strong>Brand:</strong> {selectedDrug.brand}</p>
                        <p><strong>Price:</strong> Rs. {selectedDrug.price}</p>
                        <p><strong>Quantity:</strong>
                            <input
                                type="number"
                                value={selectedDrug.quantity}
                                onChange={handleQuantityChange}
                                min="0"
                                placeholder='0'
                                style={{ width: '100px', marginLeft: '10px' }}
                            />
                        </p>
                        <p><strong>Total Price:</strong> Rs. {selectedDrug.price * selectedDrug.quantity}</p>

                        {/* Add to Cart Button */}
                        <div className="add-to-cart">
                            <button onClick={handleAddToCart} style={{ padding: '10px 20px', marginTop: '10px' }}>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cart Section */}
            <div className="cart-details">
                <div className="cart-table-container">
                    <h2>Cart Table</h2>
                    <div className="cart-table-scroll">
                        <table className="cart-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Brand</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.length > 0 ? (
                                    cart.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.name}</td>
                                            <td>{item.brand}</td>
                                            <td>Rs. {item.price}</td>
                                            <td>{item.quantity}</td>
                                            <td>Rs. {item.price * item.quantity}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleRemoveFromCart(item)}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: 'red',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center' }}>No items in the cart</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="cart-summary">
                        <p><strong>Total Cart Value:</strong> Rs. {cart.reduce((total, item) => total + (item.price * item.quantity), 0)}</p>
                    </div>

                    {/* Sell Button */}
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button onClick={handleSell} className="sell-button-outdoor">
                            Sell
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for Checkout */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={handleCloseModal}>&times;</span>
                        <h2>Checkout</h2>

                        {/* Total Cart Value */}
                        <div>
                            <label>Total Cart Value: </label>
                            <span>Rs. {cart.reduce((total, item) => total + (item.price * item.quantity), 0)}</span>
                        </div>

                        {/* Cash Amount Input */}
                        <div>
                            <label>Cash Amount: </label>
                            <input
                                type="number"
                                value={cashAmount}
                                onChange={handleCashAmountChange}
                                placeholder="Enter cash amount"
                            />
                        </div>

                        {/* Balance */}
                        <div>
                            <label>Balance: </label>
                            <span>Rs. {balance}</span>
                        </div>

                        {/* Print Button */}
                        <div>
                            {/* <button
                                onClick={handlePrintBill}
                                style={{ backgroundColor: 'green', color: 'white' }}
                            >
                                Print
                            </button> */}
                            <button
                                onClick={handlePrintBill}
                                disabled={isPrinting}
                                style={{
                                    backgroundColor: isPrinting ? '#ccc' : 'green',
                                    color: 'white',
                                    position: 'relative',
                                    padding: '10px 20px',
                                    cursor: isPrinting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isPrinting ? (
                                    <div className="spinner" style={{
                                        border: '3px solid #f3f3f3',
                                        borderTop: '3px solid #00b300', // ✅ change color here
                                        borderRadius: '50%',
                                        width: '16px',
                                        height: '16px',
                                        animation: 'spin 1s linear infinite',
                                        margin: '0 auto'
                                    }} />
                                ) : (
                                    'Print'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutdoorPharmacy;