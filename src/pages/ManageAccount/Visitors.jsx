import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { 
  Search, Filter, Eye, Download, Calendar, User, Mail, Phone, 
  CheckCircle, XCircle, AlertCircle, Users, Award, Clock, RefreshCw, Trash2 
} from 'lucide-react';
import './Visitors.css';

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    minScore: '',
    maxScore: '',
  });
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    averagePercentage: 0
  });

  useEffect(() => {
    fetchVisitors();
    fetchStats();
  }, []);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/getVisitors`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Visitor data:', data);
      
      // Handle different response formats
      let visitorsData = [];
      if (data.status === 'success' && data.data) {
        visitorsData = data.data;
      } else if (Array.isArray(data)) {
        visitorsData = data;
      } else if (data.data && Array.isArray(data.data)) {
        visitorsData = data.data;
      } else {
        visitorsData = [];
      }

      setVisitors(visitorsData);
      setFilteredVisitors(visitorsData);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      setError(error.message);
      setVisitors([]);
      setFilteredVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/visitorStats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          total: data.total || 0,
          passed: data.passed || 0,
          failed: data.failed || 0,
          averagePercentage: data.averagePercentage || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Filter visitors based on search and filters
  useEffect(() => {
    let result = [...visitors];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (v) =>
          v.name?.toLowerCase().includes(term) ||
          v.email?.toLowerCase().includes(term) ||
          v.phone?.includes(term)
      );
    }

    // Status filter
    if (filters.status) {
      result = result.filter((v) => 
        v.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Score range filter
    if (filters.minScore) {
      result = result.filter((v) => v.score >= parseInt(filters.minScore));
    }
    if (filters.maxScore) {
      result = result.filter((v) => v.score <= parseInt(filters.maxScore));
    }

    setFilteredVisitors(result);
  }, [searchTerm, filters, visitors]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'passed':
      case 'pass':
        return '#4CAF50';
      case 'failed':
      case 'fail':
        return '#f44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'passed':
      case 'pass':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'failed':
      case 'fail':
        return <XCircle size={16} color="#f44336" />;
      case 'pending':
        return <AlertCircle size={16} color="#FF9800" />;
      default:
        return <AlertCircle size={16} color="#9E9E9E" />;
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 70) return '#4CAF50';
    if (percentage >= 50) return '#FF9800';
    if (percentage >= 30) return '#FF5722';
    return '#f44336';
  };

  const handleViewDetails = (visitor) => {
    setSelectedVisitor(visitor);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedVisitor(null);
  };

  const handleDelete = async (visitor) => {
    const id = visitor.id || visitor._id;
    if (!window.confirm(`Delete visitor "${visitor.name || 'Unknown'}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/deleteVisitor/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Delete failed');
      }

      // Remove from the list immediately, then refresh the stats cards
      setVisitors((prev) => prev.filter((v) => (v.id || v._id) !== id));
      if (selectedVisitor && (selectedVisitor.id || selectedVisitor._id) === id) {
        handleCloseDetails();
      }
      fetchStats();
    } catch (err) {
      console.error('Error deleting visitor:', err);
      alert('Could not delete visitor: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Name', 'Email', 'Phone', 'Registered At', 'Submitted At',
      'Correct', 'Wrong', 'Skipped', 'Score', 'Max Score', 'Percentage', 'Status'
    ];
    
    const csvData = filteredVisitors.map((v) => [
      v.name || 'N/A',
      v.email || 'N/A',
      v.phone || 'N/A',
      formatDate(v.registeredAt),
      formatDate(v.submittedAt),
      v.correctCount || 0,
      v.wrongCount || 0,
      v.skippedCount || 0,
      v.score || 0,
      v.maxScore || 0,
      v.percentage || 0,
      v.status || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `visitors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setFilters({ status: '', minScore: '', maxScore: '' });
    setSearchTerm('');
  };

  const refreshData = () => {
    fetchVisitors();
    fetchStats();
  };

  if (loading) {
    return (
      <div className="visitors-loading">
        <div className="loading-spinner"></div>
        <p>Loading visitors data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="visitors-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button onClick={refreshData} className="retry-btn">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="visitors-container">
      <div className="visitors-header">
        <h2>Visitor Management</h2>
        <div className="visitors-actions">
          <button className="refresh-btn" onClick={refreshData} title="Refresh Data">
            <RefreshCw size={18} />
          </button>
          <button className="export-btn" onClick={handleExportCSV}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="visitors-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h4>Total Visitors</h4>
            <p>{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon passed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h4>Passed</h4>
            <p>{stats.passed}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon failed">
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <h4>Failed</h4>
            <p>{stats.failed}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon average">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <h4>Avg Score</h4>
            <p>{Math.round(stats.averagePercentage)}%</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="visitors-search-filter">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label><Filter size={16} /> Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Min Score</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minScore}
              onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
              min="0"
            />
          </div>
          <div className="filter-group">
            <label>Max Score</label>
            <input
              type="number"
              placeholder="100"
              value={filters.maxScore}
              onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
              min="0"
              max="100"
            />
          </div>
          <button className="reset-filters-btn" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="visitors-table-container">
        {filteredVisitors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h4>No Visitors Found</h4>
            <p>
              {searchTerm || filters.status || filters.minScore || filters.maxScore
                ? 'No visitors match your search criteria. Try different filters.'
                : 'No visitor data available in the studentUsers collection.'}
            </p>
            {(searchTerm || filters.status || filters.minScore || filters.maxScore) && (
              <button onClick={resetFilters} className="reset-filters-btn">
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <table className="visitors-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Registered</th>
                <th>Score</th>
                <th>Status</th>
                <th>Performance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map((visitor) => (
                <tr key={visitor.id || visitor._id} className="visitor-row">
                  <td>
                    <div className="visitor-name">
                      <div className="name-avatar">
                        {visitor.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="name-details">
                        <div className="full-name">{visitor.name || 'Unknown'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="visitor-contact">
                      <div className="contact-item">
                        <Mail size={14} />
                        <span>{visitor.email || 'N/A'}</span>
                      </div>
                      <div className="contact-item">
                        <Phone size={14} />
                        <span>{visitor.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="registration-info">
                      <div className="date-item">
                        <Calendar size={12} />
                        <span>{formatDate(visitor.registeredAt)}</span>
                      </div>
                      <div className="date-item submitted">
                        <Clock size={12} />
                        <span>Submitted: {formatDate(visitor.submittedAt)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="score-info">
                      <div className="score-value">{visitor.score || 0}</div>
                      <div className="score-max">/ {visitor.maxScore || 0}</div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(visitor.status) }}
                    >
                      {getStatusIcon(visitor.status)}
                      {visitor.status || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <div className="performance-info">
                      <div className="percentage-value">
                        {visitor.percentage || 0}%
                      </div>
                      <div className="performance-bar">
                        <div
                          className="performance-fill"
                          style={{
                            width: `${Math.min(visitor.percentage || 0, 100)}%`,
                            backgroundColor: getScoreColor(visitor.percentage || 0)
                          }}
                        />
                      </div>
                      <div className="question-stats">
                        <span className="correct">
                          <CheckCircle size={12} /> {visitor.correctCount || 0}
                        </span>
                        <span className="wrong">
                          <XCircle size={12} /> {visitor.wrongCount || 0}
                        </span>
                        <span className="skipped">
                          <AlertCircle size={12} /> {visitor.skippedCount || 0}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="view-details-btn"
                        onClick={() => handleViewDetails(visitor)}
                      >
                        <Eye size={16} /> View
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(visitor)}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Visitor Details Modal */}
      {showDetails && selectedVisitor && (
        <div className="visitor-modal-overlay" onClick={handleCloseDetails}>
          <div className="visitor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Visitor Details</h3>
              <button className="modal-close-btn" onClick={handleCloseDetails}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-row">
                  <div className="detail-label">Name</div>
                  <div className="detail-value">{selectedVisitor.name || 'N/A'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{selectedVisitor.email || 'N/A'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Phone</div>
                  <div className="detail-value">{selectedVisitor.phone || 'N/A'}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Registered At</div>
                  <div className="detail-value">{formatDate(selectedVisitor.registeredAt)}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Submitted At</div>
                  <div className="detail-value">{formatDate(selectedVisitor.submittedAt)}</div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Performance Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">Correct</div>
                    <div className="metric-value correct">{selectedVisitor.correctCount || 0}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Wrong</div>
                    <div className="metric-value wrong">{selectedVisitor.wrongCount || 0}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Skipped</div>
                    <div className="metric-value skipped">{selectedVisitor.skippedCount || 0}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Score</div>
                    <div className="metric-value score">{selectedVisitor.score || 0}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Max Score</div>
                    <div className="metric-value max-score">{selectedVisitor.maxScore || 0}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Percentage</div>
                    <div className="metric-value percentage" style={{ color: getScoreColor(selectedVisitor.percentage || 0) }}>
                      {selectedVisitor.percentage || 0}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-row">
                  <div className="detail-label">Status</div>
                  <span
                    className="status-badge large"
                    style={{ backgroundColor: getStatusColor(selectedVisitor.status) }}
                  >
                    {getStatusIcon(selectedVisitor.status)}
                    {selectedVisitor.status || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(selectedVisitor)}
                >
                  <Trash2 size={16} /> Delete Visitor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitors;