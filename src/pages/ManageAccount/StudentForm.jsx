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

    "NEET&JEE": {  // Add this for combined display
        coursetype: "NEET&JEE",
        courseName: "NEET&JEE",
        standards: ["11th", "12th"],
        subjects: ["Physics", "Chemistry", "Botany", "Zoology", "Maths"]
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
    { value: 'trial',      label: 'Trial',       days: 10  },
    { value: 'monthly',    label: 'Monthly',     days: 30  },
    { value: 'quarterly',  label: 'Quarterly',   days: 90  },
    { value: 'halfyearly', label: 'Half Yearly', days: 180 },
    { value: 'yearly',     label: 'Yearly',      days: 365 }
];

const severityOptions = [
    "Competent (70%)", "Proficient (80%)", "Expert (90%)"
];

const deriveCourseType = (keys) => {
    if (!keys || keys.length === 0) return '';
    // Join all selected course keys with '&' for coursetype
    return keys.join('&');
};

const deriveCourseName = (keys) => {
    if (!keys || keys.length === 0) return '';
    // Join all selected course keys with '&' for courseName
    return keys.join('&');
};

const buildSelectedCourse = (keys, standardsMap) => {
    const obj = {};
    keys.forEach(key => {
        obj[key] = standardsMap[key] || COURSE_CONFIG[key]?.standards || [];
    });
    return obj;
};

