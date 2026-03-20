// StudentForm.jsx
import React, { useState, useEffect }                                                      from 'react';
import { X, Save, User, Mail, Phone, Calendar, Lock, BookOpen, GraduationCap, CreditCard } from 'lucide-react';
import { API_BASE_URL }                                                                    from '../../config';
import './StudentForm.css';

const INDIA_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// Course config matching DB structure exactly
const COURSE_CONFIG = {
    NEET: {
        coursetype: "NEET",
        courseName: "NEET",
        standards: ["11th", "12th"],
        subjects: ["Physics", "Chemistry", "Botany", "Zoology"]
    },
    JEE: {
        coursetype: "JEE",
        courseName: "JEE",
        standards: ["11th", "12th"],
        subjects: ["Physics", "Chemistry", "Maths"]
    },
    "Class 6-12": {
        coursetype: "academics",
        courseName: "Class 6-12",
        standards: ["6th", "7th", "8th", "9th", "10th", "11th", "12th"],
        subjects: ["Mathematics", "Science", "Social Studies", "English", "Hindi"]
    },
    "Class 1-5": {
        coursetype: "academics",
        courseName: "Class 1-5",
        standards: ["1st", "2nd", "3rd", "4th", "5th"],
        subjects: ["Mathematics", "Science", "English", "Hindi", "EVS"]
    },
    "Kindergarten": {
        coursetype: "academics",
        courseName: "Kindergarten",
        standards: ["KG1", "KG2"],
        subjects: ["English", "Numbers", "Rhymes", "Drawing"]
    }
};

const planOptions = [
    { value: 'trial', label: 'Trial', days: 10 },
    { value: 'monthly', label: 'Monthly', days: 30 },
    { value: 'quarterly', label: 'Quarterly', days: 90 },
    { value: 'halfyearly', label: 'Half Yearly', days: 180 },
    { value: 'yearly', label: 'Yearly', days: 365 }
];

const severityOptions = [
     "Competent (70%)", "Proficient (80%)", "Expert (90%)"
];

