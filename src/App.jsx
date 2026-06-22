import React, { useState, useEffect }             from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar                                     from "./components/Navbar";
import Footer                                     from './components/Footer';
import Home                                       from './pages/Home';
import Signup                                     from './pages/Signup';
import Signin                                     from './pages/Signin';
import AdminHome                                  from './pages/AdminHome'; // Assuming you have this page
import AdminRight                                 from './pages/AdminRight';
import BoardExam                                  from './pages/BoardExam';
import ManageAccount                              from './pages/ManageAccount'; // Assuming you have this page
import DerivationAdmin                            from './pages/DerivationAdmin';
import "./App.css";

function AppContent() {
  const location = useLocation();
  const isDerivationRoute = location.pathname === "/adminhome/derivation";

  return (
    <div className="app-container">
      {!isDerivationRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/adminhome" element={<AdminHome />} />
        <Route path="/adminright" element={<AdminRight />} />
        <Route path="/boardexam" element={<BoardExam />} />
        <Route path="/manage-account" element={<ManageAccount />} />
        <Route path="/adminhome/derivation" element={<DerivationAdmin />} />
        {/* Add more routes as needed */}
      </Routes>
      {!isDerivationRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App; 