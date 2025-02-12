import React, { useState, useEffect } from 'react';
import { collection, getDocs, db } from '../../firebaseConfig';
import '../../css/IndoorPharmacy.css'; // We can reuse the same CSS

const OutdoorPharmacy = () => {
    // State variables
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [cart, setCart] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [cashAmount, setCashAmount] = useState(0);
    const [balance, setBalance] = useState(0);

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
    }, []);

    // Filter drugs based on search query
    const filteredDrugs = drugs.filter(drug =>
        drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drug.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle row click and set selected drug
    const handleRowClick = (drug) => {
        setSelectedDrug({ ...drug, quantity: 1 });
    };

    // Handle quantity change
    const handleQuantityChange = (e) => {
        const newQuantity = parseInt(e.target.value, 10);
        if (newQuantity >= 0) {
            setSelectedDrug((prevDrug) => ({
                ...prevDrug,
                quantity: newQuantity,
            }));
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

                // Deduct quantity from the main list
                const updatedDrugs = [...drugs];
                updatedDrugs[drugIndex].quantity -= selectedDrug.quantity;
                setDrugs(updatedDrugs);

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
        // Restore the quantity back to the main list
        const drugIndex = drugs.findIndex(drug => drug.id === item.id);
        if (drugIndex >= 0) {
            const updatedDrugs = [...drugs];
            updatedDrugs[drugIndex].quantity += item.quantity;
            setDrugs(updatedDrugs);
        }

        // Remove the item from the cart
        const updatedCart = cart.filter(cartItem => cartItem.id !== item.id);
        setCart(updatedCart);
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    const handleSell = () => {
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

    const handlePrintBill = () => {
        const billContent = document.getElementById('bill-section').innerHTML;
        const originalContent = document.body.innerHTML;

        document.body.innerHTML = billContent;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
    };

    return (
        <div className="indoor-pharmacy">
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
                                style={{ width: '60px', marginLeft: '10px' }}
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
                            <button
                                onClick={handlePrintBill}
                                style={{ backgroundColor: 'green', color: 'white' }}
                            >
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bill Section (Hidden) */}
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
                    LEO Medical POS<br></br>
                    Pharmacy Bill<br></br>
                    --------------------------------<br></br>
                    {cart.map(item =>
                        `${item.name.padEnd(15)} ${item.quantity} x ${item.price.toString().padEnd(5)} = ${(item.quantity * item.price).toString().padEnd(5)}`
                    ).join("\n")}<br></br>
                    --------------------------------<br></br>
                    Total Amount: Rs. {cart.reduce((total, item) => total + (item.price * item.quantity), 0)}<br></br>
                    Cash Amount: Rs. {cashAmount}<br></br>
                    Balance:     Rs. {balance}<br></br>
                    --------------------------------<br></br>
                    Thank you for your purchase!
                </pre>
            </div>
        </div>
    );
};

export default OutdoorPharmacy;