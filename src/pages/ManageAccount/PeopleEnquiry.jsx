import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, MessageSquare, File, Calendar, User, 
  CheckCircle, XCircle, Download, Search, Filter, 
  Clock, AlertCircle, ArrowLeft, Send 
} from 'lucide-react';
import './PeopleEnquiry.css';
import { API_BASE_URL }               from '../../config';

const PeopleEnquiry = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const [error, setError] = useState(null);

  // Fetch enquiries from backend
  const fetchEnquiries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching people enquiries...');
      const response = await fetch(`${API_BASE_URL}/people-enquiries`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Enquiries data:', data);
      
      // Transform data to match frontend structure
      const transformedEnquiries = data.map(enquiry => ({
        _id: { $oid: enquiry.id },
        id: enquiry.id,
        name: enquiry.name || 'N/A',
        email: enquiry.email || 'N/A',
        phone: enquiry.phone || 'N/A',
        category: enquiry.category || 'General Inquiry',
        enquiryMessage: enquiry.enquiryMessage || 'No message',
        fileName: enquiry.fileName || null,
        submittedAt: enquiry.submittedAt || new Date().toISOString(),
        isRegistered: enquiry.isRegistered || false,
        status: enquiry.status || 'new',
        notes: enquiry.notes || '',
        fileData: enquiry.fileData || null,
        contentType: enquiry.contentType || null,
        marketingStatus: enquiry.marketingStatus || 'not_moved', // Changed to 'not_moved'
      }));

      setEnquiries(transformedEnquiries);
      setFilteredEnquiries(transformedEnquiries);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setError(`Failed to load enquiries: ${error.message}`);
      
      // Fallback to sample data
      const sampleData = [
        {
          _id: { $oid: '697064a46e5da37f9d39a95d' },
          id: '697064a46e5da37f9d39a95d',
          name: 'sneka',
          email: 'naveen@padmasini.com',
          phone: '9655816656',
          category: 'Pricing',
          enquiryMessage: 'Test enquiry',
          fileName: 'Screenshot 2025-12-12 162006.png',
          submittedAt: '2026-01-21T11:01:16.846199600',
          isRegistered: false,
          status: 'new',
          notes: '',
          marketingStatus: 'not_moved',
        },
      ];
      setEnquiries(sampleData);
      setFilteredEnquiries(sampleData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Apply local filters
  useEffect(() => {
    let result = [...enquiries];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(enquiry =>
        enquiry.name.toLowerCase().includes(term) ||
        enquiry.email.toLowerCase().includes(term) ||
        enquiry.phone.toLowerCase().includes(term) ||
        enquiry.enquiryMessage.toLowerCase().includes(term)
      );
    }

    // Category filter (local)
    if (categoryFilter !== 'all') {
      result = result.filter(enquiry => enquiry.category === categoryFilter);
    }

    // Status filter (local)
    if (statusFilter !== 'all') {
      result = result.filter(enquiry => {
        if (statusFilter === 'moved') {
          return enquiry.marketingStatus === 'moved';
        } else if (statusFilter === 'not_moved') {
          return enquiry.marketingStatus === 'not_moved';
        }
        return true;
      });
    }

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(enquiry =>
        new Date(enquiry.submittedAt).toISOString().split('T')[0] === today
      );
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter(enquiry =>
        new Date(enquiry.submittedAt) >= weekAgo
      );
    }

    setFilteredEnquiries(result);
  }, [searchTerm, categoryFilter, statusFilter, dateFilter, enquiries]);

  // Handle View Details
  const handleViewDetails = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setViewMode('detail');
  };

  // Handle Back to List
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedEnquiry(null);
  };

  // Handle Move to Marketing Team
  const handleMoveToMarketing = async (enquiryId) => {
    if (!window.confirm('Move this enquiry to Marketing Team?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/people-enquiries/${enquiryId}/marketing`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          marketingStatus: 'moved',
          notes: `Moved to Marketing Team on ${new Date().toLocaleDateString()}`
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to move to marketing: ${errorText}`);
      }

      // Update local state
      setEnquiries(prev => prev.map(enquiry =>
        enquiry.id === enquiryId
          ? {
              ...enquiry,
              marketingStatus: 'moved',
            }
          : enquiry
      ));

      if (viewMode === 'detail' && selectedEnquiry && selectedEnquiry.id === enquiryId) {
        setSelectedEnquiry({
          ...selectedEnquiry,
          marketingStatus: 'moved',
        });
      }
      
      alert('Enquiry moved to Marketing Team successfully!');
    } catch (error) {
      console.error('Error moving to marketing:', error);
      alert(`Failed to move to marketing: ${error.message}`);
    }
  };

  // Handle View/Download File
  const handleViewFile = async (enquiry) => {
    if (!enquiry.fileName || !enquiry.id) {
      alert('No file attached to this enquiry');
      return;
    }

    try {
      // First check file info
      const infoResponse = await fetch(`${API_BASE_URL}/people-enquiries/${enquiry.id}/file-info`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!infoResponse.ok) {
        throw new Error(`Cannot check file info: ${infoResponse.status}`);
      }

      const fileInfo = await infoResponse.json();
      
      if (!fileInfo.fileDataExists) {
        alert('File data not available in the database.');
        return;
      }

      // Fetch the file
      const response = await fetch(`${API_BASE_URL}/people-enquiries/${enquiry.id}/file`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = enquiry.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(fileUrl), 100);
      
    } catch (error) {
      console.error('Error fetching file:', error);
      alert(`Could not load file: ${error.message}`);
    }
  };

  // Format Date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get Status Color - Updated for moved/not_moved
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#FF9800';
      case 'contacted': return '#2196F3';
      case 'processed': return '#4CAF50';
      case 'moved': return '#9C27B0';
      case 'not_moved': return '#FF9800';
      default: return '#757575';
    }
  };

  // Get Marketing Status Color
  const getMarketingStatusColor = (status) => {
    switch (status) {
      case 'moved': return '#9C27B0';
      case 'not_moved': return '#FF9800';
      default: return '#757575';
    }
  };

  // Get Category Color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Pricing': return '#9C27B0';
      case 'Technical Support': return '#2196F3';
      case 'General Inquiry': return '#4CAF50';
      case 'Feedback': return '#FF9800';
      default: return '#757575';
    }
  };

  // Get Unique Categories
  const getUniqueCategories = () => {
    const categories = enquiries.map(e => e.category);
    return ['all', ...new Set(categories)];
  };

  // Detail View
  if (viewMode === 'detail' && selectedEnquiry) {
    return (
      <div className="people-enquiry-detail">
        <div className="detail-header">
          <button className="back-button" onClick={handleBackToList}>
            <ArrowLeft size={16} /> Back to List
          </button>
          <h2>Enquiry Details</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="detail-card">
          <div className="detail-section">
            <h3>Personal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <User size={16} />
                <strong>Name:</strong> {selectedEnquiry.name}
              </div>
              <div className="info-item">
                <Mail size={16} />
                <strong>Email:</strong> {selectedEnquiry.email}
              </div>
              <div className="info-item">
                <Phone size={16} />
                <strong>Phone:</strong> {selectedEnquiry.phone}
              </div>
              <div className="info-item">
                <Calendar size={16} />
                <strong>Submitted:</strong> {formatDate(selectedEnquiry.submittedAt)}
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Enquiry Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Category:</strong>
                <span
                  className="category-badge"
                  style={{ backgroundColor: getCategoryColor(selectedEnquiry.category) }}
                >
                  {selectedEnquiry.category}
                </span>
              </div>
              <div className="info-item">
                <strong>Marketing Status:</strong>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getMarketingStatusColor(selectedEnquiry.marketingStatus || 'not_moved') }}
                >
                  {selectedEnquiry.marketingStatus === 'moved' ? 'Moved' : 'Not Moved'}
                </span>
              </div>
              <div className="info-item">
                <strong>Registered User:</strong>
                {selectedEnquiry.isRegistered ? (
                  <span className="registered-badge">
                    <CheckCircle size={14} /> Yes
                  </span>
                ) : (
                  <span className="not-registered-badge">
                    <XCircle size={14} /> No
                  </span>
                )}
              </div>
              <div className="info-item">
                <strong>Inquiry Status:</strong>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(selectedEnquiry.status) }}
                >
                  {selectedEnquiry.status}
                </span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Message</h3>
            <div className="message-box">
              <MessageSquare size={16} />
              <p>{selectedEnquiry.enquiryMessage}</p>
            </div>
          </div>

          {selectedEnquiry.fileName && (
            <div className="detail-section">
              <h3>Attachment</h3>
              <div className="attachment-box">
                <File size={16} />
                <span>{selectedEnquiry.fileName}</span>
                <button
                  className="download-btn"
                  onClick={() => handleViewFile(selectedEnquiry)}
                >
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Actions</h3>
            <div className="action-buttons">
              {selectedEnquiry.marketingStatus !== 'moved' && (
                <button
                  className="action-btn marketing-btn"
                  onClick={() => handleMoveToMarketing(selectedEnquiry.id)}
                >
                  <Send size={14} /> Move to Marketing Team
                </button>
              )}
              {selectedEnquiry.marketingStatus === 'moved' && (
                <div className="info-alert">
                  <CheckCircle size={16} />
                  <span>This enquiry has been moved to Marketing Team</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="people-enquiry-container">
      <div className="enquiry-header">
        <h2>People Enquiries</h2>
        <div className="header-stats">
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Search and Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search enquiries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label><Filter size={16} /> Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().filter(cat => cat !== 'all').map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Marketing Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="not_moved">Not Moved</option>
              <option value="moved">Moved</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>

          <button
            className="reset-btn"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
              setDateFilter('all');
            }}
          >
            Reset Filters
          </button>

          <button
            className="refresh-btn"
            onClick={fetchEnquiries}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Enquiries List */}
      <div className="enquiries-list">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading enquiries...</p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} />
            <h3>No Enquiries Found</h3>
            <p>No enquiries match your search criteria.</p>
            <button onClick={fetchEnquiries} className="retry-btn">
              Try Loading Again
            </button>
          </div>
        ) : (
          <div className="enquiries-table-container">
            <table className="enquiries-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Contact</th>
                  <th>Category</th>
                  <th>Message</th>
                  <th>Marketing Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry.id || enquiry._id.$oid} className="enquiry-row">
                    <td>
                      <div className="person-info">
                        <div className="person-avatar">
                          {enquiry.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="person-details">
                          <div className="person-name">{enquiry.name}</div>
                          <div className="person-registered">
                            {enquiry.isRegistered ? 'Registered' : 'Not Registered'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-item">
                          <Mail size={12} />
                          <span>{enquiry.email}</span>
                        </div>
                        <div className="contact-item">
                          <Phone size={12} />
                          <span>{enquiry.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(enquiry.category) }}
                      >
                        {enquiry.category}
                      </span>
                    </td>
                    <td>
                      <div className="message-preview">
                        {enquiry.enquiryMessage.length > 50
                          ? `${enquiry.enquiryMessage.substring(0, 50)}...`
                          : enquiry.enquiryMessage}
                      </div>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getMarketingStatusColor(enquiry.marketingStatus || 'not_moved') }}
                      >
                        {enquiry.marketingStatus === 'moved' ? 'Moved' : 'Not Moved'}
                      </span>
                      {enquiry.marketingStatus === 'moved' && (
                        <div className="marketing-status">
                          <small>
                            <Send size={10} /> Moved to Marketing
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="date-info">
                        {formatDate(enquiry.submittedAt)}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() => handleViewDetails(enquiry)}
                        >
                          View Details
                        </button>
                        {enquiry.marketingStatus !== 'moved' && (
                          <button
                            className="marketing-btn-small"
                            onClick={() => handleMoveToMarketing(enquiry.id || enquiry._id.$oid)}
                          >
                            <Send size={12} /> To Marketing
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeopleEnquiry;