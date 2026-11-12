import React, { useEffect, useState, useCallback } from 'react';
import './ManageAccount.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { loadCurrentUser } from '../utils/access';
import { MANAGE_SERVICE_IDS, parseServices, hasFullAccess } from './ManageAccount/services';
import { User, Image as ImageIcon, BookOpen } from 'lucide-react';

import Support from './ManageAccount/Support';
import People from './ManageAccount/PeopleEnquiry';
import Coupon from './ManageAccount/Coupon';
import AssignClass from './ManageAccount/AssignClass';
import MediaUpload from './ManageAccount/MediaUpload';
import Visitors from './ManageAccount/Visitors';
import ManageTeacher from './ManageAccount/ManageTeacher';
import ManageStudent from './ManageAccount/ManageStudent';
import Blogs from './ManageAccount/Blogs';

// Every section + its sidebar label (order = sidebar order)
const NAV_ITEMS = [
  { id: 'teachers',     label: 'Manage Staff' },
  { id: 'students',     label: 'Manage Students' },
  { id: 'support',      label: 'Support Tickets' },
  { id: 'people',       label: 'People Tickets' },
  { id: 'coupons',      label: 'Coupons' },
  { id: 'assign-class', label: 'Assign Classes' },
  { id: 'media',        label: 'Media Manager', icon: <ImageIcon size={18} /> },
  { id: 'visitors',     label: 'Visitors',      icon: <User size={18} /> },
  { id: 'blogs',        label: 'Blogs',         icon: <BookOpen size={18} /> },
];
const ALL_SECTIONS = NAV_ITEMS.map((n) => n.id);
const TEACHER_SECTIONS = ['students', 'support', 'people', 'coupons', 'assign-class', 'media', 'visitors'];

// All roles a user holds (a user may be BOTH teacher and admin with the same login)
const getRoles = (user) => {
  if (!user) return [];
  const roles = Array.isArray(user.roles) && user.roles.length ? [...user.roles] : [user.role];
  if (user.role && !roles.includes(user.role)) roles.push(user.role);
  return roles.filter(Boolean);
};

// ── Which sections may this logged-in user open? ──
// admin (even if the same login is also a teacher) → ONLY the sections ticked on the admin account
//                                                    ("full" or empty service = everything)
// teacher only                                      → teacher sections
const getAllowedSections = (user) => {
  if (!user) return ALL_SECTIONS;

  const roles = getRoles(user);
  const isTeacher = roles.includes('teacher');
  const isAdmin = roles.includes('admin');

  if (isAdmin) {
    if (user.service === undefined) return []; // not resolved yet → fail closed
    const list = parseServices(user.service);
    if (list.length === 0 || hasFullAccess(user.service)) return ALL_SECTIONS;
    return NAV_ITEMS
      .map((n) => n.id)
      .filter((id) => list.includes(id) && MANAGE_SERVICE_IDS.includes(id));
  }

  if (isTeacher) return TEACHER_SECTIONS;

  return ALL_SECTIONS;
};

