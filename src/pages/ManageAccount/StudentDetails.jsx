// StudentDetails.jsx - Complete working version with study sessions and progress
import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Mail, Phone, Calendar, User, GraduationCap,
  CreditCard, BarChart, Download, MapPin, Clock, BookOpen,
  Percent, Tag, FileText, Shield, Layers, Target,
  CheckCircle, XCircle, AlertCircle, LogIn, LogOut, Timer, RefreshCw
} from 'lucide-react';
import { API_BASE_URL }                            from '../../config';



const COURSE_CONFIG = {
  NEET: { coursetype: "NEET", subjects: ["Physics", "Chemistry", "Botany", "Zoology"] },
  JEE: { coursetype: "JEE", subjects: ["Physics", "Chemistry", "Maths"] },
  "Class 6-12": { coursetype: "academics", subjects: ["Mathematics", "Science", "Social Studies", "English", "Hindi"] },
  "Class 1-5": { coursetype: "academics", subjects: ["Mathematics", "Science", "English", "Hindi", "EVS"] },
  "Kindergarten": { coursetype: "academics", subjects: ["English", "Numbers", "Rhymes", "Drawing"] }
};

const getCourseMode = (courseTypeOrKey) => {
  if (!courseTypeOrKey) return 'Academics';
  const parts = courseTypeOrKey.split('&').map(s => s.trim());
  const allPro = parts.every(p => p === 'NEET' || p === 'JEE');
  const allAca = parts.every(p => p !== 'NEET' && p !== 'JEE');
  if (allPro) return 'Professional';
  if (allAca) return 'Academics';
  return 'Mixed';
};

