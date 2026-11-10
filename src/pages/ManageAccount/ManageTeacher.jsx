import React, { useState } from 'react';
import './ManageTeacher.css';
import { API_BASE_URL } from '../../config';
import { Eye, EyeOff, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import { SERVICES, MANAGE_SERVICE_IDS, parseServices, serviceLabels } from './services';

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
  if (mode === 'academics') return [{ value: 'class11', label: 'Class 11' }, { value: 'class12', label: 'Class 12' }];
  if (mode === 'professional') return [{ value: 'jee', label: 'JEE' }, { value: 'neet', label: 'NEET' }];
  if (mode === 'tutor') return [{ value: 'board_exam', label: 'Board Exam' }];
  return [];
};

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
  services: [], // admin only: the Manage Account sections this admin can open (checkboxes)
  access: { mode: '', cardId: [], boardType: '', subjects: [], standards: [] },
};

// Backend stores courseName as a string — join with comma when several are selected
const resolveCardIdForApi = (arr) => (!arr || arr.length === 0 ? '' : arr.join(','));

const ManageTeacher = ({ teachers = [], onRefresh }) => {
  const [activeTab, setActiveTab] = useState('teacher'); // 'teacher' | 'admin'
  const [formData, setFormData] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [originalEmail, setOriginalEmail] = useState(null); // null = creating, string = editing
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdminTab = activeTab === 'admin';
  const isEditing = originalEmail !== null;
  const { access } = formData;
  const isBoardExam = access.cardId.includes('board_exam');
  const allServicesSelected = formData.services.length === MANAGE_SERVICE_IDS.length;

  const visibleUsers = teachers.filter((t) => (t.role || 'teacher') === activeTab);
  const countOf = (role) => teachers.filter((t) => (t.role || 'teacher') === role).length;

  const setAccess = (patch) =>
    setFormData((prev) => ({ ...prev, access: { ...prev.access, ...patch } }));

  const resetForm = () => {
    setFormData(emptyForm);
    setShowForm(false);
    setOriginalEmail(null);
    setShowPassword(false);
  };

  const switchTab = (tab) => {
    resetForm();
    setActiveTab(tab);
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setOriginalEmail(null);
    setShowForm(true);
  };

  const getSingleCardId = () => formData.access.cardId[0] || '';

  // ── Admin: tick / untick one Manage Account section ──
  const toggleService = (id) =>
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id],
    }));

  const toggleAllServices = () =>
    setFormData((prev) => ({
      ...prev,
      services: prev.services.length === MANAGE_SERVICE_IDS.length ? [] : [...MANAGE_SERVICE_IDS],
    }));

  // ── Course / class change (teacher form) ──
  const handleCardChange = (e) => {
    const cardValue = e.target.value;

    if (access.mode === 'professional') {
      const current = access.cardId;
      const updated = current.includes(cardValue)
        ? current.filter((v) => v !== cardValue)
        : [...current, cardValue];
      const mergedSubjects = [...new Set(updated.flatMap((id) => teacherSubjectOptions[id] || []))];
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
    const current = access[key];
    setAccess({
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  };

  // ── Submit ──
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in username and email');
      return;
    }
    if (!isEditing && !formData.password) {
      alert('Password is required for a new user');
      return;
    }
    if (isAdminTab && formData.services.length === 0) {
      alert('Please tick at least one Manage Account section for this admin');
      return;
    }
    if (!isAdminTab && !access.mode) {
      alert('Please select a mode for this teacher');
      return;
    }

    const user = {
      userName: formData.name.trim(),
      phoneNumber: formData.phone,
      gmail: formData.email.trim(),
      password: formData.password, // blank on edit = keep existing password
      role: activeTab,
      // several sections are saved as one comma-separated string, e.g. "students,blogs"
      service: isAdminTab ? formData.services.join(',') : '',
      coursetype: isAdminTab ? '' : access.mode,
      courseName: isAdminTab ? '' : resolveCardIdForApi(access.cardId),
      boardType: isAdminTab ? '' : access.boardType,
      standards: isAdminTab ? [] : access.standards || [],
      subjects: isAdminTab ? [] : access.subjects || [],
    };

    const body = { databaseName: 'users', collectionName: 'users', user };

    const url = isEditing
      ? `${API_BASE_URL}/updateUser/${encodeURIComponent(originalEmail)}`
      : `${API_BASE_URL}/newUser`;
    const method = isEditing ? 'PUT' : 'POST';
    const label = isAdminTab ? 'Admin' : 'Teacher';

    setSaving(true);
    fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'pass') {
          alert(isEditing ? `${label} updated!` : `${label} created!`);
          onRefresh && onRefresh();
          resetForm();
        } else {
          alert(data.message || 'Operation failed');
        }
      })
      .catch((err) => {
        console.error('Error saving user:', err);
        alert(`Error saving ${label.toLowerCase()}`);
      })
      .finally(() => setSaving(false));
  };

  // ── Delete ──
  const handleDelete = (item) => {
    const label = isAdminTab ? 'admin' : 'teacher';
    if (!window.confirm(`Are you sure you want to delete this ${label}: ${item.name || item.email}?`)) return;

    fetch(`${API_BASE_URL}/deleteUser/${encodeURIComponent(item.email)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'pass') {
          alert('Deleted!');
          onRefresh && onRefresh();
          if (showForm) resetForm();
        } else {
          alert(data.message || 'Failed to delete');
        }
      })
      .catch((err) => {
        console.error('Error deleting user:', err);
        alert('Error deleting user');
      });
  };

  // ── Edit ──
  const handleEdit = (item) => {
    setOriginalEmail(item.email);
    setShowForm(true);
    setShowPassword(false);
    setFormData({
      name: item.name || '',
      phone: item.phone || '',
      email: item.email || '',
      password: '',
      // keep only sections that can still be assigned (drops old "academics"/"professional")
      services: parseServices(item.service).filter((s) => MANAGE_SERVICE_IDS.includes(s)),
      access: {
        mode: item.access?.mode || '',
        cardId: Array.isArray(item.access?.cardId)
          ? item.access.cardId
          : item.access?.cardId ? [item.access.cardId] : [],
        boardType: item.access?.boardType || '',
        subjects: item.access?.subjects || [],
        standards: item.access?.standards || [],
      },
    });
  };

  return (
    <div className="manage-container">
      <h2>Manage Staff</h2>

      <div className="teachers-management">
        {/* ── Two buttons: Teacher / Admin ── */}
        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${activeTab === 'teacher' ? 'active' : ''}`}
            onClick={() => switchTab('teacher')}
          >
            👨‍🏫 Teachers <span className="role-tab-count">{countOf('teacher')}</span>
          </button>
          <button
            type="button"
            className={`role-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => switchTab('admin')}
          >
            🛡️ Admins <span className="role-tab-count">{countOf('admin')}</span>
          </button>
        </div>

        <div className="existing-teachers-section">
          <div className="section-header">
            <h3>{isAdminTab ? 'Existing Admins' : 'Existing Teachers'}</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="teacher-count">{visibleUsers.length} total</div>
              <button className="add-teacher-btn" onClick={openCreate}>
                {isAdminTab ? '+ Add Admin' : '+ Add Teacher'}
              </button>
            </div>
          </div>

          {/* ── Create / Edit form ── */}
          {showForm && (
            <div className="create-teacher-section">
              <div className="form-header">
                <h4>
                  {isEditing ? 'Edit' : 'Create New'} {isAdminTab ? 'Admin' : 'Teacher'}
                </h4>
                <button type="button" className="close-form-btn" onClick={resetForm}>×</button>
              </div>

              <form className="teacher-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email (login ID) *</label>
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
                    <label>Password {isEditing ? '' : '*'}</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isEditing ? 'Leave blank to keep current' : 'Password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!isEditing}
                        autoComplete="new-password"
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

                {/* ───────── ADMIN: Manage Account sections (checkboxes) ───────── */}
                {isAdminTab && (
                  <div className="form-group full-width">
                    <label>Manage Account * (this user will ONLY see the ticked sections after login)</label>
                    <div className="checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={allServicesSelected}
                          onChange={toggleAllServices}
                        />
                        <strong>Select all</strong>
                      </label>
                      {SERVICES.map((s) => (
                        <label key={s.id}>
                          <input
                            type="checkbox"
                            checked={formData.services.includes(s.id)}
                            onChange={() => toggleService(s.id)}
                          />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* ───────── TEACHER: mode / course / subjects ───────── */}
                {!isAdminTab && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Mode *</label>
                        <select
                          value={access.mode}
                          onChange={(e) =>
                            setAccess({ mode: e.target.value, cardId: [], boardType: '', subjects: [], standards: [] })
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
                              <label key={card.value}>
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
                          <select value={getSingleCardId()} onChange={handleCardChange} disabled={!access.mode}>
                            <option value="">-- Select --</option>
                            {getCardsForMode(access.mode).map((card) => (
                              <option key={card.value} value={card.value}>{card.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {isBoardExam && (
                      <div className="form-row">
                        <div className="form-group">
                          <label>Board Type</label>
                          <select value={access.boardType} onChange={(e) => setAccess({ boardType: e.target.value })}>
                            <option value="">-- Select Board --</option>
                            <option value="cbse">CBSE</option>
                            <option value="state_board">State Board</option>
                          </select>
                        </div>
                      </div>
                    )}

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

                    {access.cardId.length > 0 && (
                      <div className="form-group full-width">
                        <label>Subjects</label>
                        <div className="subject-options">
                          {[
                            ...new Set(
                              access.cardId.flatMap((id) => teacherSubjectOptions[id] || teacherSubjectOptions.board_exam)
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
                  </>
                )}

                <button type="submit" className="create-teacher-btn" disabled={saving}>
                  {saving
                    ? 'Saving...'
                    : `${isEditing ? 'Update' : 'Create'} ${isAdminTab ? 'Admin' : 'Teacher'}`}
                </button>
              </form>
            </div>
          )}

          {/* ── Cards ── */}
          {visibleUsers.length === 0 ? (
            <div className="empty-state teacher-empty">
              <div className="empty-icon">{isAdminTab ? '🛡️' : '👨‍🏫'}</div>
              <h4>No {isAdminTab ? 'Admins' : 'Teachers'} Found</h4>
              <p>Click "{isAdminTab ? '+ Add Admin' : '+ Add Teacher'}" above to get started.</p>
            </div>
          ) : (
            <div className="teachers-grid">
              {visibleUsers.map((item, idx) => {
                const mode = item.access?.mode || '';
                const cardIds = item.access?.cardId || [];
                const subjects = item.access?.subjects || [];
                const adminServices = parseServices(item.service);
                // The main admin (no service) = full access; protect it from edit/delete here
                const isFullAdmin = isAdminTab && adminServices.length === 0;

                return (
                  <div key={item.id || item.email || idx} className="teacher-card">
                    <div className="teacher-card-header">
                      <div className="teacher-avatar">{(item.name || 'U').charAt(0).toUpperCase()}</div>
                      <div className="teacher-info">
                        <h4>{item.name}</h4>
                        <span className="teacher-role">{item.role || 'teacher'}</span>
                      </div>
                    </div>

                    <div className="teacher-card-body">
                      <div className="teacher-detail"><Mail size={14} /><span>{item.email}</span></div>
                      <div className="teacher-detail"><Phone size={14} /><span>{item.phone || 'Not provided'}</span></div>

                      {isAdminTab ? (
                        <div className="teacher-access">
                          {isFullAdmin ? (
                            <div className="access-badge subjects">Full access</div>
                          ) : (
                            adminServices.map((id) => (
                              <div key={id} className="access-badge subjects">{serviceLabels(id)}</div>
                            ))
                          )}
                        </div>
                      ) : (
                        mode && (
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
                        )
                      )}
                    </div>

                    {!isFullAdmin && (
                      <div className="teacher-card-footer">
                        <button className="teacher-edit-btn" onClick={() => handleEdit(item)}>
                          <Edit size={14} /> Edit
                        </button>
                        <button className="teacher-delete-btn" onClick={() => handleDelete(item)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
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