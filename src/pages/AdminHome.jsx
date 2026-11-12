import React, { useState, useEffect }  from 'react';
import { FiBook }                      from 'react-icons/fi';
import { useNavigate, useLocation }    from 'react-router-dom';
import './AdminHome.css';
import { API_BASE_URL }                from '../config';
import { loadCurrentUser }             from '../utils/access';
import { MANAGE_SERVICE_IDS, parseServices, hasFullAccess } from './ManageAccount/services';

const academicCards = [
  { id: 'kindergarten', subtitle: 'Kindergarten', title: 'Bright Beginnings' },
  { id: 'class1-5', subtitle: 'Class 1 - 5', title: 'Practice Zone' },
  { id: 'class6-12', subtitle: 'Class 6 - 12', title: 'Board Exam' },
];

const professionalCards = [
  { id: 'jee', subtitle: 'JEE Exam', title: 'JEE Prep Material' },
  { id: 'neet', subtitle: 'NEET Exam', title: 'NEET Prep Material' },
];

// Subjects / standards each card owns (every card has its OWN list)
const CARD_DEFAULT_SUBJECTS = {
  jee: ['Physics', 'Chemistry', 'Maths', 'JEE Previous Questions', 'Derivation'],
  neet: ['Physics', 'Chemistry', 'Zoology', 'Botany', 'NEET Previous Questions', 'Formulas', 'Derivation'],
  'class1-5': ['English', 'Maths', 'Science'],
  'class6-12': ['Physics', 'Chemistry', 'Maths', 'Biology'],
  kindergarten: ['ABCs', 'Numbers', 'Shapes'],
};

const CARD_DEFAULT_STANDARDS = {
  jee: ['11', '12'],
  neet: ['11', '12'],
  'class1-5': ['1', '2', '3', '4', '5'],
  'class6-12': ['6', '7', '8', '9', '10', '11', '12'],
  kindergarten: ['KG'],
};

// Admin starts with a ready list only for JEE / NEET (same as before)
const ADMIN_START_SUBJECTS = ['jee', 'neet'];

