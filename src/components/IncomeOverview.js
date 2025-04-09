import React, { useEffect, useState } from 'react';
import '../css/IncomeOverview.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const IncomeOverview = () => {
  const [indoorData, setIndoorData] = useState([]);
  const [outdoorData, setOutdoorData] = useState([]);
  const [investigationData, setInvestigationData] = useState([]);
  const [dressingData, setDressingData] = useState([]);
  const [investigationSettleData, setInvestigationSettleData] = useState([]);
  const [loyaltyIndoorData, setLoyaltyIndoorData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [indoorSearch, setIndoorSearch] = useState('');
  const [loyaltyIndoorSearch, setLoyaltyIndoorSearch] = useState('');
  const [outdoorSearch, setOutdoorSearch] = useState('');
  const [investigationSearch, setInvestigationSearch] = useState('');
  const [investigationSettleSearch, setInvestigationSettleSearch] = useState('');
  const [dressingSearch, setDressingSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [globalDoctorSearch, setGlobalDoctorSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const indoorSnap = await getDocs(collection(db, 'indoorSales'));
      const outdoorSnap = await getDocs(collection(db, 'outdoorSales'));
      const investigationSnap = await getDocs(collection(db, 'investigationSales'));
      const dressingSnap = await getDocs(collection(db, 'dressingSales'));
      const investigationSettleSnap = await getDocs(collection(db, 'investigationSettle'));
      const loyaltySnap = await getDocs(collection(db, 'loyaltyIndoorSales'));

      setIndoorData(indoorSnap.docs.map(doc => doc.data()));
      setOutdoorData(outdoorSnap.docs.map(doc => doc.data()));
      setInvestigationData(investigationSnap.docs.map(doc => doc.data()));
      setDressingData(dressingSnap.docs.map(doc => doc.data()));
      setInvestigationSettleData(investigationSettleSnap.docs.map(doc => doc.data()));
      setLoyaltyIndoorData(loyaltySnap.docs.map(doc => doc.data()));
      setLoading(false);
    };

    fetchData();
  }, []);

  const isSameDate = (timestamp, selectedDate) => {
    if (!selectedDate || !timestamp) return true;
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toISOString().slice(0, 10) === selectedDate;
  };

  const filteredIndoor = indoorData.filter(e =>
    isSameDate(e.timestamp, selectedDate) &&
    (
      (e.saleId || '').toLowerCase().includes(indoorSearch.toLowerCase()) ||
      (e.cashier || '').toLowerCase().includes(indoorSearch.toLowerCase()) ||
      (e.doctor || '').toLowerCase().includes(indoorSearch.toLowerCase())
    ) &&
    (e.doctor || '').toLowerCase().includes(globalDoctorSearch.toLowerCase())
  );

  const filteredLoyaltyIndoor = loyaltyIndoorData.filter(e =>
    isSameDate(e.timestamp, selectedDate) &&
    (
      (e.saleId || '').toLowerCase().includes(loyaltyIndoorSearch.toLowerCase()) ||
      (e.cashier || '').toLowerCase().includes(loyaltyIndoorSearch.toLowerCase()) ||
      (e.doctor || '').toLowerCase().includes(loyaltyIndoorSearch.toLowerCase())
    )&&
    (e.doctor || '').toLowerCase().includes(globalDoctorSearch.toLowerCase())
  );

  const filteredOutdoor = outdoorData.filter(e =>
    isSameDate(e.timestamp, selectedDate) &&
    (
      (e.saleId || '').toLowerCase().includes(outdoorSearch.toLowerCase()) ||
      (e.cashier || '').toLowerCase().includes(outdoorSearch.toLowerCase())
    )
  );

  const filteredInvestigation = investigationData.filter(e =>
    isSameDate(e.timestamp, selectedDate) &&
    (
      (e.saleId || '').toLowerCase().includes(investigationSearch.toLowerCase()) ||
      (e.customerName || '').toLowerCase().includes(investigationSearch.toLowerCase()) ||
      (e.cashierName || '').toLowerCase().includes(investigationSearch.toLowerCase())
    )
  );

  const filteredInvestigationSettle = investigationSettleData.filter(e =>
    isSameDate(e.settledAt, selectedDate) &&
    (
      (e.saleId || '').toLowerCase().includes(investigationSettleSearch.toLowerCase()) ||
      (e.customerName || '').toLowerCase().includes(investigationSettleSearch.toLowerCase()) ||
      (e.cashierName || '').toLowerCase().includes(investigationSettleSearch.toLowerCase())
    )
  );

  const filteredDressing = dressingData.filter(e =>
    isSameDate(e.createdAt, selectedDate) &&
    (
      (
        (e.saleId || '').toLowerCase().includes(dressingSearch.toLowerCase()) ||
        (e.patientName || '').toLowerCase().includes(dressingSearch.toLowerCase()) ||
        (e.cashierName || '').toLowerCase().includes(dressingSearch.toLowerCase())
      ) &&
      (e.doctorName || '').toLowerCase().includes(globalDoctorSearch.toLowerCase())
    )
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="income-overview">
      <h1>Income Overview</h1>
      {loading ? (
        <div className="loading-container">
          <div class="loading">
            <svg width="64px" height="48px">
              <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back"></polyline>
              <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front"></polyline>
            </svg>
          </div>
        </div>
      ) : (
        <div className="main-container">
          <div className="date-filter-container">
            <label><strong>Filter by Date:</strong></label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="doctor-filter-container">
            <label><strong>Search by Doctor Name (Global):</strong></label>
            <input
              type="text"
              placeholder="Enter doctor name..."
              value={globalDoctorSearch}
              onChange={(e) => setGlobalDoctorSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Indoor Pharmacy */}
          <div className="sub-section">
            <h2>Indoor Pharmacy</h2>
            <input
              type="text"
              placeholder="Search by Sale ID, Doctor, or Cashier"
              value={indoorSearch}
              onChange={(e) => setIndoorSearch(e.target.value)}
              className="search-input"
            />
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Date & Time</th>
                    <th>Cart Items</th>
                    <th>Cashier</th>
                    <th>Doctor</th>
                    <th>Drugs Charge</th>
                    <th>Doctor Charge</th>
                    <th>Channeling Charge</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIndoor.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.saleId || '-'}</td>
                      <td>{formatDate(entry.timestamp)}</td>
                      <td>
                        {entry.cartItems?.length > 0 ? (
                          <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {entry.cartItems.map((item, idx) => (
                              <li key={idx}>{item.name} x {item.quantity} @ Rs. {item.price}</li>
                            ))}
                          </ul>
                        ) : '-'}
                      </td>
                      <td>{entry.cashier || '-'}</td>
                      <td>{entry.doctor || '-'}</td>
                      <td>Rs. {entry.cartTotal || 0}</td>
                      <td>Rs. {entry.doctorCharge || 0}</td>
                      <td>Rs. {entry.channelingCharge || 0}</td>
                      <td>Rs. {entry.totalAmount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-totals">
              <strong>Drugs Charge:</strong> Rs. {filteredIndoor.reduce((a, e) => a + (e.cartTotal || 0), 0)}<br />
              <strong>Doctor Charge:</strong> Rs. {filteredIndoor.reduce((a, e) => a + (e.doctorCharge || 0), 0)}<br />
              <strong>Channeling Charge:</strong> Rs. {filteredIndoor.reduce((a, e) => a + (e.channelingCharge || 0), 0)}<br />
              <strong>Total Amount:</strong> Rs. {filteredIndoor.reduce((a, e) => a + (e.totalAmount || 0), 0)}
            </div>
            <div><strong>Number of patient:</strong> {filteredIndoor.length}</div>
          </div>

          {/* Loyalty Indoor Pharmacy */}
          <div className="sub-section">
            <h2>Loyalty Indoor Pharmacy</h2>
            <input
              type="text"
              placeholder="Search by Sale ID, Doctor, or Cashier"
              value={loyaltyIndoorSearch}
              onChange={(e) => setLoyaltyIndoorSearch(e.target.value)}
              className="search-input"
            />
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Date & Time</th>
                    <th>Cart Items</th>
                    <th>Cashier</th>
                    <th>Doctor</th>
                    <th>Drugs Charge</th>
                    <th>Doctor Charge</th>
                    <th>Channeling Charge</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoyaltyIndoor.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.saleId || '-'}</td>
                      <td>{formatDate(entry.timestamp)}</td>
                      <td>
                        {entry.cartItems?.length > 0 ? (
                          <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {entry.cartItems.map((item, idx) => (
                              <li key={idx}>{item.name} x {item.quantity} @ Rs. {item.price}</li>
                            ))}
                          </ul>
                        ) : '-'}
                      </td>
                      <td>{entry.cashier || '-'}</td>
                      <td>{entry.doctor || '-'}</td>
                      <td>Rs. {entry.cartTotal || 0}</td>
                      <td>Rs. {entry.doctorCharge || 0}</td>
                      <td>Rs. {entry.channelingCharge || 0}</td>
                      <td>Rs. {entry.totalAmount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-totals">
              <strong>Drugs Charge:</strong> Rs. {filteredLoyaltyIndoor.reduce((a, e) => a + (e.cartTotal || 0), 0)}<br />
              <strong>Doctor Charge:</strong> Rs. {filteredLoyaltyIndoor.reduce((a, e) => a + (e.doctorCharge || 0), 0)}<br />
              <strong>Channeling Charge:</strong> Rs. {filteredLoyaltyIndoor.reduce((a, e) => a + (e.channelingCharge || 0), 0)}<br />
              <strong>Total Amount:</strong> Rs. {filteredLoyaltyIndoor.reduce((a, e) => a + (e.totalAmount || 0), 0)}
            </div>
            <div><strong>Number of patient:</strong> {filteredLoyaltyIndoor.length}</div>
          </div>

          {/* Outdoor Pharmacy */}
          <div className="sub-section">
            <h2>Outdoor Pharmacy</h2>
            <input
              type="text"
              placeholder="Search by Sale ID, Doctor, or Cashier"
              value={outdoorSearch}
              onChange={(e) => setOutdoorSearch(e.target.value)}
              className="search-input"
            />
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Date & Time</th>
                    <th>Cart Items</th>
                    <th>Cashier</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutdoor.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.saleId || '-'}</td>
                      <td>{formatDate(entry.timestamp)}</td>
                      <td>
                        {entry.cartItems?.length > 0 ? (
                          <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            {entry.cartItems.map((item, idx) => (
                              <li key={idx}>{item.name} x {item.quantity} @ Rs. {item.price}</li>
                            ))}
                          </ul>
                        ) : '-'}</td>
                      <td>{entry.cashier || '-'}</td>
                      <td>Rs. {entry.totalAmount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-totals">
              <strong>Total Amount:</strong> Rs. {filteredOutdoor.reduce((a, e) => a + (e.totalAmount || 0), 0)}
            </div>
            <div><strong>Number of customers:</strong> {filteredOutdoor.length}</div>
          </div>

          {/* Investigation */}
          <div className="sub-section">
            <h2>Investigation</h2>
            <input
              type="text"
              placeholder="Search by Sale ID, Doctor, or Cashier"
              value={investigationSearch}
              onChange={(e) => setInvestigationSearch(e.target.value)}
              className="search-input"
            />
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Date & Time</th>
                    <th>Cart Items</th>
                    <th>Cashier</th>
                    <th>Patient Name</th>
                    <th>Negative Cash</th>
                    <th>Total Amount</th>
                    <th>Settle Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestigation.map((entry, index) => {
                    const receivedCash =
                      entry.cash && entry.cash < entry.total && entry.balance !== 0
                        ? entry.cash - entry.total
                        : '-';
                    return (
                      <tr key={index}>
                        <td>{entry.saleId || '-'}</td>
                        <td>{formatDate(entry.timestamp)}</td>
                        <td>
                          {entry.cartItems?.length > 0 ? (
                            <ul style={{ paddingLeft: '20px', margin: 0 }}>
                              {entry.cartItems.map((item, idx) => (
                                <li key={idx}>{item.name} x {item.quantity} @ Rs. {item.price}</li>
                              ))}
                            </ul>
                          ) : '-'}</td>
                        <td>{entry.cashierName || '-'}</td>
                        <td>{entry.customerName || '-'}</td>
                        <td>{receivedCash !== '-' ? `Rs. ${receivedCash}` : '-'}</td>
                        <td>Rs. {entry.total || 0}</td>
                        <td>
                          {(entry.cash && entry.cash < entry.total && entry.balance !== 0)
                            ? (entry.settleStatus ? '✅ Settled' : '❌ Not Settled')
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-totals">
              <div><strong>Total Billed:</strong> Rs. {filteredInvestigation.reduce((a, e) => a + (e.total || 0), 0)}</div>
              <div><strong>Total Unpaid (Negative Cash):</strong> Rs. {
                filteredInvestigation.reduce((a, e) => {
                  const isNegative = e.cash && e.cash < e.total && e.balance !== 0;
                  const unpaidAmount = isNegative ? e.total - e.cash : 0;
                  const settled = e.settleStatus ? unpaidAmount : 0;
                  return a + (unpaidAmount - settled);
                }, 0)
              }</div>
              <div><strong>Total Received:</strong> Rs. {
                filteredInvestigation.reduce((a, e) => a + (e.total || 0), 0) -
                filteredInvestigation.reduce((a, e) =>
                  (e.cash && e.cash < e.total && e.balance !== 0)
                    ? a + (e.total - e.cash)
                    : a
                  , 0)
              }</div>
            </div>
            <div><strong>Number of patient:</strong> {filteredInvestigation.length}</div>
          </div>

          {/* Investigation Settlements */}
          <div className="sub-section">
            <h2>Investigation Settlements</h2>
            <input
              type="text"
              placeholder="Search by Sale ID, Doctor, or Cashier"
              value={investigationSettleSearch}
              onChange={(e) => setInvestigationSettleSearch(e.target.value)}
              className="search-input"
            />
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Settle ID</th>
                    <th>Date & Time</th>
                    <th>Patient Name</th>
                    <th>Cashier</th>
                    <th>Cash Received</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestigationSettle.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.saleId || '-'}</td>
                      <td>{formatDate(entry.settledAt)}</td>
                      <td>{entry.customerName || '-'}</td>
                      <td>{entry.cashierName || '-'}</td>
                      <td>Rs. {entry.settledAmount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-totals">
              <strong>Total Settled:</strong> Rs. {filteredInvestigationSettle.reduce((a, e) => a + (e.settledAmount || 0), 0)}
            </div>
          </div>

          {/* Dressing */}
          <div className="sub-section">
            <h2>Dressing</h2>
            <input
              type="text"
              placeholder="Search by Sale ID, Doctor, or Cashier"
              value={dressingSearch}
              onChange={(e) => setDressingSearch(e.target.value)}
              className="search-input"
            />
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Date & Time</th>
                    <th>Patient Name</th>
                    <th>Dressing Type</th>
                    <th>Doctor Name</th>
                    <th>Cashier</th>
                    <th>Doctor Charge</th>
                    <th>Dressing Charge</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDressing.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.saleId || '-'}</td>
                      <td>{formatDate(entry.createdAt)}</td>
                      <td>{entry.patientName || '-'}</td>
                      <td>{entry.dressingType || '-'}</td>
                      <td>{entry.doctorName || '-'}</td>
                      <td>{entry.cashierName || '-'}</td>
                      <td>Rs. {entry.doctorCharge || 0}</td>
                      <td>Rs. {entry.dressingCharge || 0}</td>
                      <td>Rs. {entry.total || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-totals">
              <strong>Dressing Charge:</strong> Rs. {filteredDressing.reduce((a, e) => a + (e.dressingCharge || 0), 0)}<br />
              <strong>Doctor Charge:</strong> Rs. {filteredDressing.reduce((a, e) => a + (e.doctorCharge || 0), 0)}<br />
              <strong>Total Amount:</strong> Rs. {filteredDressing.reduce((a, e) => a + (e.total || 0), 0)}
            </div>
            <div><strong>Number of patient:</strong> {filteredDressing.length}</div>
          </div>
          <div className="grand-totals">
            <h3>📊 Grand Totals</h3>
            <p><strong>Total Amount:</strong> Rs. {
              filteredIndoor.reduce((a, e) => a + (e.totalAmount || 0), 0) +
              filteredOutdoor.reduce((a, e) => a + (e.totalAmount || 0), 0) +
              filteredLoyaltyIndoor.reduce((a, e) => a + (e.totalAmount || 0), 0) +
              filteredDressing.reduce((a, e) => a + (e.total || 0), 0) +
              (
                filteredInvestigation.reduce((a, e) => a + (e.total || 0), 0) -
                filteredInvestigation.reduce((a, e) =>
                  (e.cash && e.cash < e.total && e.balance !== 0)
                    ? a + (e.total - e.cash)
                    : a
                  , 0)
              ) +
              filteredInvestigationSettle.reduce((a, e) => a + (e.settledAmount || 0), 0)
            }</p>
            <p><strong>Total Doctor Charge:</strong> Rs. {
              filteredIndoor.reduce((a, e) => a + (e.doctorCharge || 0), 0) +
              filteredDressing.reduce((a, e) => a + (e.doctorCharge || 0), 0) +
              filteredLoyaltyIndoor.reduce((a, e) => a + (e.doctorCharge || 0), 0)
            }</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeOverview;