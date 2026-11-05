import React, { useState, useMemo } from 'react';
import './ManageStudent.css';
import { API_BASE_URL } from '../../config';
import { Search, Filter, Eye, Calendar, User, Mail, Phone, Edit, Trash2, Pencil, Check, X } from 'lucide-react';
import StudentDetails from './StudentDetails';
import StudentForm from './StudentForm';

const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-IN');
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return '#4CAF50';
    case 'trial': return '#FF9800';
    case 'expiring': return '#FF5722';
    case 'inactive': return '#9E9E9E';
    default: return '#757575';
  }
};

const emptyFilters = { coursetype: '', plan: '', status: '', gender: '' };

// Backend: PUT /api/updateStudent/{email}  (UserController.updateStudent)
const UPDATE_STUDENT_URL = (email) =>
  `${API_BASE_URL}/updateStudent/${encodeURIComponent(email)}`;

const toDateInput = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  return isNaN(d) ? '' : d.toISOString().split('T')[0];
};

const ManageStudent = ({ students = [], onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState(emptyFilters);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);

  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentFormMode, setStudentFormMode] = useState('add');
  const [editingStudent, setEditingStudent] = useState(null);

  // ── Filter / search (derived, no extra state) ──
  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          (s.phone || '').toLowerCase().includes(term) ||
          (s.courseName || '').toLowerCase().includes(term)
      );
    }
    if (filters.coursetype) result = result.filter((s) => s.coursetype === filters.coursetype);
    if (filters.plan) result = result.filter((s) => s.plan === filters.plan);
    if (filters.status) result = result.filter((s) => s.status === filters.status);
    if (filters.gender) result = result.filter((s) => s.gender === filters.gender);

    return result;
  }, [students, searchTerm, filters]);

  // ── Inline End Date edit ──
  const [editingEndId, setEditingEndId] = useState(null);
  const [endDateValue, setEndDateValue] = useState('');
  const [savingEnd, setSavingEnd] = useState(false);

  const startEditEnd = (student) => {
    setEditingEndId(student.id);
    setEndDateValue(toDateInput(student.endDate));
  };

  const cancelEditEnd = () => {
    setEditingEndId(null);
    setEndDateValue('');
  };

  const saveEndDate = (student) => {
    if (!endDateValue) {
      alert('Please select an end date');
      return;
    }
    setSavingEnd(true);
    fetch(UPDATE_STUDENT_URL(student.email), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endDate: endDateValue }), // yyyy-MM-dd, same format the backend stores
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'pass') {
          cancelEditEnd();
          onRefresh && onRefresh();
        } else {
          alert(data.message || 'Failed to update end date');
        }
      })
      .catch((err) => {
        console.error('Error updating end date:', err);
        alert('Error updating end date');
      })
      .finally(() => setSavingEnd(false));
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const resetFilters = () => {
    setFilters(emptyFilters);
    setSearchTerm('');
  };

  // ── Form handlers ──
  const handleAddStudent = () => {
    setStudentFormMode('add');
    setEditingStudent(null);
    setShowStudentForm(true);
  };

  const handleEditStudent = (student) => {
    setStudentFormMode('edit');
    setEditingStudent(student);
    setShowStudentForm(true);
  };

  const handleStudentSaved = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
    setTimeout(() => onRefresh && onRefresh(), 400);
  };

  // ── Delete ──
  const handleDelete = (student) => {
    if (!window.confirm(`Are you sure you want to delete this student: ${student.name || 'Unknown'}?`)) return;

    fetch(`${API_BASE_URL}/deleteStudent/${student.id || student._id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'pass') {
          alert('Student deleted!');
          onRefresh && onRefresh();
        } else {
          alert(data.message || 'Failed to delete student');
        }
      })
      .catch((err) => {
        console.error('Error deleting student:', err);
        alert('Error deleting student');
      });
  };

  // ── Details view ──
  if (showStudentDetails) {
    return (
      <StudentDetails
        student={selectedStudent}
        onBack={() => {
          setShowStudentDetails(false);
          setSelectedStudent(null);
        }}
        formatDate={formatDate}
      />
    );
  }

  return (
    <div className="manage-container">
      <h2>Manage Students</h2>

      <div className="student-management-panel">
        {/* Search & Filter */}
        <div className="search-filter-bar">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search students by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label><Filter size={16} /> Course Type</label>
              <select
                value={filters.coursetype}
                onChange={(e) => setFilters({ ...filters, coursetype: e.target.value })}
              >
                <option value="">All Courses</option>
                <option value="academics">Academics</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Plan</label>
              <select
                value={filters.plan}
                onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
              >
                <option value="">All Plans</option>
                <option value="trial">Trial</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="halfyearly">Half Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="expiring">Expiring</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              >
                <option value="">All Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button className="reset-filters-btn" onClick={resetFilters}>Reset Filters</button>
          </div>
        </div>

        {/* Student list */}
        <div className="student-list-container">
          <div className="list-header">
            <div className="list-header-left">
              <h3>
                Students ({filteredStudents.length})
                <span className="search-summary">
                  {searchTerm && ` matching "${searchTerm}"`}
                  {hasActiveFilters && ' with filters applied'}
                </span>
              </h3>
            </div>
            <button className="add-student-btn" onClick={handleAddStudent}>
              <User size={18} /> Add New Student
            </button>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👨‍🎓</div>
              <h4>No Students Found</h4>
              <p>
                {searchTerm || hasActiveFilters
                  ? 'No students match your search criteria. Try different filters.'
                  : 'No students found in the database.'}
              </p>
              {(searchTerm || hasActiveFilters) && (
                <button onClick={resetFilters} className="reset-filters-btn">
                  Clear Search & Filters
                </button>
              )}
            </div>
          ) : (
            <div className="student-table-container">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Contact</th>
                    <th>Course</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Subscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="student-row">
                      <td>
                        <div className="student-info">
                          <div className="student-details">
                            <div className="student-name">{student.name}</div>
                            <div className="student-id">ID: {student.id?.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <div className="contact-item"><Mail size={14} /><span>{student.email}</span></div>
                          <div className="contact-item"><Phone size={14} /><span>{student.phone || 'Not provided'}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="course-info">
                          <div className="course-type">{student.coursetype || 'Not set'}</div>
                          <div className="course-name">{student.courseName || 'Not specified'}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`plan-badge plan-${student.plan?.toLowerCase() || 'default'}`}>
                          {student.plan || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(student.status) }}>
                          {student.status}
                          {student.daysRemaining !== null && student.daysRemaining <= 7 && (
                            <span className="days-count"> ({student.daysRemaining}d)</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <div className="subscription-info">
                          <div className="date-item"><Calendar size={12} /><span>Start: {formatDate(student.startDate)}</span></div>
                          {editingEndId === student.id ? (
                            <div className="date-item end-date-edit">
                              <Calendar size={12} />
                              <input
                                type="date"
                                value={endDateValue}
                                onChange={(e) => setEndDateValue(e.target.value)}
                                disabled={savingEnd}
                              />
                              <button className="end-date-save" onClick={() => saveEndDate(student)} disabled={savingEnd} title="Save">
                                <Check size={12} />
                              </button>
                              <button className="end-date-cancel" onClick={cancelEditEnd} disabled={savingEnd} title="Cancel">
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="date-item">
                              <Calendar size={12} />
                              <span>End: {formatDate(student.endDate)}</span>
                              <button className="end-date-edit-btn" onClick={() => startEditEnd(student)} title="Edit End Date">
                                <Pencil size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="view-btn"
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowStudentDetails(true);
                            }}
                          >
                            <Eye size={16} /> View
                          </button>
                          <button className="edit-btn" onClick={() => handleEditStudent(student)} title="Edit Student">
                            <Edit size={16} /> Edit
                          </button>
                          <button className="deleteE-btn" onClick={() => handleDelete(student)} title="Delete Student">
                            <Trash2 size={16} /> Delete
                          </button>
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

      {/* Student form modal */}
      {showStudentForm && (
        <StudentForm
          student={editingStudent}
          onClose={() => {
            setShowStudentForm(false);
            setEditingStudent(null);
          }}
          onSave={handleStudentSaved}
          mode={studentFormMode}
        />
      )}
    </div>
  );
};

export default ManageStudent;