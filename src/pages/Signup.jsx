import React, { useState, useEffect } from 'react';
import { useNavigate }                from 'react-router-dom';
import './Signin.css';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [allowedSubjects, setAllowedSubjects] = useState([]);
  const [allowedStandard, setAllowedStandard] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const subjectsByCard = {
    kindergarten: ['English', 'Math', 'Rhymes'],
    'class1-5': ['English', 'Math', 'EVS'],
    'class6-12': ['Physics', 'Chemistry', 'Math', 'Biology', 'English'],
    jee: ['Physics', 'Chemistry', 'Math'],
    neet: ['Physics', 'Chemistry', 'Biology'],
  };

  // Set default subjects for JEE/NEET but allow manual changes
  useEffect(() => {
    if (selectedCard === 'jee') {
      setAllowedSubjects(['Physics', 'Chemistry', 'Math']);
    } else if (selectedCard === 'neet') {
      setAllowedSubjects(['Physics', 'Chemistry', 'Biology']);
    } else {
      setAllowedSubjects([]); // For other cards, manual selection
    }
  }, [selectedCard]);

  const handleSubjectChange = (subject) => {
    if (allowedSubjects.includes(subject)) {
      setAllowedSubjects(allowedSubjects.filter((s) => s !== subject));
    } else {
      setAllowedSubjects([...allowedSubjects, subject]);
    }
  };

  const handleSignup = (e) => {
    e.preventDefault();

    if (!username || !email || !password || !selectedCard) {
      setMessage('Please fill in all required fields.');
      return;
    }

    if ((selectedCard === 'jee' || selectedCard === 'neet') && !allowedStandard) {
      setMessage('Please select a standard for JEE/NEET.');
      return;
    }

    if (allowedSubjects.length === 0) {
      setMessage('Please select at least one subject.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.find(user => user.username === username)) {
      setMessage('Username already exists.');
      return;
    }

    const newUser = {
      username,
      email,
      password,
      role: 'user',
      access: {
        cardId: selectedCard,
        subjects: allowedSubjects,
        standard: (selectedCard === 'jee' || selectedCard === 'neet') ? allowedStandard : null,
      },
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    setMessage('Signup successful! Redirecting...');
    setTimeout(() => navigate('/signin'), 1500);
  };

  return (
    <div className="signin-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup} className="signin-form">
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <select value={selectedCard} onChange={(e) => setSelectedCard(e.target.value)} required>
          <option value="">Select Card</option>
          <option value="kindergarten">Kindergarten</option>
          <option value="class1-5">Class 1 - 5</option>
          <option value="class6-12">Class 6 - 12</option>
          <option value="jee">JEE</option>
          <option value="neet">NEET</option>
        </select>

        {(selectedCard === 'jee' || selectedCard === 'neet') && (
          <select value={allowedStandard} onChange={(e) => setAllowedStandard(e.target.value)} required>
            <option value="">Select Standard</option>
            <option value="11">11</option>
            <option value="12">12</option>
          </select>
        )}

        {selectedCard && (
          <div className="subject-checkboxes">
            <label>Select Subjects:</label>
            {subjectsByCard[selectedCard]?.map((subject) => (
              <div key={subject}>
                <input
                  type="checkbox"
                  id={subject}
                  checked={allowedSubjects.includes(subject)}
                  onChange={() => handleSubjectChange(subject)}
                />
                <label htmlFor={subject}>{subject}</label>
              </div>
            ))}
          </div>
        )}

        <button type="submit">Sign Up</button>
      </form>

      {message && (
        <p className={`signin-message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Signup;
