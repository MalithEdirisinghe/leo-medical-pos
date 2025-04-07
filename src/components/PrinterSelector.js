import React, { useEffect, useState } from "react";
import qz from "qz-tray";

const PrinterSelector = () => {
    const [printers, setPrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState(localStorage.getItem("selectedPrinter") || "");
    // const qz = window.qz;

    useEffect(() => {
        const loadPrinters = async () => {
            try {
              qz.security.setCertificatePromise(() => Promise.resolve(""));
              qz.security.setSignaturePromise(() => Promise.resolve());
          
              if (!qz.websocket.isActive()) {
                await qz.websocket.connect();
              }
          
              const printers = await qz.printers.find("*"); // Wildcard for all printers
              console.log("🖨️ Available Printers:", printers);
              setPrinters(printers);
            } catch (err) {
              console.error("❌ Error fetching printers:", err);
            }
          };               

        loadPrinters();
    }, []);

    const handleSelect = (e) => {
        const printer = e.target.value;
        setSelectedPrinter(printer);
        localStorage.setItem("selectedPrinter", printer); // store globally
    };

    const handleLogPrinters = async () => {
        try {
          if (!qz.websocket.isActive()) {
            qz.security.setCertificatePromise(() => Promise.resolve(""));
            qz.security.setSignaturePromise(() => Promise.resolve(""));
            await qz.websocket.connect();
          }
      
          const printers = await qz.printers.find("*"); // compatible with older QZ
          console.log("🖨️ Printers Detected by QZ:", printers);
        } catch (err) {
          console.error("❌ Error fetching printers:", err);
        }
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
            <button onClick={handleLogPrinters} style={{ marginTop: "10px" }}>
                Log Printers to Console
            </button>
        </div>
    );
};

export default PrinterSelector;
