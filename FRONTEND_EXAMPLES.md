# Frontend Integration Examples

Complete frontend code examples for integrating with the Steadfast courier API.

## 🎨 React Components

### 1. Confirm Shipment Button with Modal

```jsx
// components/ConfirmShipmentButton.jsx
import { useState } from 'react';
import ShipmentReviewModal from './ShipmentReviewModal';

function ConfirmShipmentButton({ order, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/courier/shipments/review/${order.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch review data');
      }
      
      const data = await response.json();
      setReviewData(data.data);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch('/api/courier/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create shipment');
      }
      
      const result = await response.json();
      setShowModal(false);
      onSuccess(result.data);
    } catch (err) {
      throw err; // Let modal handle the error
    }
  };

  return (
    <>
      <button
        onClick={handleConfirm}
        disabled={loading || order.status !== 'CONFIRMED'}
        className="btn btn-primary"
      >
        {loading ? 'Loading...' : 'Confirm Shipment'}
      </button>
      
      {error && (
        <div className="alert alert-error mt-2">
          {error}
        </div>
      )}
      
      {showModal && (
        <ShipmentReviewModal
          data={reviewData}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default ConfirmShipmentButton;
```

### 2. Shipment Review Modal

```jsx
// components/ShipmentReviewModal.jsx
import { useState } from 'react';

function ShipmentReviewModal({ data, onSubmit, onClose }) {
  const [formData, setFormData] = useState(data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Review Shipment Details</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Invoice Number *</label>
            <input
              type="text"
              name="invoice"
              value={formData.invoice}
              onChange={handleChange}
              required
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>Recipient Name *</label>
            <input
              type="text"
              name="recipient_name"
              value={formData.recipient_name}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="recipient_phone"
                value={formData.recipient_phone}
                onChange={handleChange}
                required
                pattern="01[0-9]{9}"
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div className="form-group">
              <label>Alternative Phone</label>
              <input
                type="tel"
                name="alternative_phone"
                value={formData.alternative_phone || ''}
                onChange={handleChange}
                pattern="01[0-9]{9}"
                placeholder="01XXXXXXXXX"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="recipient_email"
              value={formData.recipient_email || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea
              name="recipient_address"
              value={formData.recipient_address}
              onChange={handleChange}
              required
              maxLength={250}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>COD Amount (BDT) *</label>
              <input
                type="number"
                name="cod_amount"
                value={formData.cod_amount}
                onChange={handleChange}
                required
                min={0}
                step={0.01}
              />
            </div>

            <div className="form-group">
              <label>Total Lot</label>
              <input
                type="number"
                name="total_lot"
                value={formData.total_lot || ''}
                onChange={handleChange}
                min={1}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Item Description</label>
            <input
              type="text"
              name="item_description"
              value={formData.item_description || ''}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Delivery Type</label>
            <select
              name="delivery_type"
              value={formData.delivery_type}
              onChange={handleChange}
            >
              <option value={0}>Home Delivery</option>
              <option value={1}>Point Delivery</option>
            </select>
          </div>

          <div className="form-group">
            <label>Delivery Note</label>
            <textarea
              name="note"
              value={formData.note || ''}
              onChange={handleChange}
              rows={2}
              placeholder="Special delivery instructions..."
            />
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Confirm & Create Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShipmentReviewModal;
```

### 3. Shipment Details Component

