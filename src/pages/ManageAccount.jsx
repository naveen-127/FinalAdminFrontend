import React, { useEffect, useState, useCallback } from 'react';
import './ManageAccount.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { User, Image as ImageIcon } from 'lucide-react';

import Support from './ManageAccount/Support';
import People from './ManageAccount/PeopleEnquiry';
import Coupon from './ManageAccount/Coupon';
import AssignClass from './ManageAccount/AssignClass';
import MediaUpload from './ManageAccount/MediaUpload';
import Visitors from './ManageAccount/Visitors';
import ManageTeacher from './ManageAccount/ManageTeacher';
import ManageStudent from './ManageAccount/ManageStudent';

const VALID_SECTIONS = [
  'teachers',
  'students',
  'support',
  'people',
  'coupons',
  'assign-class',
  'media',
  'visitors',
];

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

  // Which panel is showing is stored in the URL (?section=visitors),
  // so it survives refresh, back/forward and bookmarks.
  // teachers | students | support | people | coupons | assign-class | media | visitors
  const sectionParam = searchParams.get('section');
  const activeSection = VALID_SECTIONS.includes(sectionParam)
    ? sectionParam
    : 'teachers';

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [assignedStudentIds, setAssignedStudentIds] = useState([]);
  const [hasLoadedAssignedStudents, setHasLoadedAssignedStudents] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);

  const isTeacherUser = currentUser?.role === 'teacher';

  const goTo = (section) => {
    setSearchParams({ section });
    setSidebarOpen(false);
  };

  // ── Load current user ──
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
      if (user.role === 'teacher') {
        // Default teachers to "students" only when no section is in the URL
        if (!searchParams.get('section')) {
          setSearchParams({ section: 'students' }, { replace: true });
        }
        fetchAssignedStudents(user.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ── Fetch teachers + students (shared by all child panels) ──
  const getUsers = useCallback(() => {
    if (!currentUser) return;
    if (currentUser.role === 'teacher' && !hasLoadedAssignedStudents) return;

    fetch(`${API_BASE_URL}/getUsers`, { method: 'GET', credentials: 'include' })
      .then((r) => r.json())
      .then((teacherData) =>
        fetch(`${API_BASE_URL}/getAllStudents`, { method: 'GET', credentials: 'include' })
          .then((r) => r.json())
          .then((studentData) => {
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
                      cardId: Array.isArray(u.courseName)
                        ? u.courseName
                        : u.courseName ? [u.courseName] : [],
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

            setTeachers(teacherAdminList);
            setStudents(
              currentUser.role === 'teacher'
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

  // ── Load data once session is valid (and again if its inputs change) ──
  useEffect(() => {
    if (sessionOk) getUsers();
  }, [sessionOk, getUsers]);

  // ── Render the active panel ──
  const renderContent = () => {
    switch (activeSection) {
      case 'visitors':     return <Visitors />;
      case 'media':        return <MediaUpload />;
      case 'support':      return <Support />;
      case 'people':       return <People />;
      case 'coupons':      return <Coupon />;
      case 'assign-class': return <AssignClass teachers={teachers} students={students} />;
      case 'students':
        return <ManageStudent students={students} onRefresh={getUsers} />;
      case 'teachers':
      default:
        return isTeacherUser
          ? <ManageStudent students={students} onRefresh={getUsers} />
          : <ManageTeacher teachers={teachers} onRefresh={getUsers} />;
    }
  };

  const NavBtn = ({ id, children }) => (
    <button
      className={`sidebar-btn ${activeSection === id ? 'active' : ''}`}
      onClick={() => goTo(id)}
    >
      {children}
    </button>
  );

  return (
    <div className="manage-account-container">
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span className="hamburger-icon">{sidebarOpen ? '✕' : '☰'}</span>
          <span className="menu-label">Menu</span>
        </button>

        <h3 className="sidebar-title">Admin Panel</h3>

        {!isTeacherUser && <NavBtn id="teachers">Manage Teachers</NavBtn>}
        <NavBtn id="students">Manage Students</NavBtn>
        <NavBtn id="support">Support Tickets</NavBtn>
        <NavBtn id="people">People Tickets</NavBtn>
        <NavBtn id="coupons">Coupons</NavBtn>
        <NavBtn id="assign-class">Assign Classes</NavBtn>
        <NavBtn id="media"><ImageIcon size={18} /> Media Manager</NavBtn>
        <NavBtn id="visitors"><User size={18} /> Visitors</NavBtn>
      </div>

      <div className="main-content">{renderContent()}</div>
    </div>
  );
};

export default ManageAccount;