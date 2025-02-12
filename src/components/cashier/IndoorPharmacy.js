import React, { useState, useEffect } from 'react';
import { collection, getDocs, db, doc, updateDoc } from '../../firebaseConfig';
import '../../css/IndoorPharmacy.css';

const IndoorPharmacy = () => {
    // State variables
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [cart, setCart] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDoctorCharge, setSelectedDoctorCharge] = useState('');
    const [selectedChannelingCharge, setSelectedChannelingCharge] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [doctorCharges, setDoctorCharges] = useState([]);
    const [channelingCharges, setChannelingCharges] = useState([]);
    const [showModal, setShowModal] = useState(false); // To toggle the modal visibility
    const [cashAmount, setCashAmount] = useState(0); // Cash entered by the cashier
    const [balance, setBalance] = useState(0);
    const [isPrinting, setIsPrinting] = useState(false);

    // Fetch drugs from Firebase
    useEffect(() => {
        const fetchDrugs = async () => {
            try {
                const drugsCollection = collection(db, 'drugs'); // Update with your Firebase collection name
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
        setSelectedDrug({ ...drug, quantity: 1 }); // Default quantity to 1 for selected drug
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

    const handleAddToCart = () => {
        if (selectedDrug && selectedDrug.quantity > 0) {
            const existingItemIndex = cart.findIndex(item => item.id === selectedDrug.id);
            const drugIndex = drugs.findIndex(drug => drug.id === selectedDrug.id);

            if (drugIndex >= 0) {
                const totalQuantityInCart = existingItemIndex >= 0
                    ? cart[existingItemIndex].quantity + selectedDrug.quantity
                    : selectedDrug.quantity;

                // Check if total quantity including cart is available
                if (drugs[drugIndex].quantity >= totalQuantityInCart) {
                    // Update cart
                    if (existingItemIndex >= 0) {
                        const updatedCart = [...cart];
                        updatedCart[existingItemIndex].quantity += selectedDrug.quantity;
                        setCart(updatedCart);
                    } else {
                        setCart([...cart, selectedDrug]);
                    }

                    // Don't deduct from drugs list yet - just display available quantity
                    const updatedDrugs = [...drugs];
                    updatedDrugs[drugIndex] = {
                        ...updatedDrugs[drugIndex],
                        displayQuantity: updatedDrugs[drugIndex].quantity - totalQuantityInCart
                    };
                    setDrugs(updatedDrugs);
                    setSelectedDrug(null);
                } else {
                    alert('Not enough stock available.');
                }
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

    // Fetch doctors from Firebase
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const doctorsCollection = collection(db, 'doctors'); // Update with your Firebase collection name
                const doctorSnapshot = await getDocs(doctorsCollection);
                const doctorList = doctorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDoctors(doctorList);
            } catch (error) {
                console.error('Error fetching doctors: ', error);
            }
        };

        fetchDoctors();
    }, []);

    // Fetch doctor charges from Firebase
    useEffect(() => {
        const fetchDoctorCharges = async () => {
            try {
                const doctorChargesCollection = collection(db, 'doctorCharges'); // Update with your Firebase collection name
                const doctorChargesSnapshot = await getDocs(doctorChargesCollection);
                const doctorChargesList = doctorChargesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDoctorCharges(doctorChargesList);
            } catch (error) {
                console.error('Error fetching doctor charges: ', error);
            }
        };

        fetchDoctorCharges();
    }, []);

    // Fetch channeling charges from Firebase
    useEffect(() => {
        const fetchChannelingCharges = async () => {
            try {
                const channelingChargesCollection = collection(db, 'channelingCharges'); // Update with your Firebase collection name
                const channelingChargesSnapshot = await getDocs(channelingChargesCollection);
                const channelingChargesList = channelingChargesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setChannelingCharges(channelingChargesList);
            } catch (error) {
                console.error('Error fetching channeling charges: ', error);
            }
        };

        fetchChannelingCharges();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    const handleSell = () => {
        if (!selectedDoctor) {
            alert('Please select a doctor.');
            return;
        }
        if (!selectedDoctorCharge) {
            alert('Please select a doctor charge.');
            return;
        }
        if (!selectedChannelingCharge) {
            alert('Please select a channeling charge.');
            return;
        }
        setShowModal(true); // Show the modal when all validations pass
    };


    const handleCloseModal = () => {
        setShowModal(false); // Close the modal
        setCashAmount(0); // Reset cash input
        setBalance(0); // Reset balance
    };

    const handleCashAmountChange = (e) => {
        const enteredCash = parseFloat(e.target.value);
        setCashAmount(enteredCash);

        const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const doctorCharge = doctorCharges.find(charge => charge.id === selectedDoctorCharge)?.charge || 0;
        const channelingCharge = channelingCharges.find(charge => charge.id === selectedChannelingCharge)?.charge || 0;

        const totalWithCharges = totalAmount + parseFloat(doctorCharge) + parseFloat(channelingCharge);
        setBalance(enteredCash - totalWithCharges);
    };

    const handlePrintBill = async () => {
        setIsPrinting(true); // Start loading
        try {
            // First update the database
            for (const item of cart) {
                const drugRef = doc(db, 'drugs', item.id);

                // Get the current drug data
                const drugSnapshot = await getDocs(collection(db, 'drugs'));
                const currentDrug = drugSnapshot.docs
                    .find(doc => doc.id === item.id)?.data();

                if (currentDrug) {
                    // Update the quantity in the database
                    await updateDoc(drugRef, {
                        quantity: currentDrug.quantity - item.quantity
                    });
                }
            }

            // Then handle the printing
            const billContent = document.getElementById('bill-section').innerHTML;
            const originalContent = document.body.innerHTML;

            document.body.innerHTML = billContent;
            window.print();
            document.body.innerHTML = originalContent;

            // Show success message
            alert('Sale completed successfully!');

            // Reload the page to refresh the drug list
            window.location.reload();
        } catch (error) {
            console.error('Error updating database:', error);
            alert('Error completing sale. Please try again.');
            setIsPrinting(false); // Stop loading on error
        }
    };

    return (
        <div className="indoor-pharmacy">
            <h1>Indoor Pharmacy Drugs</h1>

            {/* Doctor Selection Dropdown */}
            <div className="dropdown-container" style={{ marginTop: '10px', marginLeft: '100px' }}>
                <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="doctor-dropdown"
                >
                    <option value="">Select a doctor</option>
                    {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                            {doctor.name}
                        </option>
                    ))}
                </select>
            </div>

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

                    {/* Charges Dropdowns */}
                    <div className="charges-dropdowns">
                        <div className="dropdown-container">
                            <label>Doctor Charge:</label>
                            <select
                                value={selectedDoctorCharge}
                                onChange={(e) => setSelectedDoctorCharge(e.target.value)}
                                className="charge-dropdown"
                            >
                                <option value="">Select doctor charge</option>
                                {doctorCharges.map(charge => (
                                    <option key={charge.id} value={charge.id}>
                                        Rs. {charge.charge}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Channeling Charge: </label>
                            <select
                                value={selectedChannelingCharge}
                                onChange={(e) => setSelectedChannelingCharge(e.target.value)}
                                className="charge-dropdown"
                            >
                                <option value="">Select channeling charge</option>
                                {channelingCharges.map(charge => (
                                    <option key={charge.id} value={charge.id}>
                                        Rs. {charge.charge}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Sell Button */}
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button onClick={handleSell} className="sell-button" style={{ padding: '10px 30px', backgroundColor: '#8b07c9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '80%' }}>
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

                        {/* Doctor Charge */}
                        <div>
                            <label>Doctor Charge: </label>
                            <span>
                                Rs. {doctorCharges.find(charge => charge.id === selectedDoctorCharge)?.charge || 0}
                            </span>
                        </div>

                        {/* Channeling Charge */}
                        <div>
                            <label>Channeling Charge: </label>
                            <span>
                                Rs. {channelingCharges.find(charge => charge.id === selectedChannelingCharge)?.charge || 0}
                            </span>
                        </div>

                        {/* Total Amount */}
                        <div>
                            <label>Total Amount: </label>
                            <span>
                                Rs. {cart.reduce((total, item) => total + (item.price * item.quantity), 0) +
                                    parseFloat(doctorCharges.find(charge => charge.id === selectedDoctorCharge)?.charge || 0) +
                                    parseFloat(channelingCharges.find(charge => charge.id === selectedChannelingCharge)?.charge || 0)
                                }
                            </span>
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
                                disabled={isPrinting}
                                style={{
                                    backgroundColor: 'green',
                                    color: 'white',
                                    position: 'relative',
                                    minWidth: '100px',
                                    padding: '10px 10px'
                                }}
                            >
                                {isPrinting ? (
                                    <>
                                        <div className="spinner"></div>
                                        <span style={{ opacity: 0 }}>Print</span>
                                    </>
                                ) : (
                                    'Print'
                                )}
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
                    Total Cart Value:     Rs. {cart.reduce((total, item) => total + (item.price * item.quantity), 0)}<br></br>
                    Doctor Charge:        Rs. {doctorCharges.find(charge => charge.id === selectedDoctorCharge)?.charge || 0}<br></br>
                    Channeling Charge:    Rs. {channelingCharges.find(charge => charge.id === selectedChannelingCharge)?.charge || 0}<br></br>
                    --------------------------------<br></br>
                    Total Amount:         Rs. {cart.reduce((total, item) => total + (item.price * item.quantity), 0) +
                        parseFloat(doctorCharges.find(charge => charge.id === selectedDoctorCharge)?.charge || 0) +
                        parseFloat(channelingCharges.find(charge => charge.id === selectedChannelingCharge)?.charge || 0)}<br></br>
                    Cash Amount:          Rs. {cashAmount}<br></br>
                    Balance:              Rs. {balance}<br></br>
                    --------------------------------<br></br>
                    Thank you for your purchase!
                </pre>
            </div>
        </div>
    );
};

export default IndoorPharmacy;
