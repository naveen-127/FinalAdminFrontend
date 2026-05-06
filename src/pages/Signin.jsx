import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signin.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { API_BASE_URL } from '../config';

const SignIn = () => {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    if (hasCheckedSession) return;

    // Check if user is already logged in via localStorage
    const currentUser = localStorage.getItem('currentUser');

    if (currentUser) {
      console.log("✅ User found in localStorage, redirecting to adminhome");
      const userData = JSON.parse(currentUser);
      console.log("🔍 User data from localStorage:", userData);
      window.dispatchEvent(new Event('userLogin'));
      navigate('/adminhome', { replace: true });
    } else {
      console.log("❌ No user in localStorage, staying on signin page");
      // No need to navigate anywhere - we're already on the signin page
    }

    setHasCheckedSession(true);
  }, [navigate, hasCheckedSession]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const start = performance.now();

    fetch(`${API_BASE_URL}/signIn`, {
      method: "POST",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userName: userName, password: password })
    })
      .then(resp => resp.json())
      .then(data => {
        const end = performance.now();
        console.log(`Fetch for login in sign in took ${end - start} ms`);
        console.log("🔍 Login response data:", data);

        if (data.status === 'failed') {
          setMessage("Invalid username or password");
        } else if (data.status === 'pass') {
          // Store ALL user data including subjects and standards
          const userData = {
            username: data.userName,
            role: data.role,
            email: data.userGmail,
            phone: data.phoneNumber,
            courseType: data.coursetype,
            courseName: data.courseName,
            subjects: data.subjects || [],      // Added subjects with fallback
            standards: data.standards || [],    // Added standards with fallback
            id: data.id                         // Added user ID
          };
          localStorage.setItem('currentUser', JSON.stringify(userData));
          setMessage("Login successful!");

          setTimeout(() => {
            window.dispatchEvent(new Event('userLogin'));
            navigate('/adminhome', { replace: true });
          }, 1000);
        }
      })
      .catch(err => {
        console.error("Login failed", err);
        setMessage("Something went wrong. Please try again.");
      });
  };

  return (
    <div className="signin-container">
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit} className="signin-form">
        <input
          type="text"
          placeholder="Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
        />
        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button type="submit">Sign In</button>
      </form>
      {message && (
        <p className={`signin-message ${message === 'Login successful!' ? 'success' : 'error'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default SignIn;