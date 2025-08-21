import React, { useEffect, useState, useRef } from 'react'; 
import { db } from '../firebase/config';
import '../dashboard.css';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

const ITEMS_PER_PAGE = 5;

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [totalQty, setTotalQty] = useState(0);
  const [totalThreshold, setTotalThreshold] = useState(0);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ item: '', qty: '', threshold: 0 });
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [alerts, setAlerts] = useState([]);
  const alertedItemsRef = useRef(new Set());

  // Fetch inventory data
  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "inventory"));
    const items = [];

    querySnapshot.forEach(docSnap => {
      const d = docSnap.data();
      items.push({ id: docSnap.id, ...d });
    });

    setData(items);
    applyFilter(items, filterMonth, filterYear);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time listener for low stock alerts
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "inventory"), where("lowStock", "==", true)),
      (snapshot) => {
        const lowStockItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAlerts(lowStockItems);
      }
    );
    return () => unsub();
  }, []);

  // Real-time listener for quantity reaching exactly 1 with popup alert
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'modified' || change.type === 'added') {
          const item = change.doc.data();
          const id = change.doc.id;

          if (item.qty === 1 && !alertedItemsRef.current.has(id)) {
            alert(`⚠ Warning: Quantity of "${item.item}" has reached 1!`);
            alertedItemsRef.current.add(id);
          }
          if (item.qty > 1 && alertedItemsRef.current.has(id)) {
            alertedItemsRef.current.delete(id);
          }
        }
      });
    });

    return () => unsub();
  }, []);

  const applyFilter = (items, month, year) => {
    const filtered = items.filter(entry => {
      const date = entry.date.toDate();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear().toString();
      const matchMonth = !month || m === month;
      const matchYear = !year || y === year;
      return matchMonth && matchYear;
    });

    let qtySum = 0;
    let stockOutSum = 0; // Sum of units below threshold

    filtered.forEach(d => {
      const qty = d.qty || 0;
      const threshold = d.threshold || 0;
      qtySum += qty;

      if (qty < threshold) {
        stockOutSum += (threshold - qty);
      }
    });

    setFilteredData(filtered);
    setTotalQty(qtySum);
    setTotalThreshold(stockOutSum);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "inventory", id));
    fetchData();
  };

  const handleEditClick = (entry) => {
    setEditId(entry.id);
    setEditData({
      item: entry.item,
      qty: entry.qty,
      threshold: entry.threshold || 0
    });
  };

  const handleUpdate = async () => {
    const newQty = Number(editData.qty);
    const thresholdVal = Number(editData.threshold) || 0;

    await updateDoc(doc(db, "inventory", editId), {
      item: editData.item,
      qty: newQty,
      threshold: thresholdVal,
      lowStock: newQty <= thresholdVal
    });

    setEditId(null);
    fetchData();
  };

  const handleFilterChange = (month, year) => {
    setFilterMonth(month);
    setFilterYear(year);
    applyFilter(data, month, year);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const changePage = (pageNum) => {
    if (pageNum < 1 || pageNum > totalPages) return;
    setCurrentPage(pageNum);
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      {/* Low Stock Alerts Panel */}
      {alerts.length > 0 && (
        <div className="alert-panel">
          {alerts.map(alert => (
            <div key={alert.id} className="alert-item">
              ⚠ Low stock: {alert.item} ({alert.qty} left, threshold {alert.threshold})
            </div>
          ))}
        </div>
      )}

      <div className="filters">
        <label>
          Month:
          <select
            value={filterMonth}
            onChange={e => handleFilterChange(e.target.value, filterYear)}
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
            onChange={e => handleFilterChange(filterMonth, e.target.value)}
          />
        </label>
      </div>

      {/* Totals */}
      <div className="totals">
        <div className="total-box total-in">
          <p>Total Quantity</p>
          <p className="total-number">{totalQty}</p>
        </div>
        <div className="total-box total-out">
          <p>Item Needed</p>
          <p className="total-number">{totalThreshold}</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Total Quantity</th>
              <th>Stock Out</th>
              <th>Date </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(entry => (
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
                      <input
                        type="number"
                        value={editData.qty}
                        onChange={e => setEditData({ ...editData, qty: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editData.threshold}
                        onChange={e => {
                          const newThreshold = Number(e.target.value);
                          const oldThreshold = Number(editData.threshold) || 0;
                          const oldQty = Number(editData.qty) || 0;

                          const diff = newThreshold - oldThreshold;
                          let newQty = oldQty - diff;
                          if (newQty < 0) newQty = 0;

                          setEditData({
                            ...editData,
                            threshold: newThreshold,
                            qty: newQty
                          });
                        }}
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
                    <td>{entry.qty}</td>
                    <td>{entry.threshold || 0}</td>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            className="btn cancel"
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ marginRight: '10px' }}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                className="btn"
                onClick={() => changePage(pageNum)}
                style={{
                  marginRight: '8px',
                  backgroundColor: currentPage === pageNum ? '#4299e1' : '#a0aec0',
                  color: currentPage === pageNum ? 'white' : '#2d3748',
                  fontWeight: currentPage === pageNum ? '700' : '600',
                  cursor: 'pointer',
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            className="btn cancel"
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ marginLeft: '10px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