const normSubject = (s) => {
  const v = String(s || '').trim().toLowerCase();
  return v === 'mathematics' ? 'maths' : v;
};

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
  const [selectedStandard, setSelectedStandard] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [courseType, setCourseType] = useState(null);
  const [courseName, setCourseName] = useState(null);
  const [currSubjects, setCurrSubjects] = useState([]);   // teacher's allowed subjects (all courses)
  const [currStandards, setCurrStandards] = useState([]); // teacher's allowed standards
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [hasFetchedUserData, setHasFetchedUserData] = useState(false);

  // e.g. "jee,neet" → ["jee", "neet"]
  const courseNameList = React.useMemo(() => {
    if (!courseName) return [];
    if (Array.isArray(courseName)) return courseName;
    return courseName.split(',').map((s) => s.trim()).filter(Boolean);
  }, [courseName]);

  // ───────── Which home buttons may this user see? ─────────
  // One login can be teacher + admin at once (user.roles) → both accesses are combined.
  const roles = React.useMemo(() => {
    const r = Array.isArray(currentUser?.roles) && currentUser.roles.length
      ? currentUser.roles
      : [currentUser?.role || userRole];
    return r.filter(Boolean).map((x) => String(x).toLowerCase());
  }, [currentUser, userRole]);

  const isAdminUser = roles.includes('admin');
  const hasTeacherAccount = roles.includes('teacher');

  const adminServices = isAdminUser ? parseServices(currentUser?.service) : [];
  // no service  OR  "full"  → full access (Academics + Professional + Manage Account)
  const isFullAdmin = isAdminUser && (adminServices.length === 0 || hasFullAccess(currentUser?.service));
  const adminHasAcademics = isFullAdmin || adminServices.includes('academics');
  const adminHasProfessional = isFullAdmin || adminServices.includes('professional');

  // true  → sees ALL subjects/standards of the card (admin style)
  // false → only the teacher's own subjects/standards
  const courseAdmin = isAdminUser && (adminHasAcademics || adminHasProfessional);

  const teacherAcademics = hasTeacherAccount && (courseType === 'academics' || courseType === 'tutor');
  const teacherProfessional = hasTeacherAccount && courseType === 'professional';

  const showAcademics = adminHasAcademics || teacherAcademics;
  const showProfessional = adminHasProfessional || teacherProfessional;
  const showManageAccount = isAdminUser &&
    (isFullAdmin || adminServices.some((id) => MANAGE_SERVICE_IDS.includes(id)));

  const hasNoAccess = !!currentUser && !showAcademics && !showProfessional && !showManageAccount;

  useEffect(() => {
    const storedState = sessionStorage.getItem('adminReturnState');

    if (storedState) {
      const { cardId, mode: returnMode } = JSON.parse(storedState);

      if (returnMode && !mode) {
        setMode(returnMode);
      }

      if (cardId && !selectedCard) {
        setTimeout(() => {
          const cards = returnMode === 'academics' ? academicCards : professionalCards;
          const cardToSelect = cards.find((card) => card.id === cardId);

          if (cardToSelect) {
            handleCardClick(cardToSelect);
          }
        }, 100);
      }

      sessionStorage.removeItem('adminReturnState');
    }
  }, [location.state, mode, selectedCard]);

  useEffect(() => {
    if (hasCheckedSession && hasFetchedUserData) return;

    let isMounted = true;
    const controller = new AbortController();

    const checkSession = async () => {
      try {
        const start = performance.now();
        const resp = await fetch(`${API_BASE_URL}/checkSession`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
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
          // merges teacher + admin accounts that share email + password
          const storedUser = await loadCurrentUser();
          if (!isMounted) return;

          setCurrentUser(storedUser);
          setUserRole(storedUser?.role);
          setCourseType(storedUser?.courseType || storedUser?.coursetype);
          setCourseName(storedUser?.courseName || storedUser?.coursename);

          if (!hasFetchedUserData) {
            fetchUserData(storedUser);
          }
          setHasCheckedSession(true);
        }
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          console.log('Session check failed:', err);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate, hasCheckedSession, hasFetchedUserData]);

  // user is passed in explicitly (state is not updated yet when this runs)
  const fetchUserData = async (user = currentUser) => {
    setLoading(true);
    try {
      if (!user) {
        console.log('No currentUser found');
        return;
      }

      const userRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
      if (!userRoles.map((r) => String(r).toLowerCase()).includes('teacher')) {
        console.log('No teacher account, skipping user data fetch');
        return;
      }

      // What the teacher saved on their account (used if the API call fails)
      const ownSubjects = Array.isArray(user.subjects) ? user.subjects : [];
      const ownStandards = Array.isArray(user.standards) ? user.standards : [];

      try {
        const response = await fetch(`${API_BASE_URL}/getUserSubjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.gmail || user.email || user.id,
            courseName: user.courseName || user.coursename,
          }),
        });

        if (!response.ok) throw new Error(`getUserSubjects ${response.status}`);
        const data = await response.json();

        setCurrSubjects(data.subjects && data.subjects.length ? data.subjects : ownSubjects);
        setCurrStandards(data.standards && data.standards.length ? data.standards : ownStandards);
      } catch (apiErr) {
        console.warn('getUserSubjects failed, using the teacher account data:', apiErr.message);
        setCurrSubjects(ownSubjects);
        setCurrStandards(ownStandards);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setHasFetchedUserData(true);
    }
  };

  const currentCardId = selectedCard?.id || null;

  const isSpecialSubject = (subjectName) => {
    const specials = [
      'NEET Previous Questions',
      'JEE Previous Questions',
      'Formulas',
      'Previous Questions',
      'Derivation',
    ];
    return specials.some(
      (special) => special.toLowerCase() === subjectName?.trim().toLowerCase()
    );
  };

  // ───────── Subjects / standards of ONE card (never shared between cards) ─────────
  const getSubjectsForCard = (cardId) => {
    if (!cardId) return [];
    if (courseAdmin) return subjectsByCard[cardId] || [];

    const base = CARD_DEFAULT_SUBJECTS[cardId] || [];
    const mine = (currSubjects || []).map(normSubject);
    if (mine.length === 0) return base;
    return base.filter((s) => isSpecialSubject(s) || mine.includes(normSubject(s)));
  };

  const getStandardsForCard = (cardId) => {
    const base = CARD_DEFAULT_STANDARDS[cardId] || [];
    if (courseAdmin) return base;
    const mine = (currStandards || []).map(String);
    if (mine.length === 0) return base;
    const filtered = base.filter((s) => mine.includes(s));
    return filtered.length > 0 ? filtered : base;
  };

  const currentSubjects = getSubjectsForCard(currentCardId);

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

  const handleSelectSubject = (idx, navigateToPage = false) => {
    const subjectsToShow = getSubjectsForCard(selectedCard?.id);
    const selectedSubjectName = subjectsToShow[idx];

    if (selectedSubjectName?.trim().toLowerCase() === 'derivation') {
      sessionStorage.setItem('adminReturnState', JSON.stringify({
        cardId: selectedCard.id,
        mode: mode,
      }));

      navigate('/adminhome/derivation');
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
      if (selectedCard?.id === 'class6-12') {
        navigate('/boardexam', {
          state: {
            cardId: currentCardId,
            subjectName: selectedSubjectName,
            standard: isSpecial ? (selectedStandard || 'General') : selectedStandard,
            examTitle: selectedCard.title,
            examSubtitle: selectedCard.subtitle,
            courseName: mode,
          },
        });
      } else {
        navigate('/adminright', {
          state: {
            cardId: currentCardId,
            subjectName: selectedSubjectName,
            standard: isSpecial ? (selectedStandard || 'General') : selectedStandard,
            examTitle: selectedCard.title,
            examSubtitle: selectedCard.subtitle,
            courseName: mode,
          },
        });
      }
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
    if (card.id === 'class6-12') {
      navigate('/boardexam', {
        state: {
          examTitle: card.title,
          examSubtitle: card.subtitle,
          courseName: mode,
        },
      });
      return;
    }

    // Admin: start THIS card's own list (kept separately for every card)
    if (!subjectsByCard[card.id]) {
      const defaults = ADMIN_START_SUBJECTS.includes(card.id)
        ? [...(CARD_DEFAULT_SUBJECTS[card.id] || [])]
        : [];
      setSubjectsByCard((prev) => ({ ...prev, [card.id]: defaults }));
    }

    setSelectedIndex(null);
    setCurrent('');
    setSelectedStandard('');
    setSelectedCard(card);
  };

  // Should this card be visible to the current user?
  const isCardAccessible = (cardId) => {
    if (courseAdmin) return true;

    if (
      (courseName === 'board_exam' || courseName === 'boardexam') &&
      cardId === 'class6-12'
    ) return true;

    return courseNameList.includes(cardId);
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
                const subjectsToShow = getSubjectsForCard(selectedCard.id);

                if (!subjectsToShow || subjectsToShow.length === 0) {
                  return <li className="empty">No subjects in this category</li>;
                }

                return subjectsToShow.map((subj, idx) => {
                  const restricted = ['jee', 'neet', 'class6-12'].includes(selectedCard?.id) &&
                    !isSpecialSubject(subj) &&
                    !selectedStandard;

                  return (
                    <li
                      key={`${selectedCard.id}-${idx}`}
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
              {showAcademics && (
                <button className="mode-button uniform" onClick={() => setMode('academics')}>Academics</button>
              )}
              {showProfessional && (
                <button className="mode-button uniform" onClick={() => setMode('professional')}>Professional Training</button>
              )}
              {showManageAccount && (
                <button className="mode-button uniform" onClick={() => navigate('/manage-account')}>Manage Account</button>
              )}
              {hasNoAccess && (
                <p style={{ color: '#6b7280', textAlign: 'center' }}>
                  No access has been allocated to this account.<br />
                  Please contact the administrator (or log in again).
                </p>
              )}
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
                      {getStandardsForCard(selectedCard.id).map((standard) => (
                        <option key={standard} value={standard}>{standard}</option>
                      ))}
                    </select>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      <em>Note: Subjects like "Derivation", "Formulas", "JEE Previous Questions", "NEET Previous Questions" don't require standard selection</em>
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
                      const dropdownSubjects = getSubjectsForCard(selectedCard.id);

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
                          isCardAccessible(cardObj.id) && (
                            <div key={cardObj.id} className="card" onClick={() => handleCardClick(cardObj)}>
                              <div className="card-subtitle">{cardObj.subtitle}</div>
                              <div className="card-title">{cardObj.title}</div>
                              <button className="card-button">Select</button>
                            </div>
                          )
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

                      {['class1-5', 'class6-12'].includes(selectedCard?.id) && currentSubjects.length > 0 && (
                        <div className="standard-select">
                          <label>Select Standard:</label>
                          <select
                            value={selectedStandard}
                            onChange={(e) => setSelectedStandard(e.target.value)}
                          >
                            <option value="">-- Select --</option>
                            {getStandardsForCard(selectedCard.id).map((standard) => (
                              <option key={standard} value={standard}>{standard}</option>
                            ))}
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