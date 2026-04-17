/* eslint-disable no-undef */
import React, { useEffect, useState, useCallback } from 'react';
import './ManageAccount.css';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import Support from './ManageAccount/support';
import StudentDetails from './ManageAccount/StudentDetails';
import { Search, Filter, Eye, Download, Calendar, User, Mail, Phone, GraduationCap, Edit } from 'lucide-react';
import People from './ManageAccount/PeopleEnquiry';
import Coupon from './ManageAccount/Coupon';
import StudentForm from './ManageAccount/StudentForm';
import AssignClass from './ManageAccount/AssignClass';

const teacherSubjectOptions = {
  jee: ['Physics', 'Chemistry', 'Maths'],
  neet: ['Physics', 'Chemistry', 'Botany', 'Zoology'],
  class11: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
  class12: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
  // Comprehensive subjects for Tutor/Board Exam mode
  board_exam: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Social Science', 'Science', 'Accountancy', 'Business Studies', 'Economics', 'Computer Science'],
};

const getCardsForMode = (mode, isTeacher = false) => {
  if (isTeacher) {
    if (mode === 'academics') {
      return [
        { value: 'class11', label: 'Class 11' },
        { value: 'class12', label: 'Class 12' },
      ];
    } else if (mode === 'professional') {
      return [
        { value: 'jee', label: 'JEE' },
        { value: 'neet', label: 'NEET' },
      ];
    } else if (mode === 'tutor') {
      // NEW: Tutor mode specifically shows Board Exam
      return [
        { value: 'board_exam', label: 'Board Exam' },
      ];
    }
  } else {
    if (mode === 'academics') {
      return [
        { value: 'kindergarten', label: 'Kindergarten' },
        { value: 'class1-5', label: 'Class 1 - 5' },
        { value: 'class6-12', label: 'Class 6 - 12' },
      ];
    } else if (mode === 'professional') {
      return [
        { value: 'jee', label: 'JEE' },
        { value: 'neet', label: 'NEET' },
      ];
    }
  }
  return [];
};

// ── Helper: normalise a raw API student doc into the shape the UI expects ──
const normaliseStudent = (student, index) => {
  const endDate = student.endDate ? new Date(student.endDate) : null;
  const now = new Date();
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))
    : null;

  let status = 'active';
  if (student.plan === 'trial') {
    status = 'trial';
  } else if (daysRemaining === 0) {
    status = 'expiring';
  } else if (daysRemaining === null) {
    status = 'inactive';
  }

  return {
    id: student._id || student.id,
    firstname: student.firstname || '',
    lastname: student.lastname || '',
    name: student.firstname
      ? `${student.firstname} ${student.lastname || ''}`.trim()
      : student.fullName || '',
    email: student.email || '',
    password: student.password || '',
    mobile: student.mobile || student.phone || '',
    phone: student.mobile || student.phone || '',
    coursetype: student.coursetype || '',
    courseName: student.courseName || '',
    standards: student.standards || [],
    subjects: student.subjects || [],
    selectedCourse: student.selectedCourse || {},
    selectedStandard: student.selectedStandard || [],
    dob: student.dob || '',
    gender: student.gender || '',
    plan: student.plan || '',
    startDate: student.startDate || '',
    endDate: student.endDate || '',
    daysRemaining,
    status,
    paymentId: student.paymentId || '',
    paymentMethod: student.paymentMethod || '',
    amountPaid: student.amountPaid || '',
    payerId: student.payerId || '',
    paymentHistory: student.paymentHistory || [],
    couponUsed: student.couponUsed || 'NONE',
    discountPercentage: student.discountPercentage || '0',
    discountAmount: student.discountAmount || '0',
    comfortableDailyHours: student.comfortableDailyHours || 3,
    severity: student.severity || '',
    city: student.city || '',
    state: student.state || '',
    photo: student.photo || '',
    access: {
      mode: student.coursetype || student.selectedCourse?.type || '',
      cardId: student.courseName || student.selectedCourse?.name || '',
      subjects: student.subjects || [],
      standards: student.selectedStandard || student.standards || [],
    },
    _class: student._class || '',
    displayIndex: index,
  };
};

