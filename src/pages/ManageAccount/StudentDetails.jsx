// StudentDetails.jsx
import React from 'react';
import {
  ArrowLeft, Mail, Phone, Calendar, User, GraduationCap,
  CreditCard, BarChart, Download, MapPin, Clock, BookOpen,
  Percent, Tag, FileText, Shield, Layers, Target,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

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
  if (!student) return null;

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

  const handleExportDetails = () => {
    const courseSection = displayCourseKeys.length > 0
      ? displayCourseKeys.map(key => `
  ${key} (${getCourseMode(key)}):
    Standards : ${(selectedCourseObj[key] || []).join(', ') || 'N/A'}
    Subjects  : ${COURSE_CONFIG[key]?.subjects.join(', ') || 'N/A'}
`).join('')
      : `  Course: ${student.courseName || 'N/A'}\n`;

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
        <h2>Student Details</h2>
        <button className="export-details-btn" onClick={handleExportDetails}>
          <Download size={16} /> Export Details
        </button>
      </div>

      {/* Profile Header */}
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

        {/* Personal Information */}
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

        {/* Subscription Details */}
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

        {/* Payment Information */}
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

        {/* Study Preferences */}
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

        {/* System Information */}
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

        {/* Payment History — full width */}
        <div className="details-card full-width">
          <div className="card-header">
            <CreditCard size={20} />
            <h3>Payment History ({student.paymentHistory?.length || 0})</h3>
          </div>
          <div className="card-content">
            {renderPaymentHistory()}
          </div>
        </div>

        {/* Enrolled Course Summary — full width */}
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
    </div>
  );
};

export default StudentDetails;