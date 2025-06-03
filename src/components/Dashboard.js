import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import '../dashboard.css';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [inTotal, setInTotal] = useState(0);
  const [outTotal, setOutTotal] = useState(0);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ item: '', qty: '', type: 'IN' });
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');


  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "inventory"));
    const items = [];

    querySnapshot.forEach(docSnap => {
      const d = docSnap.data();
      items.push({ id: docSnap.id, ...d });
    });

    setData(items);
    applyFilter(items, filterMonth, filterYear);
  };

  useEffect(() => {
    fetchData(); // eslint-disable-next-line
  }, []);

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

    let inSum = 0;
    let outSum = 0;
    filtered.forEach(d => {
      d.type === "IN" ? inSum += d.qty : outSum += d.qty;
    });

    setFilteredData(filtered);
    setInTotal(inSum);
    setOutTotal(outSum);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "inventory", id));
    fetchData();
  };

  const handleEditClick = (entry) => {
    setEditId(entry.id);
    setEditData({ item: entry.item, qty: entry.qty, type: entry.type });
  };

  const handleUpdate = async () => {
    await updateDoc(doc(db, "inventory", editId), {
      item: editData.item,
      qty: Number(editData.qty),
      type: editData.type
    });
    setEditId(null);
    fetchData();
  };

  const handleFilterChange = (month, year, type) => {
  setFilterMonth(month);
  setFilterYear(year);
  setFilterType(type);
  applyFilter(data, month, year, type);
};

  const generatePDF = async () => {
  const doc = new jsPDF();

  // Fetch image from public folder and convert to base64
  const getImageBase64 = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const logoImg = await getImageBase64("/avant.jpg");

  // Now use it in jsPDF
  doc.addImage(logoImg, 'JPEG', 14, 10, 30, 15);
  doc.setFontSize(18);
  doc.text("Inventory Report", 50, 20);
  doc.setFontSize(12);
  const tableColumn = ["Item", "Type", "Qty", "Date"];
  const tableRows = filteredData.map(entry => [
    entry.item,
    entry.type,
    entry.qty,
    entry.date.toDate().toLocaleDateString()
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40
  });

  doc.save("inventory_report.pdf");
};


  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="filters">
        <label>
          Month:
          <select value={filterMonth} onChange={e => handleFilterChange(e.target.value, filterYear)}>
            <option value="">All</option>
            {Array.from({ length: 12 }, (_, i) =>
              <option key={i} value={(i + 1).toString().padStart(2, '0')}>
                {i + 1}
              </option>
            )}
          </select>
        </label>
        <label>
          Year:
          <input
            type="text"
            placeholder="e.g. 2025"
            value={filterYear}
            onChange={e => handleFilterChange(filterMonth, e.target.value)}
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

      <div className="totals">
        <div className="total-box total-in">
          <p>Total Stock IN</p>
          <p className="total-number">{inTotal}</p>
        </div>
        <div className="total-box total-out">
          <p>Total Stock OUT</p>
          <p className="total-number">{outTotal}</p>
        </div>
      </div>

      <button className="btn pdf-btn" onClick={generatePDF} disabled={filteredData.length === 0}>
        Download PDF
      </button>

      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(entry => (
              <tr key={entry.id} className={editId === entry.id ? 'editing-row' : ''}>
                {editId === entry.id ? (
                  <>
                    <td>
                      <input
                        value={editData.item}
                        onChange={e => setEditData({ ...editData, item: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        value={editData.type}
                        onChange={e => setEditData({ ...editData, type: e.target.value })}
                      >
                        <option value="IN">IN</option>
                        <option value="OUT">OUT</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editData.qty}
                        onChange={e => setEditData({ ...editData, qty: e.target.value })}
                      />
                    </td>
                    <td>{entry.date.toDate().toLocaleDateString()}</td>
                    <td>
                      <button className="btn save" onClick={handleUpdate}>Save</button>
                      <button className="btn cancel" onClick={() => setEditId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{entry.item}</td>
                    <td className={entry.type === "IN" ? "type-in" : "type-out"}>{entry.type}</td>
                    <td>{entry.qty}</td>
                    <td>{entry.date.toDate().toLocaleDateString()}</td>
                    <td>
                      <button className="btn edit" onClick={() => handleEditClick(entry)}>Edit</button>
                      <button className="btn delete" onClick={() => handleDelete(entry.id)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