```jsx
// components/ShipmentDetails.jsx
import { useState, useEffect } from 'react';

function ShipmentDetails({ orderId }) {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchShipment();
  }, [orderId]);

  const fetchShipment = async () => {
    try {
      const response = await fetch(
        `/api/courier/shipments/order/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch shipment');
      }

      const data = await response.json();
      setShipment(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(
        `/api/courier/shipments/${shipment.id}/sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to sync shipment');
      }

      await fetchShipment();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div>Loading shipment details...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!shipment) return <div>No shipment found</div>;

  return (
    <div className="shipment-details">
      <div className="card">
        <div className="card-header">
          <h3>Shipment Information</h3>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-sm"
          >
            {syncing ? 'Syncing...' : 'Sync Status'}
          </button>
        </div>

        <div className="card-body">
          <div className="info-grid">
            <div className="info-item">
              <label>Consignment ID:</label>
              <span>{shipment.consignmentId}</span>
            </div>

            <div className="info-item">
              <label>Tracking Code:</label>
              <span className="tracking-code">{shipment.trackingCode}</span>
            </div>

            <div className="info-item">
              <label>Invoice:</label>
              <span>{shipment.invoice}</span>
            </div>

            <div className="info-item">
              <label>Status:</label>
              <span className={`status-badge status-${shipment.deliveryStatus}`}>
                {shipment.deliveryStatus}
              </span>
            </div>

            <div className="info-item">
              <label>COD Amount:</label>
              <span>৳{shipment.codAmount}</span>
            </div>

            {shipment.deliveryCharge && (
              <div className="info-item">
                <label>Delivery Charge:</label>
                <span>৳{shipment.deliveryCharge}</span>
              </div>
            )}

            <div className="info-item full-width">
              <label>Recipient:</label>
              <span>{shipment.recipientName} - {shipment.recipientPhone}</span>
            </div>

            <div className="info-item full-width">
              <label>Address:</label>
              <span>{shipment.recipientAddress}</span>
            </div>

            {shipment.trackingMessage && (
              <div className="info-item full-width">
                <label>Latest Update:</label>
                <span>{shipment.trackingMessage}</span>
              </div>
            )}

            {shipment.assignedToName && (
              <div className="info-item full-width">
                <label>Assigned To:</label>
                <span>
                  {shipment.assignedToName} - {shipment.assignedToPhone}
                  {shipment.assignedToHub && ` (${shipment.assignedToHub})`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {shipment.courierEvents && shipment.courierEvents.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h3>Tracking History</h3>
          </div>
          <div className="card-body">
            <div className="timeline">
              {shipment.courierEvents.map((event) => (
                <div key={event.id} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="event-type">{event.notificationType}</span>
                      <span className="event-date">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {event.status && (
                      <div className="event-status">{event.status}</div>
                    )}
                    {event.trackingMessage && (
                      <div className="event-message">{event.trackingMessage}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShipmentDetails;
```

### 4. Balance Display Component

```jsx
// components/CourierBalance.jsx
import { useState, useEffect } from 'react';

function CourierBalance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/courier/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      setBalance(data.data.current_balance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading balance...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="balance-card">
      <div className="balance-label">Courier Balance</div>
      <div className="balance-amount">
        ৳{balance?.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
      </div>
      <button onClick={fetchBalance} className="btn btn-sm">
        Refresh
      </button>
    </div>
  );
}

export default CourierBalance;
```

### 5. Withdrawal Request Component

```jsx
// components/WithdrawalRequest.jsx
import { useState } from 'react';

function WithdrawalRequest({ onSuccess }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/courier/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          note,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create withdrawal');
      }

      const result = await response.json();
      setAmount('');
      setNote('');
      onSuccess(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Request Withdrawal</h3>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (BDT) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={1}
              step={0.01}
              placeholder="Enter amount"
            />
          </div>

          <div className="form-group">
            <label>Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optional note..."
            />
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default WithdrawalRequest;
```

## 🎨 CSS Styles

```css
/* styles/courier.css */

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

/* Form Styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-in_review {
  background: #fef3c7;
  color: #92400e;
}

.status-delivered {
  background: #d1fae5;
  color: #065f46;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.status-pending {
  background: #e0e7ff;
  color: #3730a3;
}

/* Shipment Details */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.info-item span {
  font-size: 14px;
  color: #111827;
}

.tracking-code {
  font-family: monospace;
  font-weight: 600;
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-marker {
  position: absolute;
  left: -30px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #3b82f6;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 12px;
  bottom: -20px;
  width: 2px;
  background: #e5e7eb;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.event-type {
  font-weight: 600;
  color: #3b82f6;
}

.event-date {
  font-size: 12px;
  color: #6b7280;
}

.event-status {
  font-weight: 500;
  color: #059669;
  margin-bottom: 5px;
}

.event-message {
  color: #374151;
}

/* Balance Card */
.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.balance-amount {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 15px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* Alert */
.alert {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* Card */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.card-body {
  padding: 20px;
}
```

## 🚀 Usage Example

```jsx
// pages/OrderDetails.jsx
import ConfirmShipmentButton from '../components/ConfirmShipmentButton';
import ShipmentDetails from '../components/ShipmentDetails';

function OrderDetails({ order }) {
  const [hasShipment, setHasShipment] = useState(false);

  const handleShipmentCreated = (shipment) => {
    setHasShipment(true);
    // Refresh order data or show success message
    alert('Shipment created successfully!');
  };

  return (
    <div className="order-details-page">
      <h1>Order #{order.orderNumber}</h1>
      
      {/* Order information */}
      <div className="order-info">
        {/* ... order details ... */}
      </div>

      {/* Shipment section */}
      {order.status === 'CONFIRMED' && !hasShipment && (
        <ConfirmShipmentButton
          order={order}
          onSuccess={handleShipmentCreated}
        />
      )}

      {(order.status === 'SHIPPED' || hasShipment) && (
        <ShipmentDetails orderId={order.id} />
      )}
    </div>
  );
}
```

---

**These components provide a complete frontend integration for the Steadfast courier system!**
