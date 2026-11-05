import React, { useState } from 'react';
import './ManageTeacher.css';
import { API_BASE_URL } from '../../config';
import { Eye, EyeOff, Mail, Phone, Edit, Trash2 } from 'lucide-react';

const teacherSubjectOptions = {
  jee: ['Physics', 'Chemistry', 'Maths'],
  neet: ['Physics', 'Chemistry', 'Botany', 'Zoology'],
  class11: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
  class12: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
  board_exam: [
    'Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Social Science',
    'Science', 'Accountancy', 'Business Studies', 'Economics', 'Computer Science',
  ],
};

const getCardsForMode = (mode) => {
  if (mode === 'academics') {
    return [
      { value: 'class11', label: 'Class 11' },
      { value: 'class12', label: 'Class 12' },
    ];
  }
  if (mode === 'professional') {
    return [
      { value: 'jee', label: 'JEE' },
      { value: 'neet', label: 'NEET' },
    ];
  }
  if (mode === 'tutor') {
    return [{ value: 'board_exam', label: 'Board Exam' }];
  }
  return [];
};

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
  role: 'teacher',
  access: { mode: '', cardId: [], boardType: '', subjects: [], standards: [] },
};

// Backend expects a string for courseName — join with comma when several are selected
const resolveCardIdForApi = (arr) => (!arr || arr.length === 0 ? '' : arr.join(','));

