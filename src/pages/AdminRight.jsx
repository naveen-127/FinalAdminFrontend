import React, { useState, useRef, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import katex from "katex";
import parse from "html-react-parser";
import "katex/dist/katex.min.css";
import { API_BASE_URL, FRONTEND_URL_AI } from "../config";
import { FaCheckCircle } from "react-icons/fa";
import "./AdminRight.css";

const AdminRight = () => {
  const navigate = useNavigate();
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [hasFetchedData, setHasFetchedData] = useState(false);


  const [currentContext, setCurrentContext] = useState({
    subject: '',
    lesson: '',
    subtopic: '',
    standard: ''
  });

  // FIXED: Add these state variables and useEffect with proper dependencies
  useEffect(() => {
    if (hasCheckedSession) return;

    let isMounted = true;
    const controller = new AbortController();

    console.log("API Base URL:", API_BASE_URL);
    fetch(`${API_BASE_URL}/checkSession`, {
      method: "GET",
      credentials: "include",
      signal: controller.signal
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (!isMounted) return;

        if (data.status === "failed") {
          navigate("/signin");
          return;
        }
        if (data.status === "pass" && !hasFetchedData) {
          getAllData();
          setHasFetchedData(true);
        }
        setHasCheckedSession(true);
      })
      .catch((err) => {
        if (isMounted && err.name !== 'AbortError') {
          console.log("Session check failed:", err);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate, hasCheckedSession, hasFetchedData]);


  useEffect(() => {
    const aiSaved = localStorage.getItem("generatedAIVideoUrl");
    if (aiSaved) {
      console.log("🔁 Detected new AI content — refreshing data...");
      localStorage.removeItem("generatedAIVideoUrl");
      getAllData();
    }
  }, []);
  const [lessonList, setLessonList] = useState([]); // your lessons state
  const [selectedUnit, setSelectedUnit] = useState("");

  useEffect(() => {
    const openLessonId = localStorage.getItem("openLessonId");
    if (openLessonId && lessonList.length > 0) {
      const lesson = lessonList.find((l) => l.id === openLessonId);
      if (lesson) setSelectedLesson(lesson); // your existing selected lesson state
      localStorage.removeItem("openLessonId");
    }
  }, [lessonList]);



  // Add this state variable near your other state declarations
  // Add near your existing state declarations
  // Add near your other state declarations
  const [movingItem, setMovingItem] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [subtopicTableRows, setSubtopicTableRows] = useState(1);
  const [subtopicTableCols, setSubtopicTableCols] = useState(1);
  const [subtopicTableData, setSubtopicTableData] = useState([]);
  const [showSubtopicMatches, setShowSubtopicMatches] = useState(false);
  const [subtopicTableEditable, setSubtopicTableEditable] = useState(false);
  const [questionTags, setQuestionTags] = useState([]);
  const [questionTagInput, setQuestionTagInput] = useState('');
  const [unitOrder, setUnitOrder] = useState([]);
  const location = useLocation();
  const standards = location.state?.standards || []; // fallback to empty array if undefined

  const { cardId, subjectName, standard, examTitle, courseName } =
    location.state || {};
  const keyPrefix = `${examTitle}_${subjectName}_Std${standard}`;
  // console.log(cardId,"  ",subjectName,"  ",standard," ",examTitle,"  ",courseName )

  const [testTags, setTestTags] = useState([]);
  const [testTagInput, setTestTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const [newUnit, setNewUnit] = useState("");
  const [unitsMap, setUnitsMap] = useState(() => {
    const saved = localStorage.getItem(`admin_unitsMap_${keyPrefix}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [editingLessonIndex, setEditingLessonIndex] = useState(null);
  const [lessonSubtopicsMap, setLessonSubtopicsMap] = useState(() => {
    const saved = localStorage.getItem(`admin_subtopicsMap_${keyPrefix}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedSubTopicUnit, setSelectedSubTopicUnit] = useState();
  const [selectedSubTopicUnitAudio, setSelectedSubTopicUnitAudio] = useState(
    []
  );



  const [serverAudioFiles, setServerAudioFiles] = useState([]);
  useEffect(() => {
    if (selectedSubTopicUnit?.audioFileId) {
      setServerAudioFiles(selectedSubTopicUnit.audioFileId);
    }
  }, [selectedSubTopicUnit]);
  const [selectedSubUnit, setSelectedSubUnit] = useState();
  const [editSelecetedSubUnit, setEditSelecetedSubUnit] = useState("");

  const [points, setPoints] = useState(['']);
  const [paragraph, setParagraph] = useState('');
  const [editHeadUnit, setEditHeadUnit] = useState("");
  const [unitData, setUnitData] = useState(null);
  const [expandedUnits, setExpandedUnits] = useState({});
  const [firstClicked, setFirstClicked] = useState(null);
  const [lastClicked, setLastClicked] = useState(null);

  const [editingTestIndex, setEditingTestIndex] = useState(null);
  // ✅ ADD after your existing state declarations
  const [subtopicImages, setSubtopicImages] = useState([]);
  const [oldQuestionForDeletion, setOldQuestionForDeletion] = useState();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState("");
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [editingSubtopicIndex, setEditingSubtopicIndex] = useState(null);
  const [showExplanationForm, setShowExplanationForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [subTitle, setSubTitle] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [rootId, setRootId] = useState(null);
  const [recordedVoiceFiles, setRecordedVoiceFiles] = useState([]);
  const [uploadedVoiceFiles, setUploadedVoiceFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const [audio, setAudio] = useState([]);
  const audioChunks = useRef([]);
  const recordingIntervalRef = useRef(null);
  const [animFiles, setAnimFiles] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [lessonTestsMap, setLessonTestsMap] = useState(() => {
    const saved = localStorage.getItem(`admin_testsMap_${keyPrefix}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedTest, setSelectedTest] = useState("");
  const [testName, setTestName] = useState("");
  const [testTimeLimit, setTestTimeLimit] = useState("");
  const [questions, setQuestions] = useState([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [passPercentage, setPassPercentage] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    image: null,
    showImage: false,
    showMatches: false,
    rows: 4,
    cols: 4,
    tableData: [],
    tableEditable: true,
    options: [
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null },
    ],
    correctIndex: null,
    explanation: "",
    // solutionText:''
  });

  const updateCurrentContext = () => {
    const context = {
      subject: subjectName || '',
      lesson: selectedUnit || '',
      subtopic: selectedSubTopicUnit?.unitName || selectedSubUnit?.unitName || '',
      standard: standard || ''
    };
    setCurrentContext(context);
    console.log("📋 Updated context for tags:", context);
  };

  // Add useEffect to monitor selection changes
  useEffect(() => {
    updateCurrentContext();
  }, [subjectName, selectedUnit, selectedSubTopicUnit, selectedSubUnit, standard]);

  const emptyQuestion = {
    text: "",
    questionImages: [],
    options: [
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null },
    ],
    correctIndex: null,
    explanation: "",
    solutionImages: [],
    rows: 0,
    cols: 0,
    tableData: [],
    showMatches: false,
    tableEditable: false,
    showQuestionInput: false,
    showSolutionInput: false,
    tags: [], // ✅ Make sure this is here
  };

  // Add this useEffect to detect return from AI page and refresh data
  useEffect(() => {
    const checkForReturnFromAI = () => {
      const params = new URLSearchParams(window.location.search);

      // Check if we're returning from AI video generation
      const saved = params.get("saved") === "true";
      const videoUrl = params.get("videoUrl");
      const subtopicId = params.get("subtopicId");
      const s3Path = params.get("s3Path");
      const timestamp = params.get("timestamp");

      if (saved && subtopicId) {
        console.log("🎬 Detected return from AI page - refreshing data...", {
          subtopicId,
          videoUrl,
          s3Path,
          timestamp
        });

        // Show success message
        setToastMessage("✅ AI Video saved successfully! Refreshing data...");

        // Clear URL parameters to prevent repeated refreshes
        window.history.replaceState({}, document.title, "/adminright");

        // Refresh all data from server
        getAllData().then((refreshedData) => {
          console.log("✅ Data refreshed successfully");

          // Try to find and select the subtopic that was updated
          if (subtopicId && refreshedData) {
            setTimeout(() => {
              const findAndSelectSubtopic = (units) => {
                for (const unit of units) {
                  if (unit.id === subtopicId || unit._id === subtopicId) {
                    setSelectedSubTopicUnit(unit);
                    setSelectedSubUnit(unit);
                    const rootId = findRootOfUnit(unit.id, refreshedData);
                    setFirstClicked(rootId);
                    setLastClicked(unit.id);
                    return true;
                  }
                  if (unit.units) {
                    if (findAndSelectSubtopic(unit.units)) return true;
                  }
                }
                return false;
              };

              findAndSelectSubtopic(refreshedData);

              // Show success message with path info
              if (s3Path) {
                setToastMessage(`✅ Video saved to: ${s3Path}`);
              } else {
                setToastMessage("✅ AI Video saved successfully!");
              }
            }, 500);
          }
        });
      }
    };

    checkForReturnFromAI();
  }, []); // Run once on mount

  // Replace your existing URL parameter useEffect with this enhanced version
  useEffect(() => {
    // Check for URL parameters when component mounts
    const urlParams = new URLSearchParams(window.location.search);

    const videoSaved = urlParams.get("saved") === "true";
    const videoGenerated = urlParams.get("videoGenerated") === "true";
    const subtopicId = urlParams.get("subtopicId");
    const subjectNameParam = urlParams.get("subjectName");
    const dbname = urlParams.get("dbname");
    const s3Path = urlParams.get("s3Path");
    const standard = urlParams.get("standard");
    const lesson = urlParams.get("lesson");
    const topic = urlParams.get("topic");

    if ((videoSaved || videoGenerated) && subtopicId) {
      console.log("🎬 Video operation detected for subtopic:", subtopicId);

      // Only show toast if we're not already showing one
      if (!toastMessage) {
        if (s3Path) {
          setToastMessage(`✅ AI Video saved to: ${s3Path}`);
        } else {
          setToastMessage(videoSaved ? "✅ AI Video saved successfully!" : "🎬 AI Video generated!");
        }
      }

      // Refresh the data to show the new video
      getAllData().then((refreshedData) => {
        console.log("✅ Data refreshed after video operation");

        // If we have the subtopicId, try to find and select it
        if (subtopicId && refreshedData) {
          setTimeout(() => {
            const findAndSelectSubtopic = (units) => {
              for (const unit of units) {
                if (unit.id === subtopicId || unit._id === subtopicId) {
                  setSelectedSubTopicUnit(unit);
                  setSelectedSubUnit(unit);
                  const rootId = findRootOfUnit(unit.id, refreshedData);
                  setFirstClicked(rootId);
                  setLastClicked(unit.id);
                  return true;
                }
                if (unit.units) {
                  if (findAndSelectSubtopic(unit.units)) return true;
                }
              }
              return false;
            };

            findAndSelectSubtopic(refreshedData);
          }, 500);
        }
      });

      // Clean up URL after a short delay
      setTimeout(() => {
        window.history.replaceState({}, document.title, "/adminright");
      }, 100);
    }
  }, [unitData]); // Add unitData as dependency


  // Add this near your other useEffects
  useEffect(() => {
    // When editingQuestionIndex changes, update questionTags from currentQuestion
    if (editingQuestionIndex !== null && questions[editingQuestionIndex]) {
      const question = questions[editingQuestionIndex];
      const tags = question.tags || question.questionTags || [];

      if (Array.isArray(tags) && tags.length > 0) {
        setQuestionTags([...tags]);

        // Also update currentQuestion if needed
        setCurrentQuestion(prev => ({
          ...prev,
          tags: [...tags]
        }));
      }
    }
  }, [editingQuestionIndex]);

  // Keep questionTags and currentQuestion.tags in sync
  useEffect(() => {
    // Only update if they're different to avoid loops
    if (JSON.stringify(questionTags) !== JSON.stringify(currentQuestion.tags)) {
      setCurrentQuestion(prev => ({
        ...prev,
        tags: questionTags.length > 0 ? [...questionTags] : []
      }));
    }
  }, [questionTags]);


  useEffect(() => {
    console.log("🔍 currentQuestion updated:", {
      text: currentQuestion.text?.substring(0, 20),
      tags: currentQuestion.tags,
      hasTagsProperty: 'tags' in currentQuestion
    });
  }, [currentQuestion]);

  // Add this useEffect to monitor questions changes
  useEffect(() => {
    console.log("📚 questions array updated:", {
      count: questions.length,
      tagsInQuestions: questions.map(q => q.tags || 'no tags')
    });
  }, [questions]);

  // Add this effect somewhere in your component
  useEffect(() => {
    if (editingQuestionIndex !== null && questions[editingQuestionIndex]) {
      // Update the specific question in the questions array when currentQuestion changes
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = {
        ...updatedQuestions[editingQuestionIndex],
        ...currentQuestion
      };
      setQuestions(updatedQuestions);
    }
  }, [currentQuestion, editingQuestionIndex]);



  const [formData, setFormData] = useState({
    topic: "",
    subtopic: "",
    description: "",
    questionsList: [],
  });




  useEffect(() => {
    localStorage.setItem(
      `admin_unitsMap_${keyPrefix}`,
      JSON.stringify(unitsMap)
    );
    localStorage.removeItem(`admin_unitsMap_${keyPrefix}`);
  }, [unitsMap]);

  useEffect(() => {
    localStorage.setItem(
      `admin_subtopicsMap_${keyPrefix}`,
      JSON.stringify(lessonSubtopicsMap)
    );
    localStorage.removeItem(`admin_subtopicsMap_${keyPrefix}`);
  }, [lessonSubtopicsMap]);

  useEffect(() => {
    localStorage.setItem(
      `admin_testsMap_${keyPrefix}`,
      JSON.stringify(lessonTestsMap)
    );
    localStorage.removeItem(`admin_testsMap_${keyPrefix}`);
  }, [lessonTestsMap]);


  const getAllData = () => {
    return new Promise((resolve, reject) => {
      const start = performance.now();

      // List of subjects that don't require standard
      const subjectsWithoutStandard = ['NEET Previous Questions', 'Formulas', 'JEE Previous Questions', 'Previous Questions'];

      // Check if this is a special subject
      const isSpecialSubject = subjectsWithoutStandard.includes(subjectName);

      console.log("🔍 getAllData - Subject Analysis:", {
        subjectName,
        isSpecialSubject,
        standard,
        courseName
      });

      let apiUrl;
      if (isSpecialSubject) {
        // For special subjects: Don't send standard parameter
        apiUrl = `${API_BASE_URL}/getAllUnitsWithoutStandard/${courseName}/${subjectName}`;
      } else {
        // For normal subjects: Include standard
        apiUrl = `${API_BASE_URL}/getAllUnits/${courseName}/${subjectName}/${standard}`;
      }

      fetch(apiUrl, {
        method: "GET",
        credentials: "include",
      })
        .then((resp) => {
          if (!resp.ok) {
            throw new Error(`HTTP error! status: ${resp.status}`);
          }
          return resp.json();
        })
        .then((data) => {
          const end1 = performance.now();
          console.log(`✅ Data fetched in ${end1 - start} ms`);

          let processedData = data;

          if (isSpecialSubject) {
            console.log("🎯 Processing special subject data structure to match original subjects");

            processedData = data.map(unit => ({
              ...unit,
              id: unit.id || unit._id,
              isLesson: true, // Ensure isLesson is true for all special subject units
              standard: "special",
              units: unit.units || [],
              test: unit.test || [],
              imageUrls: unit.imageUrls || [],
              audioFileId: unit.audioFileId || [],
              tags: unit.tags || []
            }));
          } else {
            // Ensure ID consistency for normal subjects too
            processedData = data.map(unit => ({
              ...unit,
              id: unit.id || unit._id,
              isLesson: true // Ensure isLesson is true for normal subjects too
            }));
          }

          setUnitData(processedData);
          resolve(processedData); // Resolve with the data
        })
        .catch((err) => {
          console.error("❌ Session check failed:", err);
          reject(err);
        });
    });
  };

  // Move lesson up/down - Updated to handle both root and nested lessons
  // Move lesson up/down - Updated for root-level units
  const handleMoveLesson = async (lesson, direction) => {
    if (!lesson || !lesson.id) {
      alert("No lesson selected for moving");
      return;
    }

    setIsMoving(true);
    setMovingItem(lesson);

    try {
      // Check if this is a special subject
      const subjectsWithoutStandard = ['NEET Previous Questions', 'Formulas', 'JEE Previous Questions', 'Previous Questions'];
      const isSpecialSubject = subjectsWithoutStandard.includes(subjectName);

      console.log("🎯 Moving lesson:", {
        lessonId: lesson.id,
        lessonName: lesson.unitName,
        isSpecialSubject,
        subjectName,
        courseName
      });

      // Determine if this is a root-level unit
      const isRootLevel = unitData.some(unit => unit.id === lesson.id);

      console.log("📊 Lesson type:", isRootLevel ? "ROOT LEVEL" : "NESTED");
      console.log("📊 All unit data:", unitData.map(u => ({
        id: u.id,
        name: u.unitName,
        isRoot: true,
        childCount: u.units?.length || 0
      })));

      let moveData;
      let url;

      if (isSpecialSubject) {
        // For special subjects, use the special endpoint
        url = `${API_BASE_URL}/moveSpecialSubjectLesson/${direction}`;
        moveData = {
          dbname: courseName,
          subjectName: subjectName,
          parentId: lesson.id,
          rootId: lesson.id,
          unitName: lesson.unitName,
          explanation: lesson.explanation || "",
          imageUrls: lesson.imageUrls || [],
          audioFileId: lesson.audioFileId || [],
          tags: lesson.tags || [],
          aiVideoUrl: lesson.aiVideoUrl || "",
          isSpecialSubject: true
        };
      } else {
        if (isRootLevel) {
          // This is a root-level unit - use the new root unit endpoint
          console.log("📁 Moving root-level unit with new endpoint");
          url = `${API_BASE_URL}/moveRootUnit/${direction}`;
          moveData = {
            dbname: courseName,
            subjectName: subjectName,
            unitId: lesson.id,
            unitName: lesson.unitName,
            standard: lesson.standard || standard
          };
        } else {
          // This is a nested unit - find its parent
          const parentInfo = findParentUnit(unitData, lesson.id);

          if (!parentInfo) {
            console.error("❌ Could not find parent for nested lesson:", lesson);
            alert("Could not find the parent unit for this lesson. Please refresh and try again.");
            setIsMoving(false);
            setMovingItem(null);
            return;
          }

          console.log("📁 Found parent:", parentInfo);
          url = `${API_BASE_URL}/moveUnit/${direction}`;
          moveData = {
            dbname: courseName,
            subjectName: subjectName,
            parentId: lesson.id,
            rootId: parentInfo.rootId,
            unitName: lesson.unitName,
            explanation: lesson.explanation || "",
            imageUrls: lesson.imageUrls || [],
            audioFileId: lesson.audioFileId || [],
            tags: lesson.tags || [],
            aiVideoUrl: lesson.aiVideoUrl || "",
            standard: lesson.standard || standard
          };
        }
      }

      console.log("🔄 Moving lesson data:", JSON.stringify(moveData, null, 2));
      console.log("📡 Using URL:", url);

      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moveData)
      });

      const data = await response.json();
      console.log("Move lesson response:", data);

      if (data.status === "success") {
        alert(`✅ Lesson moved ${direction} successfully`);
        await getAllData();
      } else {
        alert(`Failed to move lesson: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error moving lesson:", error);
      alert("Error moving lesson. Please try again.");
    } finally {
      setIsMoving(false);
      setMovingItem(null);
    }
  };

  // Enhanced helper function to find parent unit
  const findParentUnit = (units, targetId, rootId = null) => {
    for (const unit of units) {
      // Check if this unit has the target in its direct children
      if (unit.units && Array.isArray(unit.units)) {
        // Log what we're checking for debugging
        console.log(`🔍 Checking unit ${unit.unitName} (${unit.id}) for child ${targetId}`);

        const hasTarget = unit.units.some(child => {
          const match = child.id === targetId;
          if (match) console.log(`✅ Found target in unit ${unit.unitName}`);
          return match;
        });

        if (hasTarget) {
          return {
            parentUnit: unit,
            parentId: unit.id,
            rootId: unit.id  // For direct children, root is the parent
          };
        }
      }

      // Check deeper nesting if this unit has children
      if (unit.units && unit.units.length > 0) {
        const found = findParentUnit(unit.units, targetId, unit.id);
        if (found) {
          return {
            ...found,
            rootId: unit.id // The root is the top-level unit
          };
        }
      }
    }
    return null;
  };

  // Alternative search that looks at all levels
  const findAlternativeParent = (units, targetId) => {
    // First, check if target is a root unit
    const isRoot = units.some(u => u.id === targetId);
    if (isRoot) {
      return {
        rootId: targetId,
        parentId: targetId
      };
    }

    // Search through all nested units
    const searchNested = (items, parentId = null) => {
      for (const item of items) {
        if (item.id === targetId) {
          return { rootId: parentId || item.id, parentId: item.id };
        }
        if (item.units && item.units.length > 0) {
          const found = searchNested(item.units, parentId || item.id);
          if (found) return found;
        }
      }
      return null;
    };

    return searchNested(units);
  };
  // Move subtopic up/down
  const handleMoveSubtopic = async (subUnit, direction) => {
    if (!subUnit || !subUnit.id) {
      alert("No subtopic selected for moving");
      return;
    }

    if (!firstClicked) {
      alert("Cannot move subtopic: Missing root reference");
      return;
    }

    setIsMoving(true);
    setMovingItem(subUnit);

    try {
      const moveData = {
        dbname: courseName,
        subjectName: subjectName,
        parentId: subUnit.id, // The ID of the unit to move
        rootId: firstClicked, // The root ID
        unitName: subUnit.unitName,
        explanation: subUnit.explanation || "",
        imageUrls: subUnit.imageUrls || [],
        audioFileId: subUnit.audioFileId || [],
        tags: subUnit.tags || [],
        aiVideoUrl: subUnit.aiVideoUrl || ""
      };

      console.log("🔄 Moving subtopic data:", moveData);

      const response = await fetch(`${API_BASE_URL}/moveUnit/${direction}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moveData)
      });

      const data = await response.json();
      console.log("Move response:", data);

      if (data.status === "success") {
        alert(`✅ Subtopic moved ${direction} successfully`);

        // Refresh all data
        getAllData();

        // Reselect the unit if it was selected
        if (selectedSubUnit && selectedSubUnit.id === subUnit.id) {
          // Wait a bit for data refresh
          setTimeout(() => {
            const updatedUnit = findUnitById(unitData, subUnit.id);
            if (updatedUnit) {
              setSelectedSubUnit(updatedUnit);
              setSelectedSubTopicUnit(updatedUnit);
            }
          }, 500);
        }
      } else {
        alert(`Failed to move subtopic: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error moving subtopic:", error);
      alert("Error moving subtopic. Please try again.");
    } finally {
      setIsMoving(false);
      setMovingItem(null);
    }
  };

  // Move test up/down
  const handleMoveTest = async (test, direction) => {
    if (!test || !test.testName) {
      alert("No test selected for moving");
      return;
    }

    if (!firstClicked || !lastClicked) {
      alert("Cannot move test: Missing parent/root references");
      return;
    }

    setIsMoving(true);
    setMovingItem(test);

    try {
      const params = new URLSearchParams({
        rootId: firstClicked,
        parentId: lastClicked,
        testName: test.testName || test.name,
        dbname: courseName,
        subjectName: subjectName
      });

      const response = await fetch(`${API_BASE_URL}/moveTest/${direction}?${params}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();
      console.log("Move test response:", data);

      if (data.status === "success") {
        alert(`✅ Test moved ${direction} successfully`);

        // Refresh all data
        getAllData();

        // Reselect the test if it was selected
        if (selectedTest && selectedTest.testName === test.testName) {
          setTimeout(() => {
            const updatedTest = findTestInUnitData(unitData, test.testName || test.name);
            if (updatedTest) {
              setSelectedTest(updatedTest);
            }
          }, 500);
        }
      } else {
        alert(`Failed to move test: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error moving test:", error);
      alert("Error moving test. Please try again.");
    } finally {
      setIsMoving(false);
      setMovingItem(null);
    }
  };

  // Helper function to find unit by ID
  const findUnitById = (units, id) => {
    if (!units || !Array.isArray(units)) return null;

    for (const unit of units) {
      if (unit.id === id || unit._id === id) {
        return unit;
      }

      if (unit.units && unit.units.length > 0) {
        const found = findUnitById(unit.units, id);
        if (found) return found;
      }
    }

    return null;
  };

  // Helper function to find test in unit data
  const findTestInUnitData = (unitData, testName) => {
    if (!unitData || !Array.isArray(unitData)) return null;

    for (const unit of unitData) {
      // Check current unit's tests
      if (unit.test && Array.isArray(unit.test)) {
        const foundTest = unit.test.find((t) => t.testName === testName);
        if (foundTest) return foundTest;
      }

      // Check child units recursively
      if (unit.units && Array.isArray(unit.units)) {
        const foundInChild = findTestInChildUnits(unit.units, testName);
        if (foundInChild) return foundInChild;
      }
    }
    return null;
  };

  const findTestInChildUnits = (units, testName) => {
    for (const unit of units) {
      if (unit.test && Array.isArray(unit.test)) {
        const foundTest = unit.test.find((t) => t.testName === testName);
        if (foundTest) return foundTest;
      }

      if (unit.units && Array.isArray(unit.units)) {
        const foundInChild = findTestInChildUnits(unit.units, testName);
        if (foundInChild) return foundInChild;
      }
    }
    return null;
  };

  const generateTable = (rows, cols) => {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => "")
    );
  };


  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        setRecordedVoiceFiles((prev) => [...prev, audioBlob]);
        audioChunks.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access denied or not supported.");
    }
  };
  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);

      // ✅ FIXED: Create proper File object from recorded audio
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        // Convert Blob to File with proper name
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: "audio/webm"
        });
        setRecordedVoiceFiles((prev) => [...prev, audioFile]);
        audioChunks.current = [];
      };
    }
  };

  // state
  const [savedItems, setSavedItems] = React.useState([]);

  // your save function
  const handleSaveImage = () => {
    if (!currentQuestion.image) {
      alert("Please upload an image.");
      return;
    }
    if (!subDesc.trim()) {
      alert("Please enter a subtopic description.");
      return;
    }

    // Save image name + description as text
    setSavedItems((prev) => [
      ...prev,
      {
        imageName: currentQuestion.image.name || "uploaded-image",
        description: subDesc,
      },
    ]);

    // reset inputs
    setCurrentQuestion((q) => ({ ...q, image: null }));
    setSubDesc("");
  };

  const [oldHeadUnitName, setOldHeadUnitName] = useState("");

  const handleAddUnit = () => {
    // Check if this is a special subject
    const subjectsWithoutStandard = ['NEET Previous Questions', 'Formulas'];
    const isSpecialSubject = subjectsWithoutStandard.includes(subjectName);

    console.log("🔍 handleAddUnit:", {
      newUnit,
      isSpecialSubject,
      subjectName,
      standard,
      editingLessonIndex
    });

    if (editingLessonIndex !== null) {
      // Edit mode
      fetch(`${API_BASE_URL}/updateHeadUnit/${newUnit}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dbname: courseName,
          subjectName: subjectName,
          unit: {
            unitName: oldHeadUnitName,
            standard: isSpecialSubject ? null : standard, // Null for special subjects
          },
        }),
      })
        .then((resp) => resp.json())
        .then((resp) => {
          console.log("edit new unit resp", resp);
          if (resp.status === "pass") {
            getAllData();
            setNewUnit("");
            setOldHeadUnitName("");
            setEditingLessonIndex(null);
          }
        })
        .catch((err) => {
          console.log("new unit fetch error", err);
        });
    } else {
      // Add new unit
      const payload = {
        dbname: courseName,
        subjectName: subjectName,
        unit: {
          unitName: newUnit,
          // Only include standard for non-special subjects
          ...(!isSpecialSubject && { standard: standard })
        },
      };

      console.log("📤 Add unit payload:", payload);

      fetch(`${API_BASE_URL}/addNewHeadUnit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((resp) => resp.json())
        .then((resp) => {
          console.log("add new unit resp", resp);
          if (resp.status === "pass") {
            getAllData();
            setNewUnit("");
            setEditingLessonIndex(null);
          }
        })
        .catch((err) => {
          console.log("new unit fetch error", err);
        });
    }
  };

  const handleEditLesson = (index) => {
    const key = standards.length > 0 ? selectedStandard : "default";
    const unitToEdit = unitsMap[key]?.[index] || "";
    setOldHeadUnitName(unitToEdit);
    setNewUnit(unitToEdit);
    setEditingLessonIndex(index);
  };
  const handleDeleteLesson = (index) => {
    const key = standards.length > 0 ? selectedStandard : "default";

    const unitToEdit = unitsMap[key]?.[index] || "";
    setOldHeadUnitName(unitToEdit);
    // console.log(unitToEdit)
    fetch(`${API_BASE_URL}/deleteHeadUnit`, {
      // fetch(`https://trilokinnovations-api-prod.trilokinnovations.com/test/addNewUnit/${subjectName}`,{
      //  fetch(`https://test-padmasiniAdmin-api.trilokinnovations.com/addNewUnit/${subjectName}`,{
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dbname: courseName,
        subjectName: subjectName,
        unit: {
          unitName: unitToEdit,
          standard: standard,
        },
      }),
    })
      .then((resp) => resp.json())
      .then((resp) => {
        // console.log("add new unit resp",resp)
        if (resp.status === "pass") {
          setUnitsMap((prev) => {
            const updated = { ...prev };
            updated[key] = [...(updated[key] || [])];
            const deletedUnit = updated[key][index];
            updated[key].splice(index, 1);
            // console.log(deletedUnit)
            // Remove associated subtopics
            setLessonSubtopicsMap((prevSubtopics) => {
              const copy = { ...prevSubtopics };
              delete copy[deletedUnit];
              return copy;
            });

            return updated;
          });
          getAllData();
          if (editingLessonIndex === index) {
            setNewUnit("");
            setEditingLessonIndex(null);
            setOldHeadUnitName("");
          }
        }
      })
      .catch((err) => {
        console.log("new unit fetch error", err);
      });
  };

  // -----------------------------
  // 🟩 API Base URL
  // -----------------------------
  const API_BASE_URL3 = `${API_BASE_URL}`;

  // -----------------------------
  // 🟩 Add Subtopic - Full Working Version
  // -----------------------------
  const handleAddSubtopic = async (e) => {
    e?.preventDefault();

    // Validation
    if (!selectedUnit || !subTitle.trim()) {
      alert("Please select a lesson and enter a subtopic title");
      return;
    }

    if (!lastClicked) {
      alert("Error: Missing parent unit reference. Please select a unit first.");
      return;
    }

    try {
      console.log("🔄 Starting subtopic creation process...");

      const cleanedDescription = subDesc;

      console.log("📝 Description being saved:", cleanedDescription);

      console.log("📸 Subtopic images:", subtopicImages);

      // ✅ FIXED: Properly handle image uploads
      const imageUrls = [];
      if (subtopicImages && subtopicImages.length > 0) {
        console.log(`📤 Uploading ${subtopicImages.length} images...`);
        for (const img of subtopicImages) {
          if (img instanceof File) {
            // New file - upload it
            const imageUrl = await uploadFileToBackend1(img, "subtopics/images");
            if (imageUrl) {
              imageUrls.push(imageUrl);
              console.log("✅ Image uploaded:", imageUrl);
            }
          } else if (typeof img === "string" && img.startsWith("http")) {
            // Existing URL - keep it (for edit scenarios)
            imageUrls.push(img);
          }
        }
      }

      // ✅ FIXED: Properly handle audio uploads
      const audioFileIds = [];
      const allAudios = [
        ...(recordedVoiceFiles || []),
        ...(uploadedVoiceFiles || []),
      ];

      if (allAudios.length > 0) {
        console.log(`📤 Uploading ${allAudios.length} audio files...`);
        for (const audioFile of allAudios) {
          if (audioFile instanceof File || audioFile instanceof Blob) {
            const audioUrl = await uploadFileToBackend1(audioFile, "subtopics/audios");
            if (audioUrl) {
              audioFileIds.push(audioUrl);
              console.log("✅ Audio uploaded:", audioUrl);
            }
          } else if (typeof audioFile === "string" && audioFile.startsWith("http")) {
            // Existing URL - keep it
            audioFileIds.push(audioFile);
          }
        }
      }

      const tableData = showSubtopicMatches && subtopicTableData.length > 0
        ? subtopicTableData
        : [];

      // ✅ FIXED: Payload for backend
      const payload = {
        parentId: lastClicked,
        rootId: firstClicked,
        dbname: courseName,
        subjectName: subjectName,
        unitName: subTitle.trim(),
        explanation: cleanedDescription,
        imageUrls: imageUrls, // ✅ Now contains actual uploaded image URLs
        audioFileId: audioFileIds, // ✅ Now contains actual uploaded audio URLs
        aiVideoUrl: "",
        standard: standard,
        tags: tags,
        tableData: tableData, // ✅ Add table data
        rows: subtopicTableRows,
        cols: subtopicTableCols,
        showMatches: showSubtopicMatches,
      };

      console.log("📤 Sending payload to backend:", payload);

      // Call backend
      const res = await fetch(`${API_BASE_URL3}/addSubtopic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const result = await res.json();
      console.log("✅ Backend response:", result);

      const insertedId = result.insertedSubId || result.insertedId;
      if (!insertedId) {
        alert("⚠️ Subtopic not inserted. Check backend logs.");
        return;
      }

      localStorage.setItem("lastInsertedSubtopicId", insertedId);

      // ✅ FIXED: Update frontend tree with actual URLs
      const newSub = {
        id: insertedId,
        unitName: payload.unitName,
        explanation: payload.explanation,
        imageUrls: payload.imageUrls, // ✅ Contains actual image URLs
        audioFileId: payload.audioFileId, // ✅ Contains actual audio URLs
        aiVideoUrl: payload.aiVideoUrl,
        parentId: payload.parentId,
        children: [],
        tags: payload.tags,
      };

      setLessonSubtopicsMap((prev) => {
        const current = prev[selectedUnit] || [];
        return {
          ...prev,
          [selectedUnit]: updateSubtopicTree(current, payload.parentId, newSub),
        };
      });

      // ✅ FIXED: Reset form after successful submission
      setSubTitle("");
      setSubDesc("");
      setSubtopicImages([]);
      setRecordedVoiceFiles([]);
      setUploadedVoiceFiles([]);
      setTags([]); // ✅ Reset tags
      setTagInput(''); // ✅ Reset tag input

      alert("✅ Subtopic added successfully with images and audio!");
      getAllData(); // Refresh data from server
    } catch (err) {
      console.error("❌ Error adding subtopic:", err);
      alert(`Failed to add subtopic: ${err.message}`);
    }
  };

  // -----------------------------
  // Recursive frontend tree update 
  // -----------------------------
  const updateSubtopicTree = (subtopics, parentId, newChild) => {
    return subtopics.map((sub) => {
      if (sub.id === parentId) {
        return { ...sub, children: [...(sub.children || []), newChild] };
      } else if (sub.children && sub.children.length > 0) {
        return {
          ...sub,
          children: updateSubtopicTree(sub.children, parentId, newChild),
        };
      } else {
        return sub;
      }
    });
  };

  // -----------------------------
  // Upload helper function
  // -----------------------------
  const uploadFileToBackend1 = async (file, folderName = "uploads") => {
    if (!file) return null;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderName", folderName);

      const res = await fetch(`${API_BASE_URL3}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Upload failed:", errorText);
        return null;
      }

      const data = await res.json();
      console.log("✅ File uploaded:", data.fileUrl);
      return data.fileUrl;
    } catch (err) {
      console.error("❌ Upload error:", err);
      return null;
    }
  };

  const updateTestsInSubtopicTree = (
    subtopics,
    targetTitle,
    newTest,
    isEdit = false,
    indexToEdit = null
  ) => {
    return subtopics.map((sub) => {
      if (sub.title === targetTitle) {
        const updatedTests = [...(sub.tests || [])];
        if (isEdit && indexToEdit !== null) {
          updatedTests[indexToEdit] = newTest;
        } else {
          updatedTests.push(newTest);
        }
        return { ...sub, tests: updatedTests };
      } else if (sub.children && sub.children.length > 0) {
        return {
          ...sub,
          children: updateTestsInSubtopicTree(
            sub.children,
            targetTitle,
            newTest,
            isEdit,
            indexToEdit
          ),
        };
      }
      return sub;
    });
  };

  const handleEditSubtopic = (unit, index) => {
    const sub = lessonSubtopicsMap[unit][index];
    setSubTitle(sub.title);
    setSubDesc(sub.description);
    setRecordedVoiceFiles(sub.voices || []);
    setUploadedVoiceFiles([]);
    setAnimFiles(sub.animation || []);
    setEditingSubtopicIndex(index);
    setShowExplanationForm(true);
    setShowTestForm(false);
  };
  const handleDeleteSubtopic = (unit, index) => {
    const updatedSubs = [...lessonSubtopicsMap[unit]];
    updatedSubs.splice(index, 1);
    setLessonSubtopicsMap((prev) => ({
      ...prev,
      [unit]: updatedSubs,
    }));
    setSelectedSubtopic(null);
  };


  const handleAddQuestion = () => {
    const hasQuestion =
      (currentQuestion.text && currentQuestion.text.trim() !== "") ||
      currentQuestion.questionImages?.length > 0;
    const hasAtLeastOneOption = currentQuestion.options.some(
      (opt) => (opt.text && opt.text.trim() !== "") || opt.image !== null
    );
    const hasCorrectAnswer =
      currentQuestion.correctIndex !== null &&
      ((currentQuestion.options[currentQuestion.correctIndex]?.text &&
        currentQuestion.options[currentQuestion.correctIndex]?.text.trim() !==
        "") ||
        currentQuestion.options[currentQuestion.correctIndex]?.image !== null);
    const hasExplanation =
      currentQuestion.explanation && currentQuestion.explanation.trim() !== "";

    if (
      !hasQuestion ||
      !hasAtLeastOneOption ||
      !hasCorrectAnswer ||
      !hasExplanation
    ) {
      alert(
        "Please add a question (text and/or image), at least one option (text and/or image), select a valid correct answer, and provide an explanation."
      );
      return;
    }

    console.log("💾 handleAddQuestion - Saving question with:");
    console.log("  - Tags from currentQuestion:", currentQuestion.tags);
    console.log("  - Tags from questionTags state:", questionTags);
    console.log("  - Editing index:", editingQuestionIndex);

    // Determine which tags to use - prioritize questionTags if available
    const tagsToSave = questionTags.length > 0
      ? [...questionTags]
      : (currentQuestion.tags && currentQuestion.tags.length > 0
        ? [...currentQuestion.tags]
        : []);

    if (editingQuestionIndex !== null) {
      // Editing existing question
      const updatedQuestions = [...questions];

      // Create the updated question with ALL currentQuestion data
      const updatedQuestion = {
        ...currentQuestion,
        tags: tagsToSave,
      };

      // Make sure options are properly formatted
      updatedQuestion.options = currentQuestion.options.map((opt, idx) => {
        const fieldName = `option${idx + 1}`;
        const imageFieldName = `option${idx + 1}Image`;

        // Preserve existing option formats
        if (typeof opt === 'object') {
          return opt;
        }
        return opt;
      });

      updatedQuestions[editingQuestionIndex] = updatedQuestion;
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);

      console.log("✅ Updated question at index", editingQuestionIndex);
      console.log("📦 Updated question data:", updatedQuestion);
      console.log("📦 Tags saved:", updatedQuestion.tags);
    } else {
      // Adding new question
      const newQuestion = {
        ...currentQuestion,
        tags: tagsToSave,
      };
      setQuestions([...questions, newQuestion]);

      console.log("✅ Added new question with tags:", newQuestion.tags);
    }

    // Reset with tags included
    setCurrentQuestion({
      ...emptyQuestion,
      tags: [], // Reset tags in current question
    });
    setQuestionTags([]); // Reset question tags state
    setQuestionTagInput('');
  };

  const handleEditQuestion = (index) => {
    const q = questions[index];

    console.log("📝 Editing question:", q);
    console.log("🔖 Question tags from question object:", q.tags);

    // Create a clean copy of the question data with ALL fields properly mapped
    const questionData = {
      // 🔹 Question text and image
      text: q.text || q.question || "",
      questionImages: q.questionImages || [],

      // 🔹 Options - handle both string and object formats
      options: [
        {
          text: q.option1 || (q.options?.[0]?.text) || "",
          image: q.option1Image || (q.options?.[0]?.image) || null,
        },
        {
          text: q.option2 || (q.options?.[1]?.text) || "",
          image: q.option2Image || (q.options?.[1]?.image) || null,
        },
        {
          text: q.option3 || (q.options?.[2]?.text) || "",
          image: q.option3Image || (q.options?.[2]?.image) || null,
        },
        {
          text: q.option4 || (q.options?.[3]?.text) || "",
          image: q.option4Image || (q.options?.[3]?.image) || null,
        },
      ],

      // 🔹 Correct answer index
      correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,

      // 🔹 Explanation / solution text and image
      explanation: q.explanation || "",
      solutionImages: q.solutionImages || [],

      // 🔹 Table-related fields
      rows: q.rows || 0,
      cols: q.cols || 0,
      tableData: q.tableData || [],

      // 🔹 Matching / advanced question support
      showMatches: q.showMatches || false,
      tableEditable: q.tableEditable || false,
      showQuestionInput: false,
      showSolutionInput: false,

      // 🔹 CRITICAL FIX: Ensure tags are properly copied
      // Try multiple possible tag field locations
      tags: (() => {
        // Check all possible tag locations
        if (Array.isArray(q.tags) && q.tags.length > 0) {
          return [...q.tags];
        }
        if (Array.isArray(q.questionTags) && q.questionTags.length > 0) {
          return [...q.questionTags];
        }
        if (Array.isArray(q.keywords) && q.keywords.length > 0) {
          return [...q.keywords];
        }
        return [];
      })(),
    };

    console.log("📦 Setting currentQuestion with tags:", questionData.tags);

    // Set current question with the tags
    setCurrentQuestion(questionData);

    // CRITICAL: Set questionTags state for the tag input UI
    setQuestionTags(questionData.tags.length > 0 ? [...questionData.tags] : []);
    setQuestionTagInput('');

    setEditingQuestionIndex(index);
  };

  const resetExplanationForm = () => {
    setShowExplanationForm(false);
    setSubTitle("");
    setSubDesc("");
    setSubtopicImages([]);
    setSubtopicTableData([]);
    setShowSubtopicMatches(false);
    setSubtopicTableRows(1);
    setSubtopicTableCols(1);
    setSubtopicTableEditable(false);
    setRecordedVoiceFiles([]);
    setUploadedVoiceFiles([]);
    setAnimFiles([]);
    setEditingSubtopicIndex(null);
    setEditSelecetedSubUnit("");
    setTags([]);
    setTagInput('');
  };
  // Safe URL helper functions
  const getSafeImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === "string") return image;
    if (image instanceof File || image instanceof Blob) {
      try {
        return URL.createObjectURL(image);
      } catch (error) {
        console.warn("Failed to create image object URL:", error);
        return null;
      }
    }
    return null;
  };

  const getSafeAudioUrl = (audioFile) => {
    if (!audioFile) return null;
    if (typeof audioFile === "string") return audioFile;
    if (audioFile instanceof File || audioFile instanceof Blob) {
      try {
        return URL.createObjectURL(audioFile);
      } catch (error) {
        console.warn("Failed to create audio object URL:", error);
        return null;
      }
    }
    return null;
  };

  // Add this function to fetch specific test data
  const fetchTestDetails = async (parentId, testName) => {
    try {
      // You need to create this endpoint in your backend
      const res = await fetch(
        `${API_BASE_URL}/getTest/${parentId}/${testName}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const testData = await res.json();
      return testData;
    } catch (err) {
      console.error("Failed to fetch test details:", err);
      return null;
    }
  };

  // Also add this endpoint to your backend controller:

  const API_BASE_URL2 = `${API_BASE_URL}`;

  // 🔹 Upload file via backend (no CORS issues)
  const uploadFileToBackend = async (file, folderName = "uploads") => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderName", folderName);

    try {
      const res = await fetch(`${API_BASE_URL2}/image/upload`, {
        method: "POST",
        body: formData,
        // Remove credentials if not needed for file upload
        // credentials: 'include'
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Upload failed:", errorText);
        return null;
      }

      const data = await res.json();
      console.log("✅ File uploaded:", data.fileUrl);
      return data.fileUrl;
    } catch (err) {
      console.error("❌ Upload error:", err);
      return null;
    }
  };


  // 🔹 Special processor for updates that handles existing URLs properly
  const processQuestion = async (q) => {
    console.log("🔄 Processing question for UPDATE:", q);
    console.log("🔄 Processing question for UPDATE:", q);
    console.log("🔍 Question object keys:", Object.keys(q));
    console.log("🔍 Question tags in processQuestion:", q.tags);
    console.log("🔍 Is tags an array?", Array.isArray(q.tags));

    // ✅ Handle question images
    const questionImageUrls = [];
    if (q.questionImages && q.questionImages.length > 0) {
      for (const img of q.questionImages) {
        if (img instanceof File) {
          const url = await uploadFileToBackend(img, "questions");
          if (url) questionImageUrls.push(url);
        } else if (typeof img === "string" && img.startsWith("http")) {
          questionImageUrls.push(img);
        }
      }
    }

    // ✅ Handle solution images
    const solutionImageUrls = [];
    if (q.solutionImages && q.solutionImages.length > 0) {
      for (const img of q.solutionImages) {
        if (img instanceof File) {
          const url = await uploadFileToBackend(img, "solutions");
          if (url) solutionImageUrls.push(url);
        } else if (typeof img === "string" && img.startsWith("http")) {
          solutionImageUrls.push(img);
        }
      }
    }

    // ✅ Process options
    const processedOptions = [];
    for (let i = 0; i < 4; i++) {
      const opt = q.options?.[i];
      const isString = typeof opt === "string";

      const text = isString ? opt : opt?.text || `Option ${i + 1}`;
      let image = null;

      if (!isString && opt?.image) {
        if (opt.image instanceof File) {
          image = await uploadFileToBackend(opt.image, "options");
        } else if (
          typeof opt.image === "string" &&
          opt.image.startsWith("http")
        ) {
          image = opt.image;
        }
      }

      processedOptions.push({ text, image });
    }

    // ✅ CRITICAL FIX: Include tags from the question
    const processedQuestion = {
      question: q.text || "",
      questionImages: questionImageUrls,
      explanation: q.explanation || "",
      solutionImages: solutionImageUrls,

      option1: processedOptions[0].text,
      option1Image: processedOptions[0].image,
      option2: processedOptions[1].text,
      option2Image: processedOptions[1].image,
      option3: processedOptions[2].text,
      option3Image: processedOptions[2].image,
      option4: processedOptions[3].text,
      option4Image: processedOptions[3].image,

      correctIndex: q.correctIndex || 0,

      // ✅ Include table data
      rows: q.rows || 0,
      cols: q.cols || 0,
      tableData: q.tableData || [],

      // ✅ CRITICAL: Include question tags
      tags: q.tags || [], // This was missing!
    };

    console.log("✅ Processed question with tags:", processedQuestion.tags);
    return processedQuestion;
  };

  // 🔹 Save Test Handler
  const handleSaveTest = async () => {
    if (!selectedUnit)
      return alert("Please select a lesson before saving the test.");
    if (!testName.trim()) return alert("Please enter a test name.");

    const pass = parseInt(passPercentage);
    if (!pass || pass <= 0 || pass > 100)
      return alert("Pass percentage must be between 1 and 100.");
    if (questions.length === 0)
      return alert("Add at least one question before saving the test.");

    try {
      // ✅ Process all questions
      const processedQuestions = [];
      for (const q of questions) {
        const processed = await processQuestion(q);
        processedQuestions.push(processed);

        // Debug log for tags
        console.log("📝 Question tags being saved:", {
          question: q.text?.substring(0, 50),
          tags: q.tags,
          processedTags: processed.tags
        });
      }

      const testDatas = {
        dbname: courseName,
        rootId: firstClicked,
        parentId: lastClicked,
        subjectName: subjectName,
        testName: testName.trim(),
        unitName: selectedUnit,
        marks: pass,
        questionsList: processedQuestions,
        tags: testTags, // This is for test-level tags
      };

      console.log("🚀 Final Test Data:", JSON.stringify(testDatas, null, 2));

      console.log("🔍 QUESTION TAGS VERIFICATION:");
      testDatas.questionsList.forEach((q, idx) => {
        console.log(`Q${idx + 1}:`, {
          question: q.question?.substring(0, 50),
          tags: q.tags,
          hasTags: Array.isArray(q.tags),
          tagsCount: q.tags?.length || 0
        });
      });

      // Debug: Check if question tags are present
      if (testDatas.questionsList && testDatas.questionsList.length > 0) {
        console.log("🔍 Checking question tags in final payload:");
        testDatas.questionsList.forEach((q, idx) => {
          console.log(`Q${idx + 1} tags:`, q.tags);
        });
      }



      const url =
        editingTestIndex === "value"
          ? `${API_BASE_URL}/updateQuestion/${lastClicked}/${oldQuestionForDeletion}`
          : `${API_BASE_URL}/addQuestion/${lastClicked}`;
      const method = editingTestIndex === "value" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testDatas),
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        console.error("❌ Backend error:", errorMsg);
        throw new Error(`Failed to save test: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Test submitted:", data);

      // Reset UI
      getAllData();
      setSelectedTest(null);
      resetTestForm();
      setCurrentQuestion({
        rows: 1,
        cols: 1,
        tableData: [],
        showMatches: false,
        tableEditable: false,
      });
    } catch (err) {
      console.error("⚠️ Submission failed:", err);
    }
  };

  const handleUpdateTest = async () => {
    console.log("🔍 ========== UPDATE TEST DEBUG INFO ==========");

    // Validation
    if (!selectedUnit) {
      alert("Please select a lesson before updating the test.");
      return;
    }

    if (!testName.trim()) {
      alert("Please enter a test name.");
      return;
    }

    if (!oldQuestionForDeletion) {
      alert("Cannot update test: Original test name not found.");
      return;
    }

    const pass = parseInt(passPercentage);
    if (!pass || pass <= 0 || pass > 100) {
      alert("Pass percentage must be between 1 and 100.");
      return;
    }

    if (!questions || questions.length === 0) {
      alert("Add at least one question before updating.");
      return;
    }

    try {
      console.log("🔄 Processing questions for upload...");

      // 🔹 Process all questions
      const processedQuestions = [];
      for (const q of questions) {
        const processed = await processQuestion(q);
        processedQuestions.push(processed);
      }

      // 🔹 ADDED: COMPLETE DEBUG SECTION - Check ALL data before final payload
      console.log(
        "🔍 ========== COMPLETE PROCESSED QUESTIONS DEBUG =========="
      );
      console.log("Total questions processed:", processedQuestions.length);

      processedQuestions.forEach((question, index) => {
        console.log(`\n📋 QUESTION ${index + 1} FULL DATA:`);
        console.log(JSON.stringify(question, null, 2));
      });

      // Check specific fields you're concerned about
      console.log("\n🔍 SPECIFIC FIELDS CHECK:");
      processedQuestions.forEach((q, index) => {
        console.log(`Q${index + 1} - Explanation: "${q.explanation}"`);
        console.log(`Q${index + 1} - Correct Index: ${q.correctIndex}`);
        console.log(`Q${index + 1} - Option 2: "${q.option2}"`);
        console.log(
          `Q${index + 1} - All Options: 1:"${q.option1}", 2:"${q.option2
          }", 3:"${q.option3}", 4:"${q.option4}"`
        );
      });
      console.log("🔍 =======================================================");

      console.log("✅ Processed questions:", processedQuestions);

      console.log("🔍 QUESTION TAGS VERIFICATION IN UPDATE:");
      processedQuestions.forEach((q, idx) => {
        console.log(`Q${idx + 1}:`, {
          question: q.question?.substring(0, 50),
          tags: q.tags,
          hasTags: Array.isArray(q.tags),
          tagsCount: q.tags?.length || 0,
          isTagsArray: Array.isArray(q.tags)
        });
      });

      // 🔹 Prepare payload with ALL required fields
      const testData = {
        dbname: courseName,
        rootId: firstClicked,
        parentId: lastClicked,
        subjectName: subjectName,
        testName: testName.trim(),
        unitName: selectedUnit,
        marks: pass,
        questionsList: processedQuestions,
        tags: testTags,
      };

      // console.log("🔍 Current explanation value:", formState.explanation);

      console.log(
        "🚀 Final Update Payload:",
        JSON.stringify(testData, null, 2)
      );

      // ✅ FIX: Use the correct API_BASE_URL and ensure proper encoding
      const encodedOldTestName = encodeURIComponent(oldQuestionForDeletion);
      const url = `${API_BASE_URL}/updateQuestion/${lastClicked}/${encodedOldTestName}`;

      console.log("📡 Making PUT request to:", url);

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      });

      console.log("📨 Response Status:", res.status);

      if (!res.ok) {
        const errorMsg = await res.text();
        console.error("❌ Backend error response:", errorMsg);
        throw new Error(`Failed to update test: ${res.status} - ${errorMsg}`);
      }

      const data = await res.json();
      console.log("✅ Test updated successfully:", data);

      // ✅ CRITICAL: Create updated test object with the processed data
      const updatedTest = {
        testName: testName.trim(),
        name: testName.trim(),
        marks: pass,
        passPercentage: pass,
        questionsList: processedQuestions,
        questions: processedQuestions,
        unitName: selectedUnit,
      };

      // ✅ Update selectedTest with the new data immediately
      setSelectedTest(updatedTest);
      console.log("✅ Immediately updated selectedTest:", updatedTest);

      // ✅ Refresh all data from server
      await getAllData();

      // ✅ Reset form and states
      resetTestForm();
      setEditingTestIndex(null);
      setOldQuestionForDeletion("");

      alert("✅ Test updated successfully!");
    } catch (err) {
      console.error("⚠️ Update failed:", err);
      alert(`Failed to update test: ${err.message}`);
    }
  };

  const handleEditTest = async (test) => {
    if (!test) return;

    console.log("🎯 Starting edit mode for test:", test.testName || test.name);

    // ✅ 1. Set editing state
    setEditingTestIndex("editing");

    // ✅ 2. CRITICAL: Set the old test name for the update API call
    const oldTestName = test.testName || test.name;
    setOldQuestionForDeletion(oldTestName);

    // ✅ 3. Set the selected unit from the test data
    if (test.unitName) {
      setSelectedUnit(test.unitName);
    }

    // ✅ 4. Show form
    setShowTestForm(true);
    setShowExplanationForm(false);

    // ✅ 5. Load test-level fields
    setTestName(test.name || test.testName || "");
    setPassPercentage(test.passPercentage || test.marks || "");
    setTestTags(test.tags || []);

    // ✅ 6. Use the existing test data directly (no refresh needed)
    console.log("✅ Using existing test data for editing:", test);

    // ✅ 7. Extract questions - IMPROVED handling
    const questionArray = test.questionsList || test.questions || [];

    if (Array.isArray(questionArray) && questionArray.length > 0) {
      const formattedQuestions = questionArray.map((q, index) => {
        // Ensure we have a proper question object with all required fields
        const question = {
          id: q.id || q._id || `q-${index}`, // ✅ FIX: Handle both id and _id
          text: q.question || q.text || "",
          questionImages: Array.isArray(q.questionImages)
            ? q.questionImages
            : [],
          options: [
            {
              text: q.option1 || "",
              image: q.option1Image || null,
            },
            {
              text: q.option2 || "",
              image: q.option2Image || null,
            },
            {
              text: q.option3 || "",
              image: q.option3Image || null,
            },
            {
              text: q.option4 || "",
              image: q.option4Image || null,
            },
          ],
          correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
          explanation: q.explanation || "",
          solutionImages: Array.isArray(q.solutionImages)
            ? q.solutionImages
            : [],
          rows: q.rows || 0,
          cols: q.cols || 0,
          tableData: Array.isArray(q.tableData) ? q.tableData : [],
          showMatches: Array.isArray(q.tableData) && q.tableData.length > 0,
          tableEditable: false,
          tags: q.tags || [],
        };

        console.log(`✅ Loaded question ${index}:`, question);
        return question;
      });

      setQuestions(formattedQuestions);

      // Set first question as current for editing
      if (formattedQuestions.length > 0) {
        setCurrentQuestion(formattedQuestions[0]);
        setEditingQuestionIndex(0);
      }

      console.log("✅ All questions loaded for editing:", formattedQuestions);
    } else {
      console.warn("⚠️ No questions found in test");
      setQuestions([]);
    }

    console.log("✅ Edit mode activated:", {
      oldTestName: oldTestName,
      selectedUnit: test.unitName || selectedUnit,
      questionsCount: questionArray.length,
    });
  };

  const handleDeleteTest = async (test) => {
    if (!test) {
      alert("No test selected for deletion.");
      return;
    }

    const testNameToDelete = test.testName || test.name;
    if (!testNameToDelete) {
      alert("Cannot delete test: Test name not found.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the test "${testNameToDelete}"?`
    );
    if (!confirmed) return;

    try {
      console.log("🗑️ Deleting test:", testNameToDelete);

      // 🔥 FIXED: Use correct payload structure for WrapperMCQTest
      const deleteData = {
        dbname: courseName,
        parentId: lastClicked,
        rootId: firstClicked,
        subjectName: subjectName,
        testName: testNameToDelete,
      };

      console.log("🗑️ Delete payload:", deleteData);

      // 🔥 FIXED: Use correct endpoint
      const url = `${API_BASE_URL}/deleteQuestion/${lastClicked}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deleteData),
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        throw new Error(`Delete failed: ${res.status} - ${errorMsg}`);
      }

      const data = await res.json();
      console.log("✅ Test deleted successfully:", data);

      // Refresh data and reset UI
      getAllData();
      setSelectedTest(null);
      resetTestForm();

      alert("✅ Test deleted successfully!");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert(`Failed to delete test: ${err.message}`);
    }
  };

  const resetTestForm = () => {
    console.log("🔄 Resetting test form");

    setTestName("");
    setPassPercentage("");
    setTestTimeLimit("");
    setQuestions([]);
    setShowExplanationForm(false);
    setShowTestForm(false);
    setTestTags([]);
    setTestTagInput('');

    // Reset current question
    setCurrentQuestion({
      text: "",
      image: null,
      questionImages: [],
      options: [
        { text: "", image: null },
        { text: "", image: null },
        { text: "", image: null },
        { text: "", image: null },
      ],
      correctIndex: null,
      explanation: "",
      solutionImages: [],
      rows: 1,
      cols: 1,
      tableData: [],
      showMatches: false,
      tableEditable: false,
      showQuestionInput: false,
      showSolutionInput: false,
    });

    setQuestionTags([]);
    setQuestionTagInput('');

    // Reset editing states
    setEditingTestIndex(null);
    setOldQuestionForDeletion("");
    setEditingQuestionIndex(null);

    console.log("✅ Test form reset complete");
  };

  const currentUnits =
    standards.length > 0
      ? unitsMap[selectedStandard] || []
      : unitsMap.default || [];
  const renderSubtopicsRecursive = (subtopics, depth = 0) => {
    return subtopics.map((sub, idx) => (
      <li
        key={`${sub.title}-${idx}`}
        style={{ marginTop: "5px", marginLeft: `${depth * 10}px` }}
      >
        <span
          onClick={() => setSelectedSubtopic(sub)}
          style={{ cursor: "pointer" }}
        >
          📘 {sub.title}
        </span>
        {sub.children && sub.children.length > 0 && (
          <ul style={{ marginLeft: "15px" }}>
            {renderSubtopicsRecursive(sub.children, depth + 1)}
          </ul>
        )}
      </li>
    ));
  };

  const handleDeleteSubtopicReal = (subUnit) => {
    if (!subUnit) return alert("No subunit selected");
    const confirmed = window.confirm(
      "Are you sure you want to delete this subtopic?"
    );
    if (!confirmed) return;

    const currentdata = {
      dbname: courseName,
      subjectName: subjectName,
      standard: standard,
      parentId: subUnit.id, // ✅ real subunit id
      rootId: firstClicked, // ✅ root id
      unitName: subUnit.unitName,
      explanation: subUnit.explanation || "",
    };

    fetch(`${API_BASE_URL}/deleteUnit`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentdata),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "deleted") {
          alert("Subunit deleted successfully!");
          getAllData();
          setEditSelecetedSubUnit("");
          setSelectedSubUnit(null);
          setSelectedUnit(null);
          setSelectedSubTopicUnit(null);
          setSelectedSubTopicUnitAudio([]);
          setShowExplanationForm(false);
          setLastClicked(null);
          setFirstClicked(null);
        } else {
          alert("Failed to delete subunit.");
        }
      })
      .catch((err) => console.error("Delete error:", err));
  };

  const unitSelection = (unit, path) => {
    //console.log("Unit Path:", path); // use directly
    setSelectedUnit(path); // optional if needed elsewhere
    setSelectedSubtopic(null);
    setSelectedTest(null);
  };

  const handleSetEditSelecetedSubUnit = (subUnit) => {
    if (!subUnit) return;
    console.log("Editing subUnit:", subUnit);

    // set edit id
    setEditSelecetedSubUnit(subUnit.id || subUnit._id);

    // ✅ CRITICAL: Update lastInsertedSubtopicId for editing
    if (subUnit.id || subUnit._id) {
      const subtopicId = subUnit.id || subUnit._id;
      localStorage.setItem("lastInsertedSubtopicId", subtopicId);
      console.log("✅ Updated lastInsertedSubtopicId for editing subtopic:", subtopicId);
    }

    if (subUnit.tableData && Array.isArray(subUnit.tableData)) {
      setSubtopicTableData(subUnit.tableData);
      setShowSubtopicMatches(true);
      setSubtopicTableRows(subUnit.rows || 1);
      setSubtopicTableCols(subUnit.cols || 1);
      setSubtopicTableEditable(false); // Start in locked mode
    } else {
      setSubtopicTableData([]);
      setShowSubtopicMatches(false);
      setSubtopicTableRows(1);
      setSubtopicTableCols(1);
    }

    setSubTitle(subUnit.unitName || "");

    // ✅ FIXED: Use explanation field for editing form, not customDescription
    // This way we don't accidentally overwrite the customDescription
    setSubDesc(subUnit.explanation || "");

    setTags(subUnit.tags || []);

    // ✅ FIXED: Log customDescription for debugging
    console.log("📝 Editing subtopic with customDescription:", subUnit.customDescription);

    // ✅ FIXED: Properly load existing images
    if (subUnit.imageUrls && Array.isArray(subUnit.imageUrls)) {
      setSubtopicImages([...subUnit.imageUrls]);
    } else {
      setSubtopicImages([]);
    }

    // ✅ FIXED: Properly load existing audio files
    if (subUnit.audioFileId && Array.isArray(subUnit.audioFileId)) {
      setSelectedSubTopicUnitAudio([...subUnit.audioFileId]);
    } else {
      setSelectedSubTopicUnitAudio([]);
    }

    setRecordedVoiceFiles([]);
    setUploadedVoiceFiles([]);

    setShowExplanationForm(true);
  };

  // In AdminRight.jsx, replace your rename function with this:
  // Add this function after your other handlers (around line 1500-1600)
  const handleRenameVideo = async () => {
    const currentUrl = selectedSubTopicUnit?.aiVideoUrl;

    if (!currentUrl) {
      alert("No video URL found");
      return;
    }

    try {
      // Parse the current URL to get components
      const urlParts = currentUrl.split('/');
      const bucket = urlParts[2].split('.')[0];
      const fullPath = urlParts.slice(3).join('/');
      const filename = fullPath.split('/').pop() || 'video.mp4';

      // Get current path components
      const currentPath = fullPath.substring(0, fullPath.lastIndexOf('/') + 1);

      // Get the standard
      const unitStandard = getUnitStandard(selectedSubTopicUnit) || standard || '11';

      // ✅ Get the parent ID from the selected subtopic (MUST be defined before use)
      const parentId = selectedSubTopicUnit.parentId ||
        findParentId(unitData, selectedSubTopicUnit._id || selectedSubTopicUnit.id) ||
        lastClicked;

      // ✅ Build the full hierarchical path for nested topics
      const buildHierarchicalPath = (unit) => {
        const pathSegments = [];
        let currentUnit = unit;

        // Helper function to find a unit by ID in the tree
        const findUnitPath = (units, targetId, currentPath = []) => {
          if (!units || !Array.isArray(units)) return null;

          for (const u of units) {
            // Check if this is the target unit
            if (u._id === targetId || u.id === targetId) {
              return [...currentPath, u.unitName];
            }

            // Check children recursively
            if (u.units && Array.isArray(u.units)) {
              const result = findUnitPath(u.units, targetId, [...currentPath, u.unitName]);
              if (result) return result;
            }
          }
          return null;
        };

        // Find the full path of parent folders
        const fullPathSegments = findUnitPath(unitData, selectedSubTopicUnit._id || selectedSubTopicUnit.id);

        if (fullPathSegments) {
          // Remove the last segment (current unit) to get just the parent path
          const parentPathSegments = fullPathSegments.slice(0, -1);

          // Sanitize each segment and join with '/'
          const sanitizedSegments = parentPathSegments.map(segment =>
            segment?.replace(/[^a-zA-Z0-9]/g, '_') || ''
          ).filter(segment => segment.length > 0);

          return sanitizedSegments.join('/');
        }

        // Fallback to just the parent lesson if path not found
        return findParentLesson(unitData, selectedSubTopicUnit._id || selectedSubTopicUnit.id) ||
          selectedUnit ||
          selectedSubTopicUnit.unitName;
      };

      // ✅ Get the full hierarchical parent path
      const hierarchicalParentPath = buildHierarchicalPath(selectedSubTopicUnit);

      // Sanitize the current subtopic name
      const safeSubtopicName = selectedSubTopicUnit.unitName?.replace(/[^a-zA-Z0-9]/g, '_') || 'video';

      // ✅ Create a clean suggested path with proper hierarchy
      const suggestedPath = `s3://trilokinnovations-test-admin/subtopics/aivideospath/standard_${unitStandard}/${subjectName}/${hierarchicalParentPath}/${safeSubtopicName}/${filename}`;

      const newFullS3Path = prompt(
        `📋 EDIT THE FULL S3 PATH BELOW\n\n` +
        `This will COPY the video to the new path (original will be preserved)\n\n` +
        `Current path: ${currentPath}\n` +
        `Filename: ${filename}\n\n` +
        `Suggested new path:`,
        suggestedPath
      );

      if (!newFullS3Path) return;

      if (!newFullS3Path.startsWith('s3://') || !newFullS3Path.endsWith('.mp4')) {
        alert("❌ Path must start with s3:// and end with .mp4");
        return;
      }

      console.log("🔄 Starting COPY process...");
      console.log("📌 Parent ID being sent:", parentId);

      const requestBody = {
        sourceUrl: currentUrl,
        destinationPath: newFullS3Path,
        dbname: courseName,
        subjectName: subjectName,
        subtopicId: selectedSubTopicUnit._id || selectedSubTopicUnit.id,
        rootId: firstClicked,
        parentId: parentId,  // ✅ Now parentId is defined
        standard: unitStandard,
        lessonName: hierarchicalParentPath,
        customDescription: selectedSubTopicUnit.customDescription || selectedSubTopicUnit.description || ""
      };

      console.log("📤 Request Body:", requestBody);

      setIsMoving(true);
      setMovingItem(selectedSubTopicUnit);

      const response = await fetch(`${FRONTEND_URL_AI}/api/copy-s3-file`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("📨 Response:", result);

      if (result.success) {
        alert(
          `✅ Video copied successfully!\n\n` +
          `Database updated: ${result.database_updated ? '✅ Yes' : '❌ No'}\n\n` +
          `New video URL: ${result.newUrl}`
        );

        // Update local state with new URL
        const updatedUnit = {
          ...selectedSubTopicUnit,
          aiVideoUrl: result.newUrl
        };

        setSelectedSubTopicUnit(updatedUnit);

        // Also update in the unitData tree
        const updateUnitInTree = (units) => {
          if (!units || !Array.isArray(units)) return units;

          return units.map(unit => {
            // Check if this is the target unit
            if (unit.id === selectedSubTopicUnit.id || unit._id === selectedSubTopicUnit._id) {
              return { ...unit, aiVideoUrl: result.newUrl };
            }

            // Check children
            if (unit.units && Array.isArray(unit.units)) {
              return {
                ...unit,
                units: updateUnitInTree(unit.units)
              };
            }

            return unit;
          });
        };

        setUnitData(prev => updateUnitInTree(prev));

      } else {
        alert(`❌ Copy failed: ${result.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error("❌ Error:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsMoving(false);
      setMovingItem(null);
    }
  };

  // Add these helper functions in your AdminRight.jsx component
  // Place them after your useState declarations and before the return statement

  // Helper function to find lesson name by ID
  const findLessonNameById = (units, targetId) => {
    if (!units || !Array.isArray(units)) return null;

    for (const unit of units) {
      // Check if this is the target unit itself
      if (unit.id === targetId || unit._id === targetId) {
        return unit.unitName;
      }

      // Check if this unit contains the target as a child
      if (unit.units && Array.isArray(unit.units)) {
        // First check if any direct child has this ID
        for (const child of unit.units) {
          if (child.id === targetId || child._id === targetId) {
            return unit.unitName; // Return the parent (lesson) name
          }
        }

        // Recursively search deeper in nested children
        const found = findLessonNameById(unit.units, targetId);
        if (found) {
          // If found in deeper nested structure, still return the top-level lesson name
          // Check if this unit is a top-level lesson (has standard or is at root level)
          if (unit.standard || unit.isLesson || unit.unitLevel === 0) {
            return unit.unitName;
          }
          return found;
        }
      }
    }

    return null;
  };

  // Helper function to find the full path of a subtopic
  const findSubtopicPath = (units, targetId, currentPath = []) => {
    if (!units || !Array.isArray(units)) return null;

    for (const unit of units) {
      const newPath = [...currentPath, unit.unitName];

      // Check if this is the target
      if (unit.id === targetId || unit._id === targetId) {
        return newPath.join(' > ');
      }

      // Search in children
      if (unit.units && Array.isArray(unit.units)) {
        const found = findSubtopicPath(unit.units, targetId, newPath);
        if (found) return found;
      }
    }

    return null;
  };

  // Helper function to find the parent lesson of a subtopic
  const findParentLesson = (units, targetId) => {
    if (!units || !Array.isArray(units)) return null;

    for (const unit of units) {
      // Check if this unit contains the target as a direct child
      if (unit.units && Array.isArray(unit.units)) {
        for (const child of unit.units) {
          if (child.id === targetId || child._id === targetId) {
            return unit.unitName;
          }
        }

        // Recursively search in deeper children
        const found = findParentLesson(unit.units, targetId);
        if (found) return found;
      }
    }

    return null;
  };

  // Helper function to get standard from unit
  const getUnitStandard = (unit) => {
    if (!unit) return null;

    // Check if unit has standard directly
    if (unit.standard) return unit.standard;

    // Check if it's a special subject
    const subjectsWithoutStandard = ['NEET Previous Questions', 'Formulas', 'JEE Previous Questions', 'Previous Questions'];
    if (subjectsWithoutStandard.includes(subjectName)) {
      return 'special';
    }

    // Return the prop standard as fallback
    return standard;
  };

  // Helper function to sanitize strings for URL/S3 path
  const sanitizeForPath = (str) => {
    if (!str) return 'unnamed';
    return str
      .replace(/[^a-zA-Z0-9\-_\s]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);
  };

  const handleUpdateSubtopic = async () => {
    if (!editSelecetedSubUnit) {
      alert("No subunit selected for update");
      return;
    }

    try {
      console.log("🔄 Starting subtopic update...");

      // ✅ PRESERVE: Get current customDescription BEFORE updating
      const currentCustomDescription = selectedSubTopicUnit?.customDescription || "";
      console.log("📝 Preserving customDescription:", currentCustomDescription);

      // ✅ FIXED: Process images properly
      const imageUrls = [];
      if (subtopicImages && subtopicImages.length > 0) {
        for (const img of subtopicImages) {
          if (img instanceof File) {
            const imageUrl = await uploadFileToBackend(img, "subtopics/images");
            if (imageUrl) imageUrls.push(imageUrl);
          } else if (typeof img === "string" && img.startsWith("http")) {
            imageUrls.push(img);
          }
        }
      }

      // ✅ FIXED: Process audio files
      const audioFileIds = [];
      const allAudios = [...recordedVoiceFiles, ...uploadedVoiceFiles];
      for (const audioFile of allAudios) {
        if (audioFile instanceof File) {
          const audioUrl = await uploadFileToBackend(audioFile, "subtopics/audios");
          if (audioUrl) audioFileIds.push(audioUrl);
        } else if (typeof audioFile === "string" && audioFile.startsWith("http")) {
          audioFileIds.push(audioFile);
        }
      }

      // ✅ CRITICAL FIX: Proper payload structure - KEEP customDescription SEPARATE
      const updatedData = {
        dbname: courseName,
        subjectName: subjectName,
        standard: standard,
        parentId: editSelecetedSubUnit,
        rootId: firstClicked,
        unitName: subTitle,
        explanation: subDesc, // This is the regular description field
        // ✅ IMPORTANT: Preserve customDescription if it exists
        customDescription: currentCustomDescription, // Don't change this
        // ✅ description field should be EITHER customDescription OR subDesc
        description: currentCustomDescription ? currentCustomDescription : subDesc,
        audioFileId: audioFileIds.length > 0 ? audioFileIds : selectedSubTopicUnitAudio || [],
        imageUrls: imageUrls,
        tags: tags,
        aiVideoUrl: selectedSubTopicUnit?.aiVideoUrl || "",
        tableData: showSubtopicMatches && subtopicTableData.length > 0 ? subtopicTableData : [],
        rows: subtopicTableRows,
        cols: subtopicTableCols,
        showMatches: showSubtopicMatches,
      };

      console.log("✅ Update payload with preserved fields:", {
        customDescription: updatedData.customDescription,
        description: updatedData.description,
        explanation: updatedData.explanation
      });

      const response = await fetch(`${API_BASE_URL}/updateSubsection`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();
      console.log("Update response:", data);

      if (data.status === "updated") {
        alert("✅ Subtopic updated - Custom description preserved!");

        // ✅ FIXED: Update local state with preserved customDescription
        const updatedSubTopicUnit = {
          ...selectedSubTopicUnit,
          unitName: subTitle,
          explanation: subDesc,
          // ✅ Preserve customDescription
          customDescription: currentCustomDescription,
          description: currentCustomDescription ? currentCustomDescription : subDesc,
          imageUrls: imageUrls,
          audioFileId: audioFileIds.length > 0 ? audioFileIds : selectedSubTopicUnitAudio,
          tags: tags,
        };

        // Update selected subtopic in state
        setSelectedSubTopicUnit(updatedSubTopicUnit);

        // Also update in the unitData tree if needed
        const updateUnitInTree = (units) => {
          return units.map(unit => {
            if (unit.id === editSelecetedSubUnit || unit._id === editSelecetedSubUnit) {
              return updatedSubTopicUnit;
            }
            if (unit.units && Array.isArray(unit.units)) {
              return {
                ...unit,
                units: updateUnitInTree(unit.units)
              };
            }
            return unit;
          });
        };

        setUnitData(prev => updateUnitInTree(prev));

        getAllData(); // refresh from server
        setEditSelecetedSubUnit("");
        setShowExplanationForm(false);
        setSubtopicImages([]);
      } else {
        alert("Failed to update subtopic");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("Update request failed. Check console & backend logs.");
    }
  };

  const removeServerAudio = (indexToRemove) => {
    setServerAudioFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const addNewSubTopic = async () => {
    //  handleStopRecording()
    if (isRecording) {
      alert("Stop recording first before adding a subtopic.");
      return;
    }

    const allAudioFiles = [...recordedVoiceFiles, ...uploadedVoiceFiles];
    const uploadedUrls = [];
    for (const file of allAudioFiles) {
      console.log("Audio file object:", file);
      const fileName = encodeURIComponent(file.name);
      const fileType = encodeURIComponent(file.type);
      // 🔸 Get presigned PUT URL from backend
      //  const res = await fetch(`https://trilokinnovations-api-prod.trilokinnovations.com/test/api/audio/presigned-url?fileName=${fileName}&fileType=${fileType}`);

      const res = await fetch(
        `${API_BASE_URL}/audio/presigned-url?fileName=${fileName}&fileType=${fileType}`
      );
      const { uploadUrl, fileUrl } = await res.json();
      //console.log(uploadUrl,"    0",fileUrl)
      // 🔸 Upload file to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (uploadRes.ok) {
        uploadedUrls.push(fileUrl);
      } else {
        // console.error("Upload failed for", file.name);
        return;
      }
    }
    let allUrls;
    if (editSelecetedSubUnit === "value") {
      const oldUrls = selectedSubTopicUnit?.audioFileId || [];

      // 🔁 Merge both
      allUrls = [...oldUrls, ...uploadedUrls];
    } else {
      allUrls = [...uploadedUrls];
    }
    const currentdata = {
      dbname: courseName,
      subjectName: subjectName,
      standard: standard,

      parentId: lastClicked,
      rootId: firstClicked,
      unitName: subTitle,
      explanation: subDesc,
      audioFileId: allUrls,
    };
    //console.log(currentdata)
    const formData = new FormData();
    formData.append(
      "unit",
      new Blob([JSON.stringify(currentdata)], { type: "application/json" })
    );

    // Append all audio files as one field: "audioFiles"
    const url =
      editSelecetedSubUnit === "value"
        ? `${API_BASE_URL}/updateSubsection`
        : `${API_BASE_URL}/addNewSubsection`;
    // ?`https://trilokinnovations-api-prod.trilokinnovations.com/test/updateSubsection`
    // :`https://trilokinnovations-api-prod.trilokinnovations.com/test/addNewSubsection`

    fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
    })
      .then((resp) => {
        // console.log("✅ Upload response", resp);
        return resp.json();
      })
      .then((data) => {
        getAllData();
        setSubTitle();
        setSubDesc();
        setEditSelecetedSubUnit("");
        setSelectedSubUnit(null);
        setSelectedUnit(null);
        setSelectedSubTopicUnit(null);
        setSelectedSubTopicUnitAudio([]);
        setShowExplanationForm(false);
        setLastClicked(null);
        setFirstClicked(null);
        setRecordedVoiceFiles([]);
        setUploadedVoiceFiles([]);
        // console.log("✅ Data saved:", data);
        // Reset form
      })
      .catch((err) => {
        console.error("❌ Error saving data", err);
      });
    setSelectedSubTopicUnitAudio([]);
    setRecordedVoiceFiles([]);
    setUploadedVoiceFiles([]);
  };

  const handleOptionImagesChange = (idx, fileList) => {
    const files = Array.from(fileList).slice(0, 4);
    setCurrentQuestion((q) => {
      const options = [...q.options];
      const prev = options[idx] || {};
      options[idx] = {
        ...prev,
        images: files,
        // keep existing descriptions when possible; fill missing with ""
        imageDescriptions: files.map(
          (_, i) => prev.imageDescriptions?.[i] || ""
        ),
      };
      return { ...q, options };
    });
  };

  const handleImageDescChange = (idx, imgIdx, value) => {
    setCurrentQuestion((q) => {
      const options = [...q.options];
      const opt = { ...options[idx] };
      const desc = [...(opt.imageDescriptions || [])];
      desc[imgIdx] = value;
      opt.imageDescriptions = desc;
      options[idx] = opt;
      return { ...q, options };
    });
  };

  const handleAddheadUnit = async () => {
    if (!newUnit) return;

    const subjectsWithoutStandard = ['NEET Previous Questions', 'Formulas'];
    const isSpecialSubject = subjectsWithoutStandard.includes(subjectName);

    const isEditing = editHeadUnit === "value";
    const url = isEditing
      ? `${API_BASE_URL}/updateHeadUnit/${newUnit}`
      : `${API_BASE_URL}/addNewHeadUnit`;
    const method = isEditing ? "PUT" : "POST";

    const payload = {
      dbname: courseName,
      subjectName: subjectName,
      unit: {
        unitName: isEditing ? oldHeadUnitName : newUnit,
        // ✅ Only send standard if it's NOT a special subject
        ...(!isSpecialSubject && { standard: standard })
      },
    };

    try {
      const resp = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (data.status === "pass") {
        getAllData();
      }
    } catch (err) {
      console.error("new unit fetch error", err);
    } finally {
      setNewUnit("");
      setOldHeadUnitName("");
      setEditingLessonIndex(null);
      setEditHeadUnit("");
    }
  };

  const handleEditHeadLesson = (unitName) => {
    // For special subjects, we don't need to worry about standard
    setNewUnit(unitName);
    setOldHeadUnitName(unitName);
    setEditHeadUnit("value");
  };

  const handleDeleteHeadLesson = (unitName) => {
    const confirmed = window.confirm(
      "Are you sure You want to Delete this whole unit"
    );
    if (!confirmed) return;

    // Determine if this is a special subject
    const subjectsWithoutStandard = ['NEET Previous Questions', 'Formulas'];
    const isSpecialSubject = subjectsWithoutStandard.includes(subjectName);

    const payload = {
      dbname: courseName,
      subjectName: subjectName,
      unit: {
        unitName: unitName,
        // Only include standard for non-special subjects
        ...(!isSpecialSubject && { standard: standard })
      },
    };

    console.log("🗑️ Deleting unit with payload:", payload);

    fetch(`${API_BASE_URL}/deleteHeadUnit`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((resp) => resp.json())
      .then((resp) => {
        console.log("🗑️ Delete response:", resp);
        if (resp.status === "pass") {
          getAllData();
          setSelectedUnit(null);
        }
      })
      .catch((err) => {
        console.log("new unit fetch error", err);
      });
  };

  const changeTestToFrontend = (realTest) => {
    console.log("🔄 Converting real test to frontend format:", realTest);

    // Use the actual structure from your database
    const test = {
      name: realTest.testName,
      testName: realTest.testName,
      marks: realTest.marks,
      passPercentage: realTest.marks,
      questionsList: realTest.questionsList || [], // Use questionsList directly
      questions: realTest.questionsList || [], // Also set questions for compatibility
      tags: realTest.tags || [],
    };

    console.log("✅ Converted test:", test);
    setSelectedTest(test);
    setShowTestForm(false);
    setShowExplanationForm(false);
  };


  const renderUnitTree = (units, parentPath = "") => {
    // ✅ SAFE CHECK: Prevent "map is not a function" error
    if (!Array.isArray(units) || units.length === 0) {
      return (
        <div style={{ padding: "10px", color: "#666", fontStyle: "italic" }}>
          No units available
        </div>
      );
    }

    return (
      <ul style={{ listStyleType: "none", paddingLeft: "10px" }}>
        {units.map((unit, index) => {
          const currentPath = parentPath
            ? `${parentPath}/${unit.unitName}`
            : unit.unitName;

          return (
            <li key={unit.id || currentPath}>
              <div style={{ cursor: "pointer", userSelect: "none" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div style={{ marginBottom: "0px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{ flexGrow: 1 }}>
                        <button
                          className={unit.standard ? "lesson-btn" : "none"}
                          style={{
                            padding: unit.standard ? "none" : "0px",
                            margin: unit.standard ? "none" : "0px",
                            color: unit.standard ? undefined : "blue",
                            background: unit.standard ? undefined : "none",
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            width: "100%"
                          }}
                          onClick={() => handleUnitClick(unit, currentPath)}
                        >
                          📚 {unit.unitName}
                        </button>
                      </div>

                      {unit.standard && (
                        <>
                          <div style={{ display: "flex", alignItems: "center", marginLeft: "5px" }}>
                            <button
                              className="move-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLesson(unit, "up");
                              }}
                              title="Move Lesson Up"
                              disabled={isMoving && movingItem?.id === unit.id || index === 0}
                              style={{
                                marginLeft: "2px",
                                opacity: index === 0 ? 0.5 : 1,
                                cursor: index === 0 ? "not-allowed" : "pointer",
                                fontSize: "12px",
                                padding: "2px 5px",
                                background: "#f0f0f0",
                                border: "1px solid #ddd",
                                borderRadius: "3px"
                              }}
                            >
                              ⬆️
                            </button>
                            <button
                              className="move-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveLesson(unit, "down");
                              }}
                              title="Move Lesson Down"
                              disabled={isMoving && movingItem?.id === unit.id || index === units.length - 1}
                              style={{
                                marginLeft: "2px",
                                opacity: index === units.length - 1 ? 0.5 : 1,
                                cursor: index === units.length - 1 ? "not-allowed" : "pointer",
                                fontSize: "12px",
                                padding: "2px 5px",
                                background: "#f0f0f0",
                                border: "1px solid #ddd",
                                borderRadius: "3px"
                              }}
                            >
                              ⬇️
                            </button>
                          </div>
                        </>
                      )}

                      {/* MOVE BUTTONS FOR SUBTOPICS (non-head units) */}
                      {!unit.standard && (
                        <div style={{ display: "flex", alignItems: "center", marginLeft: "5px" }}>
                          <button
                            className="move-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveSubtopic(unit, "up");
                            }}
                            title="Move Up"
                            disabled={isMoving && movingItem?.id === unit.id || index === 0}
                            style={{
                              marginLeft: "2px",
                              opacity: index === 0 ? 0.5 : 1,
                              cursor: index === 0 ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              padding: "2px 5px",
                              background: "#f0f0f0",
                              border: "1px solid #ddd",
                              borderRadius: "3px"
                            }}
                          >
                            ⬆️
                          </button>
                          <button
                            className="move-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveSubtopic(unit, "down");
                            }}
                            title="Move Down"
                            disabled={isMoving && movingItem?.id === unit.id || index === units.length - 1}
                            style={{
                              marginLeft: "2px",
                              opacity: index === units.length - 1 ? 0.5 : 1,
                              cursor: index === units.length - 1 ? "not-allowed" : "pointer",
                              fontSize: "12px",
                              padding: "2px 5px",
                              background: "#f0f0f0",
                              border: "1px solid #ddd",
                              borderRadius: "3px"
                            }}
                          >
                            ⬇️
                          </button>
                        </div>
                      )}

                      {unit.standard && (
                        <>
                          <button
                            className="icon-btn"
                            onClick={() => handleEditHeadLesson(unit.unitName)}
                            title="Edit"
                            style={{ marginLeft: "5px" }}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() =>
                              handleDeleteHeadLesson(unit.unitName)
                            }
                            title="Delete"
                            style={{ marginLeft: "5px" }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      {expandedUnits[currentPath] &&
                        unit.test &&
                        Array.isArray(unit.test) &&
                        unit.test.map((test, idx) => {
                          // Check multiple conditions to identify lessons
                          const isLesson = unit.isLesson ||
                            unit.unitLevel === 0 ||
                            unit.level === 0 ||
                            (unit.parentId === null || unit.parentId === undefined) ||
                            (unitData && findRootOfUnit(unit.id, unitData) === unit.id);

                          return (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                              <button
                                onClick={() => {
                                  console.log("🎯 Selected test from backend:", test);

                                  const frontendTest = {
                                    name: test.testName,
                                    testName: test.testName,
                                    marks: test.marks,
                                    passPercentage: test.marks,
                                    questionsList: test.questionsList || [],
                                    questions: test.questionsList || [],
                                    unitName: unit.unitName,
                                  };

                                  setSelectedTest(frontendTest);

                                  console.log(
                                    "✅ Set selectedTest and selectedUnit:",
                                    frontendTest,
                                    unit.unitName
                                  );

                                  const rootId = findRootOfUnit(unit.id, unitData);
                                  setFirstClicked(rootId);
                                  setLastClicked(unit.id);
                                  setSelectedSubTopicUnit(unit);

                                  setShowTestForm(false);
                                  setShowExplanationForm(false);
                                }}
                                style={{
                                  padding: "0px",
                                  marginLeft: "0px",
                                  background: "none",
                                  color: "blue",
                                  textAlign: "left"
                                }}
                              >
                                📝 {test.testName} {isLesson ? "- Assessment" : ""}
                              </button>

                              {/* TEST MOVE BUTTONS */}
                              <div style={{ display: "flex", alignItems: "center" }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveTest(test, "up");
                                  }}
                                  title="Move Test Up"
                                  disabled={isMoving && movingItem?.testName === test.testName || idx === 0}
                                  style={{
                                    fontSize: "10px",
                                    padding: "1px 4px",
                                    opacity: idx === 0 ? 0.5 : 1,
                                    cursor: idx === 0 ? "not-allowed" : "pointer",
                                    background: "#f0f0f0",
                                    border: "1px solid #ddd",
                                    borderRadius: "3px",
                                    marginLeft: "5px"
                                  }}
                                >
                                  ⬆️
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveTest(test, "down");
                                  }}
                                  title="Move Test Down"
                                  disabled={isMoving && movingItem?.testName === test.testName || idx === unit.test.length - 1}
                                  style={{
                                    fontSize: "10px",
                                    padding: "1px 4px",
                                    opacity: idx === unit.test.length - 1 ? 0.5 : 1,
                                    cursor: idx === unit.test.length - 1 ? "not-allowed" : "pointer",
                                    background: "#f0f0f0",
                                    border: "1px solid #ddd",
                                    borderRadius: "3px",
                                    marginLeft: "2px"
                                  }}
                                >
                                  ⬇️
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {unit.units && unit.units.length > 0 && (
                  <span style={{ marginLeft: "0px", color: "gray" }}>
                    {expandedUnits[currentPath]}
                  </span>
                )}
              </div>

              {unit.units &&
                Array.isArray(unit.units) &&
                unit.units.length > 0 &&
                expandedUnits[currentPath] &&
                renderUnitTree(unit.units, currentPath)}
            </li>
          );
        })}
      </ul>
    );
  };

  const [unitPath, setUnitPath] = useState("");
  const fetchUnitCustomDescription = async (unitId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/getUnitCustomDescription/${unitId}?subjectName=${encodeURIComponent(subjectName)}&dbname=${encodeURIComponent(courseName)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📥 Custom description response:", data);
        return data;
      }
      return null;
    } catch (error) {
      console.error("❌ Error fetching custom description:", error);
      return null;
    }
  };

  const handleUnitClick = (unit, path) => {
    console.log("📌 Unit clicked:", unit.unitName);
    console.log("📌 Full unit data:", unit);

    if (!selectedSubTopicUnitAudio) {
      console.log("no audio file bro");
    }
    setSelectedSubTopicUnitAudio([]);
    setRecordedVoiceFiles([]);
    setUploadedVoiceFiles([]);

    setSelectedSubTopicUnit(unit);

    const unitId = unit.id || unit._id;
    const rootId = findRootOfUnit(unitId, unitData);
    setFirstClicked(rootId);

    setLastClicked(unitId);

    console.log("🎯 Setting IDs:", {
      rootId: rootId,
      lastClicked: unitId,
      unitName: unit.unitName
    });

    // ✅ CRITICAL FIX: Update the lastInsertedSubtopicId for existing subtopic
    if (unitId) {
      localStorage.setItem("lastInsertedSubtopicId", unitId);
      console.log("✅ Updated lastInsertedSubtopicId for existing subtopic:", unitId);
    }

    toggleExpand(path);
    unitSelection(unit, path);
    setUnitPath(path);

    if (!unit.standard) setSelectedSubUnit(unit);

    const newAudioIds = Array.isArray(unit.audioFileId)
      ? unit.audioFileId
      : unit.audioFileId
        ? [unit.audioFileId]
        : [];

    setTimeout(() => {
      setSelectedSubTopicUnitAudio(newAudioIds);
      console.log("✅ Updated audio to:", newAudioIds);
    }, 0);
  };
  const toggleExpand = (id) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const findRootOfUnit = (targetId, units, parentId = null) => {
    for (let unit of units) {
      if (unit.id === targetId) {
        return parentId ?? unit.id; // Return parent if exists, else self (root)
      }
      if (unit.units) {
        const result = findRootOfUnit(
          targetId,
          unit.units,
          parentId ?? unit.id
        );
        if (result) {
          // setKnowUnit(unit.unitName)
          return result;
        }
      }
    }
    return null;
  };
  const handleDeleteServerAudio = (fileUrl) => {
    fetch(`${API_BASE_URL}/audio/delete-file`, {
      // fetch(`https://trilokinnovations-api-prod.trilokinnovations.com/test/api/audio/delete-file`,{
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        fileUrl: fileUrl,
        // Replace with actual unitId
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // console.log("✅ Success:", data);
        const updatedAudioIds = selectedSubTopicUnit.audioFileId.filter(
          (id) => id !== fileUrl
        );
        setSelectedSubTopicUnit((prev) => ({
          ...prev,
          audioFileId: updatedAudioIds,
        }));
      })
      .catch((error) => {
        console.error("❌ Error:", error);
      });
  };
  //update fetch for delete audio

  useEffect(() => {
    if (selectedSubTopicUnit?.audioFileId) {
      setServerAudioFiles(selectedSubTopicUnit.audioFileId);
    }
  }, [selectedSubTopicUnit]);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Case 1: Saved flag
    if (params.get("saved") === "true") {
      setToastMessage("✅ Video downloaded!");
    }

    // Case 2: Message string (optional if you pass messages)
    if (params.get("message")) {
      setToastMessage(params.get("message"));
    }

    // Auto-hide after 4s
    if (params.get("saved") === "true" || params.get("message")) {
      setTimeout(() => setToastMessage(""), 4000);
    }
  }, []);

  const parseTextWithFormulas = (texts) => {
    if (!texts) return null;

    const text = texts.replace(/\\\\/g, "\\");
    const TEMP_DOLLAR = "__DOLLAR__";
    const safeText = text.replace(/\\\$/g, TEMP_DOLLAR);

    // Split by lines to handle different formats
    const lines = safeText.split('\n');

    return lines.map((line, lineIndex) => {
      // Skip empty lines or return break
      if (line.trim() === '') {
        return <br key={lineIndex} />;
      }

      // Handle bullet points (starting with * or -)
      if (line.trim().match(/^[*-]\s/)) {
        // Remove the bullet marker (* or -) and the following space
        const bulletContent = line.trim().replace(/^[*-]\s/, '');
        return (
          <div key={lineIndex} style={{ marginLeft: '20px', marginBottom: '5px', display: 'flex' }}>
            <span style={{ marginRight: '8px' }}>•</span>
            <span>{parseLineWithFormatting(bulletContent)}</span>
          </div>
        );
      }

      // Handle numbered lists (starting with 1., 2., etc.)
      else if (line.match(/^\d+\.\s/)) {
        const match = line.match(/^(\d+)\.\s(.*)/);
        if (match) {
          return (
            <div key={lineIndex} style={{ marginLeft: '20px', marginBottom: '5px', display: 'flex' }}>
              <span style={{ marginRight: '8px' }}>{match[1]}.</span>
              <span>{parseLineWithFormatting(match[2])}</span>
            </div>
          );
        }
      }

      // Handle headings (starting with #)
      else if (line.match(/^#\s/)) {
        return (
          <div key={lineIndex} style={{ fontWeight: 'bold', fontSize: '18px', margin: '10px 0 5px 0' }}>
            {parseLineWithFormatting(line.substring(2))}
          </div>
        );
      }

      // Regular paragraph line
      else {
        return (
          <div key={lineIndex} style={{ marginBottom: '5px' }}>
            {parseLineWithFormatting(line)}
          </div>
        );
      }
    });
  };

  // Helper function to parse bold (**text**) and italic (__text__) formatting
  const parseLineWithFormatting = (content) => {
    // First handle bold formatting (**text**)
    const partsWithBold = content.split(/(\*\*.*?\*\*)/g);

    // Then for each part, handle italic formatting (__text__)
    const result = partsWithBold.map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // This is bold text, now check if it has italic inside
        const boldContent = part.slice(2, -2);
        const boldParts = boldContent.split(/(__.*?__)/g);

        return (
          <strong key={`bold-${partIndex}`}>
            {boldParts.map((boldPart, boldIndex) => {
              if (boldPart.startsWith('__') && boldPart.endsWith('__')) {
                return (
                  <em key={`bold-italic-${boldIndex}`}>
                    {parseLineContent(boldPart.slice(2, -2))}
                  </em>
                );
              }
              return <span key={`bold-plain-${boldIndex}`}>{parseLineContent(boldPart)}</span>;
            })}
          </strong>
        );
      } else {
        // Not bold, but might have italic (__text__)
        const italicParts = part.split(/(__.*?__)/g);
        return italicParts.map((italicPart, italicIndex) => {
          if (italicPart.startsWith('__') && italicPart.endsWith('__')) {
            return (
              <em key={`italic-${partIndex}-${italicIndex}`}>
                {parseLineContent(italicPart.slice(2, -2))}
              </em>
            );
          }
          return <span key={`plain-${partIndex}-${italicIndex}`}>{parseLineContent(italicPart)}</span>;
        });
      }
    });

    return <>{result}</>;
  };

  // Helper function to parse LaTeX formulas within text
  const parseLineContent = (content) => {
    const TEMP_DOLLAR = "__DOLLAR__";
    const safeText = content.replace(/\\\$/g, TEMP_DOLLAR);
    const parts = safeText.split(/(\$[^$]+\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        const latex = part.slice(1, -1);
        try {
          const html = katex.renderToString(latex, {
            throwOnError: false,
            output: "html",
          });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (err) {
          return (
            <span key={index} style={{ color: "red" }}>
              {latex}
            </span>
          );
        }
      } else {
        return <span key={index}>{part.replaceAll(TEMP_DOLLAR, "$")}</span>;
      }
    });
  };
  //////////////////image part//////////////

  return (
    <div className="adminright-container">
      <h2 className="title">
        You are in:
        {examTitle && ` ${examTitle} -`}
        {subjectName && ` ${subjectName}`}
        {standard && ` (Standard ${standard})`}
      </h2>

      <div className="adminright-grid">
        <div className="left-panel">
          <h3>
            {editingLessonIndex !== null ? "Edit Lesson" : "Add New Lesson"}
          </h3>
          <input
            type="text"
            placeholder="Enter lesson name"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
          />
          <button onClick={handleAddheadUnit}>
            {editingLessonIndex !== null || editHeadUnit !== ""
              ? "Update Lesson"
              : "Add Lesson"}
          </button>
          <div className="bottom-box">
            <h3>All Lessons</h3>
            <h4>Select Lesson</h4>
            <div>
              {unitData && renderUnitTree(unitData)}
              {currentUnits.map((unit, index) => (
                <button key={index}>{unit.unitName}</button>
              ))}
            </div>
            {currentUnits.map((unit, index) => (
              <React.Fragment key={index}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    margin: "8px 0",
                  }}
                >
                  <button
                    className="lesson-btn"
                    onClick={() => {
                      unitSelection(unit);
                    }}
                  >
                    📚 {unit}
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => handleEditLesson(index)}
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => handleDeleteLesson(index)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Subtopics */}
                {selectedUnit === unit &&
                  lessonSubtopicsMap[unit]?.length > 0 && (
                    <ul
                      style={{
                        marginLeft: "20px",
                        marginTop: "5px",
                        color: "blue",
                      }}
                    >
                      {renderSubtopicsRecursive(lessonSubtopicsMap[unit])}
                    </ul>
                  )}
                {/* Tests */}
                {selectedUnit === unit && lessonTestsMap[unit]?.length > 0 && (
                  <ul
                    style={{
                      marginLeft: "20px",
                      marginTop: "5px",
                      color: "green",
                    }}
                  >
                    {lessonTestsMap[unit].map((test, idx) => (
                      <li
                        key={`test-${idx}`}
                        onClick={() => {
                          console.log(
                            "🎯 Selected test from lessonTestsMap:",
                            test
                          );
                          // Use the actual test data structure
                          const frontendTest = {
                            name: test.name || test.testName,
                            testName: test.testName || test.name,
                            marks: test.marks || test.passPercentage,
                            passPercentage: test.marks || test.passPercentage,
                            questionsList:
                              test.questionsList || test.questions || [],
                            questions:
                              test.questionsList || test.questions || [],
                          };

                          setSelectedTest(frontendTest);
                          console.log("✅ Set selectedTest to:", frontendTest);
                          setShowTestForm(false);
                          setShowExplanationForm(false);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        📝 {test.name || test.testName}
                      </li>
                    ))}
                  </ul>
                )}
              </React.Fragment>
            ))}
          </div>
          <button onClick={() => {
            // Store the state in sessionStorage
            sessionStorage.setItem('adminReturnState', JSON.stringify({
              returnToCard: true,
              cardId: location.state?.cardId,
              mode: location.state?.courseName || location.state?.mode,
              timestamp: Date.now()
            }));

            // Navigate
            navigate("/adminhome");
          }}>
            Back to Admin Home
          </button>
        </div>
        {/* Right Panel */}
        <div className="right-panel">
          <div className="explanation-box">
            <h4>Description / Test</h4>
            {selectedUnit && (
              <h3 style={{ color: "#333", margin: "10px 0" }}>
                Selected Lesson: {selectedUnit}
              </h3>
            )}
            <div className="explanation-buttons">
              <button
                onClick={() => {
                  setShowExplanationForm(true);
                  setShowTestForm(false);
                }}
              >
                Add Content
              </button>
              {selectedSubTopicUnit && selectedSubTopicUnit.test && (
                <button
                  onClick={() => {
                    if (!selectedUnit) {
                      alert("Please select a lesson before adding a test.");
                      return;
                    }
                    setShowTestForm(true);
                    setShowExplanationForm(false);
                    setSelectedTest(true);
                    setTestName("");
                    setCurrentQuestion({
                      text: "",
                      image: null,
                      options: [
                        { text: "", image: null },
                        { text: "", image: null },
                        { text: "", image: null },
                        { text: "", image: null },
                      ],
                      correctIndex: null,
                      explanation: "",
                    });
                    setQuestions([]);
                    setEditingTestIndex(null);
                  }}
                >
                  Add Test
                </button>
              )}
            </div>

            {selectedSubTopicUnit && !selectedSubTopicUnit.standard && (
              <div className="subtopic-detail-box" style={{ marginTop: "20px" }}>
                <h4>Subtopic Preview</h4>
                <p>
                  <strong>Title:</strong> {selectedSubTopicUnit.unitName}
                </p>
                {selectedSubTopicUnit.explanation && (
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>Original Description:</strong></p>
                    <div style={{
                      padding: '10px',
                      background: '#f5f5f5',
                      borderLeft: '3px solid #ccc',
                      borderRadius: '4px',
                      marginTop: '5px'
                    }}>
                      {parseTextWithFormulas(selectedSubTopicUnit.explanation)}
                    </div>
                  </div>
                )}

                {selectedSubTopicUnit.customDescription && (
                  <div style={{ marginTop: '15px', padding: '10px', border: '2px solid #4CAF50', borderRadius: '8px', background: '#f0f9f0' }}>
                    <p>
                      <strong style={{ color: '#2e7d32', fontSize: '16px' }}>
                        ✨ Ai Page Description:
                      </strong>
                    </p>
                    <div style={{
                      padding: '12px',
                      background: '#e8f5e9',
                      borderLeft: '4px solid #4CAF50',
                      borderRadius: '4px',
                      marginTop: '8px'
                    }}>
                      {parseTextWithFormulas(selectedSubTopicUnit.customDescription)}
                    </div>

                    <div style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                      <span>📝 <em>This description was customized for the AI video</em></span>
                    </div>
                  </div>
                )}
                {/* Tags Display in Preview */}
                {selectedSubTopicUnit.tags && selectedSubTopicUnit.tags.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Tags:</strong>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginTop: '5px'
                    }}>
                      {selectedSubTopicUnit.tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            background: '#e3f2fd',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            color: '#1976d2'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audio Section */}
                <div style={{ paddingLeft: "2px", marginBottom: "12px" }}>
                  <h5>Audio:</h5>
                  {selectedSubTopicUnitAudio &&
                    Array.isArray(selectedSubTopicUnitAudio) &&
                    selectedSubTopicUnitAudio.length > 0 ? (
                    selectedSubTopicUnitAudio.map((id, index) => {
                      const fileName = id.split("/").pop();
                      return (
                        <div key={index} style={{ marginBottom: "8px" }}>
                          <div style={{ marginBottom: "4px", fontWeight: "bold" }}>
                            {fileName}
                          </div>
                          <audio controls src={id} />
                        </div>
                      );
                    })
                  ) : (
                    <p>No audio files</p>
                  )}
                </div>

                {/* Image Section */}
                <div style={{ paddingLeft: "2px", marginBottom: "12px" }}>
                  <h5>Images:</h5>
                  {selectedSubTopicUnit.imageUrls &&
                    Array.isArray(selectedSubTopicUnit.imageUrls) &&
                    selectedSubTopicUnit.imageUrls.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {selectedSubTopicUnit.imageUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Subtopic image ${idx + 1}`}
                          style={{
                            width: "150px",
                            height: "auto",
                            borderRadius: "4px",
                            objectFit: "cover",
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p>No images</p>
                  )}
                </div>

                {/* Table Display in Preview */}
                {selectedSubTopicUnit.showMatches && selectedSubTopicUnit.tableData &&
                  selectedSubTopicUnit.tableData.length > 0 && (
                    <div style={{ marginTop: "15px" }}>
                      <h5>Match Table:</h5>
                      <div style={{ overflowX: "auto" }}>
                        <table
                          border="1"
                          style={{
                            borderCollapse: "collapse",
                            width: "100%",
                            backgroundColor: "#f8f9fa",
                            marginTop: "8px"
                          }}
                        >
                          <tbody>
                            {selectedSubTopicUnit.tableData.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((cell, colIndex) => (
                                  <td
                                    key={colIndex}
                                    style={{
                                      padding: "8px",
                                      border: "1px solid #dee2e6",
                                      textAlign: "center",
                                      minWidth: "80px"
                                    }}
                                  >
                                    {parseTextWithFormulas(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* 🔥 NEW: AI Video Section */}
                {/* 🔥 NEW: AI Video Section with Rename URL Button */}
                <div style={{ paddingLeft: "2px", marginBottom: "12px" }}>
                  <h5>AI Generated Video:</h5>
                  {selectedSubTopicUnit.aiVideoUrl ? (
                    <div>
                      <video
                        controls
                        src={selectedSubTopicUnit.aiVideoUrl}
                        style={{
                          width: "100%",
                          maxWidth: "500px",
                          borderRadius: "8px",
                          marginBottom: "10px",
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                        <a
                          href={selectedSubTopicUnit.aiVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "#007bff",
                            color: "white",
                            textDecoration: "none",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }}
                        >
                          🔗 Open Video
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedSubTopicUnit.aiVideoUrl);
                            alert("Video URL copied to clipboard!");
                          }}
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "14px",
                            cursor: "pointer",
                          }}
                        >
                          📋 Copy URL
                        </button>

                        {/* 🔥 NEW: Rename URL Button */}
                        {/* 🔥 ENHANCED: Rename Video File Button with full path editing */}
                        <button
                          onClick={handleRenameVideo}
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "#ffc107",
                            color: "#212529",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "14px",
                            cursor: "pointer",
                          }}
                        >
                          ✏️ Rename Video File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: "20px",
                      textAlign: "center",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      border: "2px dashed #dee2e6"
                    }}>
                      <p style={{ color: "#6c757d", margin: "0" }}>
                        🎬 No AI video generated yet
                      </p>
                      <p style={{ color: "#6c757d", fontSize: "14px", margin: "5px 0 0 0" }}>
                        Click "Generate AI Video" to create an interactive lesson video
                      </p>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: "15px", marginBottom: "15px" }}>
                  <button
                    className="generate-button"
                    onClick={async () => {
                      if (!selectedSubTopicUnit) {
                        alert("Please select a subtopic first");
                        return;
                      }

                      console.log("🔍 ========== AI VIDEO DEBUG START ==========");

                      const subtopicTitle = selectedSubTopicUnit.unitName || "";
                      const subtopicId = selectedSubTopicUnit._id || selectedSubTopicUnit.id;

                      // ✅ FIXED: Get the selected lesson (top-level unit)
                      let selectedLesson = selectedUnit;

                      // If selectedUnit is not set, try to find the parent lesson
                      if (!selectedLesson && subtopicId) {
                        selectedLesson = findLessonNameById(unitData, subtopicId);
                      }

                      // If still not found, try to get from parentId
                      if (!selectedLesson && selectedSubTopicUnit.parentId) {
                        selectedLesson = findLessonNameById(unitData, selectedSubTopicUnit.parentId);
                      }

                      // Get the standard
                      const selectedStandard = getUnitStandard(selectedSubTopicUnit);

                      // Get the full nested path for the subtopic
                      const subtopicPath = findSubtopicPath(unitData, subtopicId);

                      console.log("📋 PATH COMPONENTS FOR S3:", {
                        standard: selectedStandard,
                        subject: subjectName,
                        lesson: selectedLesson,
                        topic: subtopicTitle,
                        fullPath: subtopicPath
                      });

                      // Get the latest custom description from backend
                      let customDescription = "";
                      let originalDescription = selectedSubTopicUnit.explanation || "";

                      try {
                        console.log("🔄 Fetching latest subtopic data from backend...");
                        const response = await fetch(
                          `${API_BASE_URL}/getLatestSubtopic/${subtopicId}?dbname=${courseName}&subjectName=${encodeURIComponent(subjectName)}`,
                          {
                            method: "GET",
                            credentials: "include"
                          }
                        );

                        if (response.ok) {
                          const latestData = await response.json();
                          console.log("✅ Latest subtopic data:", latestData);

                          if (latestData.found) {
                            // Update selectedSubTopicUnit with latest data
                            setSelectedSubTopicUnit(latestData);

                            // Use the latest customDescription
                            customDescription = latestData.customDescription || latestData.description || selectedSubTopicUnit.explanation || "";
                          }
                        }
                      } catch (error) {
                        console.log("⚠️ Could not fetch latest data, using current state");
                        // Fallback to current state
                        customDescription = selectedSubTopicUnit.customDescription ||
                          selectedSubTopicUnit.description ||
                          selectedSubTopicUnit.explanation || "";
                      }

                      // If fetch failed, use current state values
                      if (!customDescription) {
                        // Priority: Use customDescription field first
                        if (selectedSubTopicUnit.customDescription) {
                          customDescription = selectedSubTopicUnit.customDescription;
                          console.log("✅ Found customDescription in unit data:", customDescription);
                        }
                        else if (selectedSubTopicUnit.description && selectedSubTopicUnit.description !== "description") {
                          customDescription = selectedSubTopicUnit.description;
                          console.log("✅ Using description field as custom description:", customDescription);
                        }
                        else {
                          customDescription = selectedSubTopicUnit.explanation || "";
                          console.log("⚠️ No customDescription found, using explanation:", customDescription);
                        }
                      }

                      // Truncate descriptions to prevent 413 error
                      const truncateText = (text, maxLength = 1000) => {
                        if (!text) return "";
                        if (text.length > maxLength) {
                          console.log(`⚠️ Truncating text from ${text.length} to ${maxLength} characters`);
                          return text.substring(0, maxLength) + "... [truncated]";
                        }
                        return text;
                      };

                      const safeOriginalDescription = truncateText(originalDescription, 1500);
                      const safeCustomDescription = truncateText(customDescription, 1500);
                      const safeSubtopicTitle = truncateText(subtopicTitle, 200);
                      const safeLessonName = truncateText(selectedLesson || subtopicTitle, 200);
                      const safeSubjectName = truncateText(subjectName, 200);
                      const safeStandard = truncateText(selectedStandard || 'no_standard', 50);

                      console.log("📝 FINAL VALUES for AI video:");
                      console.log("• Standard:", safeStandard);
                      console.log("• Subject:", safeSubjectName);
                      console.log("• Lesson:", safeLessonName);
                      console.log("• Subtopic Title:", safeSubtopicTitle);
                      console.log("• Subtopic ID:", subtopicId);
                      console.log("• Parent ID:", lastClicked || selectedSubTopicUnit.parentId);
                      console.log("• Root ID:", firstClicked || rootId);
                      console.log("• Custom Description Length:", safeCustomDescription.length);
                      console.log("• Original Description Length:", safeOriginalDescription.length);

                      // Prepare AI video parameters with ALL path components
                      const aiVideoParams = new URLSearchParams({
                        subtopic: encodeURIComponent(safeSubtopicTitle),
                        description: encodeURIComponent(safeOriginalDescription),
                        customDescription: encodeURIComponent(safeCustomDescription),
                        subtopicId: subtopicId,
                        parentId: lastClicked || selectedSubTopicUnit.parentId || "",
                        rootId: firstClicked || rootId || "",
                        dbname: courseName,
                        subjectName: safeSubjectName,
                        standard: safeStandard,
                        lessonName: safeLessonName,
                        returnTo: encodeURIComponent(window.location.href),
                        timestamp: Date.now(),
                        source: "adminright",
                        hasCustomDescription: customDescription ? "true" : "false",
                        fullPath: subtopicPath || `${safeStandard}/${safeSubjectName}/${safeLessonName}/${safeSubtopicTitle}`
                      });

                      const aiVideoUrl = `${FRONTEND_URL_AI}/?${aiVideoParams.toString()}`;
                      console.log("📏 URL Length:", aiVideoUrl.length, "characters");

                      if (aiVideoUrl.length > 8000) {
                        console.warn("⚠️ WARNING: URL is very long, may cause 413 error");
                      }

                      console.log("========== AI VIDEO DEBUG END ==========");

                      // Open in new tab
                      window.open(aiVideoUrl, "_blank");
                    }}
                  >
                    🎬 Generate AI Video for This Subtopic
                  </button>
                </div>

                {/* Edit/Delete Buttons */}
                <div className="subtopic-actions" style={{ marginTop: "15px" }}>
                  <button
                    className="icon-btn"
                    onClick={() => handleSetEditSelecetedSubUnit(selectedSubUnit)}
                    title="Edit Subtopic"
                  >
                    <Pencil size={10} /> Edit
                  </button>

                  <button
                    className="icon-btn"
                    onClick={() => handleDeleteSubtopicReal(selectedSubUnit)}
                    title="Delete Subtopic"
                    style={{ marginLeft: "10px" }}
                  >
                    <Trash2 size={10} /> Delete
                  </button>
                </div>
              </div>
            )}

            {selectedTest && (
              <div className="test-detail-box" style={{ marginTop: "20px" }}>
                {/* 🔄 Refresh Button Added Here */}
                <h4>🧾 Test Preview</h4>
                <p>
                  <strong>Name:</strong>{" "}
                  {selectedTest.testName || selectedTest.name}
                </p>
                <p>
                  <strong>Pass Percentage:</strong>{" "}
                  {selectedTest.marks || selectedTest.passPercentage}%
                </p>

                {selectedTest.tags && selectedTest.tags.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Tags:</strong>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginTop: '5px'
                    }}>
                      {selectedTest.tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            background: '#e3f2fd',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            color: '#1976d2'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <h5 style={{ marginTop: "15px" }}>
                  <strong>Questions:</strong>
                </h5>

                <ol>
                  {(
                    selectedTest.questionsList ||
                    selectedTest.questions ||
                    []
                  ).map((q, idx) => {
                    // ✅ Safely get question images - only string URLs
                    const questionImages = (q.questionImages || []).filter(
                      (img) =>
                        img &&
                        typeof img === "string" &&
                        img !== "NO_QUESTION_IMAGE"
                    );

                    // ✅ Safely get solution images - only string URLs
                    const solutionImages = (q.solutionImages || []).filter(
                      (img) =>
                        img &&
                        typeof img === "string" &&
                        img !== "NO_SOLUTION_IMAGE"
                    );

                    // ✅ Safely get options
                    const options = [
                      {
                        text: q.option1 || "",
                        image:
                          q.option1Image &&
                            typeof q.option1Image === "string" &&
                            q.option1Image !== "NO_OPTION_IMAGE"
                            ? q.option1Image
                            : null,
                      },
                      {
                        text: q.option2 || "",
                        image:
                          q.option2Image &&
                            typeof q.option2Image === "string" &&
                            q.option2Image !== "NO_OPTION_IMAGE"
                            ? q.option2Image
                            : null,
                      },
                      {
                        text: q.option3 || "",
                        image:
                          q.option3Image &&
                            typeof q.option3Image === "string" &&
                            q.option3Image !== "NO_OPTION_IMAGE"
                            ? q.option3Image
                            : null,
                      },
                      {
                        text: q.option4 || "",
                        image:
                          q.option4Image &&
                            typeof q.option4Image === "string" &&
                            q.option4Image !== "NO_OPTION_IMAGE"
                            ? q.option4Image
                            : null,
                      },
                    ];

                    const correctIndex =
                      typeof q.correctIndex === "number" ? q.correctIndex : 0;

                    // ✅ Get table data
                    const tableData =
                      Array.isArray(q.tableData) && q.tableData.length
                        ? q.tableData
                        : [];

                    return (
                      <li
                        key={idx}
                        style={{
                          marginBottom: "25px",
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: "10px",
                          padding: "15px",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        }}
                      >
                        {/* Question */}
                        <p>
                          <strong>Q{idx + 1}.</strong>{" "}
                          {parseTextWithFormulas(q.question || q.text || "")}
                        </p>

                        {/* Question Images */}
                        {questionImages.length > 0 && (
                          <div style={{ marginBottom: "12px" }}>
                            <h5>Question Images:</h5>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              {questionImages.map((url, i) => (
                                <img
                                  key={i}
                                  src={url}
                                  alt={`question-${i}`}
                                  style={{
                                    width: "150px",
                                    height: "auto",
                                    maxHeight: "150px",
                                    borderRadius: "4px",
                                    objectFit: "cover",
                                    border: "1px solid #ccc",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Match Table */}
                        {tableData.length > 0 && (
                          <div style={{ marginTop: "10px" }}>
                            <h5>Match Table:</h5>
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                border: "1px solid #ccc",
                                background: "#fafafa",
                              }}
                            >
                              <tbody>
                                {tableData.map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        style={{
                                          border: "1px solid #ccc",
                                          padding: "6px",
                                          textAlign: "center",
                                        }}
                                      >
                                        {parseTextWithFormulas(cell)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Options */}
                        <div style={{ marginTop: "10px" }}>
                          <h5>Options:</h5>
                          <ul style={{ listStyle: "none", padding: 0 }}>
                            {options.map((opt, i) => {
                              const isCorrect = i === correctIndex;
                              return (
                                <li
                                  key={i}
                                  style={{
                                    marginBottom: "8px",
                                    background: isCorrect
                                      ? "#e8f9e9"
                                      : "#f9f9f9",
                                    border: isCorrect
                                      ? "1px solid #7ed957"
                                      : "1px solid #ddd",
                                    borderRadius: "6px",
                                    padding: "8px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                  }}
                                >
                                  <span>
                                    {isCorrect && "✅"}{" "}
                                    {parseTextWithFormulas(opt.text || "")}
                                  </span>
                                  {opt.image && (
                                    <img
                                      src={opt.image}
                                      alt={`option-${i}`}
                                      style={{
                                        width: "120px",
                                        height: "auto",
                                        maxHeight: "120px",
                                        borderRadius: "4px",
                                        objectFit: "cover",
                                        border: "1px solid #ccc",
                                      }}
                                    />
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div style={{ marginTop: "10px" }}>
                            <strong>Explanation:</strong>{" "}
                            {parseTextWithFormulas(q.explanation)}
                          </div>
                        )}

                        {/* Solution Images */}
                        {solutionImages.length > 0 && (
                          <div style={{ marginBottom: "12px" }}>
                            <h5>Solution Images:</h5>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              {solutionImages.map((url, i) => (
                                <img
                                  key={i}
                                  src={url}
                                  alt={`solution-${i}`}
                                  style={{
                                    width: "150px",
                                    height: "auto",
                                    maxHeight: "150px",
                                    borderRadius: "4px",
                                    objectFit: "cover",
                                    border: "1px solid #ccc",
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}


                        {q.tags && q.tags.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <small style={{ color: '#666', fontSize: '12px' }}>
                              <strong>Question Tags:</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                {q.tags.map((tag, tagIdx) => (
                                  <span
                                    key={tagIdx}
                                    style={{
                                      background: '#e3f2fd',
                                      padding: '2px 6px',
                                      borderRadius: '12px',
                                      fontSize: '10px',
                                      color: '#1976d2'
                                    }}
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </small>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>

                {/* Edit / Delete Buttons */}
                <div style={{ marginTop: "15px" }}>
                  <button
                    className="edit-btn"
                    onClick={() => handleEditTest(selectedTest)}
                  >
                    ✏️ Edit All
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteTest(selectedTest)}
                    style={{ marginLeft: "10px" }}
                  >
                    🗑️ Delete All
                  </button>
                </div>
              </div>
            )}

            {audio?.map((a) => (
              <AudioComponent key={a.id} data={a} />
            ))}
            {showExplanationForm && (
              <div className="explanation-form">
                <h4>
                  {selectedSubtopic ? "Add Child Subtopic" : "Add Subtopic"}
                </h4>
                <input
                  type="text"
                  placeholder="Subtopic title"
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                />
                <textarea
                  placeholder={`Subtopic description (supports automatic formatting):

• Start lines with * or - for bullet points
1. Start with numbers for ordered lists
# For headings
**bold text** or __italic text__

Or just write a paragraph normally.`}
                  rows={8}
                  value={subDesc}
                  onChange={(e) => setSubDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    resize: 'vertical',
                    whiteSpace: 'pre-wrap'
                  }}
                  onKeyDown={(e) => {
                    // Auto-format on Enter
                    if (e.key === 'Enter') {
                      const textarea = e.target;
                      const cursorPos = textarea.selectionStart;
                      const textBefore = subDesc.substring(0, cursorPos);
                      const lastLine = textBefore.split('\n').pop();

                      // Auto-continue bullet points
                      if (lastLine.match(/^[*-]\s/)) {
                        e.preventDefault();
                        const newText = subDesc.substring(0, cursorPos) + '\n* ' + subDesc.substring(cursorPos);
                        setSubDesc(newText);

                        // Move cursor after bullet
                        setTimeout(() => {
                          textarea.selectionStart = textarea.selectionEnd = cursorPos + 3;
                        }, 0);
                      }
                      // Auto-continue numbered lists
                      else if (lastLine.match(/^\d+\.\s/)) {
                        e.preventDefault();
                        const match = lastLine.match(/^(\d+)\./);
                        if (match) {
                          const nextNum = parseInt(match[1]) + 1;
                          const newText = subDesc.substring(0, cursorPos) + `\n${nextNum}. ` + subDesc.substring(cursorPos);
                          setSubDesc(newText);

                          setTimeout(() => {
                            textarea.selectionStart = textarea.selectionEnd = cursorPos + (nextNum.toString().length) + 3;
                          }, 0);
                        }
                      }
                    }
                  }}
                />

                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  <strong>Live Preview:</strong>
                  <div style={{
                    marginTop: '5px',
                    padding: '10px',
                    background: '#f9f9f9',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    minHeight: '50px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {subDesc.split('\n').map((line, i) => {
                      if (line.match(/^[*-]\s/)) {
                        return <div key={i} style={{ marginLeft: '20px' }}>• {line.substring(2)}</div>;
                      } else if (line.match(/^\d+\.\s/)) {
                        const match = line.match(/^(\d+)\.\s(.*)/);
                        return <div key={i} style={{ marginLeft: '20px' }}>{match[1]}. {match[2]}</div>;
                      } else if (line.match(/^#\s/)) {
                        return <div key={i} style={{ fontWeight: 'bold', fontSize: '16px' }}>{line.substring(2)}</div>;
                      } else {
                        return <div key={i}>{line}</div>;
                      }
                    })}
                  </div>
                </div>

                {/* Table Controls for Subtopic */}
                <div style={{ marginTop: "15px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}>
                  <h5>Match Table (Optional)</h5>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <label>Rows: </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={subtopicTableRows}
                        onChange={(e) => {
                          const rows = parseInt(e.target.value);
                          setSubtopicTableRows(rows);
                          if (showSubtopicMatches) {
                            const newTable = generateTable(rows, subtopicTableCols);
                            setSubtopicTableData(newTable);
                          }
                        }}
                        style={{ width: "50px", marginLeft: "5px" }}
                        disabled={showSubtopicMatches && !subtopicTableEditable}
                      />
                    </div>

                    <div>
                      <label>Cols: </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={subtopicTableCols}
                        onChange={(e) => {
                          const cols = parseInt(e.target.value);
                          setSubtopicTableCols(cols);
                          if (showSubtopicMatches) {
                            const newTable = generateTable(subtopicTableRows, cols);
                            setSubtopicTableData(newTable);
                          }
                        }}
                        style={{ width: "50px", marginLeft: "5px" }}
                        disabled={showSubtopicMatches && !subtopicTableEditable}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSubtopicMatches(!showSubtopicMatches);
                        if (!showSubtopicMatches) {
                          const newTable = generateTable(subtopicTableRows, subtopicTableCols);
                          setSubtopicTableData(newTable);
                          setSubtopicTableEditable(true);
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        background: showSubtopicMatches ? "#dc3545" : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      {showSubtopicMatches ? "Remove Table" : "Add Match Table"}
                    </button>

                    {showSubtopicMatches && (
                      <button
                        type="button"
                        onClick={() => setSubtopicTableEditable(!subtopicTableEditable)}
                        style={{
                          padding: "6px 12px",
                          background: subtopicTableEditable ? "#ffc107" : "#17a2b8",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        {subtopicTableEditable ? "Lock Table" : "Edit Table"}
                      </button>
                    )}
                  </div>

                  {/* Table Display/Editor */}
                  {showSubtopicMatches && subtopicTableData.length > 0 && (
                    <div style={{ overflowX: "auto", marginTop: "10px" }}>
                      <table
                        border="1"
                        style={{
                          borderCollapse: "collapse",
                          width: "100%",
                          backgroundColor: "#f8f9fa"
                        }}
                      >
                        <tbody>
                          {subtopicTableData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, colIndex) => (
                                <td
                                  key={colIndex}
                                  style={{
                                    padding: "8px",
                                    border: "1px solid #dee2e6",
                                    minWidth: "80px"
                                  }}
                                >
                                  {subtopicTableEditable ? (
                                    <input
                                      type="text"
                                      value={cell}
                                      onChange={(e) => {
                                        const newTable = [...subtopicTableData];
                                        newTable[rowIndex][colIndex] = e.target.value;
                                        setSubtopicTableData(newTable);
                                      }}
                                      style={{
                                        width: "100%",
                                        padding: "4px",
                                        border: "1px solid #ced4da",
                                        borderRadius: "3px"
                                      }}
                                      placeholder={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                                    />
                                  ) : (
                                    <div style={{ padding: "8px", minHeight: "20px" }}>
                                      {cell || `Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                                    </div>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={{ marginTop: "10px", fontSize: "12px", color: "#6c757d" }}>
                        <small>
                          💡 Use this table for matching exercises, comparison tables, or organized data.
                          {subtopicTableEditable && " Click 'Lock Table' when finished editing."}
                        </small>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tag Input Section - Add after description textarea */}
                <div style={{ marginTop: '15px' }}>
                  <h5>Tags & Keywords</h5>

                  {/* Display Current Subject, Lesson, Subtopic for Context */}
                  <div style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: '#f0f7ff',
                    borderRadius: '6px',
                    borderLeft: '3px solid #2196f3',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                      {subjectName && (
                        <span>📚 <strong>Subject:</strong> {subjectName}</span>
                      )}
                      {selectedUnit && (
                        <span>📖 <strong>Lesson:</strong> {selectedUnit.split('/')[0]}</span>
                      )}
                      {selectedSubTopicUnit?.unitName && (
                        <span>📝 <strong>Subtopic:</strong> {selectedSubTopicUnit.unitName}</span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <input
                      type="text"
                      placeholder="Add a tag (e.g., 'physics', 'formula', 'theory')"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          e.preventDefault();
                          if (!tags.includes(tagInput.trim())) {
                            setTags([...tags, tagInput.trim()]);
                          }
                          setTagInput('');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                          setTags([...tags, tagInput.trim()]);
                          setTagInput('');
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Add Tag
                    </button>
                  </div>

                  {/* Display tags */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    minHeight: '40px',
                    padding: '8px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    background: '#f9f9f9'
                  }}>
                    {tags.length === 0 ? (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>
                        No tags added yet. Add tags to help categorize this subtopic.
                      </span>
                    ) : (
                      tags.map((tag, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#e3f2fd',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '14px'
                          }}
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTags(tags.filter((_, i) => i !== index));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#666',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: '0',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Tag suggestions with Subject, Lesson, Subtopic names */}
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <strong>Quick Add Tags:</strong>
                    <div style={{
                      display: 'flex',
                      gap: '5px',
                      flexWrap: 'wrap',
                      marginTop: '5px'
                    }}>
                      {/* Subject Name Button */}
                      {subjectName && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!tags.includes(subjectName)) {
                              setTags([...tags, subjectName]);
                            }
                          }}
                          style={{
                            padding: '2px 8px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          + {subjectName}
                        </button>
                      )}

                      {/* Lesson Name Button (only first part before slash) */}
                      {selectedUnit && (
                        <button
                          type="button"
                          onClick={() => {
                            const cleanLessonName = selectedUnit.split('/')[0];
                            if (!tags.includes(cleanLessonName)) {
                              setTags([...tags, cleanLessonName]);
                            }
                          }}
                          style={{
                            padding: '2px 8px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          + {selectedUnit.split('/')[0]}
                        </button>
                      )}

                      {/* Subtopic Name Button */}
                      {selectedSubTopicUnit?.unitName && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!tags.includes(selectedSubTopicUnit.unitName)) {
                              setTags([...tags, selectedSubTopicUnit.unitName]);
                            }
                          }}
                          style={{
                            padding: '2px 8px',
                            background: '#ffc107',
                            color: '#333',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          + {selectedSubTopicUnit.unitName}
                        </button>
                      )}

                      {/* Separator and common suggestions */}
                      <span style={{ color: '#ccc', margin: '0 4px' }}>|</span>

                      {['formula', 'theory', 'example', 'definition', 'practice', 'concept', 'diagram', 'calculation'].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            if (!tags.includes(suggestion)) {
                              setTags([...tags, suggestion]);
                            }
                          }}
                          style={{
                            padding: '2px 8px',
                            background: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '12px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* ✅ Add Description Button */}
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("imageInput").click(); // open file picker manually
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ➕ Add Images
                </button>
                {/* ✅ Hidden input for multiple images */}
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    // ✅ FIXED: Directly set the File objects
                    setSubtopicImages(prev => [...prev, ...files]);
                    e.target.value = ""; // reset so user can re-select same files
                  }}
                />
                {/* ✅ FIXED: Use subtopicImages instead of currentQuestion.image */}
                {subtopicImages && subtopicImages.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginTop: "10px",
                    }}
                  >
                    {subtopicImages.map((img, idx) => {
                      const imgSrc = getSafeImageUrl(img);
                      return imgSrc ? (
                        <div key={idx} style={{ position: "relative" }}>
                          <img
                            src={imgSrc}
                            alt={`upload-preview-${idx}`}
                            width="120"
                            height="120"
                            style={{ objectFit: "cover", borderRadius: 6 }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              // ✅ FIXED: Remove from subtopicImages instead of currentQuestion
                              setSubtopicImages(prev => prev.filter((_, i) => i !== idx))
                            }
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              background: "black",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              lineHeight: "1",
                              padding: "0",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                {/* Record Audio */}
                <div className="recordaudio">
                  <h5>Record Audio</h5>
                  {/* 🎙️ Record / Stop Buttons */}
                  {isRecording ? (
                    <>
                      <button onClick={handleStopRecording}>
                        Stop Recording
                      </button>
                      <span style={{ fontWeight: "bold", marginLeft: "10px" }}>
                        Recording:{" "}
                        {String(Math.floor(recordingTime / 60)).padStart(
                          2,
                          "0"
                        )}
                        :{String(recordingTime % 60).padStart(2, "0")}
                      </span>
                    </>
                  ) : (
                    <button onClick={handleStartRecording}>Record Audio</button>
                  )}
                  {Array.isArray(currentQuestion?.audio) &&
                    currentQuestion.audio.length > 0 && (
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          marginTop: "10px",
                        }}
                      >
                        {currentQuestion.audio.map((audio, index) => {
                          const audioSrc = getSafeAudioUrl(audio);
                          {
                            /* ✅ Use the global function */
                          }
                          return audioSrc ? (
                            <li key={index} style={{ marginTop: "10px" }}>
                              <audio controls src={audioSrc} />
                              <button
                                className="remove-button"
                                onClick={() =>
                                  setCurrentQuestion((prev) => ({
                                    ...prev,
                                    audio: prev.audio.filter(
                                      (_, i) => i !== index
                                    ),
                                  }))
                                }
                              >
                                Remove
                              </button>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    )}
                  {/* 🎙️ Newly Recorded Audios */}
                  {recordedVoiceFiles.map((file, index) => {
                    const audioSrc = getSafeAudioUrl(file); // Use the same safe function
                    return audioSrc ? (
                      <li key={index} style={{ marginTop: "10px" }}>
                        <audio controls src={audioSrc} />
                        <button
                          className="remove-button"
                          onClick={() =>
                            setRecordedVoiceFiles((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ) : null;
                  })}
                </div>
                {/* Upload Audio */}
                <div style={{ marginTop: "20px" }}>
                  <h5>Upload Audio</h5>
                  <input
                    type="file"
                    accept=".mp3,.wav,.flac,.aac,.m4a"
                    multiple
                    // In your uploaded audio handling:
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const validTypes = [
                        "audio/mpeg",
                        "audio/wav",
                        "audio/flac",
                        "audio/aac",
                        "audio/x-m4a",
                        "audio/mp4",
                      ];
                      const validFiles = files.filter((file) =>
                        validTypes.includes(file.type)
                      );
                      if (validFiles.length < files.length) {
                        alert("Some files were skipped. Only supported formats are allowed.");
                      }
                      // ✅ FIXED: Directly set File objects
                      setUploadedVoiceFiles((prev) => [...prev, ...validFiles]);
                      e.target.value = "";
                    }}
                  />

                  {((selectedSubTopicUnit &&
                    selectedSubTopicUnit.audioFileId?.length > 0) ||
                    uploadedVoiceFiles.length > 0) && (
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {/* Show audio files from backend (already uploaded) */}
                        {editSelecetedSubUnit === "value" &&
                          selectedSubTopicUnit.audioFileId?.map((id, index) => (
                            <li key={index} style={{ marginTop: "10px" }}>
                              <audio controls src={id} />
                              <button
                                className="remove-button"
                                onClick={() => handleDeleteServerAudio(id)}
                              >
                                Delete
                              </button>
                              {/* Optional: Add a delete button for server audio if you want */}
                            </li>
                          ))}

                        {/* Show newly selected files before upload */}
                        {uploadedVoiceFiles.map((file, index) => {
                          const audioSrc = getSafeAudioUrl(file);
                          return audioSrc ? (
                            <li
                              key={`local-${index}`}
                              style={{ marginTop: "10px" }}
                            >
                              <audio controls src={audioSrc} />
                              <button
                                className="remove-button"
                                onClick={() =>
                                  setUploadedVoiceFiles((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  )
                                }
                              >
                                Remove
                              </button>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    )}
                </div>
                <div>
                  {toastMessage && (
                    <div
                      style={{
                        position: "fixed",
                        top: "20px",
                        right: "20px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        padding: "12px 20px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                        zIndex: 9999,
                        fontWeight: "bold",
                        transition: "opacity 0.5s ease-in-out",
                      }}
                    >
                      {toastMessage}
                    </div>
                  )}
                </div>
                <div className="action-buttons">
                  <button
                    type="button" // ✅ Prevents form submission
                    onClick={(e) => {
                      e.preventDefault(); // Extra safety
                      if (editSelecetedSubUnit) {
                        handleUpdateSubtopic();
                      } else if (selectedSubtopic) {
                        handleAddChildSubtopic(selectedSubtopic, e);
                      } else {
                        handleAddSubtopic(e);
                      }
                    }}
                  >
                    {editSelecetedSubUnit
                      ? "Update Subtopic"
                      : selectedSubtopic
                        ? "Add Child Subtopic"
                        : "Add Subtopic"}
                  </button>

                  <button
                    type="button" // ✅ Prevents form submission
                    onClick={() => {
                      if (isRecording) {
                        alert("Stop recording first before adding a subtopic.");
                        return;
                      }
                      resetExplanationForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* TEST FORM */}
            {showTestForm && (
              <div className="test-form">
                <h4>Test Settings</h4>

                {/* Test Name */}
                <input
                  type="text"
                  placeholder="Test Name"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  required
                />

                {/* Pass Percentage */}
                <input
                  type="number"
                  placeholder="Pass Percentage"
                  min="1"
                  max="100"
                  value={passPercentage}
                  onChange={(e) => setPassPercentage(e.target.value)}
                />


                {/* 🔥 NEW: Test Tags Section */}
                <div style={{ marginTop: '15px' }}>
                  <h5>Test Tags & Categories</h5>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <input
                      type="text"
                      placeholder="Add a tag (e.g., 'difficult', 'mcq', 'practice', 'exam')"
                      value={testTagInput}
                      onChange={(e) => setTestTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && testTagInput.trim()) {
                          e.preventDefault();
                          if (!testTags.includes(testTagInput.trim())) {
                            setTestTags([...testTags, testTagInput.trim()]);
                          }
                          setTestTagInput('');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (testTagInput.trim() && !testTags.includes(testTagInput.trim())) {
                          setTestTags([...testTags, testTagInput.trim()]);
                          setTestTagInput('');
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Add Tag
                    </button>
                  </div>

                  {/* Display test tags */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    minHeight: '40px',
                    padding: '8px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    background: '#f9f9f9'
                  }}>
                    {testTags.length === 0 ? (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>
                        No tags added yet. Add tags to help categorize this test.
                      </span>
                    ) : (
                      testTags.map((tag, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#e3f2fd',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '14px'
                          }}
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTestTags(testTags.filter((_, i) => i !== index));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#666',
                              cursor: 'pointer',
                              fontSize: '16px',
                              padding: '0',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Test tag suggestions */}
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <strong>Common Test Tags:</strong>
                    <div style={{
                      display: 'flex',
                      gap: '5px',
                      flexWrap: 'wrap',
                      marginTop: '5px'
                    }}>
                      {['mcq', 'difficult', 'easy', 'practice', 'exam', 'quiz', 'concept', 'calculation', 'theory', 'application'].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            if (!testTags.includes(suggestion)) {
                              setTestTags([...testTags, suggestion]);
                            }
                          }}
                          style={{
                            padding: '2px 8px',
                            background: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '12px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <h4>Add Question</h4>

                {/* Question Text */}
                <input
                  type="text"
                  placeholder="Question"
                  value={currentQuestion.text}
                  onChange={(e) =>
                    setCurrentQuestion((q) => ({ ...q, text: e.target.value }))
                  }
                />

                {/* Question Tags Section - Add this after the question text input */}
                <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                  <h6>Question Tags & Keywords</h6>

                  {/* Display Current Subject, Lesson, Subtopic */}
                  <div style={{
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: '#f0f7ff',
                    borderRadius: '6px',
                    borderLeft: '3px solid #2196f3',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                      {subjectName && (
                        <span>📚 <strong>Subject:</strong> {subjectName}</span>
                      )}
                      {selectedUnit && (
                        <span>📖 <strong>Lesson:</strong> {selectedUnit.split('/')[0]}</span>
                      )}
                      {selectedSubTopicUnit?.unitName && (
                        <span>📝 <strong>Subtopic:</strong> {selectedSubTopicUnit.unitName}</span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <input
                      type="text"
                      placeholder="Add question tag (e.g., 'algebra', 'geometry', 'difficult', 'tricky')"
                      value={questionTagInput}
                      onChange={(e) => setQuestionTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && questionTagInput.trim()) {
                          e.preventDefault();
                          if (!questionTags.includes(questionTagInput.trim())) {
                            const newTags = [...questionTags, questionTagInput.trim()];
                            setQuestionTags(newTags);
                            setCurrentQuestion(prev => ({
                              ...prev,
                              tags: newTags
                            }));
                          }
                          setQuestionTagInput('');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (questionTagInput.trim() && !questionTags.includes(questionTagInput.trim())) {
                          const newTags = [...questionTags, questionTagInput.trim()];
                          setQuestionTags(newTags);
                          setCurrentQuestion(prev => ({
                            ...prev,
                            tags: newTags
                          }));
                          setQuestionTagInput('');
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Add Tag
                    </button>
                  </div>

                  {/* Display question tags */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    minHeight: '30px',
                    padding: '6px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    background: '#f5f5f5'
                  }}>
                    {questionTags.length === 0 ? (
                      <span style={{ color: '#999', fontStyle: 'italic', fontSize: '12px' }}>
                        No question tags added yet. Tags help categorize individual questions.
                      </span>
                    ) : (
                      questionTags.map((tag, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#e9ecef',
                            padding: '2px 8px',
                            borderRadius: '15px',
                            fontSize: '12px'
                          }}
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = questionTags.filter((_, i) => i !== index);
                              setQuestionTags(newTags);
                              setCurrentQuestion(prev => ({
                                ...prev,
                                tags: newTags
                              }));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#666',
                              cursor: 'pointer',
                              fontSize: '14px',
                              padding: '0',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Question tag suggestions with cleaned lesson name */}
                  <div style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: '#666'
                  }}>
                    <strong>Quick Add Tags:</strong>
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      flexWrap: 'wrap',
                      marginTop: '5px'
                    }}>
                      {/* Subject Name */}
                      {subjectName && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!questionTags.includes(subjectName)) {
                              const newTags = [...questionTags, subjectName];
                              setQuestionTags(newTags);
                              setCurrentQuestion(prev => ({ ...prev, tags: newTags }));
                            }
                          }}
                          style={{
                            padding: '2px 8px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          + {subjectName}
                        </button>
                      )}

                      {/* Lesson Name - only the first part before slash */}
                      {selectedUnit && (
                        <button
                          type="button"
                          onClick={() => {
                            const cleanLessonName = selectedUnit.split('/')[0];
                            if (!questionTags.includes(cleanLessonName)) {
                              const newTags = [...questionTags, cleanLessonName];
                              setQuestionTags(newTags);
                              setCurrentQuestion(prev => ({ ...prev, tags: newTags }));
                            }
                          }}
                          style={{
                            padding: '2px 8px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          + {selectedUnit.split('/')[0]}
                        </button>
                      )}

                      {/* Subtopic Name */}
                      {selectedSubTopicUnit?.unitName && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!questionTags.includes(selectedSubTopicUnit.unitName)) {
                              const newTags = [...questionTags, selectedSubTopicUnit.unitName];
                              setQuestionTags(newTags);
                              setCurrentQuestion(prev => ({ ...prev, tags: newTags }));
                            }
                          }}
                          style={{
                            padding: '2px 8px',
                            background: '#ffc107',
                            color: '#333',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          + {selectedSubTopicUnit.unitName}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentQuestion((q) => ({
                        ...q,
                        showQuestionInput: true,
                      }))
                    }
                  >
                    Question Images
                  </button>
                  {currentQuestion.showQuestionInput && (
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setCurrentQuestion((q) => ({
                          ...q,
                          questionImages: [
                            ...(q.questionImages || []),
                            ...files,
                          ],
                        }));
                      }}
                      style={{ marginTop: "0.5rem" }}
                    />
                  )}
                  {currentQuestion.questionImages && currentQuestion.questionImages.length > 0 && (
                    <div
                      style={{
                        marginTop: "1rem",
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {currentQuestion.questionImages.map((img, index) => {
                        const imgSrc = getSafeImageUrl(img);
                        return imgSrc ? (
                          <div
                            key={index}
                            style={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            <img
                              src={imgSrc}
                              alt={`question-${index}`}
                              width={100}
                              style={{
                                border: "1px solid #ccc",
                                borderRadius: "6px",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                // Remove the image at the specific index
                                setCurrentQuestion((q) => ({
                                  ...q,
                                  questionImages: q.questionImages.filter((_, i) => i !== index),
                                }));
                              }}
                              style={{
                                position: "absolute",
                                top: "-8px",
                                right: "-8px",
                                background: "#ff4444",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "24px",
                                height: "24px",
                                cursor: "pointer",
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                              }}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Table Data */}
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={currentQuestion.rows}
                    onChange={(e) =>
                      setCurrentQuestion((q) => ({
                        ...q,
                        rows: parseInt(e.target.value),
                      }))
                    }
                    style={{ marginLeft: "1rem", width: "50px" }}
                  />
                  <span> Rows </span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={currentQuestion.cols}
                    onChange={(e) =>
                      setCurrentQuestion((q) => ({
                        ...q,
                        cols: parseInt(e.target.value),
                      }))
                    }
                    style={{ marginLeft: "0.5rem", width: "50px" }}
                  />
                  <span> Cols </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentQuestion((q) => ({
                        ...q,
                        showMatches: true,
                        tableData: generateTable(q.rows, q.cols),
                        tableEditable: true,
                      }))
                    }
                    style={{ marginLeft: "0.5rem" }}
                  >
                    Add Matches
                  </button>
                </div>
                {currentQuestion.showMatches && (
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentQuestion((q) => ({
                          ...q,
                          tableEditable: !q.tableEditable,
                        }))
                      }
                    >
                      {currentQuestion.tableEditable
                        ? "Lock Table"
                        : "Edit Table"}
                    </button>

                    <table
                      border="1"
                      style={{
                        marginTop: "0.5rem",
                        borderCollapse: "collapse",
                      }}
                    >
                      <tbody>
                        {currentQuestion.tableData.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, colIndex) => (
                              <td
                                key={colIndex}
                                style={{
                                  width: 80,
                                  height: 40,
                                  textAlign: "center",
                                  padding: "4px",
                                }}
                              >
                                {currentQuestion.tableEditable ? (
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) => {
                                      const newTable =
                                        currentQuestion.tableData.map(
                                          (r, rIdx) =>
                                            rIdx === rowIndex
                                              ? r.map((c, cIdx) =>
                                                cIdx === colIndex
                                                  ? e.target.value
                                                  : c
                                              )
                                              : r
                                        );
                                      setCurrentQuestion((q) => ({
                                        ...q,
                                        tableData: newTable,
                                      }));
                                    }}
                                    style={{ width: "100%" }}
                                  />
                                ) : (
                                  cell
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Options */}
                <h5>Options</h5>
                {currentQuestion.options.map((opt, idx) => {
                  const optionImageSrc = getSafeImageUrl(opt.image);
                  return (
                    <div key={idx} className="option-row">
                      <input
                        type="radio"
                        name="correct"
                        checked={currentQuestion.correctIndex === idx}
                        onChange={() =>
                          setCurrentQuestion((q) => ({
                            ...q,
                            correctIndex: idx,
                          }))
                        }
                      />
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={opt.text}
                        onChange={(e) => {
                          const newOpts = [...currentQuestion.options];
                          newOpts[idx] = e.target.value;
                          setCurrentQuestion((q) => ({
                            ...q,
                            options: newOpts,
                          }));
                        }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const newOpts = [...currentQuestion.options];
                            newOpts[idx] = { ...newOpts[idx], image: file };
                            setCurrentQuestion((q) => ({
                              ...q,
                              options: newOpts,
                            }));
                          }
                        }}
                      />
                      {optionImageSrc && (
                        <img
                          src={optionImageSrc}
                          alt={`Option ${idx + 1} Preview`}
                          style={{ width: "100px", marginLeft: "10px" }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Explanation */}
                <textarea
                  placeholder="Explain the correct answer"
                  rows={3}
                  value={currentQuestion.explanation || ""}
                  onChange={(e) =>
                    setCurrentQuestion((q) => ({
                      ...q,
                      explanation: e.target.value,
                    }))
                  }
                />

                {/* Solution Image */}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestion((q) => ({
                      ...q,
                      showSolutionInput: true,
                    }))
                  }
                >
                  Solution Image
                </button>
                {currentQuestion.showSolutionInput && (
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setCurrentQuestion((q) => ({
                        ...q,
                        solutionImages: [...(q.solutionImages || []), ...files],
                      }));
                    }}
                    style={{ marginTop: "0.5rem" }}
                  />
                )}
                {currentQuestion.solutionImages &&
                  currentQuestion.solutionImages.length > 0 && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {currentQuestion.solutionImages.map((img, index) => {
                        const imgSrc = getSafeImageUrl(img);
                        return imgSrc ? (
                          <img
                            key={index}
                            src={imgSrc}
                            alt={`solution-${index}`}
                            width={100}
                            style={{
                              border: "1px solid #ccc",
                              borderRadius: "6px",
                            }}
                          />
                        ) : null;
                      })}
                    </div>
                  )}

                <button
                  onClick={() => {
                    // 1️⃣ Add the current question to the array
                    setQuestions((prev) => [...prev, { ...currentQuestion }]);

                    // 2️⃣ Reset everything using emptyQuestion
                    setCurrentQuestion({ ...emptyQuestion });

                    // 3️⃣ Clear editing index
                    setEditingQuestionIndex(null);

                    // 4️⃣ Clear form data question list
                    setFormData((prevForm) => ({
                      ...prevForm,
                      questionsList: [],
                    }));

                    // 5️⃣ Clear file inputs (images)
                    const fileInputs =
                      document.querySelectorAll('input[type="file"]');
                    fileInputs.forEach((input) => (input.value = ""));

                    // 6️⃣ Optional feedback
                    alert("✅ Question added and all fields reset!");
                  }}
                >
                  Add Question
                </button>
                {editingQuestionIndex !== null && (
                  <button
                    onClick={() => {
                      setEditingQuestionIndex(null);
                      setCurrentQuestion({ ...emptyQuestion });
                    }}
                    style={{ marginLeft: "10px" }}
                  >
                    Cancel Edit
                  </button>
                )}

                {Array.isArray(questions) && questions.length > 0 && (
                  <ol>
                    {questions.map((q, idx) => {
                      const imageSrc = getSafeImageUrl(q.image);
                      return (
                        <li key={idx} style={{ marginBottom: "10px" }}>
                          <div>
                            {q.text && <strong>{q.text}</strong>}
                            {imageSrc && (
                              <div>
                                <img
                                  src={imageSrc}
                                  alt="Question"
                                  style={{
                                    maxWidth: "150px",
                                    display: "block",
                                    marginTop: "5px",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div style={{ marginTop: "5px" }}>
                            <button
                              onClick={() => {
                                // Prefill currentQuestion safely
                                setCurrentQuestion({
                                  text: q.text || "",
                                  questionImages: q.questionImages || [],
                                  options: Array.isArray(q.options)
                                    ? q.options.map((opt) => ({
                                      text:
                                        typeof opt === "string"
                                          ? opt
                                          : opt?.text || "",
                                      image:
                                        typeof opt === "object" && opt?.image
                                          ? opt.image
                                          : null,
                                    }))
                                    : [
                                      { text: "", image: null },
                                      { text: "", image: null },
                                      { text: "", image: null },
                                      { text: "", image: null },
                                    ],
                                  correctIndex:
                                    typeof q.correctIndex === "number"
                                      ? q.correctIndex
                                      : null,
                                  explanation: q.explanation || "",
                                  solutionImages: q.solutionImages || [],
                                  rows: q.rows || 0,
                                  cols: q.cols || 0,
                                  tableData: q.tableData || [],
                                  showMatches: q.showMatches || false,
                                  tableEditable: q.tableEditable ?? false,
                                  showQuestionInput: false,
                                  showSolutionInput: false,
                                });
                                setEditingQuestionIndex(idx);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => {
                                const confirmed = window.confirm(
                                  "Are you sure You want to Delete this whole unit?"
                                );
                                if (!confirmed) return;

                                const updatedQuestions = questions.filter(
                                  (_, i) => i !== idx
                                );
                                setQuestions(updatedQuestions);

                                if (editingQuestionIndex === idx) {
                                  setCurrentQuestion({
                                    text: "",
                                    image: null,
                                    options: [
                                      { text: "", image: null },
                                      { text: "", image: null },
                                      { text: "", image: null },
                                      { text: "", image: null },
                                    ],
                                    correctIndex: null,
                                    explanation: "",
                                  });
                                  setEditingQuestionIndex(null);
                                }
                              }}
                              style={{ marginLeft: "10px" }}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
                {showTestForm && (
                  <div className="action-buttons">
                    <button
                      type="button" // ✅ Prevents form submission
                      onClick={() => {
                        const isEditMode = editingTestIndex !== null && oldQuestionForDeletion;

                        if (isEditMode) {
                          handleUpdateTest();
                        } else {
                          handleSaveTest();
                        }
                      }}
                    >
                      {editingTestIndex !== null && oldQuestionForDeletion
                        ? "Update Test"
                        : "Save Test"}
                    </button>

                    <button
                      type="button" // ✅ Prevents form submission
                      onClick={() => {
                        resetTestForm();
                        setEditingTestIndex(null);
                        setOldQuestionForDeletion("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminRight;