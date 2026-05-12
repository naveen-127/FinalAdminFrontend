import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiUpload, FiEdit3, FiCheckCircle, FiFileText, FiArrowLeft, FiEdit, FiTrash2, FiUsers, FiBookOpen, FiImage, FiRotateCcw, FiScissors, FiMenu, FiX, FiZap, FiCalendar, FiClock, FiChevronLeft, FiChevronRight, FiLoader, FiExternalLink } from 'react-icons/fi';
import './BoardExam.css';
import './ManageAccount.css';
import { API_BASE_URL } from '../config';

const PdfRenderer = ({ url, onHeightChange }) => {
  const containerRef = useRef(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const renderPdf = async () => {
      try {
        setIsRendering(true);
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          document.head.appendChild(script);
          await new Promise((res) => { script.onload = res; });
          window.pdfjsLib = window['pdfjs-dist/build/pdf'];
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const loadingTask = window.pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        if (!isMounted || !containerRef.current) return;
        
        containerRef.current.innerHTML = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.style.width = '100%';
          canvas.style.display = 'block';
          canvas.style.marginBottom = '10px';
          canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          
          if (!isMounted) return;
          containerRef.current.appendChild(canvas);
        }
        
        setIsRendering(false);
        if (onHeightChange && containerRef.current) {
           onHeightChange(containerRef.current.scrollHeight);
        }
      } catch (err) {
        console.error("Error rendering PDF:", err);
        setIsRendering(false);
      }
    };
    
    renderPdf();
    return () => { isMounted = false; };
  }, [url]);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#e5e7eb' }}>
      {isRendering && (
        <div style={{ position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)', background: '#064e3b', color: 'white', padding: '10px 20px', borderRadius: '20px', fontSize: '14px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          Rendering PDF Pages...
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} />
    </div>
  );
};
const CalendarView = ({ allAssignedClasses, currentUser, allTeachers, fetchAllAssignedClasses, allStudents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClassPopup, setSelectedClassPopup] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (allAssignedClasses.length > 0) {
      console.log("Calendar View Data:", allAssignedClasses);
    }
  }, [allAssignedClasses]);

  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    let [hours, minutes] = time24.split(':');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const getStudentNames = (studentIds) => {
    if (!studentIds || studentIds.length === 0) return 'No students';
    return studentIds.map(id => {
      const student = allStudents.find(s => String(s.id || s._id) === String(id));
      return student ? student.name : 'Unknown';
    }).join(', ');
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getTeacherName = (id) => {
    const teacher = allTeachers.find(t => String(t.id || t._id) === String(id));
    return teacher ? teacher.name : 'Unknown';
  };

  const getClassesForDate = (dateNum) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
    return allAssignedClasses.filter(cls => {
      return cls.selectedDates && cls.selectedDates.includes(dateStr);
    });
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) {
      alert("Please select a new date.");
      return;
    }
    const cls = selectedClassPopup.cls;
    const oldDate = selectedClassPopup.dateStr;

    // Duplicate Check: Same batch name, same subject, same date
    const isDuplicate = allAssignedClasses.some(c =>
      c.batchName === cls.batchName &&
      c.subject === cls.subject &&
      (c.selectedDates?.includes(rescheduleDate) || c.rescheduledSlots?.some(s => s.date === rescheduleDate))
    );

    if (isDuplicate) {
      console.log("already having like that");
      alert("Error: A class with the same batch name and subject already exists on this date!");
      return;
    }

    const payload = {
      type: "RESCHEDULE_REQUEST",
      classAssignmentId: cls.id || cls._id,
      batchName: cls.batchName,
      teacherId: currentUser.id,
      teacherName: currentUser.username,
      oldDate: oldDate,
      newDate: rescheduleDate,
      newStartTime: convertTo12Hour(rescheduleStartTime),
      newEndTime: convertTo12Hour(rescheduleEndTime)
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (res.ok) {
        alert("Reschedule request sent to admin!");
        setSelectedClassPopup(null);
        setIsRescheduling(false);
        setRescheduleDate('');
        setRescheduleStartTime('');
        setRescheduleEndTime('');
      } else {
        alert("Failed to send reschedule request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="calendar-view-container fade-in">
      <div className="calendar-header">
        <h2 className="calendar-title">Class Schedule</h2>
        <div className="calendar-controls">
          <button onClick={prevMonth} className="calendar-nav-btn"><FiChevronLeft size={18} /></button>
          <span className="calendar-current-month">{monthNames[month]} {year}</span>
          <button onClick={nextMonth} className="calendar-nav-btn"><FiChevronRight size={18} /></button>
        </div>
      </div>

      <div className="calendar-scroll-wrapper">
        <div className="calendar-grid-main">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day-cell empty"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, d) => {
            const dateNum = d + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
            const dayClasses = getClassesForDate(dateNum);
            const isToday = new Date().getDate() === dateNum && new Date().getMonth() === month && new Date().getFullYear() === year;
            return (
              <div key={`day-${dateNum}`} className={`calendar-day-cell ${isToday ? 'is-today' : ''}`}>
                <div className={`calendar-date-number ${isToday ? 'is-today' : ''}`}>{dateNum}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, maxHeight: '200px' }} className="custom-scrollbar">
                  {dayClasses.map((cls, idx) => {
                    const isOwnClass = currentUser && (String(cls.teacherId) === String(currentUser.id) || currentUser.role === 'admin');
                    // Check for rescheduled slot info
                    const reslot = cls.rescheduledSlots?.find(s => s.date && s.date.trim() === dateStr.trim());
                    const isRescheduled = !!reslot;
                    const displayStartTime = reslot ? reslot.startTime : cls.startTime;

                    return (
                      <div key={idx}
                        onClick={() => setSelectedClassPopup({ cls, dateStr, isOwnClass })}
                        style={{
                          background: isOwnClass ? '#eef6ff' : '#f5f5f5',
                          borderLeft: `4px solid ${isOwnClass ? '#007bff' : '#9e9e9e'}`,
                          padding: '6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}>
                        <div style={{ fontWeight: 'bold', color: isOwnClass ? '#0056b3' : '#444', marginBottom: '2px' }}>
                          {cls.batchName} ({cls.subject})
                          {isRescheduled && <span style={{ marginLeft: '4px', color: '#ff9800', fontSize: '9px', fontWeight: '900' }}>[RESCHEDULED]</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#666', marginBottom: '2px' }}><FiClock size={10} /> {displayStartTime}</div>
                        {!isOwnClass && <div style={{ color: '#888', fontStyle: 'italic', marginTop: '2px' }}>{getTeacherName(cls.teacherId)}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedClassPopup && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '400px', maxWidth: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#333' }}>Class Details</h3>
              <FiX size={24} style={{ cursor: 'pointer', color: '#666' }} onClick={() => { setSelectedClassPopup(null); setIsRescheduling(false); }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Batch Name:</strong> <span>{selectedClassPopup.cls.batchName}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Subject:</strong> <span>{selectedClassPopup.cls.subject}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Standard:</strong> <span>Class {selectedClassPopup.cls.standard}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Teacher:</strong> <span>{getTeacherName(selectedClassPopup.cls.teacherId)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Time:</strong>
                <span>
                  {(() => {
                    const reslot = selectedClassPopup.cls.rescheduledSlots?.find(s => s.date && s.date.trim() === selectedClassPopup.dateStr.trim());
                    return reslot ? `${reslot.startTime} - ${reslot.endTime}` : `${selectedClassPopup.cls.startTime} - ${selectedClassPopup.cls.endTime}`;
                  })()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}><strong>Enrolled:</strong> <span style={{ textAlign: 'right' }}>{selectedClassPopup.cls.selectedStudents?.length || 0} ({getStudentNames(selectedClassPopup.cls.selectedStudents)})</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Date Scheduled:</strong> <span style={{ color: '#007bff', fontWeight: 'bold' }}>{selectedClassPopup.dateStr} {selectedClassPopup.cls.rescheduledSlots?.some(s => s.date && s.date.trim() === selectedClassPopup.dateStr.trim()) && <span style={{ color: '#ff9800', fontSize: '11px' }}>(Rescheduled)</span>}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Mode:</strong> <span>{selectedClassPopup.cls.mode?.toUpperCase()}</span></div>
              {selectedClassPopup.cls.meetLink && selectedClassPopup.cls.mode === 'online' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Meeting Link:</strong>
                  <a href={selectedClassPopup.cls.meetLink} target="_blank" rel="noreferrer" style={{ background: '#eef6ff', color: '#007bff', padding: '4px 12px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>Join Class</a>
                </div>
              )}
            </div>

            {selectedClassPopup.isOwnClass && (
              <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                {!isRescheduling ? (
                  <button onClick={() => setIsRescheduling(true)} style={{ background: '#FF9800', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <FiCalendar size={18} /> Reschedule This Class
                  </button>
                ) : (
                  <div className="fade-in">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Select New Date:</label>
                    <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #ccc', marginBottom: '15px' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Start Time:</label>
                        <input type="time" value={rescheduleStartTime} onChange={(e) => setRescheduleStartTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #ccc' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>End Time:</label>
                        <input type="time" value={rescheduleEndTime} onChange={(e) => setRescheduleEndTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid #ccc' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button disabled={isSubmitting} onClick={handleReschedule} style={{ background: '#28a745', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>
                        {isSubmitting ? 'Saving...' : 'Save New Date'}
                      </button>
                      <button onClick={() => setIsRescheduling(false)} style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const BoardExam = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize state with location data or defaults
  const [subjectName, setSubjectName] = useState(location.state?.subjectName || '');
  const [standard, setStandard] = useState(location.state?.standard || '');
  const [boardType, setBoardType] = useState(location.state?.boardType || '');

  const [testTitle, setTestTitle] = useState('');
  const [manualQuestions, setManualQuestions] = useState('');
  const [file, setFile] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [editingTestId, setEditingTestId] = useState(null);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  // Lesson State
  const [activeTab, setActiveTab] = useState('calendar');
  const [lessonImage, setLessonImage] = useState(null);
  const [lessonTool, setLessonTool] = useState('pen');
  const [lessonColor, setLessonColor] = useState('#d32f2f');
  const [lessonBrushSize, setLessonBrushSize] = useState(3);
  const lessonCanvasRef = useRef(null);
  const [isLessonDrawing, setIsLessonDrawing] = useState(false);
  const [lessonHistory, setLessonHistory] = useState([]);
  const lessonHistoryRef = useRef([]);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(1);

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [assignedStudentIds, setAssignedStudentIds] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [hasLoadedAssignedStudents, setHasLoadedAssignedStudents] = useState(false);
  const [allAssignedClasses, setAllAssignedClasses] = useState([]);

  // Learning Materials State
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialType, setMaterialType] = useState('Notes'); // Notes / Video
  const [materialFile, setMaterialFile] = useState(null);
  const [materialVideoLink, setMaterialVideoLink] = useState('');
  const [selectedAssignedStudents, setSelectedAssignedStudents] = useState([]);
  const [selectedAssignedBatches, setSelectedAssignedBatches] = useState([]);
  const [learningMaterials, setLearningMaterials] = useState([]);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
      fetchAssignedStudents(user);
    }
    fetchAllUsers();
  }, []);

  const fetchAssignedStudents = async (user) => {
    try {
      const res = await fetch(`${API_BASE_URL}/getAssignedClasses`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAllAssignedClasses(data);

        if (user && user.role === 'teacher') {
          // Filter classes assigned to this teacher and extract student IDs
          const teacherClasses = data.filter(cls => String(cls.teacherId) === String(user.id));
          setAssignedClasses(teacherClasses);
          const studentIds = teacherClasses.flatMap(cls => cls.selectedStudents || []);
          setAssignedStudentIds([...new Set(studentIds)]); // Unique student IDs
        } else {
          setAssignedClasses(data);
        }
      }
      setHasLoadedAssignedStudents(true);
    } catch (err) {
      console.error("Error fetching assigned students:", err);
      setHasLoadedAssignedStudents(true);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const teacherRes = await fetch(`${API_BASE_URL}/getUsers`, { credentials: 'include' });
      const studentRes = await fetch(`${API_BASE_URL}/getAllStudents`, { credentials: 'include' });

      if (teacherRes.ok && studentRes.ok) {
        const teacherData = await teacherRes.json();
        const studentData = await studentRes.json();

        setAllTeachers(Array.isArray(teacherData) ? teacherData
          .filter(u => u.role === 'teacher' || u.role === 'admin')
          .map(u => ({
            ...u,
            id: u._id || u.id,
            name: u.userName || u.name || 'Unnamed Teacher'
          })) : []);

        setAllStudents(Array.isArray(studentData) ? studentData.map(s => ({
          ...s,
          id: s._id || s.id,
          name: s.firstname
            ? `${s.firstname} ${s.lastname || ''}`.trim()
            : (s.fullName || s.userName || s.name || 'Unnamed Student'),
          userName: s.userName || s.name || (s.firstname ? `${s.firstname} ${s.lastname || ''}`.trim() : s.fullName || '')
        })) : []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Correction Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [marks, setMarks] = useState('');
  const [remarks, setRemarks] = useState('');

  // Canvas Drawing State
  const [isPenMode, setIsPenMode] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- PC Mouse Events ---
  const startDrawing = (e) => {
    if (!isPenMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !isPenMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  // --- Mobile Touch Events ---
  const handleTouchStart = (e) => {
    if (!isPenMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e) => {
    if (!isDrawing || !isPenMode || !canvasRef.current) return;
    // CRITICAL FIX: Prevent scroll only when drawing
    if (e.cancelable) e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Passive Event Listener Fix for Mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const options = { passive: false };

    canvas.addEventListener('touchstart', handleTouchStart, options);
    canvas.addEventListener('touchmove', handleTouchMove, options);
    canvas.addEventListener('touchend', stopDrawing, options);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isDrawing, isPenMode, selectedSubmission]);

  // --- Take Lesson Canvas Logic ---
  const startLessonDrawing = (e) => {
    if (!lessonCanvasRef.current || !lessonImage) return;
    const canvas = lessonCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) * (canvas.width / rect.width);
    const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) * (canvas.height / rect.height);
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = lessonTool === 'eraser' ? '#ffffff' : (lessonTool === 'magic-pen' ? '#ffeb3b' : lessonColor);
    ctx.lineWidth = lessonBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (lessonTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    setIsLessonDrawing(true);
  };

  const lessonDraw = (e) => {
    if (!isLessonDrawing || !lessonCanvasRef.current) return;
    if (e.cancelable) e.preventDefault();

    const canvas = lessonCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) * (canvas.width / rect.width);
    const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) * (canvas.height / rect.height);
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = lessonTool === 'eraser' ? '#ffffff' : (lessonTool === 'magic-pen' ? '#ffeb3b' : lessonColor);
    ctx.lineWidth = lessonBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopLessonDrawing = () => {
    if (!isLessonDrawing) return;
    setIsLessonDrawing(false);

    if (lessonTool === 'magic-pen') {
      setTimeout(() => {
        const canvas = lessonCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Restore the latest permanent drawing from the Ref
          const currentHistory = lessonHistoryRef.current;
          if (currentHistory.length > 0) {
            const img = new Image();
            img.src = currentHistory[currentHistory.length - 1];
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
            };
          }
        }
      }, 4000);
    } else {
      saveLessonHistory();
    }
  };

  const saveLessonHistory = () => {
    const canvas = lessonCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      const newHistory = [...lessonHistoryRef.current, dataUrl].slice(-10);
      setLessonHistory(newHistory);
      lessonHistoryRef.current = newHistory;
    }
  };

  const undoLesson = () => {
    if (lessonHistory.length <= 1) {
      clearLessonCanvas(false);
      setLessonHistory([]);
      return;
    }
    const newHistory = [...lessonHistory];
    newHistory.pop();
    const lastState = newHistory[newHistory.length - 1];
    setLessonHistory(newHistory);
    lessonHistoryRef.current = newHistory;

    const canvas = lessonCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const clearLessonCanvas = (confirm = true) => {
    if (confirm && !window.confirm("Clear all drawings?")) return;
    const canvas = lessonCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setLessonHistory([]);
      lessonHistoryRef.current = [];
    }
  };

  const [lessonFileType, setLessonFileType] = useState('');
  const [lessonFileName, setLessonFileName] = useState('');
  const [workspaceHeight, setWorkspaceHeight] = useState(15000); // Dynamic height to solve blank space issue

  const countPdfPages = (file) => {
    return new Promise(async (resolve) => {
      try {
        // Load PDF.js from CDN if not already present
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.async = true;
          document.head.appendChild(script);
          await new Promise((res) => {
            script.onload = res;
            script.onerror = () => res(null);
          });
        }

        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        if (!pdfjsLib) throw new Error("PDF.js not loaded");

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        console.log("PDF.js detected pages:", pdf.numPages);
        resolve(pdf.numPages);
      } catch (err) {
        console.error("PDF.js failed, falling back to robust regex:", err);
        
        const reader = new FileReader();
        reader.onload = function(e) {
          const content = e.target.result;
          
          // Improved Regex Fallback
          const allCounts = content.match(/\/Count\s+(\d+)/g);
          if (allCounts) {
            const counts = allCounts.map(m => {
              const match = m.match(/\d+/);
              return match ? parseInt(match[0]) : 0;
            });
            const maxCount = Math.max(...counts);
            if (maxCount > 0) {
              resolve(maxCount);
              return;
            }
          }

          const pageMatches = content.match(/\/Type\s*\/Page\b/gi) || [];
          if (pageMatches.length > 0) {
            resolve(pageMatches.length);
            return;
          }

          resolve(1);
        };
        reader.readAsBinaryString(file);
      }
    });
  };

  const handleLessonImageUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setLessonFileType(uploadedFile.type);
      setLessonFileName(uploadedFile.name);

      if (uploadedFile.type.includes('pdf')) {
        const pages = await countPdfPages(uploadedFile);
        setPdfPageCount(pages);
        const calculatedHeight = pages * 1120 + 20; // Exact fit
        setWorkspaceHeight(calculatedHeight);
      } else {
        setPdfPageCount(1);
        setWorkspaceHeight(15000);
      }

      if (lessonImage && lessonImage.startsWith('blob:')) {
        URL.revokeObjectURL(lessonImage);
      }
      const blobUrl = URL.createObjectURL(uploadedFile);
      setLessonImage(blobUrl);
      setLessonHistory([]);
      lessonHistoryRef.current = [];
      setIsSidebarHidden(true);
    }
  };

  // Initialization: Set canvas dimensions once when file loads
  useEffect(() => {
    const canvas = lessonCanvasRef.current;
    if (!canvas || !lessonImage) return;

    if (lessonFileType.includes('pdf')) {
      canvas.width = 2000;
      canvas.height = workspaceHeight;
    } else if (lessonFileType.startsWith('image/')) {
      // Dimensions set in <img> onLoad
    } else {
      canvas.width = 1200;
      canvas.height = 800;
    }

    if (lessonHistoryRef.current.length > 0) {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = lessonHistoryRef.current[lessonHistoryRef.current.length - 1];
      img.onload = () => ctx.drawImage(img, 0, 0);
    }
  }, [lessonImage, lessonFileType, workspaceHeight]);

  // Event Listeners: Handle drawing interactions
  useEffect(() => {
    const canvas = lessonCanvasRef.current;
    if (!canvas) return;

    const options = { passive: false };
    canvas.addEventListener('touchstart', startLessonDrawing, options);
    canvas.addEventListener('touchmove', lessonDraw, options);
    canvas.addEventListener('touchend', stopLessonDrawing, options);
    return () => {
      canvas.removeEventListener('touchstart', startLessonDrawing);
      canvas.removeEventListener('touchmove', lessonDraw);
      canvas.removeEventListener('touchend', stopLessonDrawing);
    };
  }, [isLessonDrawing, lessonTool, lessonColor, lessonBrushSize]);

  // Fetch data on mount
  useEffect(() => {
    if (!currentUser) return;

    // If teacher, wait for assigned students to load to avoid "showing all" flash
    if (currentUser.role === 'teacher' && !hasLoadedAssignedStudents) {
      return;
    }

    fetchRecentTests();
    fetchSubmissions();
  }, [currentUser, assignedStudentIds, hasLoadedAssignedStudents, subjectName, standard, boardType]);

  const fetchRecentTests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tests/all`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        const sortedData = Array.isArray(data)
          ? data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          : [];

        // Filter by teacher if applicable
        if (currentUser && currentUser.role === 'teacher') {
          const filtered = sortedData.filter(test =>
            String(test.teacherId) === String(currentUser.id)
          );
          setRecentTests(filtered);
        } else {
          setRecentTests(sortedData);
        }
      } else {
        setRecentTests([]);
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
      setRecentTests([]);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/test-paper-submissions/with-names`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();

        let filtered = data;

        // 1. Filter by teacher responsibility if role is teacher
        if (currentUser && currentUser.role === 'teacher') {
          filtered = filtered.filter(sub =>
            sub.testTeacherId && String(sub.testTeacherId) === String(currentUser.id)
          );
        }

        // 2. Further filter by selected UI filters (Subject, Class, Board)
        if (subjectName) {
          filtered = filtered.filter(sub => sub.subject === subjectName);
        }
        if (standard) {
          filtered = filtered.filter(sub => sub.standard === standard);
        }
        if (boardType) {
          filtered = filtered.filter(sub => sub.boardType === boardType);
        }

        setSubmissions(filtered);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setSubmissions([]);
    }
  };

  const handleDeleteTest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tests/delete/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        alert("Test deleted successfully!");
        fetchRecentTests();
      } else {
        alert("Failed to delete test.");
      }
    } catch (err) {
      console.error("Error deleting test:", err);
    }
  };

  const handleEditClick = (test) => {
    setEditingTestId(test.id || test._id);
    setTestTitle(test.title);
    setManualQuestions(test.questions || '');
    setBoardType(test.boardType || '');
    setSubjectName(test.subject);
    setStandard(test.standard);
    setActiveTab('creation');
    window.scrollTo(0, 0);
  };

  const handleOpenCorrection = (sub) => {
    setSelectedSubmission(sub);
    setMarks(sub.marks || '');
    setRemarks(sub.remarks || '');
  };

  const closeCorrection = () => {
    setSelectedSubmission(null);
    setIsPenMode(false);
  };

  const handleEvaluate = async () => {
    if (!selectedSubmission) return;
    const sId = selectedSubmission.id || selectedSubmission._id;

    try {
      const formData = new FormData();
      formData.append('marks', marks);
      formData.append('remarks', remarks);

      // Add structured evaluation details
      const evaluationDetails = [
        { type: 'manual_text', content: selectedSubmission.answerText || selectedSubmission.studentAnswerContent },
        { evaluatedAt: new Date().toISOString() }
      ];
      formData.append('evaluationDetails', JSON.stringify(evaluationDetails));

      // Merge canvas and image if in pen mode and canvas has content
      if (isPenMode && canvasRef.current) {
        const blob = await mergeCanvasAndImage();
        if (blob) {
          formData.append('evaluatedFile', blob, 'evaluated_answer.jpg');
        }
      }

      const res = await fetch(`${API_BASE_URL}/test-paper-submissions/evaluate/${sId}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });

      if (res.ok) {
        alert("Evaluation saved successfully!");
        fetchSubmissions();
        closeCorrection();
      } else {
        alert("Failed to save evaluation. Check backend logs.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving evaluation: " + error.message);
    }
  };

  const mergeCanvasAndImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const originalUrl = selectedSubmission.filePath || (selectedSubmission.answerFilePath ? `${API_BASE_URL}/test-submissions/images/${selectedSubmission.answerFilePath}` : null);
    if (!originalUrl) return null;

    // Use proxy if it's an external URL (S3)
    const proxyUrl = originalUrl.startsWith('http')
      ? `${API_BASE_URL}/test-paper-submissions/proxy-image?url=${encodeURIComponent(getNormalizedUrl(originalUrl))}`
      : originalUrl;

    img.src = proxyUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    return new Promise((resolve) => {
      tempCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  };

  const handleSubmitTest = async () => {
    if (!subjectName || !standard || !testTitle || !boardType) {
      alert("Please select a Subject, Class, Test Title, and Board Type.");
      return;
    }

    setIsSubmittingTest(true);
    const formData = new FormData();
    formData.append('title', testTitle);
    formData.append('questions', manualQuestions);
    formData.append('boardType', boardType);
    formData.append('subject', subjectName);
    formData.append('standard', standard);
    if (currentUser && currentUser.id) {
      formData.append('teacherId', currentUser.id);
    }
    if (file) {
      formData.append('file', file);
    }

    const url = editingTestId
      ? `${API_BASE_URL}/tests/update/${editingTestId}`
      : `${API_BASE_URL}/tests/create`;

    try {
      const response = await fetch(url, {
        method: editingTestId ? 'PUT' : 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        alert(editingTestId ? 'Test Updated Successfully!' : 'Test Paper Submitted Successfully!');
        setTestTitle('');
        setManualQuestions('');
        setFile(null);
        setEditingTestId(null);
        fetchRecentTests();
      } else {
        const errorText = await response.text();
        console.error('❌ Server Error Details:', errorText);
        alert(`Submit failed: ${response.status}.`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('Error: Network issue or Server is unreachable.');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const fetchLearningMaterials = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/learning-materials/all`, { credentials: 'include' });
      if (res.ok) {
        let data = await res.json();
        if (currentUser && currentUser.role === 'teacher') {
          data = data.filter(material => String(material.teacherId) === String(currentUser.id));
        }
        setLearningMaterials(data);
      }
    } catch (err) {
      console.error("Error fetching materials:", err);
    }
  };

  const handleLearningMaterialSubmit = async () => {
    if (!materialTitle || !subjectName || !standard) {
      alert("Please fill in Title, Subject, and Class.");
      return;
    }

    setIsSubmittingMaterial(true);
    const formData = new FormData();
    formData.append('title', materialTitle);
    formData.append('description', materialDescription);
    formData.append('subject', subjectName);
    formData.append('standard', standard);
    formData.append('materialType', materialType);
    if (materialVideoLink) formData.append('videoLink', materialVideoLink);
    if (currentUser?.id) formData.append('teacherId', currentUser.id);

    selectedAssignedStudents.forEach(id => formData.append('assignedStudents', id));
    selectedAssignedBatches.forEach(batch => formData.append('assignedBatches', batch));

    if (materialFile) {
      formData.append('file', materialFile);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/learning-materials/create`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (res.ok) {
        alert("Learning material uploaded successfully!");
        setMaterialTitle('');
        setMaterialDescription('');
        setMaterialFile(null);
        setMaterialVideoLink('');
        setSelectedAssignedStudents([]);
        setSelectedAssignedBatches([]);
        fetchLearningMaterials();
      } else {
        const errorText = await res.text();
        alert("Upload failed: " + errorText);
      }
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setIsSubmittingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Delete this material?")) return;
    try {
      // Assuming a delete endpoint exists or I should add it
      const res = await fetch(`${API_BASE_URL}/learning-materials/delete/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchLearningMaterials();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'materials' && currentUser) {
      fetchLearningMaterials();
      fetchAllUsers();
    }
  }, [activeTab, currentUser]);

  // Helper to fix S3 SSL issues with buckets containing dots
  const getNormalizedUrl = (url) => {
    if (!url) return "";
    if (url.includes('.s3.') && url.includes('amazonaws.com')) {
      try {
        // Convert virtual-host style (bucket.with.dots.s3...) to path-style (s3.region/bucket.with.dots/...)
        // This avoids net::ERR_CERT_COMMON_NAME_INVALID errors
        const parts = url.match(/^https:\/\/([^/]+\.[^/]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)$/);
        if (parts) {
          return `https://s3.${parts[2]}.amazonaws.com/${parts[1]}/${parts[3]}`;
        }
      } catch (e) {
        console.error("URL parsing error:", e);
      }
    }
    return url;
  };

  return (
    <div className={`board-exam-container ${isSidebarHidden ? 'sidebar-hidden' : ''} ${activeTab === 'lesson' && lessonImage ? 'lesson-workspace-active' : ''}`}>
      <aside className={`exam-sidebar ${isSidebarHidden || (activeTab === 'lesson' && lessonImage) ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <h3>Board Exam</h3>
          <p>{subjectName ? `${subjectName} - Class ${standard}` : 'Select Subject & Class'}</p>
        </div>
        <nav>
          <button
            className={activeTab === 'calendar' ? 'active' : ''}
            onClick={() => { setActiveTab('calendar'); setEditingTestId(null); setIsSidebarHidden(false); }}
          >
            <FiCalendar /> Calendar View
          </button>
          <button
            className={activeTab === 'creation' ? 'active' : ''}
            onClick={() => { setActiveTab('creation'); setEditingTestId(null); setIsSidebarHidden(false); }}
          >
            <FiEdit3 /> Test Creation
          </button>
          <button
            className={activeTab === 'correction' ? 'active' : ''}
            onClick={() => { setActiveTab('correction'); setIsSidebarHidden(false); }}
          >
            <FiCheckCircle /> Test Correction
          </button>
          <button
            className={activeTab === 'lesson' ? 'active' : ''}
            onClick={() => { setActiveTab('lesson'); setIsSidebarHidden(false); }}
          >
            <FiBookOpen /> Take Lesson
          </button>
          <button
            className={activeTab === 'materials' ? 'active' : ''}
            onClick={() => { setActiveTab('materials'); setIsSidebarHidden(false); }}
          >
            <FiFileText /> Learning Materials
          </button>
        </nav>
        <button className="back-btn" onClick={() => navigate('/adminhome')}>
          <FiArrowLeft /> Back to Home
        </button>
      </aside>

      <main className="exam-content">
        {activeTab === 'calendar' ? (
          <CalendarView allAssignedClasses={allAssignedClasses} currentUser={currentUser} allTeachers={allTeachers} fetchAllAssignedClasses={() => fetchAssignedStudents(currentUser)} allStudents={allStudents} />
        ) : activeTab === 'creation' ? (
          <div className="fade-in">
            <h2 className="section-title">{editingTestId ? 'Edit Question Paper' : 'Create Question Paper'}</h2>
            <div className="creation-layout">
              <div className="form-card">
                {!location.state?.subjectName && (
                  <div className="subject-selection" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label>Subject</label>
                      <select value={subjectName} onChange={(e) => setSubjectName(e.target.value)}>
                        <option value="">Select Subject</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Maths">Maths</option>
                        <option value="Biology">Biology</option>
                        <option value="Science">Science</option>
                        <option value="English">English</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Class</label>
                      <select value={standard} onChange={(e) => setStandard(e.target.value)}>
                        <option value="">Select Class</option>
                        {['6', '7', '8', '9', '10', '11', '12'].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Board Type</label>
                      <select value={boardType} onChange={(e) => setBoardType(e.target.value)}>
                        <option value="">Select Board</option>
                        <option value="CBSE">CBSE</option>
                        <option value="State Board">State Board</option>
                      </select>
                    </div>
                  </div>
                )}

                <label>Test Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="Enter test title..."
                />

                <label>Questions (Manual Entry)</label>
                <textarea
                  rows="8"
                  value={manualQuestions}
                  onChange={(e) => setManualQuestions(e.target.value)}
                  placeholder="Type questions here..."
                />

                <div className="upload-box">
                  <label className="custom-file-upload">
                    <FiUpload /> {file ? file.name : "Upload Question File (Image/PDF/Docs)"}
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      hidden
                    />
                  </label>
                </div>

                <button className="main-submit-btn" onClick={handleSubmitTest} disabled={isSubmittingTest}>
                  {isSubmittingTest ? (
                    <>
                      <FiLoader className="animate-spin" size={18} style={{ marginRight: '8px' }} />
                      {editingTestId ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    editingTestId ? 'Update Question Paper' : 'Submit Question Paper'
                  )}
                </button>
                {editingTestId && (
                  <button className="cancel-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => {
                    setEditingTestId(null);
                    setTestTitle('');
                    setManualQuestions('');
                  }}>Cancel Edit</button>
                )}
              </div>

              <div className="recent-card">
                <h3>Recently Submitted</h3>
                <div className="test-list">
                  {recentTests.length > 0 ? (
                    recentTests.map((test, index) => (
                      <div key={test.id || test._id || index} className="test-item">
                        <FiFileText className="item-icon" />
                        <div style={{ flex: 1 }}>
                          <p className="item-title">{test.title}</p>
                          <div className="item-meta">
                            <span className="item-subject">{test.subject}</span>
                            <span className="item-standard">Class {test.standard}</span>
                            <span className="item-date">
                              {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                        </div>
                        <div className="test-actions">
                          <button className="action-btn edit" onClick={() => handleEditClick(test)} title="Edit">
                            <FiEdit />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDeleteTest(test.id || test._id)} title="Delete">
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#888', fontSize: '14px', fontStyle: 'italic' }}>
                      No recent tests found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'correction' ? (
          <div className="fade-in">
            <h2 className="section-title">Student Submissions (Correction)</h2>
            <div className="submission-grid">
              {submissions.length > 0 ? submissions.map((sub) => (
                <div key={sub.id || sub._id} className="submission-card">
                  <div className="sub-info">
                    <strong>{sub.studentName}</strong>
                    <div className="sub-test-details" style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
                      <span>Test: {sub.testTitle || 'General Test'}</span>
                      <span style={{ marginLeft: '10px' }}>({sub.subject} - {sub.standard})</span>
                    </div>
                    <span>Status: <em className={sub.status === 'Evaluated' || sub.status === 'Checked' ? 'completed' : 'pending'}>{sub.status}</em></span>
                    {sub.marks && <span style={{ display: 'block', marginTop: '5px', fontSize: '14px', color: '#005f4b' }}>Marks: {sub.marks}</span>}
                  </div>
                  <button className="correct-btn" onClick={() => handleOpenCorrection(sub)}>
                    {sub.status === 'Evaluated' || sub.status === 'Checked' ? 'View/Edit Correction' : 'Open & Correct (Manual Pen)'}
                  </button>
                </div>
              )) : (
                <p style={{ color: '#888', fontStyle: 'italic' }}>No submissions found for correction.</p>
              )}
            </div>

            {selectedSubmission && (
              <div className="modal-overlay">
                <div className="correction-modal">
                  <h3>Evaluate: {selectedSubmission.studentName}'s Test</h3>

                  <div className="answer-content-box">
                    <p><strong>Answer Content:</strong></p>
                    <div className="answer-text">
                      {selectedSubmission.answerText || selectedSubmission.studentAnswerContent || 'No text answer provided.'}
                    </div>
                    {selectedSubmission.evaluationDetails && (
                      <div className="evaluation-history" style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Evaluation Metadata:</p>
                        <ul style={{ fontSize: '11px', color: '#888' }}>
                          {selectedSubmission.evaluationDetails.map((detail, idx) => (
                            <li key={idx}>{JSON.stringify(detail)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {(selectedSubmission.filePath || selectedSubmission.answerFilePath) && (
                    <div className="answer-file-box">
                      <p><strong>Attached File:</strong></p>
                      {(selectedSubmission.filePath || selectedSubmission.answerFilePath).toLowerCase().endsWith('.pdf') ? (
                        <iframe
                          src={getNormalizedUrl(selectedSubmission.filePath) || `${API_BASE_URL}/test-submissions/images/${selectedSubmission.answerFilePath}`}
                          width="100%"
                          height="400px"
                          title="Student Answer PDF"
                          style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <button
                            onClick={() => setIsPenMode(!isPenMode)}
                            style={{
                              marginBottom: '10px',
                              padding: '8px 15px',
                              background: isPenMode ? '#d32f2f' : '#00796b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <FiEdit3 /> {isPenMode ? 'Disable Red Pen' : 'Enable Manual Red Pen'}
                          </button>

                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            {selectedSubmission.evaluatedFilePath ? (
                              <div style={{ marginBottom: '10px', border: '2px solid #4CAF50', borderRadius: '8px', padding: '5px' }}>
                                <p style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>Previously Evaluated Image:</p>
                                <img
                                  src={selectedSubmission.evaluatedFilePath.startsWith('http')
                                    ? `${API_BASE_URL}/test-paper-submissions/proxy-image?url=${encodeURIComponent(getNormalizedUrl(selectedSubmission.evaluatedFilePath))}`
                                    : `${API_BASE_URL}/test-submissions/images/${selectedSubmission.evaluatedFilePath}`}
                                  alt="Evaluated"
                                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '5px' }}
                                />
                              </div>
                            ) : null}
                            <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Original Image (Correct Below):</p>
                            <img
                              src={getNormalizedUrl(selectedSubmission.filePath) || `${API_BASE_URL}/test-submissions/images/${selectedSubmission.answerFilePath}`}
                              alt="Student Answer"
                              onLoad={(e) => {
                                if (canvasRef.current) {
                                  canvasRef.current.width = e.target.width;
                                  canvasRef.current.height = e.target.height;
                                }
                              }}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '400px',
                                borderRadius: '8px',
                                border: '1px solid #ccc',
                                display: 'block'
                              }}
                            />
                            <canvas
                              ref={canvasRef}
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 10,
                                cursor: isPenMode ? 'crosshair' : 'default',
                                pointerEvents: isPenMode ? 'auto' : 'none',
                                touchAction: isPenMode ? 'none' : 'auto'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="evaluation-fields">
                    <label>Marks Awarded</label>
                    <input
                      type="text"
                      placeholder="e.g. 85/100"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                    />

                    <label>Remarks / Feedback</label>
                    <textarea
                      rows="4"
                      placeholder="Enter feedback for the student..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={closeCorrection}>Cancel</button>
                    <button className="main-submit-btn" onClick={handleEvaluate}>Save Evaluation</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'lesson' ? (
          <div className="fade-in lesson-container-full">
            {!lessonImage ? (
              <div className="lesson-upload-screen">
                <div className="upload-card">
                  <FiImage size={64} color="#064e3b" />
                  <h2>Whiteboard Lesson</h2>
                  <p>Upload an image to start teaching and annotating.</p>
                  <label className="lesson-upload-btn">
                    <FiUpload /> Upload File (Any Format)
                    <input type="file" onChange={handleLessonImageUpload} hidden />
                  </label>
                </div>
              </div>
            ) : (
              <div className="lesson-workspace">
                <div className="lesson-header-bar">
                  <div className="tool-section">
                    <div className="tool-group">
                      <button className={`tool-btn ${lessonTool === 'pen' ? 'active' : ''}`} onClick={() => setLessonTool('pen')} title="Pen"><FiEdit3 /></button>
                      <button className={`tool-btn ${lessonTool === 'magic-pen' ? 'active' : ''}`} onClick={() => setLessonTool('magic-pen')} title="Magic Pen (Disappearing)"><FiZap /></button>
                      <button className={`tool-btn ${lessonTool === 'eraser' ? 'active' : ''}`} onClick={() => setLessonTool('eraser')} title="Eraser"><FiScissors /></button>
                    </div>
                    <div className="tool-group">
                      <button className="tool-btn" onClick={() => clearLessonCanvas()} title="Clear All"><FiRotateCcw /></button>
                      <button className="tool-btn" onClick={undoLesson} disabled={lessonHistory.length === 0} title="Undo"><FiRotateCcw style={{ transform: 'scaleX(-1)' }} /></button>
                    </div>
                    <div className="tool-group">
                      <input type="color" value={lessonColor} onChange={(e) => setLessonColor(e.target.value)} className="color-picker" />
                      <select value={lessonBrushSize} onChange={(e) => setLessonBrushSize(Number(e.target.value))} className="size-select">
                        <option value="2">Thin</option>
                        <option value="5">Medium</option>
                        <option value="10">Thick</option>
                        <option value="20">Extra Thick</option>
                      </select>
                    </div>
                  </div>
                  <button className="close-lesson-btn" onClick={() => {
                    if (lessonImage && lessonImage.startsWith('blob:')) {
                      URL.revokeObjectURL(lessonImage);
                    }
                    setLessonImage(null);
                    setLessonFileType('');
                    setLessonFileName('');
                    setIsSidebarHidden(false);
                  }}>
                    <FiTrash2 /> Close
                  </button>
                </div>

                <div className="lesson-canvas-container">
                  <div className="canvas-centering-box" style={{ height: `${workspaceHeight}px`, minHeight: `${workspaceHeight}px` }}>
                    {lessonFileType.includes('pdf') ? (
                      <PdfRenderer 
                        url={lessonImage} 
                        onHeightChange={(h) => setWorkspaceHeight(Math.max(h, 1140))} 
                      />
                    ) : lessonFileType.startsWith('image/') ? (
                      <img
                        src={lessonImage}
                        alt="Lesson"
                        className="lesson-img-base"
                        onLoad={(e) => {
                          if (lessonCanvasRef.current) {
                            lessonCanvasRef.current.width = e.target.naturalWidth;
                            lessonCanvasRef.current.height = e.target.naturalHeight;
                          }
                        }}
                      />
                    ) : (
                      <div className="lesson-other-file" style={{ padding: '40px', textAlign: 'center' }}>
                        <FiFileText size={64} color="#064e3b" />
                        <p style={{ marginTop: '15px', color: '#064e3b', fontWeight: 'bold' }}>
                          File Uploaded: {lessonFileName || 'Document'}
                        </p>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          Drawing tools are active on the overlay.
                        </p>
                      </div>
                    )}
                    <canvas
                      ref={lessonCanvasRef}
                      onMouseDown={startLessonDrawing}
                      onMouseMove={lessonDraw}
                      onMouseUp={stopLessonDrawing}
                      onMouseLeave={stopLessonDrawing}
                      className="lesson-canvas-overlay"
                      style={{ display: 'block' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'materials' ? (
          <div className="fade-in">
            <h2 className="section-title">Upload Learning Materials</h2>
            <div className="creation-layout">
              <div className="form-card">
                <div className="subject-selection" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Subject</label>
                    <select value={subjectName} onChange={(e) => setSubjectName(e.target.value)}>
                      <option value="">Select Subject</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Maths">Maths</option>
                      <option value="Biology">Biology</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Class</label>
                    <select value={standard} onChange={(e) => setStandard(e.target.value)}>
                      <option value="">Select Class</option>
                      {['6', '7', '8', '9', '10', '11', '12'].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label>Material Title</label>
                <input
                  type="text"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="Enter material title..."
                />

                <label>Description</label>
                <textarea
                  rows="4"
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  placeholder="Enter description..."
                />

                <label>Material Type</label>
                <select value={materialType} onChange={(e) => setMaterialType(e.target.value)} style={{ marginBottom: '15px' }}>
                  <option value="Notes">Notes / Assignment (PDF, DOCX, PPT)</option>
                  <option value="Video">Video Recording (MP4)</option>
                </select>

                {materialType === 'Notes' ? (
                  <div className="upload-box">
                    <label className="custom-file-upload">
                      <FiUpload /> {materialFile ? materialFile.name : "Upload File (PDF, DOCX, PPT)"}
                      <input
                        type="file"
                        onChange={(e) => setMaterialFile(e.target.files[0])}
                        accept=".pdf,.docx,.ppt,.pptx"
                        hidden
                      />
                    </label>
                  </div>
                ) : (
                  <div className="video-options">
                    <div className="upload-box" style={{ marginBottom: '15px' }}>
                      <label className="custom-file-upload">
                        <FiUpload /> {materialFile ? materialFile.name : "Upload Video (MP4)"}
                        <input
                          type="file"
                          onChange={(e) => setMaterialFile(e.target.files[0])}
                          accept="video/mp4"
                          hidden
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className="assignment-section">
                  <h3>Assign To</h3>
                  <div className="assignment-grid">
                    <div className="assignment-column">
                      <label>Select Students</label>
                      <div className="list-container custom-scrollbar">
                        {allStudents.length > 0 ? allStudents.map(student => (
                          <label key={student.id} className="list-item">
                            <input
                              type="checkbox"
                              checked={selectedAssignedStudents.includes(student.id)}
                              onChange={() => {
                                setSelectedAssignedStudents(prev =>
                                  prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id]
                                );
                              }}
                            />
                            <span>{student.name}</span>
                          </label>
                        )) : <p className="empty-list-msg">No students found</p>}
                      </div>
                    </div>
                    <div className="assignment-column">
                      <label>Select Batches</label>
                      <div className="list-container custom-scrollbar">
                        {['Regular Batch', 'Crash Course', 'Revision Series'].map(batch => (
                          <label key={batch} className="list-item">
                            <input
                              type="checkbox"
                              checked={selectedAssignedBatches.includes(batch)}
                              onChange={() => {
                                setSelectedAssignedBatches(prev =>
                                  prev.includes(batch) ? prev.filter(b => b !== batch) : [...prev, batch]
                                );
                              }}
                            />
                            <span>{batch}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="main-submit-btn"
                  style={{ marginTop: '30px' }}
                  onClick={handleLearningMaterialSubmit}
                  disabled={isSubmittingMaterial}
                >
                  {isSubmittingMaterial ? 'Uploading...' : 'Upload Learning Material'}
                </button>
              </div>

              <div className="recent-card">
                <h3>Existing Materials</h3>
                <div className="test-list">
                  {learningMaterials.length > 0 ? (
                    learningMaterials.map((mat, index) => (
                      <div key={mat.id || index} className="test-item">
                        <FiFileText className="item-icon" />
                        <div style={{ flex: 1 }}>
                          <p className="item-title">{mat.title}</p>
                          <div className="item-meta">
                            <span className="item-subject">{mat.subject}</span>
                            <span className="item-standard">Class {mat.standard}</span>
                            <span className="item-type" style={{ background: '#eef2ff', color: '#4f46e5', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>{mat.materialType}</span>
                          </div>
                        </div>
                        <div className="test-actions">
                          {(mat.filePath || mat.videoLink) && (
                            <button
                              className="action-btn edit"
                              onClick={() => window.open(mat.filePath || mat.videoLink, '_blank')}
                              title="Open Material"
                              style={{ background: '#eef2ff', color: '#4f46e5' }}
                            >
                              <FiExternalLink />
                            </button>
                          )}
                          <button className="action-btn delete" onClick={() => handleDeleteMaterial(mat.id || mat._id)} title="Delete">
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#888', fontSize: '14px', fontStyle: 'italic' }}>
                      No learning materials found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default BoardExam;