const StudentForm = ({ student, onClose, onSave, mode }) => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        mobile: '',
        coursetype: 'NEET',
        courseName: 'NEET',
        standards: [],
        subjects: [],
        selectedCourse: { NEET: ["11th", "12th"] },
        selectedStandard: ["11th", "12th"],
        dob: '',
        gender: '',
        city: '',
        state: '',
        plan: 'monthly',
        startDate: '',
        endDate: '',
        paymentId: '',
        paymentMethod: 'Razorpay',
        amountPaid: '',
        payerId: '',
        couponUsed: 'NONE',
        discountPercentage: '0',
        discountAmount: '0',
        comfortableDailyHours: 4,
        severity: 'Competent (70%)',
        paymentHistory: [],
        _class: 'com.padmasiniAdmin.padmasiniAdmin_1.manageUser.UserModel'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const selectedCourseKey = Object.keys(COURSE_CONFIG).find(
        key => COURSE_CONFIG[key].courseName === formData.courseName
    ) || 'NEET';
    const currentCourseConfig = COURSE_CONFIG[selectedCourseKey];

    // Load student data if editing
    useEffect(() => {
        if (mode === 'edit' && student) {
            setFormData({
                firstname: student.firstname || '',
                lastname: student.lastname || '',
                email: student.email || '',
                password: student.password || '',
                mobile: student.mobile || '',
                coursetype: student.coursetype || 'NEET',
                courseName: student.courseName || 'NEET',
                standards: student.standards || [],
                subjects: student.subjects || [],
                selectedCourse: student.selectedCourse || {},
                selectedStandard: student.selectedStandard || [],
                dob: student.dob || '',
                gender: student.gender || '',
                city: student.city || '',
                state: student.state || '',
                plan: student.plan || 'monthly',
                startDate: student.startDate || '',
                endDate: student.endDate || '',
                paymentId: student.paymentId || '',
                paymentMethod: student.paymentMethod || '',
                amountPaid: student.amountPaid || '',
                payerId: student.payerId || '',
                couponUsed: student.couponUsed || 'NONE',
                discountPercentage: student.discountPercentage || '0',
                discountAmount: student.discountAmount || '0',
                comfortableDailyHours: student.comfortableDailyHours || 4,
                severity: student.severity || 'Competent (70%)',
                paymentHistory: student.paymentHistory || [],
                _class: 'com.padmasiniAdmin.padmasiniAdmin_1.manageUser.UserModel'
            });
        }
    }, [student, mode]);

    const calculateEndDate = (startDate, plan) => {
        if (!startDate || !plan) return '';
        const selectedPlan = planOptions.find(p => p.value === plan);
        if (!selectedPlan) return '';
        const date = new Date(startDate);
        date.setDate(date.getDate() + selectedPlan.days);
        return date.toISOString().split('T')[0];
    };

    const handleCourseChange = (courseKey) => {
        const config = COURSE_CONFIG[courseKey];
        if (!config) return;
        // selectedCourse object: { "NEET": ["11th", "12th"] } — matches DB
        const selectedCourse = { [config.courseName]: config.standards };
        setFormData(prev => ({
            ...prev,
            coursetype: config.coursetype,
            courseName: config.courseName,
            standards: [],
            subjects: [],
            selectedCourse,
            selectedStandard: config.standards // default all selected like DB
        }));
    };

    const handleStandardChange = (std) => {
        const config = COURSE_CONFIG[selectedCourseKey];
        setFormData(prev => {
            const current = prev.selectedStandard || [];
            const updated = current.includes(std)
                ? current.filter(s => s !== std)
                : [...current, std];
            return {
                ...prev,
                selectedStandard: updated,
                // Update selectedCourse object to reflect chosen standards
                selectedCourse: { [config.courseName]: updated }
            };
        });
    };

    const handleSubjectChange = (subject) => {
        setFormData(prev => {
            const current = prev.subjects || [];
            const updated = current.includes(subject)
                ? current.filter(s => s !== subject)
                : [...current, subject];
            return { ...prev, subjects: updated };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Build payload matching DB structure exactly
            const payload = {
                firstname: formData.firstname,
                lastname: formData.lastname,
                email: formData.email,
                password: formData.password,
                mobile: formData.mobile,
                coursetype: formData.coursetype,
                courseName: formData.courseName,
                standards: [],                          // DB shows empty array
                subjects: [],                           // DB shows empty array
                selectedCourse: formData.selectedCourse,
                selectedStandard: formData.selectedStandard,
                dob: formData.dob,
                gender: formData.gender,
                city: formData.city,
                state: formData.state,
                plan: formData.plan,
                startDate: formData.startDate,
                endDate: formData.endDate,
                paymentId: formData.paymentId || `PAY-${Date.now()}`,
                paymentMethod: formData.paymentMethod,
                amountPaid: formData.amountPaid,
                payerId: formData.payerId || '',
                comfortableDailyHours: formData.comfortableDailyHours,
                severity: formData.severity,
                paymentHistory: formData.paymentHistory,
                _class: 'com.padmasiniAdmin.padmasiniAdmin_1.manageUser.UserModel'
            };

            // Build paymentHistory entry for new payment (add/upgrade)
            if (mode === 'add') {
                const historyEntry = {
                    date: new Date().toISOString().split('T')[0],
                    amountPaid: formData.amountPaid || '0',
                    paymentId: formData.plan === 'trial'
                        ? `TRIAL_${Date.now()}`
                        : (formData.paymentId || `PAY-${Date.now()}`),
                    action: formData.plan === 'trial' ? 'TRIAL_ACTIVATION' : 'UPGRADE/RENEWAL',
                    plan: formData.plan,
                    ...(formData.plan !== 'trial' && {
                        discountPercentage: formData.discountPercentage || '0',
                        couponUsed: formData.couponUsed || 'NONE',
                        payerId: formData.payerId || '',
                        discountAmount: formData.discountAmount || '0'
                    })
                };
                payload.paymentHistory = [historyEntry];
                // For trial plan, sync paymentId
                if (formData.plan === 'trial') {
                    payload.paymentId = historyEntry.paymentId;
                    payload.paymentMethod = 'Free Trial';
                    payload.amountPaid = '0';
                }
            }

            const url = mode === 'edit'
                ? `${API_BASE_URL}/updateStudent/${student.email}`
                : `${API_BASE_URL}/addStudent`;

            const response = await fetch(url, {
                method: mode === 'edit' ? 'PUT' : 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === 'pass' || data.status === 'success') {
                onSave();
                onClose();
            } else {
                setError(data.message || 'Failed to save student');
            }
        } catch (err) {
            console.error('Error saving student:', err);
            setError('Error saving student. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="student-form-modal">
            <div className="student-form-overlay" onClick={onClose}></div>
            <div className="student-form-container">
                <div className="student-form-header">
                    <h2>{mode === 'edit' ? 'Edit Student' : 'Add New Student'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="student-form">
                    {error && <div className="form-error">{error}</div>}

                    {/* ── Personal Information ── */}
                    <div className="form-section">
                        <h3><User size={18} /> Personal Information</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input type="text" value={formData.firstname} required
                                    onChange={e => setFormData({ ...formData, firstname: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input type="text" value={formData.lastname}
                                    onChange={e => setFormData({ ...formData, lastname: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label><Mail size={14} /> Email *</label>
                                <input type="email" value={formData.email} required
                                    onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label><Phone size={14} /> Mobile *</label>
                                <input type="tel" value={formData.mobile} required
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label><Lock size={14} /> Password *</label>
                                <input type="password" value={formData.password}
                                    required={mode === 'add'}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label><Calendar size={14} /> Date of Birth</label>
                                <input type="date" value={formData.dob}
                                    onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Gender</label>
                                <select value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>City</label>
                                <input type="text" value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            {/* ── State dropdown — all Indian states ── */}
                            <div className="form-group">
                                <label>State</label>
                                <select value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}>
                                    <option value="">Select State</option>
                                    {INDIA_STATES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Course Information ── */}
                    <div className="form-section">
                        <h3><GraduationCap size={18} /> Course Information</h3>

                        <div className="form-group">
                            <label>Course *</label>
                            <select value={selectedCourseKey}
                                onChange={e => handleCourseChange(e.target.value)} required>
                                {Object.keys(COURSE_CONFIG).map(key => (
                                    <option key={key} value={key}>{key}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Standards</label>
                            <div className="checkbox-group">
                                {currentCourseConfig.standards.map(std => (
                                    <label key={std} className="checkbox-label">
                                        <input type="checkbox"
                                            checked={(formData.selectedStandard || []).includes(std)}
                                            onChange={() => handleStandardChange(std)} />
                                        {std}
                                    </label>
                                ))}
                            </div>
                            <small>selectedCourse saved as: {JSON.stringify(formData.selectedCourse)}</small>
                        </div>

                        <div className="form-group">
                            <label>Subjects</label>
                            <div className="checkbox-group">
                                {currentCourseConfig.subjects.map(subject => (
                                    <label key={subject} className="checkbox-label">
                                        <input type="checkbox"
                                            checked={(formData.subjects || []).includes(subject)}
                                            onChange={() => handleSubjectChange(subject)} />
                                        {subject}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Subscription & Payment ── */}
                    <div className="form-section">
                        <h3><CreditCard size={18} /> Subscription & Payment</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Plan *</label>
                                <select value={formData.plan} required
                                    onChange={e => {
                                        const plan = e.target.value;
                                        const endDate = calculateEndDate(formData.startDate, plan);
                                        setFormData({ ...formData, plan, endDate });
                                    }}>
                                    {planOptions.map(p => (
                                        <option key={p.value} value={p.value}>
                                            {p.label} ({p.days} days)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Start Date *</label>
                                <input type="date" value={formData.startDate} required
                                    onChange={e => {
                                        const startDate = e.target.value;
                                        const endDate = calculateEndDate(startDate, formData.plan);
                                        setFormData({ ...formData, startDate, endDate });
                                    }} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>End Date</label>
                                <input type="date" value={formData.endDate} readOnly className="readonly-field" />
                                <small>Auto-calculated</small>
                            </div>
                            <div className="form-group">
                                <label>Amount Paid (₹)</label>
                                <input type="number" value={formData.amountPaid}
                                    onChange={e => setFormData({ ...formData, amountPaid: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Payment Method</label>
                                <select value={formData.paymentMethod}
                                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                    <option value="Razorpay">Razorpay</option>
                                    <option value="Free Trial">Free Trial</option>
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Payment ID</label>
                                <input type="text" value={formData.paymentId}
                                    placeholder="e.g. pay_SNtP9i5C2PS59J"
                                    onChange={e => setFormData({ ...formData, paymentId: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Payer ID</label>
                                <input type="text" value={formData.payerId}
                                    placeholder="e.g. sneka@oksbi"
                                    onChange={e => setFormData({ ...formData, payerId: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Coupon Used</label>
                                <input type="text" value={formData.couponUsed}
                                    onChange={e => setFormData({ ...formData, couponUsed: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Discount %</label>
                                <input type="number" min="0" max="100" value={formData.discountPercentage}
                                    onChange={e => {
                                        const pct = e.target.value;
                                        const discountAmount = formData.amountPaid
                                            ? ((formData.amountPaid * pct) / 100).toFixed(2)
                                            : '0';
                                        setFormData({ ...formData, discountPercentage: pct, discountAmount });
                                    }} />
                            </div>
                            <div className="form-group">
                                <label>Discount Amount (₹)</label>
                                <input type="number" value={formData.discountAmount}
                                    onChange={e => setFormData({ ...formData, discountAmount: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* ── Study Preferences ── */}
                    <div className="form-section">
                        <h3><BookOpen size={18} /> Study Preferences</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Daily Study Hours</label>
                                <input type="number" min="1" max="24" value={formData.comfortableDailyHours}
                                    onChange={e => setFormData({ ...formData, comfortableDailyHours: parseInt(e.target.value) || 4 })} />
                            </div>
                            <div className="form-group">
                                <label>Proficiency Level</label>
                                <select value={formData.severity}
                                    onChange={e => setFormData({ ...formData, severity: e.target.value })}>
                                    <option value="">Select Level</option>
                                    {severityOptions.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? 'Saving...' : (<><Save size={16} /> {mode === 'edit' ? 'Update Student' : 'Add Student'}</>)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentForm;