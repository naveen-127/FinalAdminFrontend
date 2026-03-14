import React from 'react';
import { 
  ArrowLeft, Mail, Phone, Calendar, User, GraduationCap, 
  CreditCard, BarChart, Download, MapPin, Clock, BookOpen,
  Percent, Tag, FileText, Shield, Layers, Target, Star,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

const StudentDetails = ({ student, onBack, formatDate }) => {
  if (!student) return null;

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return '#4CAF50';
      case 'trial': return '#FF9800';
      case 'expiring': return '#FF5722';
      case 'inactive': return '#9E9E9E';
      default: return '#757575';
    }
  };

  const getPlanColor = (plan) => {
    switch(plan?.toLowerCase()) {
      case 'premium': return '#9C27B0';
      case 'basic': return '#2196F3';
      case 'trial': return '#FF9800';
      case 'yearly': return '#00BCD4';
      case 'monthly': return '#4CAF50';
      default: return '#757575';
    }
  };

  // Calculate subscription status based on dates
  const calculateStatus = () => {
    if (!student.startDate || !student.endDate) return 'inactive';
    
    const now = new Date();
    const endDate = new Date(student.endDate);
    const startDate = new Date(student.startDate);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'expired';
    
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 7) return 'expiring';
    return 'active';
  };

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    if (!student.endDate) return null;
    
    const now = new Date();
    const endDate = new Date(student.endDate);
    
    if (now > endDate) return 0;
    
    return Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  };

  const status = calculateStatus();
  const daysRemaining = calculateDaysRemaining();

  const handleExportDetails = () => {
    const details = `
Student Details Report
=====================
ID: ${student.id}
Name: ${student.firstname} ${student.lastname}
Email: ${student.email}
Phone: ${student.mobile || student.phone || 'Not provided'}
Gender: ${student.gender || 'Not specified'}
Date of Birth: ${formatDate(student.dob)}
City: ${student.city || 'Not specified'}
State: ${student.state || 'Not specified'}

Course Information
------------------
Course Type: ${student.coursetype || 'Not specified'}
Course Name: ${student.courseName || 'Not specified'}
Standards: ${student.standards?.join(', ') || student.selectedStandard?.join(', ') || 'Not specified'}
Subjects: ${student.subjects?.join(', ') || 'Not specified'}

Selected Course Details
-----------------------
Course: ${student.selectedCourse?.name || student.selectedCourse?.courseName || 'Not specified'}
Course ID: ${student.selectedCourse?.id || student.selectedCourse?.courseId || 'Not specified'}
Plan: ${student.selectedCourse?.plan || 'Not specified'}

Subscription Details
--------------------
Plan: ${student.plan || 'Not specified'}
Status: ${status}
Start Date: ${formatDate(student.startDate)}
End Date: ${formatDate(student.endDate)}
Days Remaining: ${daysRemaining !== null ? daysRemaining : 'N/A'}

Payment Information
-------------------
Payment Method: ${student.paymentMethod || 'Not specified'}
Amount Paid: ${student.amountPaid || '0'}
Discount Amount: ${student.discountAmount || '0'}
Discount Percentage: ${student.discountPercentage || '0'}%
Payment ID: ${student.paymentId || 'Not specified'}
Payer ID: ${student.payerId || 'Not specified'}
Coupon Used: ${student.couponUsed || 'None'}
Payment Action: ${student.action || 'Not specified'}

Study Preferences
-----------------
Comfortable Daily Hours: ${student.comfortableDailyHours || 3} hours
Proficiency Level: ${student.severity || 'Not specified'}
Learning Mode: ${student.access?.mode || 'Not specified'}

Additional Information
----------------------
Photo: ${student.photo ? 'Uploaded' : 'Not uploaded'}
Class: ${student._class || 'Not specified'}
Total Payments: ${student.paymentHistory?.length || 0}

Payment History Details
------------------------
${student.paymentHistory?.map((payment, index) => `
Payment ${index + 1}:
  Date: ${formatDate(payment.date)}
  Action: ${payment.action || 'N/A'}
  Plan: ${payment.plan || 'N/A'}
  Amount: ₹${payment.amountPaid || '0'}
  Discount: ${payment.discountPercentage || '0'}% (₹${payment.discountAmount || '0'})
  Coupon: ${payment.couponUsed || 'None'}
  Payment ID: ${payment.paymentId || 'N/A'}
`).join('\n') || 'No payment history'}

Report Generated: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([details], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `student_${student.id}_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format payment history for display
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
              <span className="payment-date">{formatDate(payment.date)}</span>
            </div>
            <div className="payment-details">
              <div className="payment-row">
                <span className="label">Action:</span>
                <span className="value">{payment.action || 'N/A'}</span>
              </div>
              <div className="payment-row">
                <span className="label">Plan:</span>
                <span className="value">{payment.plan || 'N/A'}</span>
              </div>
              <div className="payment-row">
                <span className="label">Amount:</span>
                <span className="value amount">₹{payment.amountPaid || '0'}</span>
              </div>
              {payment.discountPercentage && (
                <div className="payment-row">
                  <span className="label">Discount:</span>
                  <span className="value discount">
                    {payment.discountPercentage}% (₹{payment.discountAmount || '0'})
                  </span>
                </div>
              )}
              {payment.couponUsed && (
                <div className="payment-row">
                  <span className="label">Coupon:</span>
                  <span className="value coupon-code">{payment.couponUsed}</span>
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
            <span className="student-email">
              <Mail size={14} /> {student.email}
            </span>
            <span className={`status-badge`} style={{backgroundColor: getStatusColor(status)}}>
              {status.toUpperCase()}
              {daysRemaining !== null && daysRemaining <= 7 && (
                <span className="days-count"> ({daysRemaining} days remaining)</span>
              )}
            </span>
            <span className={`plan-badge`} style={{backgroundColor: getPlanColor(student.plan)}}>
              {student.plan ? student.plan.toUpperCase() : 'N/A'}
            </span>
          </div>
          {student.city || student.state ? (
            <div className="location-info">
              <MapPin size={14} />
              {student.city && <span>{student.city}</span>}
              {student.city && student.state && <span>, </span>}
              {student.state && <span>{student.state}</span>}
            </div>
          ) : null}
        </div>
      </div>

      <div className="details-grid">
        {/* Personal Information Card */}
        <div className="details-card">
          <div className="card-header">
            <User size={20} />
            <h3>Personal Information</h3>
          </div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Full Name:</span>
              <span className="info-value">
                {student.firstname} {student.lastname}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">
                <Mail size={16} /> {student.email}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span className="info-value">
                <Phone size={16} /> {student.mobile || student.phone || 'Not provided'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Date of Birth:</span>
              <span className="info-value">
                <Calendar size={16} /> {formatDate(student.dob)}
              </span>
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

        {/* Course Information Card */}
        <div className="details-card">
          <div className="card-header">
            <GraduationCap size={20} />
            <h3>Course Information</h3>
          </div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Course Type:</span>
              <span className="info-value">
                {student.coursetype || 'Not specified'}
                {student.coursetype && (
                  <span className="course-mode">
                    ({student.coursetype === 'NEET' || student.coursetype === 'JEE' ? 'Professional' : 'Academics'})
                  </span>
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Course Name:</span>
              <span className="info-value">{student.courseName || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Selected Course:</span>
              <span className="info-value">
                {student.selectedCourse?.name || student.selectedCourse?.courseName || 'Not specified'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Selected Standard:</span>
              <span className="info-value">
                {student.selectedStandard?.join(', ') || student.standards?.join(', ') || 'Not specified'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Subjects:</span>
              <span className="info-value">
                {student.subjects?.join(', ') || 'Not specified'}
                {student.access?.subjects && student.access.subjects.length > 0 && (
                  <span className="access-subjects">
                    <br />Access: {student.access.subjects.join(', ')}
                  </span>
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Learning Mode:</span>
              <span className="info-value">
                {student.access?.mode || (student.coursetype === 'NEET' || student.coursetype === 'JEE' ? 'Professional' : 'Academics')}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="details-card">
          <div className="card-header">
            <Calendar size={20} />
            <h3>Subscription Details</h3>
          </div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Plan Type:</span>
              <span className="info-value plan-highlight" style={{color: getPlanColor(student.plan)}}>
                {student.plan ? student.plan.toUpperCase() : 'Not specified'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Start Date:</span>
              <span className="info-value">
                <Clock size={16} /> {formatDate(student.startDate)}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">End Date:</span>
              <span className="info-value">
                <Clock size={16} /> {formatDate(student.endDate)}
              </span>
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
              <span className="info-label">Subscription Status:</span>
              <span className="info-value status-text" style={{color: getStatusColor(status)}}>
                {status.toUpperCase()}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Account Created:</span>
              <span className="info-value">
                {student._class ? <CheckCircle size={16} color="#4CAF50" /> : <XCircle size={16} color="#f44336" />}
                {student._class ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Information Card */}
        <div className="details-card">
          <div className="card-header">
            <CreditCard size={20} />
            <h3>Payment Information</h3>
          </div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Payment Method:</span>
              <span className="info-value">{student.paymentMethod || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Amount Paid:</span>
              <span className="info-value amount-paid">₹{student.amountPaid || '0'}</span>
            </div>
            {student.discountAmount && (
              <div className="info-row">
                <span className="info-label">Discount Amount:</span>
                <span className="info-value discount-amount">₹{student.discountAmount}</span>
              </div>
            )}
            {student.discountPercentage && (
              <div className="info-row">
                <span className="info-label">Discount Percentage:</span>
                <span className="info-value discount-percent">
                  <Percent size={16} /> {student.discountPercentage}%
                </span>
              </div>
            )}
            {student.couponUsed && (
              <div className="info-row">
                <span className="info-label">Coupon Used:</span>
                <span className="info-value coupon-info">
                  <Tag size={16} /> {student.couponUsed}
                </span>
              </div>
            )}
            {student.action && (
              <div className="info-row">
                <span className="info-label">Payment Action:</span>
                <span className="info-value action-type">{student.action}</span>
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

        {/* Study Preferences Card */}
        <div className="details-card">
          <div className="card-header">
            <BarChart size={20} />
            <h3>Study Preferences & Proficiency</h3>
          </div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Comfortable Daily Hours:</span>
              <span className="info-value highlight">
                <Clock size={16} /> {student.comfortableDailyHours || 3} hours
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Proficiency Level:</span>
              <span className="info-value severity-level">
                {student.severity || 'Not specified'}
                {student.severity && (
                  <span className="severity-indicator" style={{
                    backgroundColor: student.severity.includes('Competent') ? '#4CAF50' :
                                   student.severity.includes('Beginner') ? '#FF9800' :
                                   student.severity.includes('Advanced') ? '#2196F3' : '#757575'
                  }}></span>
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Learning Access:</span>
              <span className="info-value">
                <Shield size={16} /> {student.access?.mode || 'Standard'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Access Card ID:</span>
              <span className="info-value code">
                {student.access?.cardId || student.courseName?.toLowerCase() || 'N/A'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Available Standards:</span>
              <span className="info-value">
                <Layers size={16} /> {student.access?.standards?.join(', ') || 'N/A'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Available Subjects:</span>
              <span className="info-value">
                <BookOpen size={16} /> {student.access?.subjects?.join(', ') || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* System Information Card */}
        <div className="details-card">
          <div className="card-header">
            <FileText size={20} />
            <h3>System Information</h3>
          </div>
          <div className="card-content">
            <div className="info-row">
              <span className="info-label">Database Class:</span>
              <span className="info-value class-name">{student._class || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Student ID:</span>
              <span className="info-value student-id-display">{student.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Photo Uploaded:</span>
              <span className="info-value">
                {student.photo ? (
                  <>
                    <CheckCircle size={16} color="#4CAF50" /> Yes
                    <button 
                      className="view-photo-btn"
                      onClick={() => window.open(student.photo, '_blank')}
                    >
                      View Photo
                    </button>
                  </>
                ) : (
                  <>
                    <XCircle size={16} color="#f44336" /> No
                  </>
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Account Status:</span>
              <span className="info-value">
                {student._class ? (
                  <span className="active-status">
                    <CheckCircle size={16} color="#4CAF50" /> Registered in System
                  </span>
                ) : (
                  <span className="inactive-status">
                    <AlertCircle size={16} color="#FF9800" /> Not Registered
                  </span>
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Profile Completeness:</span>
              <div className="completeness-bar">
                <div 
                  className="completeness-fill"
                  style={{
                    width: `${student.photo && student.dob && student.gender ? '100%' : 
                           student.dob && student.gender ? '75%' : 
                           student.dob || student.gender ? '50%' : '25%'}`
                  }}
                ></div>
              </div>
              <span className="completeness-text">
                {student.photo && student.dob && student.gender ? 'Complete' : 
                 student.dob && student.gender ? 'Mostly Complete' : 
                 student.dob || student.gender ? 'Partially Complete' : 'Basic'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Card */}
        <div className="details-card full-width">
          <div className="card-header">
            <CreditCard size={20} />
            <h3>Payment History ({student.paymentHistory?.length || 0})</h3>
          </div>
          <div className="card-content">
            {renderPaymentHistory()}
          </div>
        </div>

        {/* Course Details Card */}
        <div className="details-card full-width">
          <div className="card-header">
            <Target size={20} />
            <h3>Selected Course Details</h3>
          </div>
          <div className="card-content">
            <div className="course-details-grid">
              <div className="course-detail-item">
                <span className="detail-label">Course Name:</span>
                <span className="detail-value">
                  {student.selectedCourse?.name || student.selectedCourse?.courseName || 'N/A'}
                </span>
              </div>
              <div className="course-detail-item">
                <span className="detail-label">Course ID:</span>
                <span className="detail-value">
                  {student.selectedCourse?.id || student.selectedCourse?.courseId || 'N/A'}
                </span>
              </div>
              <div className="course-detail-item">
                <span className="detail-label">Plan Type:</span>
                <span className="detail-value plan-tag">
                  {student.selectedCourse?.plan || student.plan || 'N/A'}
                </span>
              </div>
              <div className="course-detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">
                  {student.startDate && student.endDate ? 
                    `${formatDate(student.startDate)} to ${formatDate(student.endDate)}` : 'N/A'}
                </span>
              </div>
              {student.selectedCourse && Object.keys(student.selectedCourse).length > 0 && (
                <div className="course-detail-item full-width">
                  <span className="detail-label">All Course Data:</span>
                  <pre className="course-json">
                    {JSON.stringify(student.selectedCourse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;