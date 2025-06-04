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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchData(); // eslint-disable-next-line
  }, []);

  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "inventory"));
    const items = [];

    querySnapshot.forEach(docSnap => {
      const d = docSnap.data();
      items.push({ id: docSnap.id, ...d });
    });

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

    let inSum = 0;
    let outSum = 0;
    filtered.forEach(d => {
      d.type === "IN" ? inSum += d.qty : outSum += d.qty;
    });

    setFilteredData(filtered);
    setInTotal(inSum);
    setOutTotal(outSum);
    setCurrentPage(1); // Reset to page 1 when filters are applied
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

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="filters">
        <label>
          Month:
          <select
            value={filterMonth}
            onChange={e => handleFilterChange(e.target.value, filterYear, filterType)}
          >
            <option value="">All</option>
            {[
              'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
              'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
            ].map((monthName, index) => (
              <option key={index} value={(index + 1).toString().padStart(2, '0')}>
                {monthName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Year:
          <input
            type="text"
            placeholder="e.g. 2025"
            value={filterYear}
            onChange={e => handleFilterChange(filterMonth, e.target.value, filterType)}
          />
        </label>

        <label>
          Type:
          <select
            value={filterType}
            onChange={e => handleFilterChange(filterMonth, filterYear, e.target.value)}
          >
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
            {currentItems.map(entry => (
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

        {/* Pagination Buttons */}
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