const ManageTeacher = ({ teachers = [], onRefresh }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const setAccess = (patch) =>
    setFormData((prev) => ({ ...prev, access: { ...prev.access, ...patch } }));

  const resetForm = () => {
    setFormData(emptyForm);
    setIsEditing(false);
    setEditIndex(null);
  };

  const getSingleCardId = () => formData.access.cardId[0] || '';

  // ── Card change ──
  const handleCardChange = (e) => {
    const cardValue = e.target.value;

    if (formData.access.mode === 'professional') {
      const current = formData.access.cardId;
      const updated = current.includes(cardValue)
        ? current.filter((v) => v !== cardValue)
        : [...current, cardValue];
      const mergedSubjects = [
        ...new Set(updated.flatMap((id) => teacherSubjectOptions[id] || [])),
      ];
      setAccess({ cardId: updated, subjects: mergedSubjects, standards: [] });
    } else {
      setAccess({
        cardId: cardValue ? [cardValue] : [],
        boardType: '',
        standards: cardValue === 'class11' ? ['11'] : cardValue === 'class12' ? ['12'] : [],
        subjects: teacherSubjectOptions[cardValue] || [],
      });
    }
  };

  const toggleInList = (key, value) => {
    const current = formData.access[key];
    setAccess({
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  };

  // ── Submit ──
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }

    const body = {
      databaseName: 'users',
      collectionName: 'users',
      user: {
        userName: formData.name,
        phoneNumber: formData.phone,
        gmail: formData.email,
        password: formData.password,
        role: 'teacher',
        coursetype: formData.access.mode,
        courseName: resolveCardIdForApi(formData.access.cardId),
        boardType: formData.access.boardType,
        standards: formData.access.standards || [],
        subjects: formData.access.subjects || [],
      },
    };

    let url;
    let method;
    if (isEditing && editIndex !== null && teachers[editIndex]) {
      const teacherEmail = teachers[editIndex].email || teachers[editIndex].gmail;
      if (!teacherEmail) {
        alert('Error: Teacher email not found for update');
        return;
      }
      url = `${API_BASE_URL}/updateUser/${teacherEmail}`;
      method = 'PUT';
    } else {
      url = `${API_BASE_URL}/newUser`;
      method = 'POST';
    }

    fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'pass') {
          alert(editIndex !== null ? 'Teacher updated!' : 'Teacher created!');
          onRefresh && onRefresh();
          resetForm();
        } else if (data.status === 'failed') {
          alert(data.message || 'Teacher with this email already exists!');
        } else {
          alert(data.message || 'Operation failed');
        }
      })
      .catch((err) => {
        console.error('Error saving teacher:', err);
        alert('Error saving teacher');
      });
  };

  // ── Delete ──
  const handleDelete = (item) => {
    const name = item.name || item.userName || 'Unknown';
    if (!window.confirm(`Are you sure you want to delete this teacher: ${name}?`)) return;

    fetch(`${API_BASE_URL}/deleteUser/${item.email}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ databaseName: 'users', collectionName: 'users' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'pass') {
          alert('Teacher deleted!');
          onRefresh && onRefresh();
          if (isEditing) resetForm();
        } else {
          alert(data.message || 'Failed to delete teacher');
        }
      })
      .catch((err) => {
        console.error('Error deleting teacher:', err);
        alert('Error deleting teacher');
      });
  };

  // ── Edit ──
  const handleEdit = (index) => {
    const teacher = teachers[index];
    if (!teacher) return;

    setEditIndex(index);
    setIsEditing(true);
    setFormData({
      name: teacher.name || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      password: '',
      role: teacher.role || 'teacher',
      access: {
        mode: teacher.access?.mode || '',
        cardId: Array.isArray(teacher.access?.cardId)
          ? teacher.access.cardId
          : teacher.access?.cardId ? [teacher.access.cardId] : [],
        boardType: teacher.access?.boardType || '',
        subjects: teacher.access?.subjects || [],
        standards: teacher.access?.standards || [],
      },
    });
  };

  const { access } = formData;
  const isBoardExam = access.cardId.includes('board_exam');

  return (
    <div className="manage-container">
      <h2>Manage Teachers</h2>

      <div className="teachers-management">
        <div className="existing-teachers-section">
          <div className="section-header">
            <h3>Existing Teachers</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="teacher-count">{teachers.length} total</div>
              <button
                className="add-teacher-btn"
                onClick={() => {
                  resetForm();
                  setIsEditing(true);
                }}
              >
                + Add Teacher
              </button>
            </div>
          </div>

          {/* ── Create / Edit form ── */}
          {isEditing && (
            <div className="create-teacher-section">
              <div className="form-header">
                <h4>{editIndex !== null ? 'Edit Teacher' : 'Create New Teacher'}</h4>
                <button className="close-form-btn" onClick={resetForm}>×</button>
              </div>

              <form className="teacher-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      placeholder="Teacher Username"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      placeholder="Email ID"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="password-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mode</label>
                    <select
                      value={access.mode}
                      onChange={(e) =>
                        setAccess({
                          mode: e.target.value,
                          cardId: [],
                          boardType: '',
                          subjects: [],
                          standards: [],
                        })
                      }
                    >
                      <option value="">-- Select Mode --</option>
                      <option value="academics">Academics</option>
                      <option value="professional">Professional</option>
                      <option value="tutor">Tutor</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Course/Class</label>
                    {access.mode === 'professional' ? (
                      <div className="checkbox-group" style={{ paddingTop: '6px' }}>
                        {getCardsForMode('professional').map((card) => (
                          <label key={card.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              value={card.value}
                              checked={access.cardId.includes(card.value)}
                              onChange={handleCardChange}
                            />
                            {card.label}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <select
                        value={getSingleCardId()}
                        onChange={handleCardChange}
                        disabled={!access.mode}
                      >
                        <option value="">-- Select --</option>
                        {getCardsForMode(access.mode).map((card) => (
                          <option key={card.value} value={card.value}>{card.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Board type (tutor mode) */}
                {isBoardExam && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Board Type</label>
                      <select
                        value={access.boardType}
                        onChange={(e) => setAccess({ boardType: e.target.value })}
                      >
                        <option value="">-- Select Board --</option>
                        <option value="cbse">CBSE</option>
                        <option value="state_board">State Board</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Classes 6–12 (tutor mode) */}
                {isBoardExam && access.boardType && (
                  <div className="form-group full-width">
                    <label>Classes (6 - 12)</label>
                    <div className="checkbox-group">
                      {['6', '7', '8', '9', '10', '11', '12'].map((std) => (
                        <label key={std}>
                          <input
                            type="checkbox"
                            checked={access.standards.includes(std)}
                            onChange={() => toggleInList('standards', std)}
                          />
                          Class {std}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standards (academics) */}
                {(access.cardId.includes('class11') || access.cardId.includes('class12')) && (
                  <div className="form-group full-width">
                    <label>Standards</label>
                    <div className="checkbox-group">
                      {(access.cardId.includes('class11') ? ['11'] : ['12']).map((std) => (
                        <label key={std}>
                          <input
                            type="checkbox"
                            checked={access.standards.includes(std)}
                            onChange={() => toggleInList('standards', std)}
                          />
                          Class {std}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subjects */}
                {access.cardId.length > 0 && (
                  <div className="form-group full-width">
                    <label>Subjects</label>
                    <div className="subject-options">
                      {[
                        ...new Set(
                          access.cardId.flatMap(
                            (id) => teacherSubjectOptions[id] || teacherSubjectOptions.board_exam
                          )
                        ),
                      ].map((subject) => (
                        <label key={subject}>
                          <input
                            type="checkbox"
                            checked={access.subjects.includes(subject)}
                            onChange={() => toggleInList('subjects', subject)}
                          />
                          {subject}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="create-teacher-btn">
                  {editIndex !== null ? 'Update Teacher' : 'Create Teacher'}
                </button>
              </form>
            </div>
          )}

          {/* ── Teachers grid ── */}
          {teachers.length === 0 ? (
            <div className="empty-state teacher-empty">
              <div className="empty-icon">👨‍🏫</div>
              <h4>No Teachers Found</h4>
              <p>Click "Add Teacher" button above to get started.</p>
            </div>
          ) : (
            <div className="teachers-grid">
              {teachers.map((item, idx) => {
                const mode = item.access?.mode || '';
                const cardIds = item.access?.cardId || [];
                const subjects = item.access?.subjects || [];

                return (
                  <div key={item.id || idx} className="teacher-card">
                    <div className="teacher-card-header">
                      <div className="teacher-avatar">
                        {(item.name || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div className="teacher-info">
                        <h4>{item.name}</h4>
                        <span className="teacher-role">{item.role || 'teacher'}</span>
                      </div>
                    </div>

                    <div className="teacher-card-body">
                      <div className="teacher-detail">
                        <Mail size={14} />
                        <span>{item.email}</span>
                      </div>
                      <div className="teacher-detail">
                        <Phone size={14} />
                        <span>{item.phone || 'Not provided'}</span>
                      </div>
                      {mode && (
                        <div className="teacher-access">
                          <div className="access-badge">{mode}</div>
                          {cardIds.map((cid) => (
                            <div key={cid} className="access-badge">{cid}</div>
                          ))}
                          {subjects.length > 0 && (
                            <div className="access-badge subjects">
                              {subjects.slice(0, 2).join(', ')}
                              {subjects.length > 2 && ` +${subjects.length - 2}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="teacher-card-footer">
                      <button className="teacher-edit-btn" onClick={() => handleEdit(idx)}>
                        <Edit size={14} /> Edit
                      </button>
                      <button className="teacher-delete-btn" onClick={() => handleDelete(item)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTeacher;