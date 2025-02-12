import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // Import useNavigate for navigation
import '../css/CashierDashboard.css';  // Ensure to import the CSS file
import 'font-awesome/css/font-awesome.min.css';

const CashierDashboard = () => {
    const navigate = useNavigate();  // Initialize navigate function
    const [time, setTime] = useState('');
    const [cashierName, setCashierName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const cashierAuthenticated = localStorage.getItem('cashierAuthenticated');
        const storedCashierName = localStorage.getItem('cashierName');
        
        if (!cashierAuthenticated || !storedCashierName) {
            navigate('/', { replace: true });
        }

        if (storedCashierName) {
            setCashierName(storedCashierName);
        }

        const interval = setInterval(() => {
            const currentTime = new Date().toLocaleTimeString();
            setTime(currentTime);
        }, 1000);

        return () => clearInterval(interval);
    }, [navigate]);

    const handleButtonClick = (action) => {
        switch (action) {
            case 'pharmacy':
                setIsModalOpen(true);
                break;
            case 'investigation':
                navigate('/admin-investigation');
                break;
            case 'dressing':
                navigate('/admin-dressing');
                break;
            case 'view-income':
                break;
            case 'logout':
                localStorage.removeItem('cashierName');
                localStorage.removeItem('cashierAuthenticated');
                alert('Logged out successfully!');
                navigate('/', { replace: true });
                break;
            default:
                break;
        }
    };

    const handleModalButtonClick = (buttonType) => {
        if (buttonType === 'Indoor') {
            navigate('/indoor-pharmacy');
        }else if(buttonType === 'Outdoor'){
            navigate('/outdoor-pharmacy');
        }
        setIsModalOpen(false);  // Close the modal after button click
    };

    return (
        <div className="cashier-dashboard">
            <h1>Cashier Dashboard</h1>

            <div className="cashier-info">
                <p><strong>Cashier: </strong>{cashierName}</p>
                <p><strong>Time: </strong>{time}</p>
            </div>

            <div className="button-containers">
                <button onClick={() => handleButtonClick('pharmacy')}>Pharmacy</button>
                <button onClick={() => handleButtonClick('investigation')}>Investigation</button>
                <button onClick={() => handleButtonClick('dressing')}>Dressing</button>
                <button onClick={() => handleButtonClick('view-income')}>View Income</button>
            </div>

            <div className="logout-button-container">
                <button onClick={() => handleButtonClick('logout')}>Logout</button>
            </div>

            {/* Modal for Indoor/Outdoor buttons */}
            {isModalOpen && (
                <div className="modal-overlay-cashier">
                    <div className="modal-content-cashier">
                        <h2>Select an Option</h2>
                        <button className="modal-btn-indoor" onClick={() => handleModalButtonClick('Indoor')}>
                            Indoor
                        </button>
                        <button className="modal-btn-outdoor" onClick={() => handleModalButtonClick('Outdoor')}>
                            Outdoor
                        </button>

                        {/* Close Icon */}
                        <i className="fa fa-times close-icon" onClick={() => setIsModalOpen(false)} aria-hidden="true" />
                    </div>
                </div>
            )}

        </div>
    );
};

export default CashierDashboard;