// ── Normalise a raw API student doc into the shape the UI expects ──
const normaliseStudent = (student, index) => {
  const endDate = student.endDate ? new Date(student.endDate) : null;
  const now = new Date();
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))
    : null;

  let status = 'active';
  if (student.plan === 'trial') status = 'trial';
  else if (daysRemaining === 0) status = 'expiring';
  else if (daysRemaining === null) status = 'inactive';

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
  const [searchParams, setSearchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [accessReady, setAccessReady] = useState(false);
  const [assignedStudentIds, setAssignedStudentIds] = useState([]);
  const [hasLoadedAssignedStudents, setHasLoadedAssignedStudents] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);

  const userRoles = getRoles(currentUser);
  const isTeacherUser = userRoles.includes('teacher');
  const isAdminUser = userRoles.includes('admin');
  // Teacher-only users see just their assigned students; anyone who is also admin sees all
  const isTeacherOnly = isTeacherUser && !isAdminUser;

  // Sections this user may see, and the one currently open (kept in the URL: ?section=...)
  const allowedSections = getAllowedSections(currentUser);
  const sectionParam = searchParams.get('section');
  const activeSection = allowedSections.includes(sectionParam) ? sectionParam : allowedSections[0];

  const goTo = (section) => {
    if (!allowedSections.includes(section)) return;
    setSearchParams({ section });
    setSidebarOpen(false);
  };

  const fetchAssignedStudents = async (teacherId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/getAssignedClasses`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const teacherClasses = data.filter((cls) => String(cls.teacherId) === String(teacherId));
        const ids = teacherClasses.flatMap((cls) => cls.selectedStudents || []);
        setAssignedStudentIds([...new Set(ids)]);
      }
    } catch (err) {
      console.error('Error fetching assigned students:', err);
    } finally {
      setHasLoadedAssignedStudents(true);
    }
  };

  // ── Load current user (and resolve its allocated service if login didn't store it) ──
  useEffect(() => {
    const load = async () => {
      const user = await loadCurrentUser();

      if (user) {
        setCurrentUser(user);
        if (getRoles(user).includes('teacher')) fetchAssignedStudents(user.id);
      }
      setAccessReady(true);
    };
    load();
  }, []);

  // ── Fetch teachers/admins + students (shared by all child panels) ──
  const getUsers = useCallback(() => {
    if (!currentUser) return;
    const roles = getRoles(currentUser);
    const teacherOnly = roles.includes('teacher') && !roles.includes('admin');
    if (teacherOnly && !hasLoadedAssignedStudents) return;

    fetch(`${API_BASE_URL}/getUsers`, { method: 'GET', credentials: 'include' })
      .then((r) => r.json())
      .then((userData) =>
        fetch(`${API_BASE_URL}/getAllStudents`, { method: 'GET', credentials: 'include' })
          .then((r) => r.json())
          .then((studentData) => {
            const staffList = Array.isArray(userData)
              ? userData
                  .filter((u) => u.role === 'teacher' || u.role === 'admin')
                  .map((u) => ({
                    id: u._id || u.id,
                    name: u.userName || '',
                    phone: u.phoneNumber || '',
                    email: u.gmail || '',
                    role: u.role || 'teacher',
                    service: u.service || '',
                    access: {
                      mode: u.coursetype || '',
                      // courseName is stored as "jee,neet" -> turn back into an array
                      cardId: u.courseName
                        ? String(u.courseName).split(',').map((s) => s.trim()).filter(Boolean)
                        : [],
                      boardType: u.boardType || '',
                      subjects: u.subjects || [],
                      standards: u.standards || [],
                    },
                  }))
              : [];

            let studentList = [];
            if (Array.isArray(studentData)) {
              studentList = studentData.map((s, i) => normaliseStudent(s, i));
            } else if (studentData?.status === 'error') {
              console.error('Error fetching students:', studentData.message);
              alert('Error fetching students: ' + studentData.message);
            }

            setTeachers(staffList);
            setStudents(
              teacherOnly
                ? studentList.filter((s) => assignedStudentIds.includes(s.id))
                : studentList
            );
          })
      )
      .catch((err) => {
        console.error('Error fetching users:', err);
        alert('Error loading user data. Please try again.');
      });
  }, [currentUser, assignedStudentIds, hasLoadedAssignedStudents]);

  // ── Session check (once) ──
  useEffect(() => {
    fetch(`${API_BASE_URL}/checkSession`, { method: 'GET', credentials: 'include' })
      .then((r) => r.json())
      .then((res) => {
        if (res.status === 'failed') {
          localStorage.removeItem('currentUser');
          navigate('/signin');
        } else {
          setSessionOk(true);
        }
      })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    if (sessionOk && accessReady) getUsers();
  }, [sessionOk, accessReady, getUsers]);

  // ── Render the active panel ──
  const renderContent = () => {
    switch (activeSection) {
      case 'visitors':     return <Visitors />;
      case 'media':        return <MediaUpload />;
      case 'support':      return <Support />;
      case 'people':       return <People />;
      case 'coupons':      return <Coupon />;
      case 'blogs':        return <Blogs />;
      case 'assign-class': return <AssignClass teachers={teachers} students={students} />;
      case 'students':     return <ManageStudent students={students} onRefresh={getUsers} />;
      case 'teachers':     return <ManageTeacher teachers={teachers} onRefresh={getUsers} />;
      default:
        return (
          <div className="manage-container">
            <h2>No access</h2>
            <p>No section has been allocated to this account. Please contact the administrator.</p>
          </div>
        );
    }
  };

  if (!accessReady) {
    return (
      <div className="manage-account-container">
        <div className="main-content" style={{ marginLeft: 0 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="manage-account-container">
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span className="hamburger-icon">{sidebarOpen ? '✕' : '☰'}</span>
          <span className="menu-label">Menu</span>
        </button>

        <h3 className="sidebar-title">Admin Panel</h3>

        {/* Only the sections this user is allowed to use are rendered */}
        {NAV_ITEMS.filter((n) => allowedSections.includes(n.id)).map((n) => (
          <button
            key={n.id}
            className={`sidebar-btn ${activeSection === n.id ? 'active' : ''}`}
            onClick={() => goTo(n.id)}
          >
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      <div className="main-content">{renderContent()}</div>
    </div>
  );
};

export default ManageAccount;