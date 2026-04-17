import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiUpload, FiEdit3, FiCheckCircle, FiFileText, FiArrowLeft } from 'react-icons/fi';
import './BoardExam.css';
import { API_BASE_URL } from '../config';

const BoardExam = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize state with location data or defaults
  const [subjectName, setSubjectName] = useState(location.state?.subjectName || '');
  const [standard, setStandard] = useState(location.state?.standard || '');

  const [activeTab, setActiveTab] = useState('creation');
  const [testTitle, setTestTitle] = useState('');
  const [manualQuestions, setManualQuestions] = useState('');
  const [file, setFile] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  // Correction Modal State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [marks, setMarks] = useState('');
  const [remarks, setRemarks] = useState('');

  // Canvas Drawing State
  const [isPenMode, setIsPenMode] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
    ctx.strokeStyle = '#d32f2f'; // Red pen color
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Fetch data on mount
  useEffect(() => {
    fetchRecentTests();
    fetchSubmissions();
  }, []);

  const fetchRecentTests = async () => {
    try {
      // Changed to /all to show all subjects (Physics, Chemistry, etc.)
      const res = await fetch(`${API_BASE_URL}/tests/all`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        // Sort by date if available (newest first)
        const sortedData = Array.isArray(data) 
          ? data.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0))
          : [];
        setRecentTests(sortedData);
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
      const res = await fetch(`${API_BASE_URL}/test-submissions/all`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setSubmissions([]);
    }
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
      const res = await fetch(`${API_BASE_URL}/test-submissions/evaluate/${sId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ marks, remarks })
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
      alert("Error saving evaluation.");
    }
  };

  const handleSubmitTest = async () => {
    // Validation: Prevent sending empty fields that might crash the backend
    if (!subjectName || !standard || !testTitle) {
      alert("Please select a Subject, Class, and enter a Test Title.");
      return;
    }

    const formData = new FormData();
    formData.append('title', testTitle);
    formData.append('content', manualQuestions);
    formData.append('subject', subjectName);
    formData.append('standard', standard);
    
    // Only append the file if the user selected one
    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tests/create`, {
        method: 'POST',
        credentials: 'include',
        // Note: We do NOT set headers manually for FormData. 
        // The browser sets the boundary automatically.
        body: formData,
      });

      if (response.ok) {
        alert('Test Paper Submitted Successfully!');
        // Reset local form states
        setTestTitle('');
        setManualQuestions('');
        setFile(null);
        fetchRecentTests();
      } else {
        // Try to get detailed error message from server
        const errorText = await response.text();
        console.error('❌ Server Error Details:', errorText);
        alert(`Submit failed: ${response.status}. Check backend logs.`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('Error: Network issue or Server is unreachable.');
    }
  };

  return (
    <div className="board-exam-container">
      <aside className="exam-sidebar">
        <div className="sidebar-header">
          <h3>Board Exam</h3>
          <p>{subjectName ? `${subjectName} - Class ${standard}` : 'Select Subject & Class'}</p>
        </div>
        <nav>
          <button 
            className={activeTab === 'creation' ? 'active' : ''} 
            onClick={() => setActiveTab('creation')}
          >
            <FiEdit3 /> Test Creation
          </button>
          <button 
            className={activeTab === 'correction' ? 'active' : ''} 
            onClick={() => setActiveTab('correction')}
          >
            <FiCheckCircle /> Test Correction
          </button>
        </nav>
        <button className="back-btn" onClick={() => navigate('/adminhome')}>
          <FiArrowLeft /> Back to Home
        </button>
      </aside>

      <main className="exam-content">
        {activeTab === 'creation' ? (
          <div className="fade-in">
            <h2 className="section-title">Create Question Paper</h2>
            <div className="creation-layout">
              <div className="form-card">
                {/* Manual Subject/Class selection if not passed via state */}
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
                        {['6','7','8','9','10','11','12'].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
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
                    <FiUpload /> {file ? file.name : "Upload Question Image/PDF"}
                    <input 
                      type="file" 
                      onChange={(e) => setFile(e.target.files[0])} 
                      hidden 
                    />
                  </label>
                </div>
                
                <button className="main-submit-btn" onClick={handleSubmitTest}>
                  Submit Question Paper
                </button>
              </div>

              <div className="recent-card">
                <h3>Recently Submitted</h3>
                <div className="test-list">
                  {recentTests.length > 0 ? (
                    recentTests.map((test, index) => (
                      <div key={test.id || index} className="test-item">
                        <FiFileText className="item-icon" />
                        <div>
                          <p className="item-title">{test.title}</p>
                          <div className="item-meta">
                            <span className="item-subject">{test.subject}</span>
                            <span className="item-standard">Class {test.standard}</span>
                            <span className="item-date">
                              {test.createdAt ? new Date(test.createdAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
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
        ) : (
          <div className="fade-in">
            <h2 className="section-title">Student Submissions (Correction)</h2>
            <div className="submission-grid">
              {submissions.length > 0 ? submissions.map((sub) => (
                <div key={sub.id || sub._id} className="submission-card">
                  <div className="sub-info">
                    <strong>{sub.studentName}</strong>
                    <span>Status: <em className={sub.status === 'Evaluated' || sub.status === 'Checked' ? 'completed' : 'pending'}>{sub.status}</em></span>
                    {sub.marks && <span style={{display: 'block', marginTop: '5px', fontSize: '14px', color: '#005f4b'}}>Marks: {sub.marks}</span>}
                  </div>
                  <button className="correct-btn" onClick={() => handleOpenCorrection(sub)}>
                    {sub.status === 'Evaluated' || sub.status === 'Checked' ? 'View/Edit Correction' : 'Open & Correct (Manual Pen)'}
                  </button>
                </div>
              )) : (
                <p style={{ color: '#888', fontStyle: 'italic' }}>No submissions found for correction.</p>
              )}
            </div>

            {/* Correction Modal */}
            {selectedSubmission && (
              <div className="modal-overlay">
                <div className="correction-modal">
                  <h3>Evaluate: {selectedSubmission.studentName}'s Test</h3>
                  
                  <div className="answer-content-box">
                    <p><strong>Answer Content:</strong></p>
                    <div className="answer-text">
                      {selectedSubmission.studentAnswerContent || 'No text answer provided.'}
                    </div>
                  </div>

                  {selectedSubmission.answerFilePath && (
                    <div className="answer-file-box">
                      <p><strong>Attached File:</strong></p>
                      {selectedSubmission.answerFilePath.toLowerCase().endsWith('.pdf') ? (
                        <iframe 
                          src={`${API_BASE_URL.replace('/api', '')}/uploads/tests/${selectedSubmission.answerFilePath}`} 
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
                            <img 
                              src={`${API_BASE_URL.replace('/api', '')}/uploads/tests/${selectedSubmission.answerFilePath}`} 
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
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.alt = "Image file not found on the server's uploads folder";
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
                                pointerEvents: isPenMode ? 'auto' : 'none'
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
        )}
      </main>
    </div>
  );
};

export default BoardExam;