const ManageAccount = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [activeView, setActiveView] = useState('teachers');
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');

  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentFormMode, setStudentFormMode] = useState('add');
  const [editingStudent, setEditingStudent] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    coursetype: '',
    plan: '',
    status: '',
    gender: '',
  });

  const [teacherFormData, setTeacherFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'teacher',
    access: { mode: '', cardId: '', boardType: '', subjects: [], standards: [] },
  });

  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // ── Fetch all users (teachers + students) ───────────────────────────────
  const getUsers = useCallback(() => {
    console.log('=== getUsers() started ===');

    fetch(`${API_BASE_URL}/getUsers`, { method: 'GET', credentials: 'include' })
      .then((r) => r.json())
      .then((teacherData) => {
        return fetch(`${API_BASE_URL}/getAllStudents`, { method: 'GET', credentials: 'include' })
          .then((r) => r.json())
          .then((studentData) => {
            // ── Teachers ──
            const teacherAdminList = Array.isArray(teacherData)
              ? teacherData
                .filter((u) => u.role === 'teacher' || u.role === 'admin')
                .map((u) => ({
                  id: u._id || u.id,
                  name: u.userName || '',
                  phone: u.phoneNumber || '',
                  email: u.gmail || '',
                  password: u.password || '',
                  role: u.role || 'user',
                  access: {
                    mode: u.coursetype || '',
                    cardId: u.courseName || '',
                    boardType: u.boardType || '',
                    subjects: u.subjects || [],
                    standards: u.standards || [],
                  },
                }))
              : [];

            // ── Students ──
            let studentList = [];
            if (Array.isArray(studentData)) {
              studentList = studentData.map((s, i) => normaliseStudent(s, i));
            } else if (studentData?.status === 'error') {
              console.error('Error fetching students:', studentData.message);
              alert('Error fetching students: ' + studentData.message);
            }

            setTeachers(teacherAdminList);

            // Replace both lists with fresh data — triggers filter useEffect
            setStudents(studentList);
            setFilteredStudents(studentList); // reset immediately too
          });
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
        alert('Error loading user data. Please try again.');
      });
  }, []);

  // ── Session check ────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasCheckedSession) return;
    const start = performance.now();
    fetch(`${API_BASE_URL}/checkSession`, { method: 'GET', credentials: 'include' })
      .then((r) => r.json())
      .then((text) => {
        console.log(`checkSession took ${performance.now() - start} ms`);
        if (text.status === 'failed') {
          localStorage.removeItem('currentUser');
          navigate('/signin');
        } else {
          getUsers();
        }
        setHasCheckedSession(true);
      })
      .catch(() => { });
  }, [navigate, hasCheckedSession, getUsers]);

  // ── Filter / search ──────────────────────────────────────────────────────
  useEffect(() => {
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

    setFilteredStudents(result);
  }, [searchTerm, filters, students]);

  // ── Student form handlers ────────────────────────────────────────────────
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

  /**
   * Called by StudentForm after a successful save.
   * We close the modal first, then re-fetch with a short delay so the
   * backend has time to commit before we GET the updated list.
   */
  const handleStudentSaved = () => {
    setShowStudentForm(false);
    setEditingStudent(null);

    // Small delay ensures the backend write is fully committed before refetch
    setTimeout(() => {
      getUsers();
    }, 400);
  };

  // ── Teacher form handlers ────────────────────────────────────────────────
  const handleTeacherCardChange = (e) => {
    const cardId = e.target.value;
    const defaultSubjs = teacherSubjectOptions[cardId] || [];
    setTeacherFormData((prev) => ({
      ...prev,
      access: {
        ...prev.access,
        cardId,
        boardType: '', // Reset board type when card changes
        standards:
          cardId === 'class11' ? ['11'] : cardId === 'class12' ? ['12'] : [],
        subjects: defaultSubjs,
      },
    }));
  };

  const handleTeacherSubjectChange = (subject) => {
    const current = teacherFormData.access.subjects;
    const updated = current.includes(subject)
      ? current.filter((s) => s !== subject)
      : [...current, subject];
    setTeacherFormData({ ...teacherFormData, access: { ...teacherFormData.access, subjects: updated } });
  };

  const handleTeacherStandardChange = (standard) => {
    const current = teacherFormData.access.standards;
    const updated = current.includes(standard)
      ? current.filter((s) => s !== standard)
      : [...current, standard];
    setTeacherFormData({ ...teacherFormData, access: { ...teacherFormData.access, standards: updated } });
  };

  const resetTeacherForm = () => {
    setTeacherFormData({
      name: '', phone: '', email: '', password: '', role: 'teacher',
      access: { mode: '', cardId: '', boardType: '', subjects: [], standards: [] },
    });
    setIsEditingTeacher(false);
    setEditIndex(null);
  };

  const handleTeacherSubmit = (e) => {
    e.preventDefault();
    if (!teacherFormData.name || !teacherFormData.email || !teacherFormData.password) {
      alert('Please fill in all required fields');
      return;
    }

    const body = {
      databaseName: 'users',
      collectionName: 'users',
      user: {
        userName: teacherFormData.name,
        phoneNumber: teacherFormData.phone,
        gmail: teacherFormData.email,
        password: teacherFormData.password,
        role: 'teacher',
        coursetype: teacherFormData.access.mode,
        courseName: teacherFormData.access.cardId,
        boardType: teacherFormData.access.boardType, // New field for Tutor mode
        standards: teacherFormData.access.standards || [],
        subjects: teacherFormData.access.subjects || [],
      },
    };

    const url = isEditingTeacher
      ? `${API_BASE_URL}/updateUser/${teachers[editIndex].email}`
      : `${API_BASE_URL}/newUser`;
    const method = isEditingTeacher ? 'PUT' : 'POST';

    fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'pass') {
          alert(isEditingTeacher ? 'Teacher updated!' : 'Teacher created!');
          getUsers();
          resetTeacherForm();
        } else if (data.status === 'failed') {
          alert('Teacher with this email already exists!');
        } else {
          alert(data.message || 'Operation failed');
        }
      })
      .catch((err) => {
        console.error('Error saving teacher:', err);
        alert('Error saving teacher');
      });
  };

  const handleDelete = (index, isTeacher = false) => {
    if (!isTeacher) return;
    const userToDelete = teachers[index];
    if (!confirm(`Delete teacher: ${userToDelete.name}?`)) return;

    fetch(`${API_BASE_URL}/deleteUser/${userToDelete.email}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ databaseName: 'users', collectionName: 'users' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'pass') {
          alert('Teacher deleted!');
          getUsers();
          if (isEditingTeacher && editIndex === index) resetTeacherForm();
        } else {
          alert(data.message || 'Failed to delete teacher');
        }
      })
      .catch((err) => {
        console.error('Error deleting teacher:', err);
        alert('Error deleting teacher');
      });
  };

  const handleEditTeacher = (index) => {
    setEditIndex(index);
    setIsEditingTeacher(true);
    setTeacherFormData({ ...teachers[index] });
    setActiveView('teachers');
    setShowSupport(false);
    setSelectedSection('');
  };

  // ── Student detail view ──────────────────────────────────────────────────
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
    setShowSupport(false);
    setSelectedSection('');
  };

  const handleBackToList = () => {
    setShowStudentDetails(false);
    setSelectedStudent(null);
  };

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExportStudents = () => {
    const headers = [
      'ID', 'Name', 'Email', 'Phone', 'Course Type',
      'Plan', 'Status', 'Start Date', 'End Date', 'Days Remaining', 'Gender', 'Subjects',
    ];
    const csvData = filteredStudents.map((s) => [
      s.id, s.name, s.email, s.phone, s.coursetype,
      s.plan, s.status,
      formatDate(s.startDate), formatDate(s.endDate),
      s.daysRemaining, s.gender, (s.subjects || []).join(', '),
    ]);
    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
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

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'premium': return '#9C27B0';
      case 'basic': return '#2196F3';
      case 'trial': return '#FF9800';
      default: return '#757575';
    }
  };

  const resetFilters = () => {
    setFilters({ coursetype: '', plan: '', status: '', gender: '' });
    setSearchTerm('');
  };

  const toggleSupportView = () => {
    setShowSupport(!showSupport);
    setSelectedSection(showSupport ? '' : 'support');
    setActiveView('');
    setShowStudentDetails(false);
  };

  const togglePeopleView = () => {
    setSelectedSection(selectedSection === 'people' ? '' : 'people');
    setShowSupport(false);
    setActiveView('');
    setShowStudentDetails(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="manage-account-container">
      <div className="sidebar">
        <h3 className="sidebar-title">Admin Panel</h3>
        <button
          className={`sidebar-btn ${activeView === 'teachers' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('teachers');
            setShowSupport(false);
            setShowStudentDetails(false);
            setSelectedSection('');
          }}
        >
          Manage Teachers
        </button>
        <button
          className={`sidebar-btn ${activeView === 'students' ? 'active' : ''}`}
          onClick={() => {
            setActiveView('students');
            setShowSupport(false);
            setShowStudentDetails(false);
            setSelectedSection('');
          }}
        >
          Manage Students
        </button>
        <button
          className={`sidebar-btn ${showSupport ? 'active' : ''}`}
          onClick={toggleSupportView}
        >
          Support Tickets
        </button>
        <button
          className={`sidebar-btn ${selectedSection === 'people' ? 'active' : ''}`}
          onClick={togglePeopleView}
        >
          People Tickets
        </button>
        <button
          className={`sidebar-btn ${selectedSection === 'coupons' ? 'active' : ''}`}
          onClick={() => {
            setSelectedSection(selectedSection === 'coupons' ? '' : 'coupons');
            setShowSupport(false);
            setActiveView('');
            setShowStudentDetails(false);
          }}
        >
          Coupons
        </button>

        <button
          className={`sidebar-btn ${selectedSection === 'assign-class' ? 'active' : ''}`}
          onClick={() => {
            setSelectedSection('assign-class');
            setShowSupport(false);
            setActiveView('');
            setShowStudentDetails(false);
          }}
        >
          Assign Classes
        </button>
      </div>

      <div className="main-content">
        {showSupport ? (
          <Support />
        ) : selectedSection === 'people' ? (
          <People />
        ) : selectedSection === 'coupons' ? (
          <Coupon />
        ) : selectedSection === 'assign-class' ? (
          <AssignClass teachers={teachers} students={students} />
        ) : showStudentDetails ? (
          <StudentDetails
            student={selectedStudent}
            onBack={handleBackToList}
            formatDate={formatDate}
          />
        ) : (
          <div className="manage-container">
            <h2>{activeView === 'teachers' ? 'Manage Teachers' : 'Manage Students'}</h2>

            {/* ── Teacher form ── */}
            {activeView === 'teachers' ? (
              <form className="user-form" onSubmit={handleTeacherSubmit}>
                <input
                  type="text"
                  placeholder="Teacher Username"
                  value={teacherFormData.name}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={teacherFormData.phone}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email ID"
                  value={teacherFormData.email}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={teacherFormData.password}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, password: e.target.value })}
                  required
                />

                <div className="restrictions">
                  <label>Mode:</label>
                  <select
                    value={teacherFormData.access.mode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setTeacherFormData((prev) => ({
                        ...prev,
                        access: { ...prev.access, mode, cardId: '', boardType: '', subjects: [], standards: [] },
                      }));
                    }}
                  >
                    <option value="">-- Select --</option>
                    <option value="academics">Academics</option>
                    <option value="professional">Professional</option>
                    <option value="tutor">Tutor</option>
                  </select>

                  <label>Course/Class:</label>
                  <select
                    value={teacherFormData.access.cardId}
                    onChange={handleTeacherCardChange}
                    disabled={!teacherFormData.access.mode}
                  >
                    <option value="">-- Select --</option>
                    {getCardsForMode(teacherFormData.access.mode, true).map((card) => (
                      <option key={card.value} value={card.value}>{card.label}</option>
                    ))}
                  </select>

                  {/* START OF HIERARCHY LOGIC FOR TUTOR/BOARD EXAM */}
                  {teacherFormData.access.cardId === 'board_exam' && (
                    <>
                      <label>Board Type:</label>
                      <select 
                        value={teacherFormData.access.boardType} 
                        onChange={(e) => setTeacherFormData({...teacherFormData, access: {...teacherFormData.access, boardType: e.target.value}})}
                      >
                        <option value="">-- Select Board --</option>
                        <option value="cbse">CBSE</option>
                        <option value="state_board">State Board</option>
                      </select>

                      {teacherFormData.access.boardType && (
                        <>
                          <label>Classes (6 - 12):</label>
                          <div className="checkbox-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {['6', '7', '8', '9', '10', '11', '12'].map((std) => (
                              <label key={std} style={{ fontSize: '12px' }}>
                                <input
                                  type="checkbox"
                                  checked={teacherFormData.access.standards.includes(std)}
                                  onChange={() => handleTeacherStandardChange(std)}
                                />
                                Std {std}
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {/* END OF HIERARCHY LOGIC */}

                  {/* Hierarchy logic for regular Academic classes */}
                  {(teacherFormData.access.cardId === 'class11' || teacherFormData.access.cardId === 'class12') && (
                    <>
                      <label>Standards:</label>
                      <div className="checkbox-group">
                        {(teacherFormData.access.cardId === 'class11' ? ['11'] : ['12']).map((std) => (
                          <label key={std}>
                            <input
                              type="checkbox"
                              checked={teacherFormData.access.standards.includes(std)}
                              onChange={() => handleTeacherStandardChange(std)}
                            />
                            Std {std}
                          </label>
                        ))}
                      </div>
                    </>
                  )}

                  {/* All Subject Selection - Shows for any card selection */}
                  {teacherFormData.access.cardId && (
                    <>
                      <label>Subjects:</label>
                      <div className="subject-options" style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
                        {(teacherSubjectOptions[teacherFormData.access.cardId] || teacherSubjectOptions['board_exam']).map((subject) => (
                          <label key={subject} style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
                            <input
                              type="checkbox"
                              checked={teacherFormData.access.subjects.includes(subject)}
                              onChange={() => handleTeacherSubjectChange(subject)}
                            />
                            {subject}
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button type="submit" className="create-teacher-btn">
                  {isEditingTeacher ? 'Update Teacher' : 'Create Teacher'}
                </button>
                {isEditingTeacher && (
                  <button type="button" onClick={resetTeacherForm} className="cancel-btn">
                    Cancel Edit
                  </button>
                )}
              </form>
            ) : (
              /* ── Student management panel ── */
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
                    <button className="export-btn" onClick={handleExportStudents}>
                      <Download size={16} /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Add Student */}
                <div className="add-student-section">
                  <button className="add-student-btn" onClick={handleAddStudent}>
                    <User size={18} /> Add New Student
                  </button>
                </div>

                {/* Stats */}
                <div className="student-stats">
                  <div className="stat-card">
                    <span className="stat-number">{students.length}</span>
                    <span className="stat-label">Total Students</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{students.filter((s) => s.status === 'active').length}</span>
                    <span className="stat-label">Active</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{students.filter((s) => s.plan === 'trial').length}</span>
                    <span className="stat-label">Trial</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">{students.filter((s) => s.status === 'expiring').length}</span>
                    <span className="stat-label">Expiring</span>
                  </div>
                </div>

                {/* Student table */}
                <div className="student-list-container">
                  <div className="list-header">
                    <h3>
                      Students ({filteredStudents.length})
                      <span className="search-summary">
                        {searchTerm && ` matching "${searchTerm}"`}
                        {Object.values(filters).some((f) => f) && ' with filters applied'}
                      </span>
                    </h3>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">👨‍🎓</div>
                      <h4>No Students Found</h4>
                      <p>
                        {searchTerm || Object.values(filters).some((f) => f)
                          ? 'No students match your search criteria. Try different filters.'
                          : 'No students found in the database.'}
                      </p>
                      {(searchTerm || Object.values(filters).some((f) => f)) && (
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
                                    <div className="student-id">
                                      ID: {student.id?.substring(0, 8)}...
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="contact-info">
                                  <div className="contact-item">
                                    <Mail size={14} />
                                    <span>{student.email}</span>
                                  </div>
                                  <div className="contact-item">
                                    <Phone size={14} />
                                    <span>{student.phone || 'Not provided'}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="course-info">
                                  <div className="course-type">{student.coursetype || 'Not set'}</div>
                                  <div className="course-name">{student.courseName || 'Not specified'}</div>
                                </div>
                              </td>
                              <td>
                                <td>
                                  <span className={`plan-badge plan-${student.plan?.toLowerCase() || 'default'}`}>
                                    {student.plan || 'N/A'}
                                  </span>
                                </td>
                              </td>
                              <td>
                                <span
                                  className="status-badge"
                                  style={{ backgroundColor: getStatusColor(student.status) }}
                                >
                                  {student.status}
                                  {student.daysRemaining !== null && student.daysRemaining <= 7 && (
                                    <span className="days-count"> ({student.daysRemaining}d)</span>
                                  )}
                                </span>
                              </td>
                              <td>
                                <div className="subscription-info">
                                  <div className="date-item">
                                    <Calendar size={12} />
                                    <span>Start: {formatDate(student.startDate)}</span>
                                  </div>
                                  <div className="date-item">
                                    <Calendar size={12} />
                                    <span>End: {formatDate(student.endDate)}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="view-btn"
                                    onClick={() => handleViewStudent(student)}
                                  >
                                    <Eye size={16} /> View
                                  </button>
                                  <button
                                    className="edit-btn"
                                    onClick={() => handleEditStudent(student)}
                                    title="Edit Student"
                                  >
                                    <Edit size={16} /> Edit
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
            )}

            {/* Teacher list */}
            {activeView === 'teachers' && (
              <div className="user-list">
                <h3>Existing Teachers</h3>
                {teachers.length === 0 ? (
                  <div className="empty-state">
                    <p>No teachers found. Create your first teacher using the form above.</p>
                  </div>
                ) : (
                  <ul>
                    {teachers.map((item, idx) => (
                      <li key={idx} className="teacher-item">
                        <strong>{item.name}</strong> ({item.email})<br />
                        📞 {item.phone}<br />
                        🛡 <span className="role-badge">{item.role}</span><br />
                        {item.access.mode && (
                          <div className="access-summary">
                            Mode: {item.access.mode}, Course: {item.access.cardId},{' '}
                            Subjects: {item.access.subjects.join(', ')}, Standards:{' '}
                            {item.access.standards.join(',')}
                          </div>
                        )}
                        <button onClick={() => handleEditTeacher(idx)}>Edit</button>
                        <button onClick={() => handleDelete(idx, true)}>Delete</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
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

export default ManageAccount;