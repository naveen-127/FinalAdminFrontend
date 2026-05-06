import React, { useEffect, useState, useRef }        from 'react';
import { Link, useNavigate }                         from 'react-router-dom';
import './Navbar.css';
import logo                                          from '../assets/logo.png';
import { FaUser, FaEnvelope, FaPhone, FaSignOutAlt, FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import { API_BASE_URL }                              from '../config';


const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const notifRef = useRef();

    const updateUser = () => {
    const storedUser = JSON.parse(localStorage.getItem('currentUser'));
   // console.log("UpdateUser triggered, storedUser = ", storedUser);
    setCurrentUser(storedUser);
  };
useEffect(() => {
    // Always check server-side session to prevent showing old user
    fetch(`${API_BASE_URL}/checkSession`, {
      // fetch('https://trilokinnovations-api-prod.trilokinnovations.com/test/checkSession',{
      method: "GET",
      credentials: 'include'
    })
      .then(resp => resp.json())
      .then(data => {
        if (data.status === 'pass') {
          const userData = {
            username: data.userName,
            phone: data.phoneNumber,
            role: data.role,
            courseType: data.coursetype,
            courseName: data.courseName,
            email: data.userGmail,
            id: data.id,
            subjects: data.subjects || [],
            standards: data.standards || [],
          };
          localStorage.setItem('currentUser', JSON.stringify(userData));
          setCurrentUser(userData);
        } else {
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
      });
  }, []);

useEffect(() => {
    updateUser();

    // Listen for custom login/logout events
    window.addEventListener('userLogin', updateUser);
    window.addEventListener('userLogout', updateUser);

    // Optional: update on localStorage change (cross-tab sync)
    window.addEventListener('storage', updateUser);

    return () => {
      window.removeEventListener('userLogin', updateUser);
      window.removeEventListener('userLogout', updateUser);
      window.removeEventListener('storage', updateUser);
    };
  }, []);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      if (currentUser.role === 'admin') {
        const res = await fetch(`${API_BASE_URL}/notifications`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.filter(n => n.status === 'PENDING' && n.type === 'RESCHEDULE_REQUEST'));
        }
      } else if (currentUser.role === 'teacher') {
        const res = await fetch(`${API_BASE_URL}/notifications/teacher/${currentUser.id}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.filter(n => n.status === 'ACCEPTED' || n.status === 'DECLINED'));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [currentUser]);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const toggleNotifications = () => setShowNotifications((prev) => !prev);

  const handleAction = async (id, action) => {
    try {
      const url = action === 'dismiss' ? `${API_BASE_URL}/notifications/${id}` : `${API_BASE_URL}/notifications/${id}/${action}`;
      const res = await fetch(url, {
        method: action === 'dismiss' ? 'DELETE' : 'PUT',
        credentials: 'include'
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
     const start = performance.now();
    fetch(`${API_BASE_URL}/logout`,{
     // fetch(`https://api-test.trilokinnovations.com/logout`,{
      // fetch('https://trilokinnovations-api-prod.trilokinnovations.com/test/logout',{
      method:"GET",
      credentials:'include'
    }).then(resp=> resp.text())
    .then(text=>{
      const end = performance.now(); // End time
      console.log(`Fetch for navbar took ${end - start} ms`);
      //console.log("inside logout",text)
      if(text==='pass'){
        localStorage.removeItem('currentUser');
    setCurrentUser(null);
     window.dispatchEvent(new Event('userLogout')); 

    setDropdownOpen(false);
    navigate('/signin')
      }
      if(text==="failed"){
        localStorage.removeItem('currentUser');
         window.dispatchEvent(new Event('userLogout')); 

    setCurrentUser(null);
    setDropdownOpen(false);
    navigate('/signin')
      }
    }).catch(()=>{
      // /console.log(err)
    })
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setDropdownOpen(false);
    window.dispatchEvent(new Event('userLogout'));
    navigate('/signin');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">
          <img src={logo} alt="Logo" className="logo-img" />
        </Link>
      </div>

      <ul className="navbar-links">{/* Add more nav links if needed */}</ul>

      <div className="navbar-signin" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'teacher') && (
          <div className="notification-wrapper" ref={notifRef} style={{ position: 'relative' }}>
            <FaBell size={20} color="#333" style={{ cursor: 'pointer' }} onClick={toggleNotifications} />
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                {notifications.length}
              </span>
            )}
            {showNotifications && (
              <div className="notification-dropdown" style={{ position: 'absolute', top: '40px', right: '-10px', width: '300px', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px', zIndex: 1000, padding: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Notifications</h4>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>No new notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} style={{ background: '#f9f9f9', padding: '10px', borderRadius: '6px', marginBottom: '10px', fontSize: '13px' }}>
                      {currentUser.role === 'admin' ? (
                        <>
                          <p style={{ margin: '0 0 5px 0' }}><strong>{notif.teacherName}</strong> requested to reschedule <strong>{notif.batchName}</strong>.</p>
                          <p style={{ margin: '0 0 10px 0', color: '#666' }}>From: {notif.oldDate} <br/> To: {notif.newDate}</p>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => handleAction(notif.id, 'accept')} style={{ flex: 1, padding: '6px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><FaCheck /> Accept</button>
                            <button onClick={() => handleAction(notif.id, 'decline')} style={{ flex: 1, padding: '6px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><FaTimes /> Decline</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: notif.status === 'ACCEPTED' ? '#28a745' : '#dc3545' }}>Request {notif.status}</p>
                          <p style={{ margin: '0 0 10px 0', color: '#333' }}>{notif.message}</p>
                          <button onClick={() => handleAction(notif.id, 'dismiss')} style={{ width: '100%', padding: '6px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>Dismiss</button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {!currentUser ? (
          <Link to="/signin" className="signin-button">Sign In</Link>
        ) : (
          <div className="user-dropdown" ref={dropdownRef}>
            <button className="user-button" onClick={toggleDropdown}>
              {currentUser.username}
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
  <p><FaUser size={15} style={{ marginRight: '10px' }} /><strong>Name:</strong> {currentUser.username}</p>
  {currentUser.email && (
    <p><FaEnvelope size={15} style={{ marginRight: '10px' }} /><strong>Email:</strong> {currentUser.email}</p>
  )}
  {currentUser.phone && (
    <p><FaPhone size={15} style={{ marginRight: '10px' }} /><strong>Phone:</strong> {currentUser.phone}</p>
  )}
  <button onClick={handleLogout} className="logout-button">
    <FaSignOutAlt size={15} style={{ marginRight: '10px' }} /> Logout
  </button>
</div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
