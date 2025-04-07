import React, { useEffect, useState } from "react";
import qz from "qz-tray";

const PrinterSelector = () => {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(localStorage.getItem("selectedPrinter") || "");

  useEffect(() => {
    const loadPrinters = async () => {
      try {
        qz.security.setCertificatePromise(() => Promise.resolve(""));
        qz.security.setSignaturePromise(() => Promise.resolve(""));

        if (!qz.websocket.isActive()) {
          await qz.websocket.connect();
        }

        const list = await qz.printers.findAll();
        setPrinters(list);
      } catch (err) {
        console.error("QZ Tray Error:", err);
      }
    };

    loadPrinters();
  }, []);

  const handleSelect = (e) => {
    const printer = e.target.value;
    setSelectedPrinter(printer);
    localStorage.setItem("selectedPrinter", printer); // store globally
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <label><strong>Select Printer:</strong></label>
      <select value={selectedPrinter} onChange={handleSelect}>
        <option value="">-- Choose Printer --</option>
        {printers.map((printer, index) => (
          <option key={index} value={printer}>
            {printer}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PrinterSelector;
