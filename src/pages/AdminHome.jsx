import React, { useState, useEffect } from 'react';
import { FiBook }                     from 'react-icons/fi';
import { useNavigate, useLocation }   from 'react-router-dom';
import './AdminHome.css';
import { API_BASE_URL, ADMIN_LAB_URL } from '../config';

const academicCards = [
  { id: 'kindergarten', subtitle: 'Kindergarten', title: 'Bright Beginnings' },
  { id: 'class1-5', subtitle: 'Class 1 - 5', title: 'Practice Zone' },
  { id: 'class6-12', subtitle: 'Class 6 - 12', title: 'Board Exam Kit' },
];

const professionalCards = [
  { id: 'jee', subtitle: 'JEE Exam', title: 'JEE Prep Material' },
  { id: 'neet', subtitle: 'NEET Exam', title: 'NEET Prep Material' },
];

const AdminHome = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [subjectsByCard, setSubjectsByCard] = useState({});
  const [current, setCurrent] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(true);
  const [mode, setMode] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedStandard, setSelectedStandard] = useState(currentUser?.role === 'admin' ? '' : currentUser?.standards);
  const [userRole, setUserRole] = useState(null);
  const [courseType, setCourseType] = useState(null);
  const [courseName, setCourseName] = useState(null);
  const [currSubjects, setCurrSubjects] = useState([]);
  const [currStandards, setCurrStandards] = useState([]);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [hasFetchedUserData, setHasFetchedUserData] = useState(false);

  useEffect(() => {
    // Check sessionStorage first
    const storedState = sessionStorage.getItem('adminReturnState');

    if (storedState) {
      const { cardId, mode: returnMode } = JSON.parse(storedState);

      if (returnMode && !mode) {
        setMode(returnMode);
      }

      if (cardId && !selectedCard) {
        setTimeout(() => {
          const cards = returnMode === 'academics' ? academicCards : professionalCards;
          const cardToSelect = cards.find(card => card.id === cardId);

          if (cardToSelect) {
            handleCardClick(cardToSelect);
          }
        }, 100);
      }

      // Clear storage after use
      sessionStorage.removeItem('adminReturnState');
    }

    // Also check location.state (in case it works)
    if (location.state?.returnToCard) {
      // ... your existing code
    }
  }, [location.state, mode, selectedCard]);

  useEffect(() => {
    // Prevent multiple executions
    if (hasCheckedSession && hasFetchedUserData) return;

    let isMounted = true;
    const controller = new AbortController();

    const checkSession = async () => {
      try {
        const start = performance.now();
        const resp = await fetch(`${API_BASE_URL}/checkSession`, {
          method: "GET",
          credentials: 'include',
          signal: controller.signal
        });

        if (!isMounted) return;

        const data = await resp.json();
        const end = performance.now();
        console.log(`Fetch admin home check session took ${end - start} ms`);

        if (data.status === 'failed') {
          navigate('/signin');
          return;
        }

        if (data.status === 'pass' && isMounted) {
          const storedUser = JSON.parse(localStorage.getItem('currentUser'));
          setCurrentUser(storedUser);
          setUserRole(storedUser?.role);
          setCourseType(storedUser?.courseType);
          setCourseName(storedUser?.courseName);

          if (!hasFetchedUserData) {
            // Fetch user data only once
            fetchUserData();
          }
          setHasCheckedSession(true);
        }
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          console.log("Session check failed:", err);
        }
      }
    };

    checkSession();

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate, hasCheckedSession, hasFetchedUserData]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      if (!currentUser) {
        console.log("No currentUser found");
        return;
      }

      console.log("Fetching data for user:", currentUser);
      console.log("Course name from user:", courseName);
      console.log("User email/gmail:", currentUser.gmail || currentUser.email || currentUser.id);

      // If user is admin, fetch all subjects
      if (currentUser.role === 'admin') {
        console.log("User is admin, skipping user data fetch");
        setHasFetchedUserData(true);
        return;
      }

      // For non-admin users, fetch their specific subjects and standards
      const requestBody = {
        userId: currentUser.gmail || currentUser.email || currentUser.id,
        courseName: courseName
      };

      console.log("Sending request to /getUserSubjects with:", requestBody);

      const response = await fetch(`${API_BASE_URL}/getUserSubjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (data.subjects) {
        console.log("Setting subjects:", data.subjects);
        setCurrSubjects(data.subjects);
      } else {
        console.log("No subjects in response");
        setCurrSubjects([]);
      }

      if (data.standards) {
        console.log("Setting standards:", data.standards);
        setCurrStandards(data.standards);
      } else {
        console.log("No standards in response");
        setCurrStandards([]);
      }

      setHasFetchedUserData(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      console.error('Error details:', error.message);
    } finally {
      setLoading(false);
      setHasFetchedUserData(true);
    }
  };

  const currentCardId = selectedCard?.id || null;
  const currentSubjects = currentCardId ? subjectsByCard[currentCardId] || [] : [];

  const handleAdd = () => {
    if (!current.trim() || currentCardId === null) return;
    setSubjectsByCard((prev) => {
      const copy = { ...prev };
      const arr = Array.isArray(copy[currentCardId]) ? [...copy[currentCardId]] : [];
      arr.push(current.trim());
      copy[currentCardId] = arr;
      return copy;
    });
    setCurrent('');
    setSelectedIndex(null);
  };

  const handleUpdate = () => {
    if (currentCardId === null || selectedIndex === null || !current.trim()) return;
    setSubjectsByCard((prev) => {
      const copy = { ...prev };
      const arr = [...(copy[currentCardId] || [])];
      arr[selectedIndex] = current.trim();
      copy[currentCardId] = arr;
      return copy;
    });
    setCurrent('');
    setSelectedIndex(null);
  };

  const handleDelete = () => {
    if (currentCardId === null || selectedIndex === null) return;
    setSubjectsByCard((prev) => {
      const copy = { ...prev };
      const arr = [...(copy[currentCardId] || [])];
      arr.splice(selectedIndex, 1);
      copy[currentCardId] = arr;
      return copy;
    });
    setCurrent('');
    setSelectedIndex(null);
  };

  const isSpecialSubject = (subjectName) => {
    const specials = [
      'NEET Previous Questions',
      'Formulas',
      'JEE Previous Questions',
      'Previous Questions',
      'Derivation' // ✅ ADDED: Derivation doesn't need standard
    ];
    return specials.includes(subjectName);
  };

  const handleSelectSubject = (idx, navigateToPage = false) => {
  const subjectsToShow = userRole === 'admin'
    ? subjectsByCard[selectedCard.id] || []
    : currSubjects;

  const selectedSubjectName = subjectsToShow[idx];

  // 1. Detect "Derivation" (Case-insensitive check is safer)
  if (selectedSubjectName?.trim().toLowerCase() === 'derivation' && navigateToPage) {
    const returnUrl = encodeURIComponent(window.location.origin);
    const card = encodeURIComponent(selectedCard.id);
    const currentMode = encodeURIComponent(mode);

    // 2. Build the full URL for the server route.
    const labUrl = `${ADMIN_LAB_URL}/admin?returnUrl=${returnUrl}&card=${card}&mode=${currentMode}`;
    
    // Save current state in the browser before leaving the React app
    sessionStorage.setItem('adminReturnState', JSON.stringify({ cardId: selectedCard.id, mode: mode }));
    
    // 3. Jump to the External Server
    window.location.href = labUrl;
    
    // 4. CRITICAL: Stop React from running navigate('/adminright') below
    return; 
  }

    const isSpecial = isSpecialSubject(selectedSubjectName);
    const isRestrictedCard = ['jee', 'neet', 'class1-5', 'class6-12'].includes(selectedCard?.id);

    if (isRestrictedCard && !isSpecial && !selectedStandard) {
      alert('Please select a standard before proceeding for this subject.');
      return;
    }

    setSelectedIndex(idx);
    setCurrent(selectedSubjectName || '');

    if (navigateToPage) {
      navigate('/adminright', {
        state: {
          cardId: currentCardId,
          subjectName: selectedSubjectName,
          standard: isSpecial ? (selectedStandard || "General") : selectedStandard,
          examTitle: selectedCard.title,
          examSubtitle: selectedCard.subtitle,
          courseName: mode,
        },
      });
    }
  };

  const handleCancelAll = () => {
    setSelectedIndex(null);
    setCurrent('');
    setMode(null);
    setSelectedCard(null);
    setSelectedStandard('');
  };

  const handleCancelSelection = () => {
    setSelectedIndex(null);
    setCurrent('');
  };

  const handleCardClick = (card) => {
    // Set default subjects based on card type
    if (!subjectsByCard[card.id]) {
      let defaults = [];
      if (card.id === 'jee') {
        defaults = ['Physics', 'Chemistry', 'Maths', 'Derivation']; // ✅ ADDED Derivation to JEE
      } else if (card.id === 'neet') {
        defaults = ['Physics', 'Chemistry', 'Zoology', 'Botany', 'NEET Previous Questions', 'Formulas', 'Derivation']; // ✅ ADDED Derivation to NEET
      }
      setSubjectsByCard((prev) => ({
        ...prev,
        [card.id]: defaults,
      }));
    }

    // For non-admin users, if currSubjects is empty, use defaults
    if (userRole !== 'admin' && currSubjects.length === 0) {
      let defaults = [];
      let standardDefaults = [];

      if (card.id === 'jee') {
        defaults = ['Physics', 'Chemistry', 'Maths', 'Derivation']; // ✅ ADDED Derivation
        standardDefaults = ['11', '12'];
      } else if (card.id === 'neet') {
        defaults = ['Physics', 'Chemistry', 'Zoology', 'Botany', 'NEET Previous Questions', 'Formulas', 'Derivation']; // ✅ ADDED Derivation
        standardDefaults = ['11', '12'];
      } else if (card.id === 'class1-5') {
        defaults = ['English', 'Maths', 'Science'];
        standardDefaults = ['1', '2', '3', '4', '5'];
      } else if (card.id === 'class6-12') {
        defaults = ['Physics', 'Chemistry', 'Maths', 'Biology'];
        standardDefaults = ['6', '7', '8', '9', '10', '11', '12'];
      } else if (card.id === 'kindergarten') {
        defaults = ['ABCs', 'Numbers', 'Shapes'];
        standardDefaults = ['KG'];
      }

      setCurrSubjects(defaults);
      setCurrStandards(standardDefaults);
    }

    setSelectedIndex(null);
    setCurrent('');
    setSelectedStandard('');
    setSelectedCard(card);
  };

  return (
    <div className="container">
      {mode !== null && selectedCard !== null && (
        <>
          <button className="dis" onClick={() => setMenuOpen(!menuOpen)}>☰</button>

          <aside className={`sidebar ${menuOpen ? '' : 'hidden'}`}>
            <h2 className="sub">Subjects</h2>
            <ul>
              {(() => {
                const subjectsToShow = userRole === 'admin'
                  ? subjectsByCard[selectedCard.id] || []
                  : currSubjects;

                if (!subjectsToShow || subjectsToShow.length === 0) {
                  return <li className="empty">No subjects in this category</li>;
                }

                return subjectsToShow.map((subj, idx) => {
                  // NEW: A subject is only disabled if it's a restricted card, NOT a special subject, AND no standard is picked
                  const restricted = ['jee', 'neet', 'class6-12'].includes(selectedCard?.id) &&
                    !isSpecialSubject(subj) &&
                    !selectedStandard;

                  return (
                    <li
                      key={idx}
                      className={`${selectedIndex === idx ? 'active' : ''} ${restricted ? 'disabled' : ''}`}
                      onClick={() => handleSelectSubject(idx, true)}
                    >
                      <FiBook className="icon" />
                      <span>{subj}</span>
                    </li>
                  );
                });
              })()}
            </ul>
          </aside>
        </>
      )}

      <section className="main">
        <div className="header">
          {mode === null ? (
            <div className="mode-switch-container">
              {(userRole === 'admin' || courseType === 'academics') && <button className="mode-button uniform" onClick={() => setMode('academics')}>Academics</button>}
              {(userRole === 'admin' || courseType === 'professional') && <button className="mode-button uniform" onClick={() => setMode('professional')}>Professional Training</button>}
              {userRole === 'admin' && (<button className="mode-button uniform" onClick={() => navigate('/manage-account')}>Manage Account</button>)}

            </div>
          ) : (
            <>
              {(selectedCard?.id === 'jee' || selectedCard?.id === 'neet') ? (
                <div className="form">
                  <div className="selected-info">
                    <strong>Selected:</strong>&nbsp;
                    <span className="italic-text">
                      {selectedCard.title} ({selectedCard.subtitle})
                    </span>
                  </div>

                  <div className="standard-select">
                    <label>Select Standard:</label>
                    <select
                      value={selectedStandard}
                      onChange={(e) => setSelectedStandard(e.target.value)}
                    >
                      <option value="">-- Select --</option>
                      {userRole !== 'admin' ? (
                        currStandards && currStandards.length > 0 ? (
                          currStandards.map((standard, idx) => (
                            <option key={idx} value={standard}>{standard}</option>
                          ))
                        ) : (
                          <option value="" disabled>No standards available</option>
                        )
                      ) : (
                        <>
                          <option value="11">11</option>
                          <option value="12">12</option>
                        </>
                      )}
                    </select>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      <em>Note: Subjects like "Derivation", "Formulas", "Previous Questions" don't require standard selection</em>
                    </p>
                  </div>

                  <div className="card-cancel-wrapper">
                    <button className="card-cancel-button" onClick={() => setSelectedCard(null)}>Back</button>
                    <button className="card-cancel-button" onClick={handleCancelAll}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="subs">Subjects</h3>

                  <div className="summary-box">
                    {selectedCard === null ? (
                      <span>Select a card above to manage its subjects</span>
                    ) : (() => {
                      // Determine which subjects to show in the dropdown
                      const dropdownSubjects = userRole === 'admin'
                        ? subjectsByCard[selectedCard.id] || []
                        : currSubjects;

                      return dropdownSubjects.length === 0 ? (
                        <span>No subjects available in this card</span>
                      ) : (
                        <select
                          className="summary-dropdown"
                          value={selectedIndex ?? ''}
                          onChange={(e) => handleSelectSubject(Number(e.target.value))}
                          disabled={(selectedCard?.id === 'jee' || selectedCard?.id === 'neet') && !selectedStandard}
                        >
                          <option value="" disabled>Select a subject</option>
                          {dropdownSubjects.map((subj, idx) => (
                            <option key={idx} value={idx}>{subj}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>

                  {selectedCard === null ? (
                    <div className="cards-wrapper">
                      <div className="cards-container">
                        {(mode === 'academics' ? academicCards : professionalCards).map((cardObj) => (
                          userRole === 'admin' ? (
                            <div key={cardObj.id} className="card" onClick={() => handleCardClick(cardObj)}>
                              <div className="card-subtitle">{cardObj.subtitle}</div>
                              <div className="card-title">{cardObj.title}</div>
                              <button className="card-button">Select</button>
                            </div>
                          ) : (cardObj.id === courseName && (<div key={cardObj.id} className="card" onClick={() => handleCardClick(cardObj)}>
                            <div className="card-subtitle">{cardObj.subtitle}</div>
                            <div className="card-title">{cardObj.title}</div>
                            <button className="card-button">Select</button>
                          </div>))
                        ))}
                      </div>
                      <div className="card-cancel-wrapper">
                        <button className="card-cancel-button" onClick={handleCancelAll}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="form">
                      <div className="selected-info">
                        <strong>Selected Card:</strong>&nbsp;
                        <span className="italic-text">
                          {selectedCard.title} ({selectedCard.subtitle})
                        </span>
                      </div>
                      {/* 👇 Show Standard Select if applicable */}
                      {['class1-5', 'class6-12'].includes(selectedCard?.id) && (userRole === 'admin' ? subjectsByCard[selectedCard.id] || [] : currSubjects).length > 0 && (
                        <div className="standard-select">
                          <label>Select Standard:</label>
                          <select
                            value={selectedStandard}
                            onChange={(e) => setSelectedStandard(e.target.value)}
                          >
                            <option value="">-- Select --</option>
                            {selectedCard?.id === 'class1-5' && (
                              <>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                                <option value="5">5</option>
                              </>
                            )}
                            {selectedCard?.id === 'class6-12' && (
                              <>
                                <option value="6">6</option>
                                <option value="7">7</option>
                                <option value="8">8</option>
                                <option value="9">9</option>
                                <option value="10">10</option>
                                <option value="11">11</option>
                                <option value="12">12</option>
                              </>
                            )}
                          </select>
                          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            <em>Note: "Derivation" doesn't require standard selection</em>
                          </p>
                        </div>
                      )}
                      <input
                        type="text"
                        placeholder="Subject Name"
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                      />

                      <div className="buttons">
                        <button onClick={handleAdd}>Add New</button>
                        <button onClick={handleUpdate} disabled={selectedIndex === null}>Update</button>
                        <button onClick={handleDelete} disabled={selectedIndex === null}>Delete</button>
                        <button onClick={handleCancelSelection}>Cancel</button>
                      </div>

                      <div className="card-cancel-wrapper">
                        <button className="card-cancel-button" onClick={() => setSelectedCard(null)}>Back</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminHome;