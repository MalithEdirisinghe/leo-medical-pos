import React, { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import qz from "qz-tray";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import "../../css/Dressing.css";

const generateUniqueSaleId = async () => {
  const salesSnapshot = await getDocs(collection(db, "dressingSales"));
  const existingIds = new Set(salesSnapshot.docs.map(doc => doc.data().saleId));

  let uniqueId = "";
  let isUnique = false;

  while (!isUnique) {
    uniqueId = "DRS-" + Math.floor(100000 + Math.random() * 900000);
    if (!existingIds.has(uniqueId)) {
      isUnique = true;
    }
  }

  return uniqueId;
};

const Dressing = () => {
  const [patientName, setPatientName] = useState("");
  const [doctorList, setDoctorList] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [dressingType, setDressingType] = useState("");
  const [dressingCharge, setDressingCharge] = useState("");
  const [doctorCharge, setDoctorCharge] = useState("");
  const [channelingCharge, setChannelingCharge] = useState("");
  const [success, setSuccess] = useState(false);
  const cashierName = localStorage.getItem("cashierName") || "Unknown";
  const [showModal, setShowModal] = useState(false);
  const [cash, setCash] = useState("");
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sutureOptions = [
    { total: 1000, doc: 400, channeling: 600 },
    { total: 1200, doc: 500, channeling: 700 },
    { total: 1400, doc: 600, channeling: 800 },
  ];

  useEffect(() => {
    const fetchDoctors = async () => {
      const doctorSnapshot = await getDocs(collection(db, "doctors"));
      const docs = doctorSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDoctorList(docs);
    };
    fetchDoctors();

    qz.websocket.connect().catch((err) => console.error("QZ Errors:", err));
  }, []);

  useEffect(() => {
    if (!qz.websocket.isActive()) {
      // 👇 Development mode: skip certificate checks
      qz.security.setCertificatePromise(() => Promise.resolve(""));
      qz.security.setSignaturePromise(() => Promise.resolve(""));

      qz.websocket.connect()
        .then(() => console.log("✅ QZ connected"))
        .catch(err => console.error("❌ QZ Connection Error:", err));
    }
  }, []);

  useEffect(() => {
    if (dressingType === "Normal") {
      if (dressingCharge) {
        const half = parseFloat(dressingCharge) / 2;
        setDoctorCharge(half);
        setChannelingCharge(half);
      } else {
        setDoctorCharge("");
        setChannelingCharge("");
      }
    }
  }, [dressingCharge, dressingType]);

  const handleSutureSelection = (value) => {
    const option = sutureOptions.find((item) => item.total === parseInt(value));
    if (option) {
      setDressingCharge(option.total);
      setDoctorCharge(option.doc);
      setChannelingCharge(option.channeling);
    }
  };

  const handlePrintAndSave = async () => {
    if (
      !patientName ||
      !selectedDoctorId ||
      !dressingType ||
      !dressingCharge ||
      !doctorCharge ||
      !channelingCharge ||
      !cash ||
      isNaN(balance)
    ) {
      alert("Please fill all required fields correctly.");
      return;
    }
  
    setIsLoading(true);
  
    try {
      const doctorName = doctorList.find((d) => d.id === selectedDoctorId)?.name || "Unknown";
  
      // 🔒 Generate safe unique sale ID
      const saleId = await generateUniqueSaleId();
  
      const saleData = {
        saleId,
        patientName,
        dressingType,
        dressingCharge: parseFloat(dressingCharge),
        doctorCharge: parseFloat(doctorCharge),
        channelingCharge: parseFloat(channelingCharge),
        total: parseFloat(dressingCharge),
        doctorName,
        doctorId: selectedDoctorId,
        cashierName,
        cash: parseFloat(cash),
        balance: parseFloat(balance),
        createdAt: Timestamp.now(),
      };  

      console.log("🧾 Sale Data to Save:", saleData);

      // Step 3: Save to Firestore
      await addDoc(collection(db, "dressingSales"), saleData);

      // Step 4: Prepare thermal receipt
      const config = qz.configs.create("XP-58 (copy 1)"); // Replace with actual printer name
      const now = new Date();
      const formattedDateTime = now.toLocaleString();

      const data = [
        "\x1B\x45\x01",        // Bold ON
        "\x1D\x21\x11",        // Double width + height
        "LEO Medical POS\n\n",
        "\x1D\x21\x00",        // Back to normal size
        "\x1B\x45\x01",

        "  --- Dressing Bill ---\n",
        "-----------------------------\n",
        "\x1B\x45\x00",
        `Sale ID     : ${saleId}\n`,
        `Patient     : ${patientName}\n`,
        `Doctor      : ${doctorName}\n`,
        `Cashier     : ${cashierName}\n`,
        `Dressing    : ${dressingType}\n`,
        "-----------------------------\n",
        `Cash        : Rs. ${cash}\n`,
        `Total       : Rs. ${dressingCharge}\n`,
        `Balance     : Rs. ${balance}\n`,
        "-----------------------------\n",
        `Date : ${formattedDateTime}\n\n`,
        "  Thank you and get well soon\n\n\n",
        "\x1D\x56\x01"
      ];

      // Step 5: Print
      await qz.print(config, data);
      console.log("🖨️ Print success");

      // Step 6: Reset UI
      setSuccess(false);
      setPatientName("");
      setSelectedDoctorId("");
      setDressingType("");
      setDressingCharge("");
      setDoctorCharge("");
      setChannelingCharge("");
      setCash("");
      setBalance(null);
      setShowModal(false);

    } catch (err) {
      console.error("❌ Error during save or print:", err);
      alert("Something went wrong while saving or printing.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dressing-container">
      <h2>Dressing Sales Entry</h2>
      <form onSubmit={handlePrintAndSave} className="dressing-form">
        <label>Patient Name:</label>
        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />

        <label>Select Doctor:</label>
        <select
          value={selectedDoctorId}
          onChange={(e) => setSelectedDoctorId(e.target.value)}
        >
          <option value="">-- Select --</option>
          {doctorList.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))}
        </select>

        <label>Dressing Type:</label>
        <select
          value={dressingType}
          onChange={(e) => {
            setDressingType(e.target.value);
            setDressingCharge("");
            setDoctorCharge("");
            setChannelingCharge("");
          }}
        >
          <option value="">-- Select Type --</option>
          <option value="Normal">Normal Dressing</option>
          <option value="Sutures">Sutures Dressing</option>
        </select>

        {dressingType === "Normal" && (
          <>
            <label>Enter Dressing Charge:</label>
            <input
              type="number"
              value={dressingCharge}
              onChange={(e) => setDressingCharge(e.target.value)}
            />
          </>
        )}

        {dressingType === "Sutures" && (
          <>
            <label>Select Sutures Price:</label>
            <select onChange={(e) => handleSutureSelection(e.target.value)}>
              <option value="">-- Select Price --</option>
              {sutureOptions.map((item) => (
                <option key={item.total} value={item.total}>
                  Rs.{item.total} (Doc: {item.doc}, Channeling: {item.channeling})
                </option>
              ))}
            </select>
          </>
        )}

        <label>Doctor Charge:</label>
        <input type="number" value={doctorCharge} disabled />

        <label>Channeling Charge:</label>
        <input type="number" value={channelingCharge} disabled />

        <label>Total:</label>
        <input type="number" value={dressingCharge} disabled />

        <button
          type="button"
          onClick={() => {
            if (
              !patientName ||
              !selectedDoctorId ||
              !dressingType ||
              !dressingCharge ||
              !doctorCharge ||
              !channelingCharge
            ) {
              alert("Please fill all fields before checking out.");
              return;
            }
            setShowModal(true);
          }}
        >
          Checkout
        </button>

        {success && <p className="success-msg">Sale added successfully!</p>}
      </form>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Dressing Sale</h3>
            <p><strong>Total:</strong> Rs. {dressingCharge}</p>

            <label>Enter Cash:</label>
            <input
              type="number"
              value={cash}
              onChange={(e) => {
                setCash(e.target.value);
                const bal = parseFloat(e.target.value) - parseFloat(dressingCharge);
                setBalance(isNaN(bal) ? null : bal);
              }}
            />

            {balance !== null && (
              <p><strong>Balance:</strong> Rs. {balance}</p>
            )}

            <div className="modal-buttons">
              <button
                onClick={handlePrintAndSave}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.5 : 1 }}
              >
                {isLoading ? <div className="spinner" /> : "Print & Save"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.5 : 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dressing;
