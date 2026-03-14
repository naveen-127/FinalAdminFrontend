import React, { useState, useEffect }             from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar                                     from "./components/Navbar";
import Footer                                     from './components/Footer';
import Home                                       from './pages/Home';
import Signup                                     from './pages/Signup';
import Signin                                     from './pages/Signin';
import AdminHome                                  from './pages/AdminHome'; // Assuming you have this page
import AdminRight                                 from './pages/AdminRight';
import ManageAccount                              from './pages/ManageAccount'; // Assuming you have this page
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/adminhome" element={<AdminHome />} />
          <Route path="/adminright" element={<AdminRight />} />
          <Route path="/manage-account" element={<ManageAccount />} />
          {/* Add more routes as needed */}
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 