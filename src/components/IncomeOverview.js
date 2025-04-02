import React, { useEffect, useState } from 'react';
import '../css/IncomeOverview.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const IncomeOverview = () => {
  const [indoorData, setIndoorData] = useState([]);
  const [outdoorData, setOutdoorData] = useState([]);
  const [investigationData, setInvestigationData] = useState([]);
  const [dressingData, setDressingData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const indoorSnap = await getDocs(collection(db, 'indoorSales'));
      const outdoorSnap = await getDocs(collection(db, 'outdoorSales'));
      const investigationSnap = await getDocs(collection(db, 'investigationSales'));
      const dressingSnap = await getDocs(collection(db, 'dressingSales'));

      setIndoorData(indoorSnap.docs.map(doc => doc.data()));
      setOutdoorData(outdoorSnap.docs.map(doc => doc.data()));
      setInvestigationData(investigationSnap.docs.map(doc => doc.data()));
      setDressingData(dressingSnap.docs.map(doc => doc.data()));
    };

    fetchData();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleString();
  };

  const renderTable = (title, data, config) => (
    <div className="sub-section">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Patient / Customer</th>
            <th>Cashier</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => (
            <tr key={index}>
              <td>{formatDate(entry[config.dateKey])}</td>
              <td>{entry[config.nameKey] || '-'}</td>
              <td>{entry[config.cashierKey] || '-'}</td>
              <td>Rs. {entry[config.totalKey] || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="income-overview">
      <h1>Income Overview</h1>

      <div className="main-container">
        {renderTable("Indoor Pharmacy", indoorData, {
          dateKey: 'timestamp',
          nameKey: 'doctor',
          cashierKey: 'cashier',
          totalKey: 'totalAmount',
        })}

        {renderTable("Outdoor Pharmacy", outdoorData, {
          dateKey: 'timestamp',
          nameKey: '',
          cashierKey: 'cashier',
          totalKey: 'totalAmount',
        })}

        {renderTable("Investigation", investigationData, {
          dateKey: 'timestamp',
          nameKey: 'customerName',
          cashierKey: 'cashierName',
          totalKey: 'total',
        })}

        {renderTable("Dressing", dressingData, {
          dateKey: 'createdAt',
          nameKey: 'patientName',
          cashierKey: 'cashierName',
          totalKey: 'total',
        })}
      </div>
    </div>
  );
};

export default IncomeOverview;
