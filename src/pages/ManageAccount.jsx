/* eslint-disable no-undef */
import React, { useEffect, useState, useCallback }                                                         from 'react';
import './ManageAccount.css';
import { useNavigate }                                                                                     from 'react-router-dom';
import { API_BASE_URL }                                                                                    from '../config';
import Support                                                                                             from './ManageAccount/support';
import StudentDetails                                                                                      from './ManageAccount/StudentDetails';
import { Search, Filter, Eye, EyeOff, Download, Calendar, User, Mail, Phone, GraduationCap, Edit, Trash2 } from 'lucide-react';
import People                                                                                              from './ManageAccount/PeopleEnquiry';
import Coupon                                                                                              from './ManageAccount/Coupon';
import StudentForm                                                                                         from './ManageAccount/StudentForm';
import AssignClass                                                                                         from './ManageAccount/AssignClass';


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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [assignedStudentIds, setAssignedStudentIds] = useState([]);
  const [hasLoadedAssignedStudents, setHasLoadedAssignedStudents] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // If you have confirm password

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
      if (user.role === 'teacher') {
        setActiveView('students'); // Default view for teacher
        fetchAssignedStudents(user.id);
      }
    }
  }, []);

  const fetchAssignedStudents = async (teacherId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/getAssignedClasses`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const teacherClasses = data.filter(cls => String(cls.teacherId) === String(teacherId));
        const studentIds = teacherClasses.flatMap(cls => cls.selectedStudents || []);
        setAssignedStudentIds([...new Set(studentIds)]);
      }
      setHasLoadedAssignedStudents(true);
    } catch (err) {
      console.error("Error fetching assigned students:", err);
      setHasLoadedAssignedStudents(true);
    }
  };

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
    if (!currentUser) return;
    if (currentUser.role === 'teacher' && !hasLoadedAssignedStudents) return;

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
            const finalStudentList = (currentUser?.role === 'teacher')
              ? studentList.filter(s => assignedStudentIds.includes(s.id))
              : studentList;

            setStudents(finalStudentList);
            setFilteredStudents(finalStudentList); // reset immediately too
          });
      })
      .catch((err) => {
        console.error('Error fetching users:', err);
        alert('Error loading user data. Please try again.');
      });
  }, [currentUser, assignedStudentIds, hasLoadedAssignedStudents]);

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
        boardType: teacherFormData.access.boardType,
        standards: teacherFormData.access.standards || [],
        subjects: teacherFormData.access.subjects || [],
      },
    };

    // FIX: Safely get the email for update URL
    let url;
    let method;

    if (isEditingTeacher && editIndex !== null && teachers[editIndex]) {
      // Use the teacher's email from the teachers array
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
          alert(isEditingTeacher ? 'Teacher updated!' : 'Teacher created!');
          getUsers();
          resetTeacherForm();
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

  const handleDelete = (item, type = 'teacher') => {
    const isTeacher = type === 'teacher';
    const name = item.name || item.userName || 'Unknown';
    if (!window.confirm(`Are you sure you want to delete this ${type}: ${name}?`)) return;

    const url = isTeacher
      ? `${API_BASE_URL}/deleteUser/${item.email}`
      : `${API_BASE_URL}/deleteStudent/${item.id || item._id}`;

    const body = isTeacher
      ? JSON.stringify({ databaseName: 'users', collectionName: 'users' })
      : null;

    fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'pass') {
          alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted!`);
          getUsers();
          if (isTeacher && isEditingTeacher) resetTeacherForm();
        } else {
          alert(data.message || `Failed to delete ${type}`);
        }
      })
      .catch((err) => {
        console.error(`Error deleting ${type}:`, err);
        alert(`Error deleting ${type}`);
      });
  };

  const handleEditTeacher = (index) => {
    const teacher = teachers[index];
    if (!teacher) {
      console.error('Teacher not found at index:', index);
      return;
    }

    setEditIndex(index);
    setIsEditingTeacher(true);
    setTeacherFormData({
      name: teacher.name || teacher.userName || '',
      phone: teacher.phone || teacher.phoneNumber || '',
      email: teacher.email || teacher.gmail || '',
      password: '', // Don't populate password for security
      role: teacher.role || 'teacher',
      access: {
        mode: teacher.access?.mode || teacher.coursetype || '',
        cardId: teacher.access?.cardId || teacher.courseName || '',
        boardType: teacher.access?.boardType || '',
        subjects: teacher.access?.subjects || teacher.subjects || [],
        standards: teacher.access?.standards || teacher.standards || [],
      },
    });
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
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button
          className="mobile-menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="hamburger-icon">
            {sidebarOpen ? '✕' : '☰'}
          </span>
          <span className="menu-label">Menu</span>
        </button>

        <h3 className="sidebar-title">Admin Panel</h3>

        {currentUser?.role !== 'teacher' && (
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
        )}
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
            {/* ── Teacher management view ── */}
            {activeView === 'teachers' ? (
              <div className="teachers-management">
                {/* Existing Teachers Grid with Add Button inside header */}
                <div className="existing-teachers-section">
                  <div className="section-header">
                    <h3>Existing Teachers</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div className="teacher-count">{teachers.length} total</div>
                      <button
                        className="add-teacher-btn"
                        onClick={() => {
                          resetTeacherForm();
                          setIsEditingTeacher(true);
                        }}
                      >
                        + Add Teacher
                      </button>
                    </div>
                  </div>

                  {/* Create Teacher Form - Shown only when isEditingTeacher is true */}
                  {isEditingTeacher && (
                    <div className="create-teacher-section">
                      <div className="form-header">
                        <h4>{editIndex !== null ? 'Edit Teacher' : 'Create New Teacher'}</h4>
                        <button className="close-form-btn" onClick={resetTeacherForm}>×</button>
                      </div>
                      <form className="teacher-form" onSubmit={handleTeacherSubmit}>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Username *</label>
                            <input
                              type="text"
                              placeholder="Teacher Username"
                              value={teacherFormData.name}
                              onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Email *</label>
                            <input
                              type="email"
                              placeholder="Email ID"
                              value={teacherFormData.email}
                              onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
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
                              value={teacherFormData.phone}
                              onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Password *</label>
                            <div className="password-input-wrapper">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={teacherFormData.password}
                                onChange={(e) => setTeacherFormData({ ...teacherFormData, password: e.target.value })}
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
                              value={teacherFormData.access.mode}
                              onChange={(e) => {
                                const mode = e.target.value;
                                setTeacherFormData((prev) => ({
                                  ...prev,
                                  access: { ...prev.access, mode, cardId: '', boardType: '', subjects: [], standards: [] },
                                }));
                              }}
                            >
                              <option value="">-- Select Mode --</option>
                              <option value="academics">Academics</option>
                              <option value="professional">Professional</option>
                              <option value="tutor">Tutor</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Course/Class</label>
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
                          </div>
                        </div>

                        {/* START OF HIERARCHY LOGIC FOR TUTOR/BOARD EXAM */}
                        {teacherFormData.access.cardId === 'board_exam' && (
                          <div className="form-row">
                            <div className="form-group">
                              <label>Board Type</label>
                              <select
                                value={teacherFormData.access.boardType}
                                onChange={(e) => setTeacherFormData({ ...teacherFormData, access: { ...teacherFormData.access, boardType: e.target.value } })}
                              >
                                <option value="">-- Select Board --</option>
                                <option value="cbse">CBSE</option>
                                <option value="state_board">State Board</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Classes selection for Tutor mode */}
                        {teacherFormData.access.cardId === 'board_exam' && teacherFormData.access.boardType && (
                          <div className="form-group full-width">
                            <label>Classes (6 - 12)</label>
                            <div className="checkbox-group">
                              {['6', '7', '8', '9', '10', '11', '12'].map((std) => (
                                <label key={std}>
                                  <input
                                    type="checkbox"
                                    checked={teacherFormData.access.standards.includes(std)}
                                    onChange={() => handleTeacherStandardChange(std)}
                                  />
                                  Class {std}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hierarchy logic for regular Academic classes */}
                        {(teacherFormData.access.cardId === 'class11' || teacherFormData.access.cardId === 'class12') && (
                          <div className="form-group full-width">
                            <label>Standards</label>
                            <div className="checkbox-group">
                              {(teacherFormData.access.cardId === 'class11' ? ['11'] : ['12']).map((std) => (
                                <label key={std}>
                                  <input
                                    type="checkbox"
                                    checked={teacherFormData.access.standards.includes(std)}
                                    onChange={() => handleTeacherStandardChange(std)}
                                  />
                                  Class {std}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* All Subject Selection - Shows for any card selection */}
                        {teacherFormData.access.cardId && (
                          <div className="form-group full-width">
                            <label>Subjects</label>
                            <div className="subject-options">
                              {(teacherSubjectOptions[teacherFormData.access.cardId] || teacherSubjectOptions['board_exam']).map((subject) => (
                                <label key={subject}>
                                  <input
                                    type="checkbox"
                                    checked={teacherFormData.access.subjects.includes(subject)}
                                    onChange={() => handleTeacherSubjectChange(subject)}
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

                  {/* Teachers Grid */}
                  {teachers.length === 0 ? (
                    <div className="empty-state teacher-empty">
                      <div className="empty-icon">👨‍🏫</div>
                      <h4>No Teachers Found</h4>
                      <p>Click "Add Teacher" button above to get started.</p>
                    </div>
                  ) : (
                    <div className="teachers-grid">
                      {teachers.map((item, idx) => {
                        // Safely get access data
                        const accessMode = item.access?.mode || item.coursetype || '';
                        const accessCardId = item.access?.cardId || item.courseName || '';
                        const accessSubjects = item.access?.subjects || item.subjects || [];
                        const accessStandards = item.access?.standards || item.standards || [];

                        return (
                          <div key={idx} className="teacher-card">
                            <div className="teacher-card-header">
                              <div className="teacher-avatar">
                                {(item.name || 'T').charAt(0).toUpperCase()}
                              </div>
                              <div className="teacher-info">
                                <h4>{item.name || item.userName}</h4>
                                <span className="teacher-role">{item.role || 'teacher'}</span>
                              </div>
                            </div>
                            <div className="teacher-card-body">
                              <div className="teacher-detail">
                                <Mail size={14} />
                                <span>{item.email || item.gmail}</span>
                              </div>
                              <div className="teacher-detail">
                                <Phone size={14} />
                                <span>{item.phone || item.phoneNumber || 'Not provided'}</span>
                              </div>
                              {accessMode && (
                                <div className="teacher-access">
                                  <div className="access-badge">{accessMode}</div>
                                  {accessCardId && <div className="access-badge">{accessCardId}</div>}
                                  {accessSubjects.length > 0 && (
                                    <div className="access-badge subjects">
                                      {accessSubjects.slice(0, 2).join(', ')}{accessSubjects.length > 2 && ` +${accessSubjects.length - 2}`}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="teacher-card-footer">
                              <button className="teacher-edit-btn" onClick={() => handleEditTeacher(idx)}>
                                <Edit size={14} /> Edit
                              </button>
                              <button className="teacher-delete-btn" onClick={() => handleDelete(item, 'teacher')}>
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
                  </div>
                </div>

                {/* Student list header with Add button inside */}
                <div className="student-list-container">
                  <div className="list-header">
                    <div className="list-header-left">
                      <h3>
                        Students ({filteredStudents.length})
                        <span className="search-summary">
                          {searchTerm && ` matching "${searchTerm}"`}
                          {Object.values(filters).some((f) => f) && ' with filters applied'}
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
                                <span className={`plan-badge plan-${student.plan?.toLowerCase() || 'default'}`}>
                                  {student.plan || 'N/A'}
                                </span>
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
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(student, 'student')}
                                    title="Delete Student"
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#fff',
                                      color: '#dc3545',
                                      border: '1px solid #dc3545',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                  >
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