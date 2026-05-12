import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    UserCheck, BookOpen, Users, CheckCircle, Clock,
    Filter, Loader2, Calendar, Trash2, ShieldCheck,
    Layers, Monitor, AlertCircle, Edit, XCircle, ExternalLink, CalendarDays, Link as LinkIcon
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AssignClass = ({ teachers = [], students = [], hideTeacherSelect = false }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [allClassesForValidation, setAllClassesForValidation] = useState([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
            setCurrentUser(user);
            if (user.role === 'teacher') {
                setAssignment(prev => ({ ...prev, teacherId: user.id }));
            }
        }
    }, []);

    const [assignment, setAssignment] = useState({
        batchName: '',
        subject: '',
        standard: '',
        teacherId: '',
        assistantTeacherId: '',
        selectedDates: [],
        days: [],
        startTime: '',
        endTime: '',
        mode: 'online',
        meetLink: '',
        status: 'Active',
        selectedStudents: [],
    });

    const [studentFilter, setStudentFilter] = useState('all');

    const fetchAssignedClasses = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/getAssignedClasses`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            const allAssigned = Array.isArray(data) ? data : [];
            setAllClassesForValidation(allAssigned);

            const user = JSON.parse(localStorage.getItem('currentUser'));
            if (user && user.role === 'teacher') {
                setAssignedClasses(allAssigned.filter(cls => String(cls.teacherId) === String(user.id)));
            } else {
                setAssignedClasses(allAssigned);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setIsLoadingClasses(false);
        }
    }, []);

    useEffect(() => {
        fetchAssignedClasses();
    }, [fetchAssignedClasses]);

    const getTeacherName = (id) => {
        if (!id) return 'Not Assigned';
        const teacher = teachers.find(t => String(t.id || t._id) === String(id));
        if (!teacher && /[a-zA-Z]/.test(id)) return id;
        return teacher ? teacher.name : 'Not Assigned';
    };

    const handleEditInitiate = (cls) => {
        setEditingId(cls.id || cls._id);
        setAssignment({
            batchName: cls.batchName || '',
            subject: cls.subject || '',
            standard: cls.standard || '',
            teacherId: cls.teacherId || '',
            assistantTeacherId: cls.assistantTeacherId || '',
            selectedDates: cls.selectedDates || [],
            days: cls.days || [],
            startTime: cls.startTime || '',
            endTime: cls.endTime || '',
            mode: cls.mode || 'online',
            meetLink: cls.meetLink || '',
            status: cls.status || 'Active',
            selectedStudents: cls.selectedStudents || [],
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setAssignment({
            batchName: '', subject: '', standard: '', teacherId: '', assistantTeacherId: '',
            selectedDates: [], days: [], startTime: '', endTime: '', mode: 'online', meetLink: '', status: 'Active', selectedStudents: []
        });
    };

    const filteredStudents = useMemo(() => {
        if (studentFilter === 'all') return students;
        return students.filter(s => s.coursetype?.toLowerCase() === studentFilter.toLowerCase());
    }, [students, studentFilter]);

    const handleStudentToggle = (studentId) => {
        setAssignment(prev => ({
            ...prev,
            selectedStudents: prev.selectedStudents.includes(studentId)
                ? prev.selectedStudents.filter(id => id !== studentId)
                : [...prev.selectedStudents, studentId]
        }));
    };

    const toggleDay = (day) => {
        setAssignment(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
    };

    const convertTo12Hour = (time24) => {
        if (!time24) return "";
        if (time24.includes('AM') || time24.includes('PM')) return time24;
        let [hours, minutes] = time24.split(':');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation for duplicate batchName + subject (ignoring spaces, hyphens and case)
        const normalize = (str) => str ? str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
        const isDuplicate = allClassesForValidation.some(cls => 
            normalize(cls.batchName) === normalize(assignment.batchName) && 
            normalize(cls.subject) === normalize(assignment.subject) &&
            (editingId ? (cls.id || cls._id) !== editingId : true)
        );

        if (isDuplicate) {
            return alert("Error: A batch with this name and subject already exists (check for similar names like 'Batch-1' or 'Batch 1')!");
        }

        if (!assignment.batchName || !assignment.subject || !assignment.standard || !assignment.teacherId || assignment.days.length === 0) {
            return alert("Error: Please fill all basic info, teacher assignment, and schedule days.");
        }

        setIsSubmitting(true);
        const finalAssignment = {
            ...assignment,
            startTime: convertTo12Hour(assignment.startTime),
            endTime: convertTo12Hour(assignment.endTime)
        };

        if (editingId) finalAssignment.id = editingId;

        try {
            const response = await fetch(`${API_BASE_URL}/assignClass`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalAssignment),
            });
            const data = await response.json();
            if (response.ok && data.status === 'pass') {
                alert(editingId ? "Batch Updated Successfully! ✨" : "Batch Created Successfully! 🔥");
                resetForm();
                fetchAssignedClasses();
            } else if (data.message === 'already exist') {
                alert("Error: This batch name with the same subject already exists!");
            } else {
                alert("Error: " + (data.message || "Failed to process batch"));
            }
        } catch (error) {
            alert("Network Error: Could not reach the server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm("Action Required: Delete this batch permanently?")) return;
        try {
            const response = await fetch(`${API_BASE_URL}/deleteAssignedClass/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                fetchAssignedClasses();
            }
        } catch (error) {
            alert("Delete operation failed.");
        }
    };

    const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const SUBJECT_OPTIONS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'Science', 'English', 'History', 'Geography'];
    const STANDARD_OPTIONS = ['6', '7', '8', '9', '10', '11', '12', 'Dropper'];

    return (
        <div className="manage-container" style={{ padding: '0 20px', minHeight: '100vh' }}>
            <div className="section-header" style={{ marginBottom: '30px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', color: '#1a1a1a' }}>
                    <ShieldCheck size={28} color={editingId ? "#FF9800" : "#007bff"} />
                    {editingId ? "Modify Batch" : "Create Batch Section"}
                </h2>
                <p style={{ color: '#666', marginTop: '5px' }}>Configure new academic batches, assign faculty, and set schedules.</p>
            </div>

            <form className="user-form" style={{ maxWidth: '100%', marginBottom: '50px' }} onSubmit={handleSubmit}>
                <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
                    
                    {/* BATCH CONFIGURATION CARD */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        
                        {/* 1. Basic Info */}
                        <div className="form-card" style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: editingId ? '2px solid #FF9800' : '1px solid #eaeaea' }}>
                            <h3 style={{ borderBottom: '1.5px solid #f0f0f0', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: '#333' }}>
                                <BookOpen size={20} color="#007bff" /> Basic Info
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Batch Name <span style={{color: 'red'}}>*</span></label>
                                    <input type="text" placeholder="e.g. Target JEE 2025" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.batchName} onChange={(e) => setAssignment({ ...assignment, batchName: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Subject <span style={{color: 'red'}}>*</span></label>
                                        <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.subject} onChange={(e) => setAssignment({ ...assignment, subject: e.target.value })} required>
                                            <option value="">Select Subject</option>
                                            {SUBJECT_OPTIONS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Class/Standard <span style={{color: 'red'}}>*</span></label>
                                        <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.standard} onChange={(e) => setAssignment({ ...assignment, standard: e.target.value })} required>
                                            <option value="">Select Class</option>
                                            {STANDARD_OPTIONS.map(std => <option key={std} value={std}>{std}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Teacher Assignment */}
                        <div className="form-card" style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #eaeaea' }}>
                            <h3 style={{ borderBottom: '1.5px solid #f0f0f0', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: '#333' }}>
                                <UserCheck size={20} color="#007bff" /> Teacher Assignment
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                {!hideTeacherSelect && (
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Select Teacher <span style={{color: 'red'}}>*</span></label>
                                        <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0', outline: 'none' }} value={assignment.teacherId} onChange={(e) => setAssignment({ ...assignment, teacherId: e.target.value })} disabled={currentUser?.role === 'teacher'} required>
                                            <option value="">Choose a Faculty Member</option>
                                            {teachers.map((t, index) => (
                                                <option key={t.id || t._id || `teacher-${index}`} value={t.id || t._id}>{t.userName || t.name} ({t.coursetype || 'Core'})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Add Assistant Teacher (Optional)</label>
                                    <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0', outline: 'none' }} value={assignment.assistantTeacherId} onChange={(e) => setAssignment({ ...assignment, assistantTeacherId: e.target.value })}>
                                        <option value="">None</option>
                                        {teachers.map((t, index) => (
                                            <option key={t.id || t._id || `asst-teacher-${index}`} value={t.id || t._id}>{t.userName || t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3. Schedule & Mode & Status */}
                        <div className="form-card" style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #eaeaea' }}>
                            <h3 style={{ borderBottom: '1.5px solid #f0f0f0', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', color: '#333' }}>
                                <CalendarDays size={20} color="#007bff" /> Schedule & Settings
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                                
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Select Class Dates</label>
                                    <input
                                        type="date"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }}
                                        onChange={(e) => {
                                            const date = e.target.value;
                                            if (date && !assignment.selectedDates.includes(date)) {
                                                setAssignment(prev => ({ ...prev, selectedDates: [...prev.selectedDates, date] }));
                                            }
                                        }}
                                    />
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {assignment.selectedDates.map(d => (
                                            <span key={d} style={{
                                                background: '#eef6ff', color: '#007bff', padding: '5px 10px',
                                                borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: '1px solid #007bff',
                                                display: 'flex', alignItems: 'center', gap: '6px'
                                            }}>
                                                {d}
                                                <XCircle
                                                    size={14}
                                                    onClick={() => setAssignment(prev => ({ ...prev, selectedDates: prev.selectedDates.filter(x => x !== d) }))}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Days <span style={{color: 'red'}}>*</span></label>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {DAYS_OF_WEEK.map(day => (
                                            <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: assignment.days.includes(day) ? '#eef6ff' : '#f5f5f5', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', border: assignment.days.includes(day) ? '1px solid #007bff' : '1px solid transparent' }}>
                                                <input type="checkbox" checked={assignment.days.includes(day)} onChange={() => toggleDay(day)} style={{display: 'none'}} />
                                                <span style={{ fontSize: '13px', fontWeight: '600', color: assignment.days.includes(day) ? '#007bff' : '#666' }}>{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Start Time</label>
                                        <input type="time" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.startTime} onChange={(e) => setAssignment({ ...assignment, startTime: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>End Time</label>
                                        <input type="time" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.endTime} onChange={(e) => setAssignment({ ...assignment, endTime: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Mode</label>
                                        <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '8px', padding: '4px' }}>
                                            <button type="button" onClick={() => setAssignment({...assignment, mode: 'online'})} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: assignment.mode === 'online' ? '#fff' : 'transparent', boxShadow: assignment.mode === 'online' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', fontWeight: '600', color: assignment.mode === 'online' ? '#007bff' : '#666', cursor: 'pointer' }}>Online</button>
                                            <button type="button" onClick={() => setAssignment({...assignment, mode: 'offline'})} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: assignment.mode === 'offline' ? '#fff' : 'transparent', boxShadow: assignment.mode === 'offline' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', fontWeight: '600', color: assignment.mode === 'offline' ? '#007bff' : '#666', cursor: 'pointer' }}>Offline</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Status</label>
                                        <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.status} onChange={(e) => setAssignment({ ...assignment, status: e.target.value })}>
                                            <option value="Active">Active</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                {assignment.mode === 'online' && (
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Google Meet Link</label>
                                        <div style={{ position: 'relative' }}>
                                            <LinkIcon size={16} color="#888" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                                            <input
                                                type="url"
                                                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }}
                                                value={assignment.meetLink}
                                                onChange={(e) => setAssignment({ ...assignment, meetLink: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* SELECTION CARD */}
                    <div className="form-card" style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #eaeaea', height: 'fit-content' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #f0f0f0', paddingBottom: '15px' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
                                <Users size={20} color="#007bff" /> Enrol Students ({assignment.selectedStudents.length})
                            </h3>
                        </div>
                        <div className="custom-scrollbar" style={{ maxHeight: '600px', overflowY: 'auto', marginTop: '20px' }}>
                            {filteredStudents.map((s, index) => (
                                <label key={s.id || s._id || `student-${index}`} style={{
                                    display: 'flex', alignItems: 'center', gap: '15px', padding: '12px',
                                    borderRadius: '10px', marginBottom: '8px', cursor: 'pointer',
                                    background: assignment.selectedStudents.includes(s.id || s._id) ? '#f0f7ff' : '#fcfcfc',
                                    border: '1px solid #eee'
                                }}>
                                    <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={assignment.selectedStudents.includes(s.id || s._id)} onChange={() => handleStudentToggle(s.id || s._id)} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '14px' }}>{s.userName || s.name}</div>
                                        <div style={{ fontSize: '11px', color: '#7f8c8d' }}>{s.coursetype?.toUpperCase()}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <button type="submit" className="create-teacher-btn" disabled={isSubmitting}
                        style={{ padding: '15px 60px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '12px', background: editingId ? '#FF9800' : '#007bff', cursor: 'pointer', border: 'none', color: '#fff' }}>
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                        {isSubmitting ? 'Processing...' : (editingId ? 'Update Batch' : '✅ Save Batch')}
                    </button>
                    {editingId ? (
                        <button type="button" onClick={resetForm} style={{ padding: '15px 30px', borderRadius: '12px', border: '1.5px solid #666', color: '#666', background: 'transparent', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <XCircle size={20} /> Cancel
                        </button>
                    ) : (
                        <button type="button" onClick={resetForm} style={{ padding: '15px 30px', borderRadius: '12px', border: '1.5px solid #dc3545', color: '#dc3545', background: 'transparent', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ❌ Cancel
                        </button>
                    )}
                </div>
            </form>

            <div className="section-header" style={{ marginTop: '80px', marginBottom: '25px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px' }}>
                    <Monitor size={22} color="#28a745" /> Active Academic Batches
                </h3>
            </div>

            <div className="student-table-container" style={{ background: '#fff', borderRadius: '16px', overflowX: 'auto', boxShadow: '0 4px 25px rgba(0,0,0,0.06)', marginBottom: '50px' }}>
                {isLoadingClasses ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#007bff' }}><Loader2 className="animate-spin" size={32} /></div>
                ) : (
                    <table className="student-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8f9fa' }}>
                            <tr>
                                <th style={{ padding: '18px', textAlign: 'left' }}>Batch Name</th>
                                <th style={{ textAlign: 'left' }}>Teacher</th>
                                <th style={{ textAlign: 'center' }}>Class</th>
                                <th style={{ textAlign: 'center' }}>Students Count</th>
                                <th style={{ textAlign: 'left' }}>Schedule</th>
                                <th style={{ textAlign: 'center' }}>Join Class</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignedClasses.length > 0 ? assignedClasses.map((cls, index) => (
                                <tr key={cls.id || cls._id || `class-${index}`} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                    <td style={{ padding: '18px' }}>
                                        <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>
                                            {cls.batchName || 'Unnamed Batch'}
                                        </div>
                                        {cls.subject && (
                                            <span style={{ fontSize: '10px', background: '#e9ecef', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#555' }}>
                                                {cls.subject}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ color: '#444', fontWeight: '500' }}>
                                        {getTeacherName(cls.teacherId)}
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#444' }}>
                                        {cls.standard || '-'}
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#007bff' }}>
                                        {cls.selectedStudents?.length || 0}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', color: '#444' }}>
                                            <Clock size={12} /> {cls.startTime || '-'} — {cls.endTime || '-'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#28a745', fontWeight: '600', marginBottom: '4px' }}>
                                            {cls.days?.length > 0 ? (
                                                cls.days.length === 7 ? 'Mon-Sun' :
                                                cls.days.length === 5 && !cls.days.includes('Sat') && !cls.days.includes('Sun') ? 'Mon-Fri' :
                                                cls.days.join(', ')
                                            ) : 'No days'}
                                        </div>
                                        {cls.selectedDates?.length > 0 && (
                                            <div style={{ fontSize: '10px', color: '#888' }}>
                                                {cls.selectedDates.join(' • ')}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {cls.mode === 'online' && cls.meetLink ? (
                                            <a href={cls.meetLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#007bff', fontWeight: '600', textDecoration: 'none', background: '#eef6ff', padding: '4px 10px', borderRadius: '6px' }} title="Join Google Meet">
                                                <LinkIcon size={14} /> Join
                                            </a>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#999' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ 
                                            fontSize: '11px', 
                                            background: cls.status === 'Active' ? '#d4edda' : '#f8d7da', 
                                            color: cls.status === 'Active' ? '#155724' : '#721c24', 
                                            padding: '4px 10px', 
                                            borderRadius: '20px', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {cls.status || 'Active'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button type="button" onClick={() => handleEditInitiate(cls)} style={{ background: '#fff3cd', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '14px' }} title="Edit Batch">
                                                ✏️
                                            </button>
                                            <button type="button" onClick={() => handleDeleteClass(cls.id || cls._id)} style={{ background: '#fff5f5', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '14px' }} title="Delete Batch">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '80px', color: '#adb5bd' }}>
                                        <Calendar size={48} style={{ opacity: 0.1, marginBottom: '15px' }} />
                                        <p style={{ fontSize: '16px' }}>No active batches found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AssignClass;