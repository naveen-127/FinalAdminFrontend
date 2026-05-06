/* eslint-disable no-undef */
import React, { useState, useEffect }                                           from 'react';
import './Coupon.css';
import { Save, Calendar, Users, Percent, Hash, Building, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL }                                                         from '../../config';


const Coupon = () => {
  const [formData, setFormData] = useState({
    organizationName: '',
    couponCode: '',
    discountPercentage: '',
    validityStartDate: '',
    validityEndDate: '',
    maxMembers: '',
    description: '',
    isActive: true
  });

  const [coupons, setCoupons] = useState([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Generate random coupon code
  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, couponCode: code });
    setGeneratedCode(code);
  };

  // Fetch existing coupons
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/coupons`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCoupons(data.data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing 
        ? `${API_BASE_URL}/coupons/${editId}`
        : `${API_BASE_URL}/coupons`;
      
      const method = isEditing ? 'PUT' : 'POST';

      // Ensure maxMembers is a number
      const submissionData = {
        ...formData,
        maxMembers: parseInt(formData.maxMembers),
        discountPercentage: parseInt(formData.discountPercentage)
      };

      const response = await fetch(url, {
        method: method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        alert(isEditing ? 'Coupon updated successfully!' : 'Coupon created successfully!');
        resetForm();
        fetchCoupons();
      } else {
        alert(data.message || 'Error saving coupon');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon) => {
    setFormData({
      organizationName: coupon.organizationName,
      couponCode: coupon.couponCode,
      discountPercentage: coupon.discountPercentage,
      validityStartDate: coupon.validityStartDate.split('T')[0],
      validityEndDate: coupon.validityEndDate.split('T')[0],
      maxMembers: coupon.maxMembers,
      description: coupon.description || '',
      isActive: coupon.isActive || true
    });
    setIsEditing(true);
    setEditId(coupon.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert('Coupon deleted successfully!');
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      organizationName: '',
      couponCode: '',
      discountPercentage: '',
      validityStartDate: '',
      validityEndDate: '',
      maxMembers: '',
      description: '',
      isActive: true
    });
    setGeneratedCode('');
    setIsEditing(false);
    setEditId(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Function to check if coupon is expired (by date OR max members)
  const getCouponStatus = (coupon) => {
    const now = new Date();
    const endDate = new Date(coupon.validityEndDate);
    const maxMembersReached = coupon.usedMembers >= coupon.maxMembers;
    const isDateExpired = endDate < now;
    const isInactive = !coupon.isActive;

    // If manually deactivated
    if (isInactive) {
      return {
        status: 'inactive',
        text: 'Inactive',
        tooltip: 'Manually deactivated'
      };
    }

    // If expired by date OR max members reached
    if (isDateExpired || maxMembersReached) {
      let tooltip = '';
      
      if (isDateExpired && maxMembersReached) {
        tooltip = 'Expired: Validity date passed and max members reached';
      } else if (isDateExpired) {
        tooltip = 'Expired: Validity date has passed';
      } else if (maxMembersReached) {
        tooltip = 'Expired: Maximum members limit reached';
      }
      
      return {
        status: 'expired',
        text: 'Expired',
        tooltip: tooltip
      };
    }

    // Otherwise active
    return {
      status: 'active',
      text: 'Active',
      tooltip: 'Valid and active'
    };
  };

  // Check if row should have expired styling
  const shouldHighlightAsExpired = (coupon) => {
    const status = getCouponStatus(coupon);
    return status.status !== 'active';
  };

  // Check specifically if max members are reached for styling
  const isMaxMembersReached = (coupon) => {
    return coupon.usedMembers >= coupon.maxMembers;
  };

  return (
    <div className="coupon-container">
      <div className="coupon-header">
        <h2>
         Coupon Management
        </h2>
        <p>Create and manage discount coupons for organizations</p>
      </div>

      <div className="coupon-content">
        {/* Form Section */}
        <div className="coupon-form-section">
          <div className="form-header">
            <h3>{isEditing ? 'Edit Coupon' : 'Create New Coupon'}</h3>
            {generatedCode && !isEditing && (
              <div className="generated-code-display">
                Generated Code: <span className="code-highlight">{generatedCode}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="coupon-form">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <Building size={16} /> Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder="Enter organization name"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Percent size={16} /> Discount Percentage *
                </label>
                <div className="percentage-input">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                    placeholder="Enter percentage"
                    required
                  />
                  <span className="percentage-symbol">%</span>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Hash size={16} /> Coupon Code *
                </label>
                <div className="code-input-group">
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                    placeholder="Enter coupon code"
                    required
                    maxLength="20"
                  />
                  {!isEditing && (
                    <button type="button" onClick={generateCouponCode} className="generate-btn">
                      Generate
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Users size={16} /> Max Members *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                  placeholder="Number of members"
                  required
                />
                <small className="hint">Coupon will expire when this limit is reached</small>
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} /> Validity Start Date *
                </label>
                <input
                  type="date"
                  value={formData.validityStartDate}
                  onChange={(e) => setFormData({ ...formData, validityStartDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} /> Validity End Date *
                </label>
                <input
                  type="date"
                  value={formData.validityEndDate}
                  onChange={(e) => setFormData({ ...formData, validityEndDate: e.target.value })}
                  required
                  min={formData.validityStartDate}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter coupon description..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={loading}>
                <Save size={18} />
                {loading ? 'Saving...' : isEditing ? 'Update Coupon' : 'Save Coupon'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Coupon List Section */}
        <div className="coupon-list-section">
          <div className="list-header">
            <h3>Existing Coupons ({coupons.length})</h3>
            <div className="status-legend">
              <span className="legend-item active">Active</span>
              <span className="legend-item expired">Expired</span>
              <span className="legend-item inactive">Inactive</span>
            </div>
          </div>

          {coupons.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎫</div>
              <h4>No Coupons Found</h4>
              <p>Create your first coupon using the form above</p>
            </div>
          ) : (
            <div className="coupon-table-container">
              <table className="coupon-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Coupon Code</th>
                    <th>Discount</th>
                    <th>Validity</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    const isExpiredRow = shouldHighlightAsExpired(coupon);
                    const isMaxReached = isMaxMembersReached(coupon);
                    
                    return (
                      <tr key={coupon.id} className={isExpiredRow ? 'expired-row' : ''}>
                        <td>
                          <div className="org-info">
                            <strong>{coupon.organizationName}</strong>
                            {coupon.description && (
                              <small>{coupon.description}</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <code className="coupon-code">{coupon.couponCode}</code>
                        </td>
                        <td>
                          <span className="discount-badge">
                            {coupon.discountPercentage}%
                          </span>
                        </td>
                        <td>
                          <div className="date-info">
                            <div>Start: {formatDate(coupon.validityStartDate)}</div>
                            <div>End: {formatDate(coupon.validityEndDate)}</div>
                          </div>
                        </td>
                        <td>
                          <span className="members-info">
                            <span className={isMaxReached ? 'expired-text' : ''}>
                              {coupon.usedMembers || 0}/{coupon.maxMembers}
                            </span>
                            {isMaxReached && (
                              <div className="limit-reached-hint">✓ Limit Reached</div>
                            )}
                          </span>
                        </td>
                        <td>
                          <span 
                            className={`status-badge ${status.status}`}
                            title={status.tooltip}
                          >
                            {status.status === 'active' && <CheckCircle size={12} />}
                            {status.status === 'expired' && <XCircle size={12} />}
                            {status.status === 'inactive' && <XCircle size={12} />}
                            {status.text}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="edit-btn"
                              onClick={() => handleEdit(coupon)}
                              disabled={coupon.usedMembers > 0}
                              title={coupon.usedMembers > 0 ? "Cannot edit: Coupon has been used" : "Edit coupon"}
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDelete(coupon.id)}
                              disabled={coupon.usedMembers > 0}
                              title={coupon.usedMembers > 0 ? "Cannot delete: Coupon has been used" : "Delete coupon"}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Coupon;