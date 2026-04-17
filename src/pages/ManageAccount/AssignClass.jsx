import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    UserCheck, BookOpen, Users, CheckCircle, Clock,
    Filter, Loader2, Calendar, Trash2, ShieldCheck,
    Layers, Monitor, AlertCircle, Edit, XCircle, ExternalLink
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AssignClass = ({ teachers = [], students = [] }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);

    const [editingId, setEditingId] = useState(null);

    const [assignment, setAssignment] = useState({
        teacherId: '',
        selectedStudents: [],
        subject: '', // Used instead of className
        batchType: 'regular',
        mode: 'online',
        startTime: '',
        endTime: '',
        selectedDates: [], 
        meetLink: '',
    });

    const [studentFilter, setStudentFilter] = useState('all');

    const fetchAssignedClasses = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/getAssignedClasses`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await response.json();
            setAssignedClasses(Array.isArray(data) ? data : []);
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

    const getStudentNames = (selectedIds) => {
        if (!selectedIds || selectedIds.length === 0) return "No Students";
        return selectedIds
            .map(id => {
                const student = students.find(s => String(s.id || s._id) === String(id));
                return student ? student.name : "Unknown";
            })
            .filter(name => name !== "Unknown")
            .join(", ");
    };

    const handleEditInitiate = (cls) => {
        setEditingId(cls.id || cls._id);
        setAssignment({
            teacherId: cls.teacherId || '',
            selectedStudents: cls.selectedStudents || [],
            subject: cls.subject || '',
            batchType: cls.batchType || 'regular',
            mode: cls.mode || 'online',
            startTime: cls.startTime || '',
            endTime: cls.endTime || '',
            selectedDates: cls.selectedDates || [],
            meetLink: cls.meetLink || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setAssignment({
            teacherId: '', selectedStudents: [], 
            subject: '', batchType: 'regular', mode: 'online',
            startTime: '', endTime: '', selectedDates: [], meetLink: ''
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
        if (!assignment.teacherId || assignment.selectedStudents.length === 0 || assignment.selectedDates.length === 0) {
            return alert("Error: Please select a Teacher, Dates, and Students.");
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
                alert(editingId ? "Batch Updated Successfully! ✨" : "Batch Assigned Successfully! 🔥");
                resetForm();
                fetchAssignedClasses();
            }
        } catch (error) {
            alert("Network Error: Could not reach the server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm("Action Required: Delete this class assignment permanently?")) return;
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

    return (
        <div className="manage-container" style={{ padding: '0 20px', minHeight: '100vh' }}>
            <div className="section-header" style={{ marginBottom: '30px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', color: '#1a1a1a' }}>
                    <ShieldCheck size={28} color={editingId ? "#FF9800" : "#007bff"} />
                    {editingId ? "Modify Existing Batch" : "Batch Deployment Engine"}
                </h2>
                <p style={{ color: '#666', marginTop: '5px' }}>Configure schedules and link educators with student cohorts.</p>
            </div>

            <form className="user-form" style={{ maxWidth: '100%', marginBottom: '50px' }} onSubmit={handleSubmit}>
                <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>

                    {/* CONFIGURATION CARD */}
                    <div className="form-card" style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: editingId ? '2px solid #FF9800' : '1px solid #eaeaea' }}>
                        <h3 style={{ borderBottom: '1.5px solid #f0f0f0', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
                            <Layers size={20} color={editingId ? "#FF9800" : "#007bff"} /> {editingId ? "Edit Configuration" : "Primary Configuration"}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Lead Educator</label>
                                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0', outline: 'none' }} value={assignment.teacherId} onChange={(e) => setAssignment({ ...assignment, teacherId: e.target.value })}>
                                    <option value="">Choose a Faculty Member</option>
                                    {teachers.map((t) => (
                                        <option key={String(t.id || t._id)} value={t.id || t._id}>{t.userName || t.name} ({t.coursetype || 'Core'})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Batch Type</label>
                                    <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.batchType} onChange={(e) => setAssignment({ ...assignment, batchType: e.target.value })}>
                                        <option value="regular">Regular Batch</option>
                                        <option value="crash">Crash Course</option>
                                        <option value="revision">Revision Series</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Class Mode</label>
                                    <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.mode} onChange={(e) => setAssignment({ ...assignment, mode: e.target.value })}>
                                        <option value="online">Online (Meet)</option>
                                        <option value="offline">Offline (Campus)</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Subject Nomenclature</label>
                                <input type="text" placeholder="e.g. Physics, Math" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.subject} onChange={(e) => setAssignment({ ...assignment, subject: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <input type="time" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.startTime} onChange={(e) => setAssignment({ ...assignment, startTime: e.target.value })} />
                                <input type="time" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} value={assignment.endTime} onChange={(e) => setAssignment({ ...assignment, endTime: e.target.value })} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Google Meet Link</label>
                                <input 
                                    type="url" 
                                    placeholder="https://meet.google.com/xxx-xxxx-xxx" 
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} 
                                    value={assignment.meetLink} 
                                    onChange={(e) => setAssignment({ ...assignment, meetLink: e.target.value })} 
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: '#444' }}>Select Class Dates</label>
                                <input 
                                    type="date" 
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e0e0e0' }} 
                                    onChange={(e) => {
                                        const date = e.target.value;
                                        if(date && !assignment.selectedDates.includes(date)) {
                                            setAssignment(prev => ({...prev, selectedDates: [...prev.selectedDates, date]}));
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
                                                onClick={() => setAssignment(prev => ({...prev, selectedDates: prev.selectedDates.filter(x => x !== d)}))} 
                                                style={{cursor:'pointer'}}
                                            />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SELECTION CARD */}
                    <div className="form-card" style={{ background: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #eaeaea' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #f0f0f0', paddingBottom: '15px' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
                                <Users size={20} color="#007bff" /> Enrolment ({assignment.selectedStudents.length})
                            </h3>
                        </div>
                        <div className="custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '20px' }}>
                            {filteredStudents.map(s => (
                                <label key={String(s.id || s._id)} style={{
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
                        style={{ padding: '15px 60px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '12px', background: editingId ? '#FF9800' : '#007bff', cursor: 'pointer' }}>
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                        {isSubmitting ? 'Processing...' : (editingId ? 'Update Batch Details' : 'Deploy Batch Assignment')}
                    </button>
                    {editingId && (
                        <button type="button" onClick={resetForm} style={{ padding: '15px 30px', borderRadius: '12px', border: '1.5px solid #666', color: '#666', background: 'transparent', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <XCircle size={20} /> Cancel Edit
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
                                <th style={{ padding: '18px', textAlign: 'left' }}>Subject</th>
                                <th style={{ textAlign: 'left' }}>Assigned Faculty</th>
                                <th style={{ textAlign: 'left' }}>Temporal Schedule</th>
                                <th style={{ textAlign: 'left' }}>Virtual Link</th>
                                <th style={{ textAlign: 'left' }}>Enrolled Roster</th>
                                <th style={{ textAlign: 'center' }}>Management</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignedClasses.length > 0 ? assignedClasses.map((cls) => (
                                <tr key={String(cls.id || cls._id)} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                    <td style={{ padding: '18px' }}>
                                        <div style={{ fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>{cls.subject}</div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <span style={{ fontSize: '9px', background: '#e9ecef', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{cls.batchType?.toUpperCase()}</span>
                                            <span style={{ fontSize: '9px', background: '#fff3cd', color: '#856404', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{cls.mode?.toUpperCase()}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '600', color: '#007bff' }}>{getTeacherName(cls.teacherId)}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} /> {cls.startTime} — {cls.endTime}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#28a745', fontWeight: '600', marginTop: '4px' }}>
                                            {cls.selectedDates?.join(' • ') || 'No dates set'}
                                        </div>
                                    </td>
                                    <td>
                                        {cls.meetLink ? (
                                            <a href={cls.meetLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#007bff', fontWeight: '600', textDecoration: 'none', background: '#eef6ff', padding: '5px 10px', borderRadius: '6px' }}>
                                                <ExternalLink size={14} /> Join Class
                                            </a>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#ccc' }}>No Link</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '12px', color: '#444' }}>
                                            <strong style={{ display: 'block', marginBottom: '2px' }}>{cls.selectedStudents?.length || 0} Enrolled</strong>
                                            <span style={{ color: '#888', fontStyle: 'italic', fontSize: '11px' }}>{getStudentNames(cls.selectedStudents)}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button onClick={() => handleEditInitiate(cls)} style={{ background: '#eef6ff', border: 'none', color: '#007bff', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Edit size={18} /></button>
                                            <button onClick={() => handleDeleteClass(cls.id || cls._id)} style={{ background: '#fff5f5', border: 'none', color: '#dc3545', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '80px', color: '#adb5bd' }}>
                                        <Calendar size={48} style={{ opacity: 0.1, marginBottom: '15px' }} />
                                        <p style={{ fontSize: '16px' }}>No active batch assignments found.</p>
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