const StudentDetails = ({ student, onBack, formatDate }) => {
  const [studySessions, setStudySessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    avgDuration: 0,
    lastLogin: null,
    lastLogout: null
  });

  const [expandedSubjects, setExpandedSubjects] = useState({});

  const [analyticalResults, setAnalyticalResults] = useState(null);
  const [loadingAnalytical, setLoadingAnalytical] = useState(false);
  const [analyticalError, setAnalyticalError] = useState(null);;

  const [assessmentResults, setAssessmentResults] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState(null);

  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [selectedAssessmentDetail, setSelectedAssessmentDetail] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedUnits, setExpandedUnits] = useState({});
  const [analysisActiveTab, setAnalysisActiveTab] = useState('all');

  const [studentProgress, setStudentProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressStats, setProgressStats] = useState({
    overallProgress: 0,
    totalTopics: 0,
    completedTopics: 0
  });

  if (!student) return null;

  console.log('StudentDetails rendering with student:', {
    id: student.id,
    _id: student._id,
    email: student.email,
    name: student.firstname
  });

  // Fetch student complete data (progress + analytical results)
  const fetchStudentData = useCallback(async () => {
    const studentId = student?.id || student?._id;

    console.log('=== fetchStudentData called ===');
    console.log('Student ID:', studentId);

    if (!studentId) {
      console.log('No student ID available');
      return;
    }

    setLoadingProgress(true);

    try {
      // Use the combined endpoint
      const apiUrl = `${API_BASE_URL}/getStudentCompleteData/${studentId}`;
      console.log('Fetching data from URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Complete data received:', data);

      if (data.status === 'pass') {
        setStudentProgress(data);

        if (data.hierarchicalProgress) {
          const neetCourse = data.hierarchicalProgress.NEET;
          if (neetCourse) {
            setProgressStats({
              overallProgress: neetCourse.overallProgress || 0,
              totalTopics: neetCourse.totalLessons || 0,
              completedTopics: 0
            });
          }
        }
      } else {
        console.log('No data found for this student');
        setStudentProgress(null);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      setStudentProgress(null);
    } finally {
      setLoadingProgress(false);
    }
  }, [student?.id, student?._id]);

  // Fetch assessment results (from AssessmentResults collection)
  const fetchAssessmentResults = useCallback(async () => {
    const studentId = student?.id || student?._id;

    console.log('=== fetchAssessmentResults called ===');
    console.log('Student ID:', studentId);

    if (!studentId) {
      console.log('No student ID available');
      return;
    }

    setLoadingAssessment(true);
    setAssessmentError(null);

    try {
      const apiUrl = `${API_BASE_URL}/getStudentAssessmentResults/${studentId}`;
      console.log('Fetching assessment results from URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Assessment results received:', data);

      if (data.status === 'pass') {
        setAssessmentResults(data);
      } else {
        setAssessmentResults(null);
      }
    } catch (error) {
      console.error('Error fetching assessment results:', error);
      setAssessmentError(error.message);
      setAssessmentResults(null);
    } finally {
      setLoadingAssessment(false);
    }
  }, [student?.id, student?._id]);

  useEffect(() => {
    console.log('useEffect triggered - fetching assessment results');
    fetchAssessmentResults();
  }, [fetchAssessmentResults]);

  // Fetch assessment analysis for the student
  // Fetch assessment analysis for the student
  const fetchAssessmentAnalysis = useCallback(async () => {
    const studentId = student?.id || student?._id;

    if (!studentId) {
      console.log('No student ID available');
      setAnalysisData({
        hasData: false,
        assessments: [],
        strongTopics: [],
        weakTopics: [],
        subjectPerformance: {},
        overallStats: {
          totalQuestions: 0,
          totalCorrect: 0,
          totalWrong: 0,
          totalSkipped: 0,
          overallPercentage: 0,
          totalAssessments: 0
        }
      });
      return;
    }

    setLoadingAnalysis(true);

    try {
      const response = await fetch(`${API_BASE_URL}/getStudentAssessmentAnalysis/${studentId}`, {
        method: 'GET',
        // credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      console.log('Analysis data received:', data);

      if (data.status === 'pass') {
        setAnalysisData(data);
      } else {
        console.error('Analysis API returned error:', data);
        setAnalysisData({
          hasData: false,
          assessments: [],
          strongTopics: [],
          weakTopics: [],
          subjectPerformance: {},
          overallStats: {
            totalQuestions: 0,
            totalCorrect: 0,
            totalWrong: 0,
            totalSkipped: 0,
            overallPercentage: 0,
            totalAssessments: 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAnalysisData({
        hasData: false,
        assessments: [],
        strongTopics: [],
        weakTopics: [],
        subjectPerformance: {},
        overallStats: {
          totalQuestions: 0,
          totalCorrect: 0,
          totalWrong: 0,
          totalSkipped: 0,
          overallPercentage: 0,
          totalAssessments: 0
        }
      });
    } finally {
      setLoadingAnalysis(false);
    }
  }, [student?.id, student?._id]);



  // Fetch analytical test results
  const fetchAnalyticalResults = useCallback(async () => {
    const studentId = student?.id || student?._id;

    console.log('=== fetchAnalyticalResults called ===');
    console.log('Student ID:', studentId);
    console.log('API_BASE_URL:', API_BASE_URL);

    if (!studentId) {
      console.log('No student ID available');
      setAnalyticalError('No student ID available');
      return;
    }

    setLoadingAnalytical(true);
    setAnalyticalError(null);

    try {
      const apiUrl = `${API_BASE_URL}/getStudentAnalyticalResults/${studentId}`;
      console.log('Fetching from URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        // credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Analytical results received:', data);
      console.log('Has results:', data.hasResults);
      console.log('Results count:', data.results?.length);

      if (data.status === 'pass') {
        setAnalyticalResults(data);
        if (data.results && data.results.length > 0) {
          console.log('First result:', data.results[0]);
        }
      } else {
        console.log('API returned non-pass status:', data);
        setAnalyticalResults(null);
        setAnalyticalError(data.message || 'Failed to fetch results');
      }
    } catch (error) {
      console.error('Error fetching analytical results:', error);
      setAnalyticalError(error.message);
      setAnalyticalResults(null);
    } finally {
      setLoadingAnalytical(false);
    }
  }, [student?.id, student?._id]);

  useEffect(() => {
    console.log('useEffect triggered - fetching analytical results');
    fetchAnalyticalResults();
  }, [fetchAnalyticalResults]);

  // Fetch student progress
  // Fetch student progress
  const fetchStudentProgress = useCallback(async () => {
    const studentId = student?.id || student?._id;

    console.log('=== fetchStudentProgress called ===');
    console.log('Student ID:', studentId);

    if (!studentId) {
      console.log('No student ID available');
      return;
    }

    setLoadingProgress(true);

    try {
      // Use the dynamic endpoint
      const apiUrl = `${API_BASE_URL}/getStudentProgressDynamic/${studentId}`;
      console.log('Fetching progress from URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Progress data received:', data);

      if (data.status === 'pass') {
        setStudentProgress(data);

        if (data.hierarchicalProgress) {
          const neetCourse = data.hierarchicalProgress.NEET;
          if (neetCourse) {
            setProgressStats({
              overallProgress: neetCourse.overallProgress || 0,
              totalTopics: neetCourse.totalLessons || 0,
              completedTopics: 0 // Will be calculated from subjects
            });
          }
        }
      } else {
        console.log('No progress found for this student');
        setStudentProgress(null);
      }
    } catch (error) {
      console.error('Error fetching student progress:', error);
      setStudentProgress(null);
    } finally {
      setLoadingProgress(false);
    }
  }, [student?.id, student?._id]);

  // Fetch study sessions for this student using ID
  const fetchStudySessions = useCallback(async () => {
    const studentId = student?.id || student?._id;

    console.log('=== fetchStudySessions called ===');
    console.log('Student ID:', studentId);
    console.log('API_BASE_URL:', API_BASE_URL);

    if (!studentId) {
      console.log('No student ID available');
      return;
    }

    setLoadingSessions(true);

    try {
      // Use the API_BASE_URL from config
      const apiUrl = `${API_BASE_URL}/getStudentSessions/${studentId}`;
      console.log('Fetching from URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Data received:', data);
      console.log('Sessions count:', data.sessions?.length);

      if (data.status === 'pass' && data.sessions) {
        console.log('Setting', data.sessions.length, 'sessions');
        setStudySessions(data.sessions);

        if (data.statistics) {
          setSessionStats({
            totalSessions: data.statistics.totalSessions || 0,
            totalMinutes: data.statistics.totalMinutes || 0,
            avgDuration: data.statistics.averageDuration || 0,
            lastLogin: data.statistics.lastLogin,
            lastLogout: data.statistics.lastLogout
          });
        }
      }
    } catch (error) {
      console.error('Error fetching study sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  }, [student?.id, student?._id]);

  useEffect(() => {
    console.log('useEffect triggered - fetching student data');
    fetchStudentData();
  }, [fetchStudentData]);

  // Run fetch when component mounts or student changes
  useEffect(() => {
    console.log('useEffect triggered - fetching sessions');
    fetchStudySessions();
  }, [fetchStudySessions]);

  useEffect(() => {
    console.log('useEffect triggered - fetching progress');
    fetchStudentProgress();
  }, [fetchStudentProgress]);

  const selectedCourseObj = student.selectedCourse || {};
  const selectedCourseKeys = Object.keys(selectedCourseObj).filter(k => Array.isArray(selectedCourseObj[k]));

  const displayCourseKeys = selectedCourseKeys.length > 0
    ? selectedCourseKeys
    : (student.courseName
      ? student.courseName.split('&').map(s => s.trim()).filter(k => COURSE_CONFIG[k])
      : []);

  const hasMultipleCourses = displayCourseKeys.length > 1;

  const getStatusColor = (status) => ({
    active: '#4CAF50',
    trial: '#FF9800',
    expiring: '#FF5722',
    expired: '#f44336',
    inactive: '#9E9E9E'
  }[status?.toLowerCase()] || '#757575');

  const getPlanColor = (plan) => ({
    trial: '#FF9800',
    yearly: '#00BCD4',
    halfyearly: '#9C27B0',
    quarterly: '#2196F3',
    monthly: '#4CAF50'
  }[plan?.toLowerCase()] || '#757575');

  const calculateStatus = () => {
    if (!student.startDate || !student.endDate) return 'inactive';
    const now = new Date();
    const end = new Date(student.endDate);
    const start = new Date(student.startDate);
    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return days <= 7 ? 'expiring' : 'active';
  };

  const calculateDaysRemaining = () => {
    if (!student.endDate) return null;
    const now = new Date();
    const end = new Date(student.endDate);
    if (now > end) return 0;
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const status = calculateStatus();
  const daysRemaining = calculateDaysRemaining();

  const formatSessionDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins} min`;
    }
  };

  // Helper function to calculate percentage
  const calculatePercentage = (scoreScored, totalMarks) => {
    if (!totalMarks || totalMarks === 0) return "0%";
    const percentage = (scoreScored / totalMarks) * 100;
    return `${Math.round(percentage)}%`;
  };

  // Helper function to toggle row expansion
  const toggleRowExpand = (rowId) => {
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  // Helper function to toggle unit expansion
  const toggleUnitExpand = (unitId) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // Helper function to get status info
  const getStatusInfo = (accuracy, attempted) => {
    if (attempted === 0) return { cls: "status-neutral", text: "Not Attempted" };
    if (accuracy >= 70) return { cls: "status-good", text: "Good" };
    if (accuracy >= 40) return { cls: "status-average", text: "Average" };
    return { cls: "status-poor", text: "Needs Work" };
  };

  // Helper function to get sorted unit names
  const getSortedUnitNames = (unitBreakdown) => {
    if (!unitBreakdown) return [];
    const unitNames = Object.keys(unitBreakdown);
    unitNames.sort((a, b) => {
      const nameA = unitBreakdown[a].originalName || a.replace(/__dot__/g, '.');
      const nameB = unitBreakdown[b].originalName || b.replace(/__dot__/g, '.');
      const numA = parseInt(nameA.match(/^\d+/)?.[0] || '0');
      const numB = parseInt(nameB.match(/^\d+/)?.[0] || '0');
      return numA - numB;
    });
    return unitNames;
  };

  // Render unit breakdown table
  const renderUnitBreakdownTable = (attempt, rowIndex) => {
    if (!attempt.unitBreakdown) return null;
    const unitBreakdown = attempt.unitBreakdown;
    const unitNames = getSortedUnitNames(unitBreakdown);
    if (unitNames.length === 0) return null;

    return (
      <div className="analysis-unit-breakdown">
        <div className="breakdown-header">
          <div className="breakdown-title-section">
            <h4 className="breakdown-title">📊 Unit-wise Performance</h4>
            <span className="breakdown-total-questions">
              Total Questions: <strong>{attempt.totalMarks || 0}</strong>
            </span>
          </div>
          <div className="breakdown-summary">
            Units: <strong>{unitNames.length}</strong>
          </div>
        </div>
        <div className="lesson-table-wrapper">
          <table className="lesson-breakdown-table">
            <thead>
              <tr>
                <th className="col-expand-lesson"></th>
                <th className="col-lesson">Unit Name</th>
                <th className="col-number">Total</th>
                <th className="col-number">Correct</th>
                <th className="col-number">Wrong</th>
                <th className="col-number">Skipped</th>
                <th className="col-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {unitNames.map((escapedUnit, unitIdx) => {
                const unitData = unitBreakdown[escapedUnit];
                const displayUnit = unitData.originalName || escapedUnit.replace(/__dot__/g, '.');
                const unitId = `${rowIndex}-unit-${unitIdx}`;
                const isUnitExpanded = expandedUnits[unitId];
                const total = unitData.total || 0;
                const correct = unitData.correct || 0;
                const wrong = unitData.wrong || 0;
                const unattended = unitData.unattended || 0;
                const attempted = correct + wrong;
                const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
                const { cls: statusClass, text: statusText } = getStatusInfo(accuracy, attempted);
                const subtopics = unitData.subtopics || {};
                const subtopicNames = Object.keys(subtopics).sort((a, b) => {
                  const nameA = subtopics[a].originalName || a.replace(/__dot__/g, '.');
                  const nameB = subtopics[b].originalName || b.replace(/__dot__/g, '.');
                  return nameA.localeCompare(nameB);
                });

                return (
                  <React.Fragment key={escapedUnit}>
                    <tr className="lesson-row" onClick={() => toggleUnitExpand(unitId)}>
                      <td className="expand-lesson-cell">
                        <span className={`expand-lesson-icon ${isUnitExpanded ? 'expanded' : ''}`}>
                          {isUnitExpanded ? '▼' : '▶'}
                        </span>
                      </td>
                      <td className="lesson-name-cell" title={displayUnit}>{displayUnit}</td>
                      <td className="number-cell">{total}</td>
                      <td className="number-cell correct">{correct}</td>
                      <td className="number-cell wrong">{wrong}</td>
                      <td className="number-cell unattended">{unattended}</td>
                      <td className="status-cell">
                        <span className={`lesson-status-badge ${statusClass}`}>{statusText}</span>
                      </td>
                    </tr>
                    {isUnitExpanded && subtopicNames.length > 0 && (
                      <tr className="subtopic-row">
                        <td colSpan="7" className="subtopic-cell">
                          <div className="subtopic-container">
                            <div className="subtopic-header">
                              <h5>📚 Topics in {displayUnit}</h5>
                              <span className="subtopic-count">{subtopicNames.length} topics</span>
                            </div>
                            <div className="subtopic-table-wrapper">
                              <table className="subtopic-table">
                                <thead>
                                  <tr><th>Topic Name</th><th>Total</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                  {subtopicNames.map(escapedSubtopic => {
                                    const subtopic = subtopics[escapedSubtopic];
                                    const displaySubtopic = subtopic.originalName || escapedSubtopic.replace(/__dot__/g, '.');
                                    const subTotal = subtopic.total || 0;
                                    const subCorrect = subtopic.correct || 0;
                                    const subWrong = subtopic.wrong || 0;
                                    const subUnattended = subtopic.unattended || 0;
                                    const subAttempted = subCorrect + subWrong;
                                    const subAccuracy = subAttempted > 0 ? Math.round((subCorrect / subAttempted) * 100) : 0;
                                    const { cls: subStatusClass, text: subStatusText } = getStatusInfo(subAccuracy, subAttempted);
                                    return (
                                      <tr key={escapedSubtopic}>
                                        <td className="subtopic-name-cell">{displaySubtopic}</td>
                                        <td className="number-cell">{subTotal}</td>
                                        <td className="number-cell correct">{subCorrect}</td>
                                        <td className="number-cell wrong">{subWrong}</td>
                                        <td className="number-cell unattended">{subUnattended}</td>
                                        <td className="status-cell"><span className={`lesson-status-badge ${subStatusClass}`}>{subStatusText}</span></td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleExportDetails = () => {
    // ... keep your existing handleExportDetails function
    const courseSection = displayCourseKeys.length > 0
      ? displayCourseKeys.map(key => `
  ${key} (${getCourseMode(key)}):
    Standards : ${(selectedCourseObj[key] || []).join(', ') || 'N/A'}
    Subjects  : ${COURSE_CONFIG[key]?.subjects.join(', ') || 'N/A'}
`).join('')
      : `  Course: ${student.courseName || 'N/A'}\n`;

    const sessionsSection = studySessions.length > 0
      ? studySessions.map((session, i) => `
Session ${i + 1}:
  Login Time    : ${formatSessionDate(session.loginTime)}
  Logout Time   : ${formatSessionDate(session.logoutTime)}
  Duration      : ${formatDuration(session.durationInMinutes)}
  Session ID    : ${session._id}
`).join('')
      : '  No study sessions recorded\n';

    const details = `
Student Details Report
======================
ID        : ${student.id}
Name      : ${student.firstname} ${student.lastname}
Email     : ${student.email}
Phone     : ${student.mobile || student.phone || 'Not provided'}
Gender    : ${student.gender || 'Not specified'}
DOB       : ${formatDate(student.dob)}
City      : ${student.city || 'Not specified'}
State     : ${student.state || 'Not specified'}

Course Information
------------------
coursetype       : ${student.coursetype || 'Not specified'}
courseName       : ${student.courseName || 'Not specified'}
Enrolled Courses (${displayCourseKeys.length}):${courseSection}
selectedStandard : ${student.selectedStandard?.join(', ') || 'Not specified'}

Subscription Details
--------------------
Plan          : ${student.plan || 'Not specified'}
Status        : ${status}
Start Date    : ${formatDate(student.startDate)}
End Date      : ${formatDate(student.endDate)}
Days Remaining: ${daysRemaining !== null ? daysRemaining : 'N/A'}

Study Session Statistics
------------------------
Total Sessions   : ${sessionStats.totalSessions}
Total Study Time : ${formatDuration(sessionStats.totalMinutes)}
Average Duration : ${formatDuration(sessionStats.avgDuration)}
Last Login       : ${formatSessionDate(sessionStats.lastLogin)}
Last Logout      : ${formatSessionDate(sessionStats.lastLogout)}

Study Sessions (${studySessions.length} records)
------------------
${sessionsSection}

Payment Information
-------------------
Method     : ${student.paymentMethod || 'Not specified'}
Amount     : ₹${student.amountPaid || '0'}
Discount   : ${student.discountPercentage || '0'}% (₹${student.discountAmount || '0'})
Payment ID : ${student.paymentId || 'Not specified'}
Payer ID   : ${student.payerId || 'Not specified'}
Coupon     : ${student.couponUsed || 'None'}

Study Preferences
-----------------
Daily Hours       : ${student.comfortableDailyHours || 3} hours
Proficiency Level : ${student.severity || 'Not specified'}

Payment History (${student.paymentHistory?.length || 0} records)
-----------------------------------------------------------------
${student.paymentHistory?.map((p, i) => `
Payment ${i + 1}:
  Date       : ${formatDate(p.date)}
  Action     : ${p.action || 'N/A'}
  Plan       : ${p.plan || 'N/A'}
  Amount     : ₹${p.amountPaid || '0'}
  Discount   : ${p.discountPercentage || '0'}% (₹${p.discountAmount || '0'})
  Coupon     : ${p.couponUsed || 'None'}
  Payment ID : ${p.paymentId || 'N/A'}
  Payer ID   : ${p.payerId || 'N/A'}
`).join('\n') || 'No payment history'}

Report Generated: ${new Date().toLocaleString()}
        `;

    const blob = new Blob([details], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `student_${student.id}_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStudySessions = () => {
    if (loadingSessions) {
      return <div className="loading-sessions">Loading study sessions...</div>;
    }

    if (!studySessions || studySessions.length === 0) {
      return (
        <div className="no-sessions">
          <AlertCircle size={20} />
          <p>No study sessions recorded for this student</p>
        </div>
      );
    }

    // Group sessions by date
    const groupedSessions = {};
    studySessions.forEach(session => {
      const date = new Date(session.loginTime);
      const dateKey = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      if (!groupedSessions[dateKey]) {
        groupedSessions[dateKey] = [];
      }
      groupedSessions[dateKey].push(session);
    });

    // Calculate daily totals
    const dailyTotals = {};
    Object.keys(groupedSessions).forEach(date => {
      const total = groupedSessions[date].reduce((sum, s) => sum + (s.durationInMinutes || 0), 0);
      dailyTotals[date] = total;
    });

    // Get sorted dates
    const sortedDates = Object.keys(groupedSessions).sort((a, b) => {
      const dateA = new Date(a.split(' ').reverse().join(' '));
      const dateB = new Date(b.split(' ').reverse().join(' '));
      return dateB - dateA;
    });

    // Calculate weekly totals for chart
    const weeklyTotals = {};
    studySessions.forEach(session => {
      const date = new Date(session.loginTime);
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      if (!weeklyTotals[weekKey]) {
        weeklyTotals[weekKey] = 0;
      }
      weeklyTotals[weekKey] += session.durationInMinutes || 0;
    });

    return (
      <div className="study-sessions-container">
        {/* Summary Cards */}
        <div className="sessions-summary-cards">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <div className="summary-value">{sessionStats.totalSessions}</div>
              <div className="summary-label">Total Sessions</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">⏱️</div>
            <div className="summary-info">
              <div className="summary-value">{formatDuration(sessionStats.totalMinutes)}</div>
              <div className="summary-label">Total Study Time</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📈</div>
            <div className="summary-info">
              <div className="summary-value">{formatDuration(sessionStats.avgDuration)}</div>
              <div className="summary-label">Average Session</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📅</div>
            <div className="summary-info">
              <div className="summary-value">{Object.keys(groupedSessions).length}</div>
              <div className="summary-label">Active Days</div>
            </div>
          </div>
        </div>

        {/* Last Session Info */}
        <div className="last-session-info">
          <div className="last-session-card">
            <div className="last-session-icon">🕐</div>
            <div className="last-session-details">
              <div className="last-session-label">Last Login</div>
              <div className="last-session-value">{formatSessionDate(sessionStats.lastLogin)}</div>
            </div>
          </div>
          <div className="last-session-card">
            <div className="last-session-icon">🔚</div>
            <div className="last-session-details">
              <div className="last-session-label">Last Logout</div>
              <div className="last-session-value">{formatSessionDate(sessionStats.lastLogout)}</div>
            </div>
          </div>
        </div>

        {/* Activity Calendar - Recent 14 days */}
        <div className="activity-calendar">
          <h4>📅 Recent Activity (Last 14 Days)</h4>
          <div className="calendar-grid">
            {sortedDates.slice(0, 14).map(date => {
              const totalMins = dailyTotals[date];
              const intensity = totalMins > 120 ? 'high' : totalMins > 60 ? 'medium' : totalMins > 0 ? 'low' : 'none';
              return (
                <div key={date} className={`calendar-day ${intensity}`}>
                  <div className="calendar-date">{date.split(',')[0]}</div>
                  <div className="calendar-duration">{formatDuration(totalMins)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const toggleSubject = (subjectKey) => {
    setExpandedSubjects(prev => ({ ...prev, [subjectKey]: !prev[subjectKey] }));
  };

  const renderProgress = () => {
    if (loadingProgress) return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
    if (!studentProgress?.hasProgress) return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No progress data</div>;

    const course = studentProgress.hierarchicalProgress?.NEET;
    if (!course) return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No course data</div>;

    const standards = course.standards || {};

    return (
      <div>
        {/* Overall Progress Bar */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong>Overall Progress</strong>
            <strong>{course.overallProgress || 0}%</strong>
          </div>
          <div style={{ background: '#e0e0e0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${course.overallProgress || 0}%`, height: '100%', background: '#4CAF50', borderRadius: '10px' }} />
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>📚 Total Lessons: {course.totalLessons || 0}</div>
        </div>

        {/* Standards Accordion */}
        {Object.keys(standards).map(standard => {
          const standardData = standards[standard];
          const subjects = standardData.subjects || {};

          return (
            <div key={standard} style={{ marginBottom: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#e3f2fd', padding: '10px 15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                onClick={() => toggleSubject(standard)}>
                <strong>📖 {standard} Standard</strong>
                <span>{expandedSubjects[standard] ? '▼' : '▶'} {standardData.progress || 0}%</span>
              </div>

              {expandedSubjects[standard] && (
                <div style={{ padding: '15px' }}>
                  {Object.keys(subjects).map(subjectName => {
                    const subject = subjects[subjectName];
                    const lessons = subject.lessons || [];
                    const completedCount = subject.completedLessons || 0;

                    return (
                      <div key={subjectName} style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong>{subjectName}</strong>
                          <span style={{ fontSize: '12px' }}>{completedCount}/{subject.totalLessons} lessons ({subject.progress || 0}%)</span>
                        </div>
                        <div style={{ background: '#e0e0e0', borderRadius: '10px', height: '6px', overflow: 'hidden', marginBottom: '10px' }}>
                          <div style={{ width: `${subject.progress || 0}%`, height: '100%', background: '#2196F3', borderRadius: '10px' }} />
                        </div>

                        {/* Compact lesson list */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                          {lessons.slice(0, 5).map((lesson, idx) => (
                            <span key={idx} style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              background: lesson.percentage >= 100 ? '#e8f5e9' : '#f5f5f5',
                              borderRadius: '12px',
                              color: lesson.percentage >= 100 ? '#4CAF50' : '#666'
                            }}>
                              {lesson.name?.substring(0, 25)} {lesson.percentage >= 100 ? '✓' : `${lesson.percentage}%`}
                            </span>
                          ))}
                          {lessons.length > 5 && <span style={{ fontSize: '11px', color: '#999' }}>+{lessons.length - 5} more</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };





  const renderPaymentHistory = () => {
    if (!student.paymentHistory || student.paymentHistory.length === 0) {
      return <div className="no-payments">No payment history available</div>;
    }
    return (
      <div className="payment-history-list">
        {student.paymentHistory.map((payment, index) => (
          <div key={index} className="payment-item">
            <div className="payment-header">
              <span className="payment-index">Payment #{index + 1}</span>
              <span className={`payment-action-badge ${payment.action === 'TRIAL_ACTIVATION' ? 'trial' : 'paid'}`}>
                {payment.action || 'N/A'}
              </span>
              <span className="payment-date">{formatDate(payment.date)}</span>
            </div>
            <div className="payment-details">
              <div className="payment-row">
                <span className="label">Plan:</span>
                <span className="value" style={{ color: getPlanColor(payment.plan), fontWeight: 600 }}>
                  {payment.plan?.toUpperCase() || 'N/A'}
                </span>
              </div>
              <div className="payment-row">
                <span className="label">Amount:</span>
                <span className="value amount">₹{payment.amountPaid || '0'}</span>
              </div>
              {payment.discountPercentage && payment.discountPercentage !== '0' && (
                <div className="payment-row">
                  <span className="label">Discount:</span>
                  <span className="value discount">
                    {payment.discountPercentage}% (₹{payment.discountAmount || '0'})
                  </span>
                </div>
              )}
              {payment.couponUsed && payment.couponUsed !== 'NONE' && (
                <div className="payment-row">
                  <span className="label">Coupon:</span>
                  <span className="value coupon-code">{payment.couponUsed}</span>
                </div>
              )}
              {payment.payerId && (
                <div className="payment-row">
                  <span className="label">Payer ID:</span>
                  <span className="value payment-id">{payment.payerId}</span>
                </div>
              )}
              {payment.paymentId && (
                <div className="payment-row">
                  <span className="label">Payment ID:</span>
                  <span className="value payment-id">{payment.paymentId}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCourseCards = () => {
    if (displayCourseKeys.length === 0) {
      return (
        <div className="details-card">
          <div className="card-header"><GraduationCap size={20} /><h3>Course Information</h3></div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Course Type:</span>
              <span className="info-value">{student.coursetype || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Course Name:</span>
              <span className="info-value">{student.courseName || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Standards:</span>
              <span className="info-value">{student.selectedStandard?.join(', ') || 'N/A'}</span>
            </div>
          </div>
        </div>
      );
    }

    return displayCourseKeys.map((courseKey, idx) => {
      const standards = selectedCourseObj[courseKey] || student.selectedStandard || [];
      const config = COURSE_CONFIG[courseKey];
      const courseMode = getCourseMode(courseKey);

      return (
        <div key={courseKey} className="details-card">
          <div className="card-header">
            <GraduationCap size={20} />
            <h3>
              {courseKey}
              {hasMultipleCourses && (
                <span className="course-count-badge">{idx + 1}/{displayCourseKeys.length}</span>
              )}
            </h3>
          </div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Course Type:</span>
              <span className="info-value">
                {courseKey}
                <span className="course-mode"> ({courseMode})</span>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">DB coursetype:</span>
              <span className="info-value code">{student.coursetype || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Standards:</span>
              <span className="info-value">
                <div className="tag-list">
                  {standards.length > 0
                    ? standards.map(s => <span key={s} className="std-tag">{s}</span>)
                    : <span className="no-data">None selected</span>
                  }
                </div>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Subjects:</span>
              <span className="info-value">
                <div className="tag-list">
                  {(config?.subjects || []).map(sub => (
                    <span key={sub} className="subject-tag">{sub}</span>
                  ))}
                </div>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Mode:</span>
              <span className="info-value">
                <Shield size={14} /> {courseMode}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="student-details-container">
      <div className="details-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} /> Back to List
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="export-details-btn"
            onClick={() => {
              fetchAssessmentAnalysis();
              setShowAnalysisModal(true);
            }}
            style={{ background: '#9C27B0' }}
          >
            <BarChart size={16} /> Analyze History
          </button>
          <button className="export-details-btn" onClick={handleExportDetails}>
            <Download size={16} /> Export Details
          </button>
          <button className="export-details-btn" onClick={fetchStudySessions} style={{ background: '#4CAF50' }}>
            <RefreshCw size={16} /> Refresh Sessions
          </button>
        </div>
      </div>

      <div className="student-profile-header">
        {student.photo ? (
          <div className="profile-photo">
            <img src={student.photo} alt={`${student.firstname} ${student.lastname}`} />
          </div>
        ) : (
          <div className="profile-avatar">
            {student.gender === 'female' ? '👩' : student.gender === 'male' ? '👨' : '👤'}
          </div>
        )}
        <div className="profile-info">
          <h1>{student.firstname} {student.lastname}</h1>
          <div className="profile-meta">
            <span className="student-id">ID: {student.id}</span>
            <span className="student-email"><Mail size={14} /> {student.email}</span>
            <span className="status-badge" style={{ backgroundColor: getStatusColor(status) }}>
              {status.toUpperCase()}
              {daysRemaining !== null && daysRemaining <= 7 && (
                <span className="days-count"> ({daysRemaining} days left)</span>
              )}
            </span>
            <span className={`plan-badge plan-${student.plan?.toLowerCase() || 'default'}`}>
              {student.plan?.toUpperCase() || 'N/A'}
            </span>
            {displayCourseKeys.map(key => (
              <span key={key} className="course-pill">
                <GraduationCap size={12} /> {key}
              </span>
            ))}
          </div>
          {(student.city || student.state) && (
            <div className="location-info">
              <MapPin size={14} />
              {student.city && <span>{student.city}</span>}
              {student.city && student.state && <span>, </span>}
              {student.state && <span>{student.state}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="details-grid">
        <div className="details-card">
          <div className="card-header"><User size={20} /><h3>Personal Information</h3></div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Full Name:</span>
              <span className="info-value">{student.firstname} {student.lastname}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value"><Mail size={16} /> {student.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span className="info-value"><Phone size={16} /> {student.mobile || student.phone || 'Not provided'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Date of Birth:</span>
              <span className="info-value"><Calendar size={16} /> {formatDate(student.dob)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Gender:</span>
              <span className="info-value">{student.gender || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">City:</span>
              <span className="info-value">{student.city || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">State:</span>
              <span className="info-value">{student.state || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Password:</span>
              <span className="info-value password-masked">
                {student.password ? '••••••••' : 'Not set'}
              </span>
            </div>
          </div>
        </div>

        {renderCourseCards()}



        <div className="details-card">
          <div className="card-header"><Calendar size={20} /><h3>Subscription Details</h3></div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Plan:</span>
              <span className="info-value plan-highlight" style={{ color: getPlanColor(student.plan) }}>
                {student.plan?.toUpperCase() || 'Not specified'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Start Date:</span>
              <span className="info-value"><Clock size={16} /> {formatDate(student.startDate)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">End Date:</span>
              <span className="info-value"><Clock size={16} /> {formatDate(student.endDate)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Days Remaining:</span>
              <span className={`info-value highlight ${daysRemaining <= 7 ? 'warning' : ''} ${daysRemaining === 0 ? 'expired' : ''}`}>
                {daysRemaining !== null ? daysRemaining : 'N/A'}
                {daysRemaining > 0 && ' days'}
                {daysRemaining === 0 && ' (Expired)'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value status-text" style={{ color: getStatusColor(status) }}>
                {status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="details-card">
          <div className="card-header"><CreditCard size={20} /><h3>Payment Information</h3></div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Payment Method:</span>
              <span className="info-value">{student.paymentMethod || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Amount Paid:</span>
              <span className="info-value amount-paid">₹{student.amountPaid || '0'}</span>
            </div>
            {student.discountAmount && student.discountAmount !== '0' && (
              <div className="info-row">
                <span className="info-label">Discount Amount:</span>
                <span className="info-value discount-amount">₹{student.discountAmount}</span>
              </div>
            )}
            {student.discountPercentage && student.discountPercentage !== '0' && (
              <div className="info-row">
                <span className="info-label">Discount %:</span>
                <span className="info-value discount-percent">
                  <Percent size={16} /> {student.discountPercentage}%
                </span>
              </div>
            )}
            {student.couponUsed && student.couponUsed !== 'NONE' && (
              <div className="info-row">
                <span className="info-label">Coupon:</span>
                <span className="info-value coupon-info"><Tag size={16} /> {student.couponUsed}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Payment ID:</span>
              <span className="info-value code">{student.paymentId || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Payer ID:</span>
              <span className="info-value code">{student.payerId || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total Payments:</span>
              <span className="info-value highlight">{student.paymentHistory?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="details-card">
          <div className="card-header"><BarChart size={20} /><h3>Study Preferences</h3></div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Daily Hours:</span>
              <span className="info-value highlight">
                <Clock size={16} /> {student.comfortableDailyHours || 3} hours
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Proficiency:</span>
              <span className="info-value severity-level">
                {student.severity || 'Not specified'}
                {student.severity && (
                  <span className="severity-indicator" style={{
                    backgroundColor:
                      student.severity.includes('Expert') ? '#2196F3' :
                        student.severity.includes('Proficient') ? '#4CAF50' :
                          student.severity.includes('Competent') ? '#8BC34A' : '#FF9800'
                  }}></span>
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Enrolled Courses:</span>
              <span className="info-value">
                <div className="tag-list">
                  {displayCourseKeys.map(k => (
                    <span key={k} className="course-tag">{k}</span>
                  ))}
                </div>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">All Standards:</span>
              <span className="info-value">
                <Layers size={16} /> {student.selectedStandard?.join(', ') || 'N/A'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Learning Mode:</span>
              <span className="info-value">
                <Shield size={16} /> {getCourseMode(student.coursetype)}
              </span>
            </div>
          </div>
        </div>

        <div className="details-card">
          <div className="card-header"><FileText size={20} /><h3>System Information</h3></div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Student ID:</span>
              <span className="info-value student-id-display">{student.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">DB coursetype:</span>
              <span className="info-value code">{student.coursetype || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">DB courseName:</span>
              <span className="info-value code">{student.courseName || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">DB Class:</span>
              <span className="info-value class-name">{student._class || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Photo:</span>
              <span className="info-value">
                {student.photo ? (
                  <><CheckCircle size={16} color="#4CAF50" /> Yes
                    <button className="view-photo-btn" onClick={() => window.open(student.photo, '_blank')}>
                      View
                    </button>
                  </>
                ) : (
                  <><XCircle size={16} color="#f44336" /> No</>
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Account:</span>
              <span className="info-value">
                {student._class
                  ? <span className="active-status"><CheckCircle size={16} color="#4CAF50" /> Registered</span>
                  : <span className="inactive-status"><AlertCircle size={16} color="#FF9800" /> Not Registered</span>
                }
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Profile:</span>
              <div style={{ flex: 1 }}>
                <div className="completeness-bar">
                  <div className="completeness-fill" style={{
                    width: student.photo && student.dob && student.gender ? '100%' :
                      student.dob && student.gender ? '75%' :
                        student.dob || student.gender ? '50%' : '25%'
                  }}></div>
                </div>
                <span className="completeness-text">
                  {student.photo && student.dob && student.gender ? 'Complete' :
                    student.dob && student.gender ? 'Mostly Complete' :
                      student.dob || student.gender ? 'Partial' : 'Basic'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="details-card full-width">
          <div className="card-header">
            <LogIn size={20} />
            <h3>Study Sessions & Activity</h3>
            <div className="session-stats">
              <div className="stat-item">
                <Timer size={14} />
                <span>Total: {formatDuration(sessionStats.totalMinutes)}</span>
              </div>
              <div className="stat-item">
                <span>Sessions: {sessionStats.totalSessions}</span>
              </div>
              <div className="stat-item">
                <span>Avg: {formatDuration(sessionStats.avgDuration)}</span>
              </div>
            </div>
          </div>
          <div className="card-content">
            {renderStudySessions()}
          </div>
        </div>

        {/* Student Progress Card */}
        <div className="details-card full-width">
          <div className="card-header">
            <BarChart size={20} />
            <h3>📊 Learning Progress</h3>
          </div>
          <div className="card-content">
            {renderProgress()}
          </div>
        </div>
        <div className="details-card full-width">
          <div className="card-header">
            <CreditCard size={20} />
            <h3>Payment History ({student.paymentHistory?.length || 0})</h3>
          </div>
          <div className="card-content">
            {renderPaymentHistory()}
          </div>
        </div>

        <div className="details-card full-width">
          <div className="card-header"><Target size={20} /><h3>Enrolled Course Summary</h3></div>
          <div className="card-content">
            {displayCourseKeys.length > 0 ? (
              <div className="course-details-grid">
                {displayCourseKeys.map(courseKey => (
                  <div key={courseKey} className="course-summary-block">
                    <div className="course-summary-title">
                      <GraduationCap size={16} /> {courseKey}
                      <span className={`course-mode-tag ${getCourseMode(courseKey).toLowerCase()}`}>
                        {getCourseMode(courseKey)}
                      </span>
                    </div>
                    <div className="course-detail-item">
                      <span className="detail-label">Standards:</span>
                      <span className="detail-value">
                        {(selectedCourseObj[courseKey] || []).join(', ') || 'N/A'}
                      </span>
                    </div>
                    <div className="course-detail-item">
                      <span className="detail-label">Subjects:</span>
                      <span className="detail-value">
                        {COURSE_CONFIG[courseKey]?.subjects.join(', ') || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="course-detail-item full-width" style={{ marginTop: 16 }}>
                  <span className="detail-label">Raw DB values:</span>
                  <pre className="course-json">
                    {`coursetype    : "${student.coursetype}"
                    courseName    : "${student.courseName}"
                    selectedCourse: ${JSON.stringify(selectedCourseObj, null, 2)}`}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="no-payments">No course data available</div>
            )}
          </div>
        </div>
      </div>
      {/* Analysis Modal */}
      {showAnalysisModal && analysisData && (
        <div className="modal-overlay" onClick={() => setShowAnalysisModal(false)}>
          <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Assessment History Analysis</h3>
              <button className="modal-close" onClick={() => setShowAnalysisModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Overall Stats */}
              {analysisData.overallStats && (
                <div className="overall-stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{analysisData.overallStats.totalAssessments}</div>
                    <div className="stat-label">Total Assessments</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{analysisData.overallStats.totalQuestions}</div>
                    <div className="stat-label">Questions Attempted</div>
                  </div>
                  <div className="stat-card correct">
                    <div className="stat-value">{analysisData.overallStats.totalCorrect}</div>
                    <div className="stat-label">Correct</div>
                  </div>
                  <div className="stat-card wrong">
                    <div className="stat-value">{analysisData.overallStats.totalWrong}</div>
                    <div className="stat-label">Wrong</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{analysisData.overallStats.overallPercentage}%</div>
                    <div className="stat-label">Overall Accuracy</div>
                  </div>
                </div>
              )}

              {/* Strong Topics */}
              {analysisData.strongTopics && analysisData.strongTopics.length > 0 && (
                <div className="analysis-section">
                  <h4>🏆 Strong Topics (≥70% score)</h4>
                  <div className="topics-grid">
                    {analysisData.strongTopics.map((topic, idx) => (
                      <div key={idx} className="topic-card strong">
                        <div className="topic-name">{topic.name}</div>
                        <div className="topic-stats">
                          <span className="subject-badge">{topic.subject}</span>
                          <span className="percentage-badge">{Math.round(topic.avgPercentage)}%</span>
                        </div>
                        <div className="topic-detail">Best: {Math.round(topic.bestPercentage)}% • {topic.totalAttempts} attempt(s)</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weak Topics */}
              {analysisData.weakTopics && analysisData.weakTopics.length > 0 && (
                <div className="analysis-section">
                  <h4>⚠️ Topics Needing Improvement (≤40% score)</h4>
                  <div className="topics-grid">
                    {analysisData.weakTopics.map((topic, idx) => (
                      <div key={idx} className="topic-card weak">
                        <div className="topic-name">{topic.name}</div>
                        <div className="topic-stats">
                          <span className="subject-badge">{topic.subject}</span>
                          <span className="percentage-badge">{Math.round(topic.avgPercentage)}%</span>
                        </div>
                        <div className="topic-detail">Best: {Math.round(topic.bestPercentage)}% • {topic.totalAttempts} attempt(s)</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject Performance */}
              {analysisData.subjectPerformance && (
                <div className="analysis-section">
                  <h4>📚 Subject-wise Performance</h4>
                  <div className="subject-performance-grid">
                    {Object.entries(analysisData.subjectPerformance).map(([subject, stats]) => {
                      const percentage = stats.totalQuestions > 0 ? (stats.totalCorrect * 100 / stats.totalQuestions) : 0;
                      return (
                        <div key={subject} className="subject-perf-card">
                          <div className="subject-name">{subject}</div>
                          <div className="subject-stats">
                            <div className="stat-row">
                              <span>✅ Correct:</span>
                              <strong>{stats.totalCorrect}</strong>
                            </div>
                            <div className="stat-row">
                              <span>❌ Wrong:</span>
                              <strong>{stats.totalWrong}</strong>
                            </div>
                            <div className="stat-row">
                              <span>⏭️ Skipped:</span>
                              <strong>{stats.totalSkipped}</strong>
                            </div>
                            <div className="stat-row accuracy">
                              <span>📊 Accuracy:</span>
                              <strong style={{ color: percentage >= 70 ? '#4CAF50' : percentage >= 40 ? '#FF9800' : '#f44336' }}>
                                {Math.round(percentage)}%
                              </strong>
                            </div>
                          </div>
                          <div className="assessment-count">{stats.assessmentCount} assessment(s)</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Assessments List */}
              {analysisData.assessments && analysisData.assessments.length > 0 && (
                <div className="analysis-section">
                  <h4>📋 Recent Assessments</h4>
                  <div className="assessments-list">
                    {analysisData.assessments.slice(0, 10).map((assessment, idx) => (
                      <div
                        key={idx}
                        className={`assessment-list-item ${assessment.status === 'Passed' ? 'passed' : 'failed'}`}
                        onClick={() => setSelectedAssessmentDetail(assessment)}
                      >
                        <div className="assessment-info">
                          <div className="assessment-topic">{assessment.topicName}</div>
                          <div className="assessment-meta">
                            <span className="subject-tag">{assessment.subject}</span>
                            <span className="type-tag">{assessment.testType}</span>
                          </div>
                        </div>
                        <div className="assessment-score">
                          <span className="score">{assessment.scoreScored}/{assessment.totalMarks}</span>
                          <span className={`status-badge ${assessment.status === 'Passed' ? 'passed' : 'failed'}`}>
                            {assessment.status}
                          </span>
                        </div>
                        <div className="assessment-date">{new Date(assessment.timestamp).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="close-modal-btn" onClick={() => setShowAnalysisModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {/* Analysis Modal */}
      {/* Analysis Modal with Tabs */}
      {showAnalysisModal && (
        <div className="modal-overlay" onClick={() => setShowAnalysisModal(false)}>
          <div className="analysis-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Assessment History Analysis - {student.firstname} {student.lastname}</h3>
              <button className="modal-close" onClick={() => setShowAnalysisModal(false)}>×</button>
            </div>

            {/* Tab Navigation */}
            <div className="analysis-tabs">
              <button
                className={`tab-btn ${analysisActiveTab === 'all' ? 'active' : ''}`}
                onClick={() => setAnalysisActiveTab('all')}
              >
                📋 All Tests ({analysisData?.assessments?.length || 0})
              </button>
              <button
                className={`tab-btn ${analysisActiveTab === 'mock' ? 'active' : ''}`}
                onClick={() => setAnalysisActiveTab('mock')}
              >
                🎯 Mock Tests ({analysisData?.assessments?.filter(a => a.testType === 'Mock' || a.testType === 'Full Mock' || a.topicName?.toLowerCase().includes('mock')).length || 0})
              </button>
              <button
                className={`tab-btn ${analysisActiveTab === 'assessment' ? 'active' : ''}`}
                onClick={() => setAnalysisActiveTab('assessment')}
              >
                📝 Assessments ({analysisData?.assessments?.filter(a => a.testType === 'Assessment' || a.testType === 'Lesson' || a.topicName?.toLowerCase().includes('assessment')).length || 0})
              </button>
              <button
                className={`tab-btn ${analysisActiveTab === 'practice' ? 'active' : ''}`}
                onClick={() => setAnalysisActiveTab('practice')}
              >
                ✏️ Practice Sessions ({analysisData?.assessments?.filter(a => a.testType === 'Practice Session' || a.topicName?.toLowerCase().includes('practice')).length || 0})
              </button>
              <button
                className={`tab-btn ${analysisActiveTab === 'formula' ? 'active' : ''}`}
                onClick={() => setAnalysisActiveTab('formula')}
              >
                🧪 Formula Tests ({analysisData?.assessments?.filter(a => a.testType === 'Formula Practice' || a.topicName?.toLowerCase().includes('formula')).length || 0})
              </button>
            </div>

            <div className="modal-body">
              {loadingAnalysis ? (
                <div className="perf-loading">Loading assessment data...</div>
              ) : !analysisData || !analysisData.hasData ? (
                <div className="no-data-message">
                  <AlertCircle size={48} />
                  <p>No assessment data found for this student</p>
                  <p className="sub-message">The student hasn't completed any assessments yet.</p>
                </div>
              ) : (
                <>
                  {/* Overall Stats Cards */}
                  {analysisData.overallStats && analysisData.overallStats.totalAssessments > 0 && (
                    <div className="analysis-overall-stats">
                      <div className="stat-card"><div className="stat-value">{analysisData.overallStats.totalAssessments}</div><div className="stat-label">Total Tests</div></div>
                      <div className="stat-card"><div className="stat-value">{analysisData.overallStats.totalQuestions}</div><div className="stat-label">Questions</div></div>
                      <div className="stat-card correct"><div className="stat-value">{analysisData.overallStats.totalCorrect}</div><div className="stat-label">Correct</div></div>
                      <div className="stat-card wrong"><div className="stat-value">{analysisData.overallStats.totalWrong}</div><div className="stat-label">Wrong</div></div>
                      <div className="stat-card"><div className="stat-value">{analysisData.overallStats.overallPercentage}%</div><div className="stat-label">Accuracy</div></div>
                    </div>
                  )}

                  {/* Filtered Assessments based on active tab */}
                  {(() => {
                    let filteredAssessments = analysisData.assessments || [];

                    if (analysisActiveTab === 'mock') {
                      filteredAssessments = filteredAssessments.filter(a =>
                        a.testType === 'Mock' ||
                        a.testType === 'Full Mock' ||
                        a.testType === 'Subject Mock' ||
                        a.topicName?.toLowerCase().includes('mock')
                      );
                    } else if (analysisActiveTab === 'assessment') {
                      filteredAssessments = filteredAssessments.filter(a =>
                        a.testType === 'Assessment' ||
                        a.testType === 'Lesson' ||
                        a.topicName?.toLowerCase().includes('assessment') ||
                        a.topicName?.toLowerCase().includes('section')
                      );
                    } else if (analysisActiveTab === 'practice') {
                      filteredAssessments = filteredAssessments.filter(a =>
                        a.testType === 'Practice Session' ||
                        a.topicName?.toLowerCase().includes('practice')
                      );
                    } else if (analysisActiveTab === 'formula') {
                      filteredAssessments = filteredAssessments.filter(a =>
                        a.testType === 'Formula Practice' ||
                        a.testType === 'Formula Assessment' ||
                        a.topicName?.toLowerCase().includes('formula')
                      );
                    }

                    return filteredAssessments.length === 0 ? (
                      <div className="no-data-message">
                        <p>No {analysisActiveTab} tests found for this student</p>
                      </div>
                    ) : (
                      <>
                        {/* Tab Summary */}
                        <div className="tab-summary">
                          <span className="tab-count">{filteredAssessments.length} tests</span>
                          <span className="tab-avg-score">
                            Avg Score: {Math.round(filteredAssessments.reduce((sum, a) => sum + ((a.scoreScored / a.totalMarks) * 100), 0) / filteredAssessments.length)}%
                          </span>
                        </div>

                        {/* Main Assessment Table */}
                        <div className="analysis-table-wrapper">
                          <table className="analysis-history-table">
                            <thead>
                              <tr>
                                <th className="col-expand"></th>
                                <th>Date & Time</th>
                                <th>Subject</th>
                                <th>Topic</th>
                                <th>Score</th>
                                <th>Percentage</th>
                                <th>Correct</th>
                                <th>Wrong</th>
                                <th>Skipped</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAssessments.map((assessment, idx) => {
                                const isPassed = assessment.status === 'Passed';
                                const isExpanded = expandedRows[`${analysisActiveTab}-${idx}`];
                                const percentage = calculatePercentage(assessment.scoreScored, assessment.totalMarks);
                                return (
                                  <React.Fragment key={idx}>
                                    <tr onClick={() => toggleRowExpand(`${analysisActiveTab}-${idx}`)} className={isExpanded ? 'expanded-row-active' : ''}>
                                      <td className="expand-cell"><span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>{isExpanded ? '▼' : '▶'}</span></td>
                                      <td>{assessment.timestamp ? new Date(assessment.timestamp).toLocaleString() : 'N/A'}</td>
                                      <td><span className="perf-subj-badge">{assessment.subject}</span></td>
                                      <td className="db-topic-cell">{assessment.topicName}</td>
                                      <td className="score-cell"><strong>{assessment.scoreScored}</strong>/{assessment.totalMarks}</td>
                                      <td className="percentage-cell"><strong>{percentage}</strong></td>
                                      <td className="correct-text">{assessment.correctCount}</td>
                                      <td className="wrong-text">{assessment.wrongCount}</td>
                                      <td className="skipped-text">{assessment.unattendedCount}</td>
                                      <td><span className={`perf-status-pill ${isPassed ? 'passed' : 'failed'}`}>{assessment.status}</span></td>
                                    </tr>
                                    {isExpanded && (
                                      <tr className="expanded-details-row">
                                        <td colSpan="10" className="expanded-details-cell">
                                          {renderUnitBreakdownTable(assessment, `${analysisActiveTab}-${idx}`)}
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}

                  {/* Strong Topics Section - Only show on All tab */}
                  {analysisActiveTab === 'all' && analysisData.strongTopics && analysisData.strongTopics.length > 0 && (
                    <div className="analysis-strong-topics">
                      <h4>🏆 Strong Topics (≥70% score)</h4>
                      <div className="topics-tags">
                        {analysisData.strongTopics.map((topic, idx) => (
                          <span key={idx} className="strong-topic-tag">{topic.name} ({Math.round(topic.avgPercentage)}%)</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weak Topics Section - Only show on All tab */}
                  {analysisActiveTab === 'all' && analysisData.weakTopics && analysisData.weakTopics.length > 0 && (
                    <div className="analysis-weak-topics">
                      <h4>⚠️ Topics Needing Improvement (≤40% score)</h4>
                      <div className="topics-tags">
                        {analysisData.weakTopics.map((topic, idx) => (
                          <span key={idx} className="weak-topic-tag">{topic.name} ({Math.round(topic.avgPercentage)}%)</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="close-modal-btn" onClick={() => setShowAnalysisModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;