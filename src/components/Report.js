// Report.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './report.css';

const Report = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchData(); // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, 'inventory'));
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setData(items);
    applyFilter(items, filterMonth, filterYear, filterType);
  };

  const applyFilter = (items, month, year, type) => {
    const filtered = items.filter(entry => {
      const date = entry.date.toDate();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear().toString();
      const matchMonth = !month || m === month;
      const matchYear = !year || y === year;
      const matchType = !type || entry.type === type;
      return matchMonth && matchYear && matchType;
    });

    setFilteredData(filtered);
  };

  const handleFilterChange = (month, year, type) => {
    setFilterMonth(month);
    setFilterYear(year);
    setFilterType(type);
    applyFilter(data, month, year, type);
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    const logo = await fetch('/avant.jpg').then(res => res.blob()).then(blob => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    });

    doc.addImage(logo, 'JPEG', 14, 10, 30, 15);
    doc.setFontSize(18);
    doc.text("Inventory Report", 50, 25);
    doc.setFontSize(12);

    const tableData = filteredData.map(d => [
      d.item,
      d.type,
      d.qty,
      d.date.toDate().toLocaleDateString()
    ]);

    doc.autoTable({
      head: [["Item", "Type", "Qty", "Date"]],
      body: tableData,
      startY: 40,
    });

    doc.save("inventory_report.pdf");
  };

  const generateExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Avant Sdn Bhd"],
      ["Inventory Report"],
      [],
      ["Item", "Type", "Qty", "Date"],
      ...filteredData.map(d => [
        d.item,
        d.type,
        d.qty,
        d.date.toDate().toLocaleDateString()
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileBlob, "inventory_report.xlsx");
  };

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  return (
    <div className="report-container">
      <h2>Inventory Report</h2>

      <div className="filters">
        <label>
          Month:
          <select value={filterMonth} onChange={e => handleFilterChange(e.target.value, filterYear, filterType)}>
            <option value="" style={{ fontWeight: 'bold' }}>All</option>
            {months.map((month, i) => (
              <option key={i} value={(i + 1).toString().padStart(2, '0')}>
                {month}
              </option>
            ))}
          </select>
        </label>
        <label>
          Year:
          <input
            type="text"
            value={filterYear}
            onChange={e => handleFilterChange(filterMonth, e.target.value, filterType)}
            placeholder="e.g. 2025"
          />
        </label>
        <label>
          Type:
          <select value={filterType} onChange={e => handleFilterChange(filterMonth, filterYear, e.target.value)}>
            <option value="">All</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        </label>
      </div>

      <div className="report-buttons">
      <button className="pdf-btn" onClick={generatePDF} disabled={filteredData.length === 0}>Download PDF</button>
      <button className="excel-btn" onClick={generateExcel} disabled={filteredData.length === 0}>Download Excel</button>
      </div>
  

      <table className="report-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Type</th>
            <th>Qty</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(entry => (
            <tr key={entry.id}>
              <td>{entry.item}</td>
              <td>{entry.type}</td>
              <td>{entry.qty}</td>
              <td>{entry.date.toDate().toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Report;
