import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import '../stockform.css';

const StockForm = () => {
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [type, setType] = useState('IN');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await addDoc(collection(db, 'inventory'), {
        item,
        qty: Number(qty),
        type,
        date: Timestamp.now()
      });
      setMessage('✅ Stock added successfully!');
      setItem('');
      setQty('');
    } catch (error) {
      console.error("Error adding document: ", error);
      setMessage('❌ Failed to add stock.');
    }
    setLoading(false);
  };

  return (
    <div className="stockform-container">
      <h2>Add Inventory</h2>
      <form onSubmit={handleSubmit} className="stockform-form">
        <input
          type="text"
          placeholder="Item name"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          required
          className="input-field"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          required
          className="input-field"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input-field"
        >
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="btn-submit"
        >
          {loading ? 'Saving...' : 'Add Stock'}
        </button>
        {message && (
          <p className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default StockForm;