const StudentForm = ({ student, onClose, onSave, mode }) => {
    const [selectedCourseKeys, setSelectedCourseKeys] = useState(['NEET']);
    const [standardsMap, setStandardsMap]             = useState({ NEET: ["11th", "12th"] });
    const [subjectsMap,  setSubjectsMap]               = useState({ NEET: [] });

    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        mobile: '',
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
    const [error,   setError]   = useState('');

    // ── Load student data when editing ──────────────────────────────────────
    useEffect(() => {
        if (mode === 'edit' && student) {
            let keys    = [];
            let stdMap  = {};
            let subjMap = {};

            // 1. Try new format: selectedCourse = { NEET: [...], JEE: [...] }
            if (student.selectedCourse && typeof student.selectedCourse === 'object') {
                const validKeys = Object.keys(student.selectedCourse).filter(k => COURSE_CONFIG[k]);
                if (validKeys.length > 0) {
                    keys = validKeys;
                    validKeys.forEach(k => {
                        stdMap[k]  = Array.isArray(student.selectedCourse[k])
                            ? student.selectedCourse[k]
                            : COURSE_CONFIG[k].standards;
                        subjMap[k] = [];
                    });
                }
            }

            // 2. Fallback: parse "NEET&JEE" style courseName / coursetype
            if (keys.length === 0 && student.courseName) {
                const parts = student.courseName.split('&').map(s => s.trim()).filter(p => COURSE_CONFIG[p]);
                if (parts.length > 0) {
                    keys = parts;
                    parts.forEach(p => {
                        stdMap[p]  = student.selectedStandard?.length
                            ? student.selectedStandard
                            : COURSE_CONFIG[p].standards;
                        subjMap[p] = [];
                    });
                }
            }

            // 3. Final fallback
            if (keys.length === 0) {
                keys    = ['NEET'];
                stdMap  = { NEET: ["11th", "12th"] };
                subjMap = { NEET: [] };
            }

            setSelectedCourseKeys(keys);
            setStandardsMap(stdMap);
            setSubjectsMap(subjMap);

            setFormData({
                firstname:             student.firstname            || '',
                lastname:              student.lastname             || '',
                email:                 student.email               || '',
                password:              student.password            || '',
                mobile:                student.mobile              || '',
                dob:                   student.dob                 || '',
                gender:                student.gender              || '',
                city:                  student.city                || '',
                state:                 student.state               || '',
                plan:                  student.plan                || 'monthly',
                startDate:             student.startDate           || '',
                endDate:               student.endDate             || '',
                paymentId:             student.paymentId           || '',
                paymentMethod:         student.paymentMethod       || 'Razorpay',
                amountPaid:            student.amountPaid          || '',
                payerId:               student.payerId             || '',
                couponUsed:            student.couponUsed          || 'NONE',
                discountPercentage:    student.discountPercentage  || '0',
                discountAmount:        student.discountAmount      || '0',
                comfortableDailyHours: student.comfortableDailyHours || 4,
                severity:              student.severity            || 'Competent (70%)',
                paymentHistory:        student.paymentHistory      || [],
                _class: 'com.padmasiniAdmin.padmasiniAdmin_1.manageUser.UserModel'
            });
        }
    }, [student, mode]);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const calculateEndDate = (startDate, plan) => {
        if (!startDate || !plan) return '';
        const found = planOptions.find(p => p.value === plan);
        if (!found) return '';
        const d = new Date(startDate);
        d.setDate(d.getDate() + found.days);
        return d.toISOString().split('T')[0];
    };

    const handleCourseKeyToggle = (key) => {
        setSelectedCourseKeys(prev => {
            if (prev.includes(key)) {
                if (prev.length === 1) return prev;
                const updated = prev.filter(k => k !== key);
                setStandardsMap(sm => { const n = { ...sm }; delete n[key]; return n; });
                setSubjectsMap(sj  => { const n = { ...sj };  delete n[key]; return n; });
                return updated;
            } else {
                setStandardsMap(sm => ({ ...sm, [key]: COURSE_CONFIG[key].standards }));
                setSubjectsMap(sj  => ({ ...sj,  [key]: [] }));
                return [...prev, key];
            }
        });
    };

    const handleStandardChange = (courseKey, std) => {
        setStandardsMap(prev => {
            const cur = prev[courseKey] || [];
            return {
                ...prev,
                [courseKey]: cur.includes(std) ? cur.filter(s => s !== std) : [...cur, std]
            };
        });
    };

    const handleSubjectChange = (courseKey, subject) => {
        setSubjectsMap(prev => {
            const cur = prev[courseKey] || [];
            return {
                ...prev,
                [courseKey]: cur.includes(subject) ? cur.filter(s => s !== subject) : [...cur, subject]
            };
        });
    };

    const allSelectedStandards = [...new Set(selectedCourseKeys.flatMap(k => standardsMap[k] || []))];
    const previewCoursetype    = deriveCourseType(selectedCourseKeys);
    const previewCourseName    = deriveCourseName(selectedCourseKeys);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const selectedCourseObj  = buildSelectedCourse(selectedCourseKeys, standardsMap);
            const combinedCoursetype = deriveCourseType(selectedCourseKeys);
            const combinedCourseName = deriveCourseName(selectedCourseKeys);

            const newHistoryEntry = {
                date:               new Date().toISOString().split('T')[0],
                amountPaid:         formData.plan === 'trial' ? '0' : (formData.amountPaid || '0'),
                paymentId:          formData.plan === 'trial'
                                        ? `TRIAL_${Date.now()}`
                                        : (formData.paymentId || `PAY-${Date.now()}`),
                action:             formData.plan === 'trial' ? 'TRIAL_ACTIVATION' : 'UPGRADE/RENEWAL',
                plan:               formData.plan,
                discountPercentage: formData.discountPercentage || '0',
                couponUsed:         formData.couponUsed         || 'NONE',
                payerId:            formData.payerId            || '',
                discountAmount:     formData.discountAmount     || '0'
            };

            let updatedPaymentHistory;
            if (mode === 'add') {
                updatedPaymentHistory = [newHistoryEntry];
            } else {
                const paymentChanged =
                    formData.amountPaid         !== (student.amountPaid         || '')    ||
                    formData.plan               !== (student.plan               || '')    ||
                    formData.startDate          !== (student.startDate          || '')    ||
                    formData.endDate            !== (student.endDate            || '')    ||
                    formData.paymentId          !== (student.paymentId          || '')    ||
                    formData.paymentMethod      !== (student.paymentMethod      || '')    ||
                    formData.discountPercentage !== (student.discountPercentage || '0')   ||
                    formData.discountAmount     !== (student.discountAmount     || '0')   ||
                    formData.couponUsed         !== (student.couponUsed         || 'NONE');

                updatedPaymentHistory = paymentChanged
                    ? [newHistoryEntry, ...(formData.paymentHistory || [])]
                    : (formData.paymentHistory || []);
            }

            const payload = {
                firstname:  formData.firstname,
                lastname:   formData.lastname,
                email:      formData.email,
                password:   formData.password,
                mobile:     formData.mobile,

                coursetype:       combinedCoursetype,
                courseName:       combinedCourseName,
                standards:        [],
                subjects:         [],
                selectedCourse:   selectedCourseObj,
                selectedStandard: allSelectedStandards,

                dob:    formData.dob,
                gender: formData.gender,
                city:   formData.city,
                state:  formData.state,

                plan:          formData.plan,
                startDate:     formData.startDate,
                endDate:       formData.endDate,
                paymentId:     newHistoryEntry.paymentId,
                paymentMethod: formData.plan === 'trial' ? 'Free Trial' : formData.paymentMethod,
                amountPaid:    formData.plan === 'trial' ? '0' : (formData.amountPaid || '0'),
                payerId:       formData.payerId || '',

                couponUsed:         formData.couponUsed         || 'NONE',
                discountPercentage: formData.discountPercentage || '0',
                discountAmount:     formData.discountAmount     || '0',

                comfortableDailyHours: formData.comfortableDailyHours,
                severity:              formData.severity,
                paymentHistory:        updatedPaymentHistory,
                _class: 'com.padmasiniAdmin.padmasiniAdmin_1.manageUser.UserModel'
            };

            const url = mode === 'edit'
                ? `${API_BASE_URL}/updateStudent/${student.email}`
                : `${API_BASE_URL}/addStudent`;

            const response = await fetch(url, {
                method:      mode === 'edit' ? 'PUT' : 'POST',
                credentials: 'include',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === 'pass' || data.status === 'success') {
                // Call onSave first — ManageAccount will close the modal and
                // then trigger a delayed refetch so the UI always shows fresh data.
                onSave();
            } else {
                setError(data.message || 'Failed to save student');
                setLoading(false);
            }
        } catch (err) {
            console.error('Error saving student:', err);
            setError('Error saving student. Please try again.');
            setLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
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

                    {/* ── Personal Information ─────────────────────────── */}
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
                                    placeholder={mode === 'edit' ? 'Leave unchanged if not updating' : ''}
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

                    {/* ── Course Information ───────────────────────────── */}
                    <div className="form-section">
                        <h3><GraduationCap size={18} /> Course Information</h3>

                        <div className="course-preview-bar">
                            <span className="course-preview-label">Will save as:</span>
                            <span className="course-preview-value">
                                coursetype = <strong>"{previewCoursetype}"</strong>
                                &nbsp;&nbsp;|&nbsp;&nbsp;
                                courseName = <strong>"{previewCourseName}"</strong>
                            </span>
                        </div>

                        <div className="form-group">
                            <label>
                                Select Course(s) *&nbsp;
                                <small style={{ color: '#888' }}>(tap to toggle — select one or more)</small>
                            </label>
                            <div className="course-toggle-group">
                                {Object.keys(COURSE_CONFIG).map(key => (
                                    <button
                                        key={key}
                                        type="button"
                                        className={`course-toggle-btn ${selectedCourseKeys.includes(key) ? 'active' : ''}`}
                                        onClick={() => handleCourseKeyToggle(key)}
                                    >
                                        {selectedCourseKeys.includes(key) ? '✓ ' : '+ '}
                                        {key}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedCourseKeys.map(courseKey => {
                            const config = COURSE_CONFIG[courseKey];
                            return (
                                <div key={courseKey} className="course-block">
                                    <div className="course-block-header">
                                        <strong>{courseKey}</strong>
                                        <span className="course-block-type">
                                            {courseKey === 'NEET' || courseKey === 'JEE' ? 'Professional' : 'Academics'}
                                        </span>
                                    </div>

                                    <div className="form-group">
                                        <label>Standards</label>
                                        <div className="checkbox-group">
                                            {config.standards.map(std => (
                                                <label key={std} className="checkbox-label">
                                                    <input type="checkbox"
                                                        checked={(standardsMap[courseKey] || []).includes(std)}
                                                        onChange={() => handleStandardChange(courseKey, std)} />
                                                    {std}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Subjects</label>
                                        <div className="checkbox-group">
                                            {config.subjects.map(subject => (
                                                <label key={subject} className="checkbox-label">
                                                    <input type="checkbox"
                                                        checked={(subjectsMap[courseKey] || []).includes(subject)}
                                                        onChange={() => handleSubjectChange(courseKey, subject)} />
                                                    {subject}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Subscription & Payment ───────────────────────── */}
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
                                        const endDate   = calculateEndDate(startDate, formData.plan);
                                        setFormData({ ...formData, startDate, endDate });
                                    }} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>End Date</label>
                                <input type="date" value={formData.endDate} readOnly className="readonly-field" />
                                <small>Auto-calculated from plan + start date</small>
                            </div>
                            <div className="form-group">
                                <label>Amount Paid (₹)</label>
                                <input type="number" value={formData.amountPaid}
                                    disabled={formData.plan === 'trial'}
                                    placeholder={formData.plan === 'trial' ? '0 (free trial)' : ''}
                                    onChange={e => setFormData({ ...formData, amountPaid: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Payment Method</label>
                                <select value={formData.paymentMethod}
                                    disabled={formData.plan === 'trial'}
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
                                    disabled={formData.plan === 'trial'}
                                    placeholder={formData.plan === 'trial' ? 'Auto-generated' : 'e.g. pay_SNtP9i5C2PS59J'}
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
                                            ? ((parseFloat(formData.amountPaid) * parseFloat(pct)) / 100).toFixed(2)
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

                        {mode === 'edit' && (
                            <div className="payment-update-notice">
                                <small>
                                    ⚠ Changing any payment or subscription field will automatically
                                    add a new entry to payment history.
                                </small>
                            </div>
                        )}
                    </div>

                    {/* ── Study Preferences ───────────────────────────── */}
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
                        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading
                                ? 'Saving...'
                                : <><Save size={16} /> {mode === 'edit' ? 'Update Student' : 'Add Student'}</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentForm;