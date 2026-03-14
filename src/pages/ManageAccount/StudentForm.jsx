// StudentForm.jsx
import React, { useState, useEffect }                                                      from 'react';
import { X, Save, User, Mail, Phone, Calendar, Lock, BookOpen, GraduationCap, CreditCard } from 'lucide-react';
import { API_BASE_URL }                                                                    from '../../config';
import './StudentForm.css';

const StudentForm = ({ student, onClose, onSave, mode }) => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        mobile: '',
        coursetype: 'academics',
        courseName: '',
        standards: [],
        subjects: [],
        selectedCourse: {},
        selectedStandard: [],
        photo: '',
        dob: '',
        gender: '',
        city: '',
        state: '',
        plan: 'monthly',
        startDate: '',
        endDate: '',
        paymentId: '',
        paymentMethod: '',
        amountPaid: '',
        payerId: '',
        couponUsed: '',
        discountPercentage: '',
        discountAmount: '',
        action: 'new',
        comfortableDailyHours: 3,
        severity: '',
        paymentHistory: []
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Plan options
    const planOptions = [
        { value: 'monthly', label: 'Monthly', days: 30 },
        { value: 'quarterly', label: 'Quarterly', days: 90 },
        { value: 'halfyearly', label: 'Half Yearly', days: 180 },
        { value: 'yearly', label: 'Yearly', days: 365 }
    ];

    // Course type options
    const courseTypeOptions = [
        { value: 'academics', label: 'Academics' },
        { value: 'professional', label: 'Professional' }
    ];

    // Course name options based on course type
    const getCourseNameOptions = () => {
        if (formData.coursetype === 'academics') {
            return [
                { value: 'kindergarten', label: 'Kindergarten' },
                { value: 'class1-5', label: 'Class 1 - 5' },
                { value: 'class6-12', label: 'Class 6 - 12' }
            ];
        } else if (formData.coursetype === 'professional') {
            return [
                { value: 'jee', label: 'JEE' },
                { value: 'neet', label: 'NEET' }
            ];
        }
        return [];
    };

    // Standard options based on course name
    const getStandardOptions = () => {
        if (formData.courseName === 'class11') return ['11'];
        if (formData.courseName === 'class12') return ['12'];
        if (formData.courseName === 'jee' || formData.courseName === 'neet') return ['11', '12'];
        if (formData.courseName === 'class6-12') return ['6', '7', '8', '9', '10', '11', '12'];
        if (formData.courseName === 'class1-5') return ['1', '2', '3', '4', '5'];
        if (formData.courseName === 'kindergarten') return ['KG'];
        return [];
    };

    // Subject options based on course name
    const getSubjectOptions = () => {
        if (formData.courseName === 'jee') {
            return ['Physics', 'Chemistry', 'Maths'];
        } else if (formData.courseName === 'neet') {
            return ['Physics', 'Chemistry', 'Botany', 'Zoology'];
        } else if (formData.courseName === 'class11' || formData.courseName === 'class12') {
            return ['Physics', 'Chemistry', 'Biology', 'Mathematics'];
        } else if (formData.courseName === 'class6-12') {
            return ['Mathematics', 'Science', 'Social Studies', 'English', 'Hindi', 'Sanskrit'];
        } else if (formData.courseName === 'class1-5') {
            return ['Mathematics', 'Science', 'English', 'Hindi', 'EVS'];
        } else if (formData.courseName === 'kindergarten') {
            return ['English', 'Numbers', 'Rhymes', 'Drawing', 'Games'];
        }
        return [];
    };

    // Load student data if editing
    useEffect(() => {
        if (mode === 'edit' && student) {
            setFormData({
                firstname: student.firstname || '',
                lastname: student.lastname || '',
                email: student.email || '',
                password: student.password || '',
                mobile: student.mobile || student.phone || '',
                coursetype: student.coursetype || 'academics',
                courseName: student.courseName || '',
                standards: student.standards || [],
                subjects: student.subjects || [],
                selectedCourse: student.selectedCourse || {},
                selectedStandard: student.selectedStandard || [],
                photo: student.photo || '',
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
                couponUsed: student.couponUsed || '',
                discountPercentage: student.discountPercentage || '',
                discountAmount: student.discountAmount || '',
                action: student.action || 'edit',
                comfortableDailyHours: student.comfortableDailyHours || 3,
                severity: student.severity || '',
                paymentHistory: student.paymentHistory || []
            });
        }
    }, [student, mode]);

    // Calculate end date based on start date and plan
    const calculateEndDate = (startDate, plan) => {
        if (!startDate || !plan) return '';

        const selectedPlan = planOptions.find(p => p.value === plan);
        if (!selectedPlan) return '';

        const date = new Date(startDate);
        date.setDate(date.getDate() + selectedPlan.days);

        return date.toISOString().split('T')[0];
    };

    // Handle start date change
    const handleStartDateChange = (e) => {
        const startDate = e.target.value;
        const endDate = calculateEndDate(startDate, formData.plan);
        setFormData({
            ...formData,
            startDate,
            endDate
        });
    };

    // Handle plan change
    const handlePlanChange = (e) => {
        const plan = e.target.value;
        const endDate = calculateEndDate(formData.startDate, plan);
        setFormData({
            ...formData,
            plan,
            endDate
        });
    };

    // Handle standard selection
    const handleStandardChange = (standard) => {
        const current = formData.selectedStandard || [];
        const updated = current.includes(standard)
            ? current.filter(s => s !== standard)
            : [...current, standard];

        setFormData({
            ...formData,
            selectedStandard: updated,
            standards: updated
        });
    };

    // Handle subject selection
    const handleSubjectChange = (subject) => {
        const current = formData.subjects || [];
        const updated = current.includes(subject)
            ? current.filter(s => s !== subject)
            : [...current, subject];

        setFormData({
            ...formData,
            subjects: updated
        });
    };

    // Handle discount percentage change
    const handleDiscountPercentageChange = (e) => {
        const percentage = e.target.value;
        const amount = formData.amountPaid;
        let discountAmount = '';

        if (amount && percentage) {
            discountAmount = (amount * percentage / 100).toFixed(2);
        }

        setFormData({
            ...formData,
            discountPercentage: percentage,
            discountAmount
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Prepare the student data
            const studentData = {
                ...formData,
                // Ensure all fields are properly formatted
                paymentHistory: formData.paymentHistory || [],
                selectedCourse: {
                    ...formData.selectedCourse,
                    name: formData.courseName,
                    plan: formData.plan
                }
            };

            // Add payment to history if it's a new payment
            if (formData.amountPaid && mode === 'add') {
                studentData.paymentHistory = [
                    {
                        date: new Date().toISOString().split('T')[0],
                        action: formData.action,
                        plan: formData.plan,
                        amountPaid: formData.amountPaid,
                        discountPercentage: formData.discountPercentage,
                        discountAmount: formData.discountAmount,
                        couponUsed: formData.couponUsed,
                        paymentId: formData.paymentId || `PAY-${Date.now()}`
                    },
                    ...(formData.paymentHistory || [])
                ];
            }

            // Send to backend
            const url = mode === 'edit'
                ? `${API_BASE_URL}/updateStudent/${studentData.email}`
                : `${API_BASE_URL}/addStudent`;

            const method = mode === 'edit' ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studentData)
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
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="student-form">
                    {error && <div className="form-error">{error}</div>}

                    <div className="form-section">
                        <h3>
                            <User size={18} /> Personal Information
                        </h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input
                                    type="text"
                                    value={formData.firstname}
                                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastname}
                                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label><Mail size={14} /> Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label><Phone size={14} /> Mobile *</label>
                                <input
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label><Lock size={14} /> Password *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={mode === 'add'}
                                />
                            </div>
                            <div className="form-group">
                                <label><Calendar size={14} /> Date of Birth</label>
                                <input
                                    type="date"
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>State</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Photo URL</label>
                                <input
                                    type="url"
                                    value={formData.photo}
                                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                                    placeholder="https://example.com/photo.jpg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>
                            <GraduationCap size={18} /> Course Information
                        </h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Course Type *</label>
                                <select
                                    value={formData.coursetype}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        coursetype: e.target.value,
                                        courseName: '',
                                        subjects: [],
                                        selectedStandard: []
                                    })}
                                    required
                                >
                                    {courseTypeOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Course Name *</label>
                                <select
                                    value={formData.courseName}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        courseName: e.target.value,
                                        subjects: [],
                                        selectedStandard: []
                                    })}
                                    required
                                >
                                    <option value="">Select Course</option>
                                    {getCourseNameOptions().map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {formData.courseName && (
                            <>
                                <div className="form-group">
                                    <label>Standards</label>
                                    <div className="checkbox-group">
                                        {getStandardOptions().map(std => (
                                            <label key={std} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.selectedStandard || []).includes(std)}
                                                    onChange={() => handleStandardChange(std)}
                                                />
                                                Std {std}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Subjects</label>
                                    <div className="checkbox-group">
                                        {getSubjectOptions().map(subject => (
                                            <label key={subject} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={(formData.subjects || []).includes(subject)}
                                                    onChange={() => handleSubjectChange(subject)}
                                                />
                                                {subject}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="form-section">
                        <h3>
                            <CreditCard size={18} /> Subscription & Payment
                        </h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Plan *</label>
                                <select
                                    value={formData.plan}
                                    onChange={handlePlanChange}
                                    required
                                >
                                    {planOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label} ({option.days} days)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Start Date *</label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleStartDateChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    readOnly
                                    className="readonly-field"
                                />
                                <small>Auto-calculated based on plan</small>
                            </div>
                            <div className="form-group">
                                <label>Amount Paid (₹)</label>
                                <input
                                    type="number"
                                    value={formData.amountPaid}
                                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Payment Method</label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                >
                                    <option value="">Select Method</option>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="online">Online Payment</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Payment ID</label>
                                <input
                                    type="text"
                                    value={formData.paymentId}
                                    onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Discount Percentage (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.discountPercentage}
                                    onChange={handleDiscountPercentageChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Discount Amount (₹)</label>
                                <input
                                    type="number"
                                    value={formData.discountAmount}
                                    onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Coupon Used</label>
                                <input
                                    type="text"
                                    value={formData.couponUsed}
                                    onChange={(e) => setFormData({ ...formData, couponUsed: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Payer ID</label>
                                <input
                                    type="text"
                                    value={formData.payerId}
                                    onChange={(e) => setFormData({ ...formData, payerId: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Action</label>
                            <select
                                value={formData.action}
                                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                            >
                                <option value="new">New Registration</option>
                                <option value="renewal">Renewal</option>
                                <option value="upgrade">Upgrade</option>
                                <option value="edit">Edit</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>
                            <BookOpen size={18} /> Study Preferences
                        </h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Daily Study Hours</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="24"
                                    value={formData.comfortableDailyHours}
                                    onChange={(e) => setFormData({ ...formData, comfortableDailyHours: parseInt(e.target.value) || 3 })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Proficiency Level</label>
                                <select
                                    value={formData.severity}
                                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                >
                                    <option value="">Select Level</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Competent">Competent</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? 'Saving...' : (
                                <>
                                    <Save size={16} /> {mode === 'edit' ? 'Update Student' : 'Add Student'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentForm;