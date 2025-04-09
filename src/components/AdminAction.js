import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; // Ensure firebaseConfig is correctly set up
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Add this import at the top
import '../css/AdminAction.css';

const AdminAction = () => {
    const navigate = useNavigate(); // Add this hook

    const [doctorName, setDoctorName] = useState('');
    const [doctorCharge, setDoctorCharge] = useState('');
    const [channelingCharge, setChannelingCharge] = useState('');

    const [doctors, setDoctors] = useState([]);
    const [doctorCharges, setDoctorCharges] = useState([]);
    const [channelingCharges, setChannelingCharges] = useState([]);

    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDoctorCharge, setSelectedDoctorCharge] = useState(null);
    const [selectedChannelingCharge, setSelectedChannelingCharge] = useState(null);

    // Fetch data from Firebase
    const fetchData = async () => {
        const doctorsSnapshot = await getDocs(collection(db, 'doctors'));
        const doctorChargesSnapshot = await getDocs(collection(db, 'doctorCharges'));
        const channelingChargesSnapshot = await getDocs(collection(db, 'channelingCharges'));

        setDoctors(doctorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setDoctorCharges(doctorChargesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setChannelingCharges(channelingChargesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Add a new doctor
    const handleAddDoctor = async () => {
        if (doctorName.trim() === '') {
            alert('Doctor name cannot be empty');
            return;
        }
        try {
            await addDoc(collection(db, 'doctors'), { name: doctorName });
            alert('Doctor added successfully!');
            setDoctorName('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error adding doctor: ', error);
        }
    };

    // Add a new doctor charge
    const handleAddDoctorCharge = async () => {
        if (doctorCharge.trim() === '') {
            alert('Doctor charge cannot be empty');
            return;
        }
        try {
            await addDoc(collection(db, 'doctorCharges'), { charge: parseFloat(doctorCharge) });
            alert('Doctor charge added successfully!');
            setDoctorCharge('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error adding doctor charge: ', error);
        }
    };

    // Add a new channeling charge
    const handleAddChannelingCharge = async () => {
        if (channelingCharge.trim() === '') {
            alert('Channeling charge cannot be empty');
            return;
        }
        try {
            await addDoc(collection(db, 'channelingCharges'), { charge: parseFloat(channelingCharge) });
            alert('Channeling charge added successfully!');
            setChannelingCharge('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error adding channeling charge: ', error);
        }
    };

    // Update selected doctor
    const handleUpdateDoctor = async () => {
        if (!selectedDoctor) return;
        try {
            await updateDoc(doc(db, 'doctors', selectedDoctor.id), { name: doctorName });
            alert('Doctor updated successfully!');
            setSelectedDoctor(null);
            setDoctorName('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error updating doctor: ', error);
        }
    };

    // Delete selected doctor
    const handleDeleteDoctor = async () => {
        if (!selectedDoctor) return;
        try {
            await deleteDoc(doc(db, 'doctors', selectedDoctor.id));
            alert('Doctor deleted successfully!');
            setSelectedDoctor(null);
            setDoctorName('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error deleting doctor: ', error);
        }
    };

    // Update selected doctor charge
    const handleUpdateDoctorCharge = async () => {
        if (!selectedDoctorCharge) return;
        try {
            await updateDoc(doc(db, 'doctorCharges', selectedDoctorCharge.id), { charge: parseFloat(doctorCharge) });
            alert('Doctor charge updated successfully!');
            setSelectedDoctorCharge(null);
            setDoctorCharge('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error updating doctor charge: ', error);
        }
    };

    // Delete selected doctor charge
    const handleDeleteDoctorCharge = async () => {
        if (!selectedDoctorCharge) return;
        try {
            await deleteDoc(doc(db, 'doctorCharges', selectedDoctorCharge.id));
            alert('Doctor charge deleted successfully!');
            setSelectedDoctorCharge(null);
            setDoctorCharge('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error deleting doctor charge: ', error);
        }
    };

    // Update selected channeling charge
    const handleUpdateChannelingCharge = async () => {
        if (!selectedChannelingCharge) return;
        try {
            await updateDoc(doc(db, 'channelingCharges', selectedChannelingCharge.id), { charge: parseFloat(channelingCharge) });
            alert('Channeling charge updated successfully!');
            setSelectedChannelingCharge(null);
            setChannelingCharge('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error updating channeling charge: ', error);
        }
    };

    // Delete selected channeling charge
    const handleDeleteChannelingCharge = async () => {
        if (!selectedChannelingCharge) return;
        try {
            await deleteDoc(doc(db, 'channelingCharges', selectedChannelingCharge.id));
            alert('Channeling charge deleted successfully!');
            setSelectedChannelingCharge(null);
            setChannelingCharge('');
            fetchData(); // Refresh data
        } catch (error) {
            console.error('Error deleting channeling charge: ', error);
        }
    };

    return (
        <div className="admin-action">
            <button 
                className="back-button" 
                onClick={() => navigate(-1)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    maxWidth: '100px',
                }}
            >
                ← Back
            </button>
            <h1>Admin Actions</h1>

            <div className="form-row">
                {/* Add Doctor Section */}
                <div className="form-containers">
                    <h2>Add New Doctor</h2>
                    <input
                        type="text"
                        placeholder="Doctor Name"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                    />
                    <button className="add-button" onClick={handleAddDoctor}>
                        Add Doctor
                    </button>
                </div>

                {/* Add Doctor Charge Section */}
                <div className="form-containers">
                    <h2>Add New Doctor Charge</h2>
                    <input
                        type="number"
                        placeholder="Doctor Charge"
                        value={doctorCharge}
                        onChange={(e) => setDoctorCharge(e.target.value)}
                    />
                    <button className="add-button" onClick={handleAddDoctorCharge}>
                        Add Charge
                    </button>
                </div>

                {/* Add Channeling Charge Section */}
                <div className="form-containers">
                    <h2>Add New Channeling Charge</h2>
                    <input
                        type="number"
                        placeholder="Channeling Charge"
                        value={channelingCharge}
                        onChange={(e) => setChannelingCharge(e.target.value)}
                    />
                    <button className="add-button" onClick={handleAddChannelingCharge}>
                        Add Charge
                    </button>
                </div>

                {/* Edit/Delete Doctor */}
                <div className="form-containers">
                    <h2>Edit or Delete Doctor</h2>
                    <select
                        onChange={(e) => {
                            const doctor = doctors.find(d => d.id === e.target.value);
                            setSelectedDoctor(doctor);
                            setDoctorName(doctor ? doctor.name : '');
                        }}
                        value={selectedDoctor ? selectedDoctor.id : ''}
                    >
                        <option value="">Select a Doctor</option>
                        {doctors.map(doctor => (
                            <option key={doctor.id} value={doctor.id}>
                                {doctor.name}
                            </option>
                        ))}
                    </select>
                    <button className="edit-button" onClick={handleUpdateDoctor} disabled={!selectedDoctor}>
                        Update
                    </button>
                    <button className="delete-button" onClick={handleDeleteDoctor} disabled={!selectedDoctor}>
                        Delete
                    </button>
                </div>

                {/* Edit/Delete Doctor Charge */}
                <div className="form-containers">
                    <h2>Edit or Delete Doctor Charge</h2>
                    <select
                        onChange={(e) => {
                            const charge = doctorCharges.find(c => c.id === e.target.value);
                            setSelectedDoctorCharge(charge);
                            setDoctorCharge(charge ? charge.charge : '');
                        }}
                        value={selectedDoctorCharge ? selectedDoctorCharge.id : ''}
                    >
                        <option value="">Select a Charge</option>
                        {doctorCharges.map(charge => (
                            <option key={charge.id} value={charge.id}>
                                {charge.charge}
                            </option>
                        ))}
                    </select>
                    <button className="edit-button" onClick={handleUpdateDoctorCharge} disabled={!selectedDoctorCharge}>
                        Update
                    </button>
                    <button className="delete-button" onClick={handleDeleteDoctorCharge} disabled={!selectedDoctorCharge}>
                        Delete
                    </button>
                </div>

                {/* Edit/Delete Channeling Charge */}
                <div className="form-containers">
                    <h2>Edit or Delete Channeling Charge</h2>
                    <select
                        onChange={(e) => {
                            const charge = channelingCharges.find(c => c.id === e.target.value);
                            setSelectedChannelingCharge(charge);
                            setChannelingCharge(charge ? charge.charge : '');
                        }}
                        value={selectedChannelingCharge ? selectedChannelingCharge.id : ''}
                    >
                        <option value="">Select a Charge</option>
                        {channelingCharges.map(charge => (
                            <option key={charge.id} value={charge.id}>
                                {charge.charge}
                            </option>
                        ))}
                    </select>
                    <button className="edit-button" onClick={handleUpdateChannelingCharge} disabled={!selectedChannelingCharge}>
                        Update
                    </button>
                    <button className="delete-button" onClick={handleDeleteChannelingCharge} disabled={!selectedChannelingCharge}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminAction;