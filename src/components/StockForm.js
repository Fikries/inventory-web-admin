import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import '../stockform.css';
import axios from 'axios';

const StockForm = () => {
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [type, setType] = useState('IN');
  const [category, setCategory] = useState('');
  const [remarks, setRemarks] = useState('');
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
        category,
        remarks,
        date: Timestamp.now()
      });
      
      setMessage('✅ Stock added successfully!');
      setItem('');
      setQty('');
      setCategory('');
      setRemarks('');
    } catch (error) {
      console.error("Error adding document: ", error);
      setMessage('❌ Failed to add stock.');
    }
    setLoading(false);
  };

  const handleClear = () => {
    setItem('');
    setQty('');
    setCategory('');
    setRemarks('');
    setMessage('');
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
        <input
          type="text"
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Remarks (optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          className="input-field textarea"
        />
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Saving...' : 'Add Stock'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="clear-btn"
          >
            Clear Form
          </button>
        </div>
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
