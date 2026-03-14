/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import "./Support.css";
import { API_BASE_URL } from "../../config";

const Support = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [taskStatus, setTaskStatus] = useState("assigned");
  const [priority, setPriority] = useState("medium");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [error, setError] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Mock employee data
  const mockEmployees = [
    {
      id: "emp1",
      name: "Rajesh Kumar",
      designation: "Technical Support",
      department: "Support",
    },
    {
      id: "emp2",
      name: "Priya Sharma",
      designation: "Customer Service",
      department: "Support",
    },
    {
      id: "emp3",
      name: "Amit Patel",
      designation: "IT Specialist",
      department: "Technical",
    },
    {
      id: "emp4",
      name: "Sneha Reddy",
      designation: "Admin Manager",
      department: "Administration",
    },
    {
      id: "emp5",
      name: "Vikram Singh",
      designation: "Operations Head",
      department: "Operations",
    },
  ];

  useEffect(() => {
    fetchEnquiries();
    setEmployees(mockEmployees);
  }, []);

  // Helper function to transform enquiry data
  const transformEnquiryData = (enquiry) => {
    const employee = mockEmployees.find((emp) => emp.id === enquiry.assignedTo);

    return {
      _id: enquiry.id || enquiry._id,
      name: enquiry.name || "N/A",
      email: enquiry.email || "N/A",
      phone: enquiry.phone || "N/A",
      category: enquiry.category || "General",
      enquiryMessage: enquiry.enquiryMessage || "No message provided",
      fileName: enquiry.fileName || null,
      fileData: enquiry.fileData || null,
      contentType: enquiry.contentType || null,
      submittedAt: enquiry.submittedAt || new Date().toISOString(),
      userId: enquiry.userId || "N/A",
      isRegistered: enquiry.isRegistered || false,
      status: enquiry.status || "pending",
      assignedTo: enquiry.assignedTo || null,
      assignmentDate: enquiry.assignmentDate || null,
      completedDate: enquiry.completedDate || null,
      deadline: enquiry.deadline || null,
      taskDescription: enquiry.taskDescription || "",
      employeeNotes: enquiry.employeeNotes || "",
      priority: enquiry.priority || "medium",
      assignedEmployeeName: employee ? employee.name : null,
      assignedEmployeeDesignation: employee ? employee.designation : null,
    };
  };

  // Fetch enquiries from backend API
  const fetchEnquiries = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching enquiries from backend...");
      console.log("API URL:", `${API_BASE_URL}/support/enquiries`);

      const response = await fetch(`${API_BASE_URL}/support/enquiries`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error("Error response details:", errorData);
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
          console.error("Error response text:", errorText);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Raw API response:", data);

      const transformedEnquiries = data.map((enquiry) =>
        transformEnquiryData(enquiry),
      );

      console.log("Transformed enquiries:", transformedEnquiries);
      setEnquiries(transformedEnquiries);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      setError(
        `Failed to load enquiries: ${error.message}. Please check your backend connection.`,
      );

      console.log("Using mock data as fallback");
      setEnquiries(getMockEnquiries());
    } finally {
      setLoading(false);
    }
  };

  // View/Download file function - COMPLETE VERSION
  const handleViewFile = async (enquiry) => {
    if (!enquiry.fileName || !enquiry._id) {
      alert("No file attached to this enquiry");
      return;
    }

    setFileLoading(true);

    try {
      console.log("Fetching file for enquiry:", enquiry._id);

      // First, check if file exists
      const infoResponse = await fetch(
        `${API_BASE_URL}/support/enquiries/${enquiry._id}/file-info`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!infoResponse.ok) {
        throw new Error(`Cannot check file info: ${infoResponse.status}`);
      }

      const fileInfo = await infoResponse.json();
      console.log("File info:", fileInfo);

      if (!fileInfo.fileDataExists) {
        alert(
          "This enquiry has a file name, but the actual file data is not available in the database.",
        );
        return;
      }

      // Now fetch the actual file
      const response = await fetch(
        `${API_BASE_URL}/support/enquiries/${enquiry._id}/file`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch file: ${response.status} ${response.statusText}`,
        );
      }

      const blob = await response.blob();
      const fileType = response.headers.get('content-type') || enquiry.contentType;
      const fileUrl = URL.createObjectURL(blob);

      const selectedFileData = {
        fileName: enquiry.fileName,
        fileType: fileType,
        fileUrl: fileUrl,
        blob: blob
      };

      setSelectedFile(selectedFileData);
      setShowFileModal(true);
    } catch (error) {
      console.error("Error fetching file:", error);
      alert(`Could not load file: ${error.message}`);
    } finally {
      setFileLoading(false);
    }
  };

  // Download file function
  const handleDownloadFile = () => {
    if (!selectedFile) return;

    try {
      if (selectedFile.blob) {
        const url = window.URL.createObjectURL(selectedFile.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = selectedFile.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (selectedFile.fileUrl) {
        const link = document.createElement("a");
        link.href = selectedFile.fileUrl;
        link.download = selectedFile.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file");
    }
  };

  // Mock data fallback
  const getMockEnquiries = () => {
    return [
      {
        _id: "697064596e5da37f9d39a95c",
        name: "Learn Forward",
        email: "learnforward@padmasini.com",
        phone: "9655816656",
        category: "Video",
        enquiryMessage:
          "Testing video upload functionality. I need help with uploading videos to the platform.",
        fileName: "Screenshot 2025-12-10 122706.png",
        fileData: null,
        contentType: "image/png",
        submittedAt: "2026-01-21T11:00:01.876Z",
        userId: "697063c66e5da37f9d39a959",
        isRegistered: true,
        status: "pending",
        assignedTo: null,
        assignmentDate: null,
        completedDate: null,
        deadline: null,
        taskDescription: "",
        employeeNotes: "",
        priority: "medium",
      },
      {
        _id: "697064596e5da37f9d39a95d",
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543210",
        category: "Technical",
        enquiryMessage: "Having issues with login. Getting error 404.",
        fileName: "video_demo.mp4",
        fileData: null,
        contentType: "video/mp4",
        submittedAt: "2026-01-20T14:30:00.000Z",
        userId: "697063c66e5da37f9d39a95a",
        isRegistered: true,
        status: "assigned",
        assignedTo: "emp1",
        assignmentDate: "2026-01-21T10:00:00.000Z",
        completedDate: null,
        deadline: "2026-01-25T18:00:00.000Z",
        taskDescription: "Investigate login issue and provide solution",
        employeeNotes: "",
        priority: "high",
      },
    ];
  };

  const handleEnquiryClick = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedEnquiry(null);
  };

  const handleAssign = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowAssignModal(true);
    setSelectedEmployee("");
    setTaskDescription("");
    setDeadline("");
    setTaskStatus("assigned");
    setPriority("medium");
  };

  // Assign enquiry to backend
  const handleAssignSubmit = async () => {
    if (!selectedEmployee || !taskDescription.trim()) {
      alert("Please select an employee and enter task description");
      return;
    }

    if (!deadline) {
      alert("Please set a deadline for the task");
      return;
    }

    try {
      const assignmentData = {
        assignedTo: selectedEmployee,
        taskDescription,
        deadline: new Date(deadline).toISOString(),
        status: taskStatus,
        priority,
      };

      console.log("Assigning enquiry:", selectedEnquiry._id, assignmentData);

      const response = await fetch(
        `${API_BASE_URL}/support/enquiries/${selectedEnquiry._id}/assign`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assignmentData),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to assign enquiry: ${response.status} ${errorText}`,
        );
      }

      const updatedEnquiry = await response.json();
      console.log("Assignment response:", updatedEnquiry);

      const updatedEnquiries = enquiries.map((e) => {
        if (e._id === updatedEnquiry.id) {
          const employee = employees.find((emp) => emp.id === selectedEmployee);
          return {
            ...e,
            status: taskStatus,
            assignedTo: selectedEmployee,
            assignedEmployeeName: employee.name,
            assignedEmployeeDesignation: employee.designation,
            assignmentDate: new Date().toISOString(),
            deadline: deadline,
            taskDescription: taskDescription,
            priority: priority,
          };
        }
        return e;
      });

      setEnquiries(updatedEnquiries);

      if (viewMode === "detail") {
        const employee = employees.find((emp) => emp.id === selectedEmployee);
        setSelectedEnquiry({
          ...selectedEnquiry,
          status: taskStatus,
          assignedTo: selectedEmployee,
          assignedEmployeeName: employee.name,
          assignedEmployeeDesignation: employee.designation,
          assignmentDate: new Date().toISOString(),
          deadline: deadline,
          taskDescription: taskDescription,
          priority: priority,
        });
      }

      setShowAssignModal(false);
      alert("Task assigned successfully!");
      fetchEnquiries();
    } catch (error) {
      console.error("Error assigning enquiry:", error);
      alert(`Failed to assign task: ${error.message}`);
    }
  };

  // Mark enquiry as complete in backend
  const handleComplete = async (enquiryId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/support/enquiries/${enquiryId}/complete`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeNotes: "Marked as completed from admin panel",
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to complete enquiry: ${response.status} ${errorText}`,
        );
      }

      const updatedEnquiry = await response.json();
      console.log("Completion response:", updatedEnquiry);

      const updatedEnquiries = enquiries.map((e) => {
        if (e._id === enquiryId) {
          return {
            ...e,
            status: "completed",
            completedDate: new Date().toISOString(),
          };
        }
        return e;
      });

      setEnquiries(updatedEnquiries);

      if (
        viewMode === "detail" &&
        selectedEnquiry &&
        selectedEnquiry._id === enquiryId
      ) {
        setSelectedEnquiry({
          ...selectedEnquiry,
          status: "completed",
          completedDate: new Date().toISOString(),
        });
      }

      alert("Marked as completed successfully!");
      fetchEnquiries();
    } catch (error) {
      console.error("Error completing enquiry:", error);
      alert(`Failed to mark as complete: ${error.message}`);
    }
  };

  // Fetch filtered enquiries
  const fetchFilteredEnquiries = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE_URL}/support/enquiries/filter`);
      if (statusFilter !== "all")
        url.searchParams.append("status", statusFilter);
      if (categoryFilter !== "all")
        url.searchParams.append("category", categoryFilter);

      console.log("Filter URL:", url.toString());

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Filtered response:", data);

      const transformedEnquiries = data.map((enquiry) =>
        transformEnquiryData(enquiry),
      );

      setEnquiries(transformedEnquiries);
    } catch (error) {
      console.error("Error fetching filtered enquiries:", error);
      setError(`Failed to load filtered enquiries: ${error.message}.`);
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (statusFilter !== "all" || categoryFilter !== "all") {
      fetchFilteredEnquiries();
    } else {
      fetchEnquiries();
    }
  }, [statusFilter, categoryFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: "Pending", class: "support-status-pending" },
      assigned: { text: "Assigned", class: "support-status-assigned" },
      completed: { text: "Completed", class: "support-status-completed" },
    };
    const badge = badges[status] || {
      text: "Unknown",
      class: "support-status-unknown",
    };
    return (
      <span className={`support-status-indicator ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const badges = {
      Video: { text: "Video", class: "support-category-video" },
      Technical: { text: "Technical", class: "support-category-technical" },
      General: { text: "General", class: "support-category-general" },
    };
    const badge = badges[category] || {
      text: category,
      class: "support-category-default",
    };
    return (
      <span className={`support-category-tag ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: { text: "Low", class: "support-priority-low" },
      medium: { text: "Medium", class: "support-priority-medium" },
      high: { text: "High", class: "support-priority-high" },
      urgent: { text: "Urgent", class: "support-priority-urgent" },
    };
    const badge = badges[priority] || {
      text: "Medium",
      class: "support-priority-medium",
    };
    return (
      <span className={`support-priority-label ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  // Get file icon based on file type
  const getFileIcon = (fileName, contentType) => {
    if (!fileName) return "📄";

    const ext = fileName.split(".").pop().toLowerCase();
    const type = contentType || "";

    if (
      type.includes("image/") ||
      ["png", "jpg", "jpeg", "gif", "bmp", "webp"].includes(ext)
    ) {
      return "🖼️";
    } else if (
      type.includes("video/") ||
      ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"].includes(ext)
    ) {
      return "🎬";
    } else if (
      type.includes("audio/") ||
      ["mp3", "wav", "ogg", "m4a"].includes(ext)
    ) {
      return "🎵";
    } else if (type.includes("pdf") || ext === "pdf") {
      return "📕";
    } else if (type.includes("word") || ["doc", "docx"].includes(ext)) {
      return "📝";
    } else if (
      type.includes("excel") ||
      type.includes("spreadsheet") ||
      ["xls", "xlsx"].includes(ext)
    ) {
      return "📊";
    } else if (
      type.includes("zip") ||
      ["zip", "rar", "7z", "tar", "gz"].includes(ext)
    ) {
      return "📦";
    } else {
      return "📄";
    }
  };

  // Check if file is viewable in browser
  const isViewableInBrowser = (fileType) => {
    if (!fileType) return false;

    const viewableTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
      "application/pdf",
      "text/plain",
      "text/html",
      "text/css",
      "text/javascript",
      "application/json",
    ];

    return viewableTypes.some((type) => fileType.includes(type));
  };

  if (loading) {
    return (
      <div className="support-system-container">
        <div className="support-loading-state">
          <div className="support-loading-spinner"></div>
          <p>Loading support enquiries...</p>
        </div>
      </div>
    );
  }

  // Detail View Component
  const DetailView = () => {
    if (!selectedEnquiry) {
      return (
        <div className="support-detail-page">
          <div className="support-detail-header-section">
            <button
              className="support-back-button"
              onClick={handleBackToList}
            >
              ← Back to List
            </button>
            <h2>No Enquiry Selected</h2>
            <p>Please select an enquiry from the list</p>
          </div>
        </div>
      );
    }

    return (
      <div className="support-detail-page">
        <div className="support-detail-header-section">
          <button
            className="support-back-button"
            onClick={handleBackToList}
          >
            ← Back to List
          </button>
          <h2>Enquiry Details</h2>
          {error && <div className="support-error-alert">{error}</div>}
        </div>

        <div className="support-detail-card-container">
          <div className="support-detail-card-header">
            <div className="support-detail-user-section">
              <h3>{selectedEnquiry.name || "N/A"}</h3>
              <div className="support-detail-meta-tags">
                {getStatusBadge(selectedEnquiry.status)}
                {getCategoryBadge(selectedEnquiry.category)}
                {selectedEnquiry.priority &&
                  getPriorityBadge(selectedEnquiry.priority)}
                <span className="support-user-type-badge">
                  {selectedEnquiry.isRegistered ? "Registered User" : "Guest"}
                </span>
              </div>
            </div>
            <div className="support-detail-submission-section">
              <p>
                <strong>Submitted:</strong>{" "}
                {formatDate(selectedEnquiry.submittedAt)}
              </p>
              {selectedEnquiry.fileName && (
                <div className="support-attachment-info">
                  <strong>Attachment:</strong>
                  <button
                    className="support-view-attachment-btn"
                    onClick={() => handleViewFile(selectedEnquiry)}
                    disabled={fileLoading}
                  >
                    {fileLoading
                      ? "⏳ Loading..."
                      : `${getFileIcon(selectedEnquiry.fileName, selectedEnquiry.contentType)} ${selectedEnquiry.fileName}`}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="support-detail-content">
            <div className="support-contact-info-section">
              <h4>Contact Information</h4>
              <div className="support-contact-grid-layout">
                <div className="support-contact-field">
                  <span className="support-contact-label">📧 Email:</span>
                  <span className="support-contact-value">
                    {selectedEnquiry.email || "N/A"}
                  </span>
                </div>
                <div className="support-contact-field">
                  <span className="support-contact-label">📱 Phone:</span>
                  <span className="support-contact-value">
                    {selectedEnquiry.phone || "N/A"}
                  </span>
                </div>
                <div className="support-contact-field">
                  <span className="support-contact-label">User ID:</span>
                  <span className="support-contact-value">
                    {selectedEnquiry.userId || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="support-message-section">
              <h4>Message</h4>
              <div className="support-message-content">
                {selectedEnquiry.enquiryMessage || "No message provided"}
              </div>
            </div>

            {selectedEnquiry.status === "assigned" &&
              selectedEnquiry.assignedTo && (
                <div className="support-assignment-section">
                  <h4>👥 Assignment Details</h4>
                  <div className="support-assignment-grid">
                    <div className="support-assignment-field">
                      <span className="support-assignment-label">
                        Assigned To:
                      </span>
                      <span className="support-assignment-value">
                        {selectedEnquiry.assignedEmployeeName || "Unknown"}(
                        {selectedEnquiry.assignedEmployeeDesignation || "N/A"})
                      </span>
                    </div>
                    <div className="support-assignment-field">
                      <span className="support-assignment-label">
                        Assigned On:
                      </span>
                      <span className="support-assignment-value">
                        {formatDate(selectedEnquiry.assignmentDate)}
                      </span>
                    </div>
                    <div className="support-assignment-field">
                      <span className="support-assignment-label">
                        Deadline:
                      </span>
                      <span className="support-assignment-value support-deadline-text">
                        {formatDate(selectedEnquiry.deadline)}
                      </span>
                    </div>
                    <div className="support-assignment-field">
                      <span className="support-assignment-label">
                        Priority:
                      </span>
                      <span className="support-assignment-value">
                        {getPriorityBadge(selectedEnquiry.priority)}
                      </span>
                    </div>
                    <div className="support-assignment-field support-full-width-field">
                      <span className="support-assignment-label">
                        Task Description:
                      </span>
                      <span className="support-assignment-value support-task-description">
                        {selectedEnquiry.taskDescription || "N/A"}
                      </span>
                    </div>
                    {selectedEnquiry.employeeNotes && (
                      <div className="support-assignment-field support-full-width-field">
                        <span className="support-assignment-label">
                          Employee Notes:
                        </span>
                        <span className="support-assignment-value support-employee-notes">
                          {selectedEnquiry.employeeNotes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {selectedEnquiry.status === "completed" && (
              <div className="support-completion-section">
                <h4>✅ Completion Details</h4>
                <div className="support-completion-grid">
                  <div className="support-completion-field">
                    <span className="support-completion-label">
                      Completed On:
                    </span>
                    <span className="support-completion-value">
                      {formatDate(selectedEnquiry.completedDate)}
                    </span>
                  </div>
                  <div className="support-completion-field">
                    <span className="support-completion-label">
                      Assigned To:
                    </span>
                    <span className="support-completion-value">
                      {selectedEnquiry.assignedEmployeeName || "Unknown"}
                    </span>
                  </div>
                  <div className="support-completion-field support-full-width-field">
                    <span className="support-completion-label">
                      Resolution Notes:
                    </span>
                    <span className="support-completion-value support-resolution-notes">
                      {selectedEnquiry.employeeNotes || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="support-detail-actions-panel">
              {selectedEnquiry.status === "pending" && (
                <button
                  className="support-assign-action-btn"
                  onClick={() => handleAssign(selectedEnquiry)}
                >
                  👤 Assign Task
                </button>
              )}

              {selectedEnquiry.status === "assigned" && (
                <>
                  <button
                    className="support-edit-assignment-btn"
                    onClick={() => handleAssign(selectedEnquiry)}
                  >
                    ✏️ Edit Assignment
                  </button>
                  <button
                    className="support-complete-action-btn"
                    onClick={() => handleComplete(selectedEnquiry._id)}
                  >
                    ✅ Mark Complete
                  </button>
                </>
              )}

              {selectedEnquiry.status === "completed" && (
                <button
                  className="support-reopen-action-btn"
                  onClick={() =>
                    console.log("Reopen functionality to be implemented")
                  }
                >
                  🔄 Reopen Task
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // List View Component
  const ListView = () => (
    <>
      <div className="support-page-header">
        <div className="support-header-content">
          <h1>📋 Support Enquiries</h1>
        </div>
        <p className="support-page-subtitle">
          Manage and assign customer support requests
        </p>
        {error && <div className="support-error-alert">{error}</div>}
      </div>

      <div className="support-filters-panel">
        <div className="support-filter-control">
          <label>Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="support-filter-control">
          <label>Filter by Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Video">Video</option>
            <option value="Technical">Technical</option>
            <option value="General">General</option>
          </select>
        </div>

        <button className="support-refresh-action-btn" onClick={fetchEnquiries}>
          🔄 Refresh
        </button>
      </div>

      <div className="support-stats-grid">
        <div className="support-stat-card-base">
          <h3>{enquiries.length}</h3>
          <p>Total Enquiries</p>
        </div>
        <div className="support-stat-card-base support-stat-pending">
          <h3>{enquiries.filter((e) => e.status === "pending").length}</h3>
          <p>Pending</p>
        </div>
        <div className="support-stat-card-base support-stat-assigned">
          <h3>{enquiries.filter((e) => e.status === "assigned").length}</h3>
          <p>Assigned</p>
        </div>
        <div className="support-stat-card-base support-stat-completed">
          <h3>{enquiries.filter((e) => e.status === "completed").length}</h3>
          <p>Completed</p>
        </div>
      </div>

      <div className="support-enquiries-container">
        {enquiries.length === 0 ? (
          <div className="support-empty-state">
            <div className="support-empty-icon">📭</div>
            <h3>No support enquiries found</h3>
            <p>No enquiries match your current filters</p>
            <button onClick={fetchEnquiries} className="support-retry-action-btn">
              Try Loading Again
            </button>
          </div>
        ) : (
          <table className="support-enquiries-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>File</th>
                <th>Submitted</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr
                  key={enquiry._id}
                  className="support-enquiry-row-item"
                  onClick={() => handleEnquiryClick(enquiry)}
                >
                  <td>
                    <div className="support-enquiry-user">
                      <strong>{enquiry.name}</strong>
                      <div className="support-enquiry-email-text">
                        {enquiry.email}
                      </div>
                    </div>
                  </td>
                  <td>{getCategoryBadge(enquiry.category)}</td>
                  <td>{getStatusBadge(enquiry.status)}</td>
                  <td>
                    {enquiry.fileName && (
                      <button
                        className="support-file-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewFile(enquiry);
                        }}
                        title={`View ${enquiry.fileName}`}
                        disabled={fileLoading}
                      >
                        {fileLoading
                          ? "⏳"
                          : getFileIcon(enquiry.fileName, enquiry.contentType)}
                      </button>
                    )}
                  </td>
                  <td className="support-enquiry-date-field">
                    {formatDate(enquiry.submittedAt)}
                  </td>
                  <td>{getPriorityBadge(enquiry.priority)}</td>
                  <td className="support-enquiry-actions-field">
                    <div
                      className="support-row-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {enquiry.status === "pending" && (
                        <button
                          className="support-assign-row-btn"
                          onClick={() => handleAssign(enquiry)}
                        >
                          Assign
                        </button>
                      )}
                      {enquiry.status === "assigned" && (
                        <button
                          className="support-complete-row-btn"
                          onClick={() => handleComplete(enquiry._id)}
                        >
                          Complete
                        </button>
                      )}
                      <button
                        className="support-view-row-btn"
                        onClick={() => handleEnquiryClick(enquiry)}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  return (
    <div className="support-system-container">
      {viewMode === "list" ? <ListView /> : <DetailView />}

      {/* Assignment Modal */}
      {showAssignModal && selectedEnquiry && (
        <div className="support-modal-overlay">
          <div className="support-modal-dialog">
            <div className="support-modal-header-section">
              <h2>Assign Support Task</h2>
              <button
                className="support-modal-close-btn"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>

            <div className="support-modal-body-section">
              <div className="support-enquiry-preview-card">
                <h4>Enquiry Details:</h4>
                <p>
                  <strong>User:</strong> {selectedEnquiry?.name || "N/A"}
                </p>
                <p>
                  <strong>Category:</strong>{" "}
                  {selectedEnquiry?.category || "N/A"}
                </p>
                <p>
                  <strong>Message:</strong>{" "}
                  {selectedEnquiry?.enquiryMessage || "No message"}
                </p>
              </div>

              <div className="support-form-control">
                <label>👨‍💼 Select Employee:</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="support-employee-selector"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.designation} (
                      {employee.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="support-form-control">
                <label>📝 Task Description:</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Describe the task to be performed..."
                  rows="4"
                  required
                />
              </div>

              <div className="support-form-row-layout">
                <div className="support-form-control support-form-half">
                  <label>📅 Deadline:</label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>

                <div className="support-form-control support-form-half">
                  <label>📊 Status:</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                  </select>
                </div>
              </div>

              <div className="support-form-control">
                <label>⏰ Priority:</label>
                <div className="support-priority-selector">
                  <button
                    type="button"
                    className={`support-priority-option support-priority-low ${priority === "low" ? "support-priority-active" : ""}`}
                    onClick={() => setPriority("low")}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    className={`support-priority-option support-priority-medium ${priority === "medium" ? "support-priority-active" : ""}`}
                    onClick={() => setPriority("medium")}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    className={`support-priority-option support-priority-high ${priority === "high" ? "support-priority-active" : ""}`}
                    onClick={() => setPriority("high")}
                  >
                    High
                  </button>
                  <button
                    type="button"
                    className={`support-priority-option support-priority-urgent ${priority === "urgent" ? "support-priority-active" : ""}`}
                    onClick={() => setPriority("urgent")}
                  >
                    Urgent
                  </button>
                </div>
              </div>
            </div>

            <div className="support-modal-footer-section">
              <button
                className="support-modal-cancel-btn"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className="support-modal-submit-btn"
                onClick={handleAssignSubmit}
              >
                👤 Assign Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File View Modal */}
      {showFileModal && (
        <div className="support-file-modal-overlay">
          <div className="support-file-modal-dialog">
            <div className="support-file-modal-header-section">
              <h2>Attachment: {selectedFile?.fileName}</h2>
              <button
                className="support-file-modal-close-btn"
                onClick={() => {
                  setShowFileModal(false);
                  if (
                    selectedFile?.fileUrl &&
                    selectedFile?.fileUrl.startsWith("blob:")
                  ) {
                    URL.revokeObjectURL(selectedFile.fileUrl);
                  }
                }}
              >
                ×
              </button>
            </div>

            <div className="support-file-modal-body-section">
              {fileLoading ? (
                <div className="support-file-loading-state">
                  <div className="support-file-loading-spinner"></div>
                  <p>Loading file...</p>
                </div>
              ) : selectedFile ? (
                <>
                  <div className="support-file-preview-area">
                    {selectedFile.fileType?.includes("image") ? (
                      <img
                        src={selectedFile.fileUrl}
                        alt={selectedFile.fileName}
                        className="support-file-image-viewer"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `
                            <div class="support-file-error-message">
                              <p>Cannot display image. Please download the file.</p>
                            </div>
                          `;
                        }}
                      />
                    ) : selectedFile.fileType?.includes("video") ? (
                      <video controls className="support-file-video-player">
                        <source
                          src={selectedFile.fileUrl}
                          type={selectedFile.fileType}
                        />
                        Your browser does not support the video tag.
                      </video>
                    ) : selectedFile.fileType?.includes("audio") ? (
                      <audio controls className="support-file-audio-player">
                        <source
                          src={selectedFile.fileUrl}
                          type={selectedFile.fileType}
                        />
                        Your browser does not support the audio tag.
                      </audio>
                    ) : selectedFile.fileType?.includes("pdf") ? (
                      <iframe
                        src={selectedFile.fileUrl}
                        title={selectedFile.fileName}
                        className="support-file-pdf-viewer"
                      />
                    ) : selectedFile.fileType?.includes("text/") ? (
                      <div className="support-file-text-content">
                        <a
                          href={selectedFile.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="support-open-external-btn"
                        >
                          Open in New Tab
                        </a>
                      </div>
                    ) : isViewableInBrowser(selectedFile.fileType) ? (
                      <div className="support-file-text-content">
                        <p>
                          This file type can be viewed directly in the browser.
                        </p>
                        <a
                          href={selectedFile.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="support-open-external-btn"
                        >
                          Open in New Tab
                        </a>
                      </div>
                    ) : (
                      <div className="support-file-unsupported-format">
                        <div className="support-file-large-icon">
                          {getFileIcon(
                            selectedFile.fileName,
                            selectedFile.fileType,
                          )}
                        </div>
                        <h3>Preview Not Available</h3>
                        <p>
                          This file type cannot be previewed in the browser.
                        </p>
                        <p>Please download the file to view it.</p>
                      </div>
                    )}
                  </div>

                  <div className="support-file-info-card">
                    <p>
                      <strong>File Name:</strong> {selectedFile.fileName}
                    </p>
                    <p>
                      <strong>File Type:</strong>{" "}
                      {selectedFile.fileType || "Unknown"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="support-file-error-message">
                  <p>File not found or cannot be loaded.</p>
                </div>
              )}
            </div>

            <div className="support-file-modal-footer-section">
              <button
                className="support-file-download-btn"
                onClick={handleDownloadFile}
                disabled={!selectedFile}
              >
                ⬇️ Download
              </button>
              <button
                className="support-file-close-btn"
                onClick={() => {
                  setShowFileModal(false);
                  if (
                    selectedFile?.fileUrl &&
                    selectedFile?.fileUrl.startsWith("blob:")
                  ) {
                    URL.revokeObjectURL(selectedFile.fileUrl);
                  }
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;