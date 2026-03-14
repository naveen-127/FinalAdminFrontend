import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import backgroundImage from '../assets/admin-bg.jpg';

const Home = () => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    const user = JSON.parse(localStorage.getItem('user')); // Adjust key if needed
    if (user && user.role === 'admin') {
      navigate('/adminhome');
    } else {
      navigate('/signin');
    }
  };

  return (
    <div
      className="admin-home"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="welcome-box">
        <h1>Welcome to Admin Dashboard</h1>
        <p>You can manage all your content and settings here.</p>
        <button className="home-button" onClick={handleButtonClick}>
          Enter Admin Panel
        </button>
      </div>
    </div>
  );
};

export default Home;
