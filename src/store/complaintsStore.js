let complaints = [];

/* =========================
   BASIC CRUD
========================= */

export const addComplaint = (complaint) => {
  complaints.push({
    ...complaint,

    photo: complaint.photo || "", // ✅ ADD THIS

    // assignment
    assignedWorker: null,
    assignedWorkerId: null,
    assignedBy: null,
    assignedByRole: null,
    assignedAt: null,
    
    // worker/student state
    workerStatus: "pending",
    studentStatus: "pending",

    // highlights
    studentHighlighted: false,
    studentHighlightedAt: null,

    councilHighlighted: false,
    councilHighlightedAt: null,

    // warden forwarding
    forwardedToWarden: false,
    forwardedToWardenAt: null,
    forwardedBy: null,
    forwardedByRole: null,
  });
};

export const getComplaints = () => complaints;

export const getComplaintById = (id) =>
  complaints.find((item) => item.id === id);

/* =========================
   ASSIGNMENT (Manager/Supervisor Only)
========================= */

export const assignWorkerToComplaint = (
  id,
  workerName,
  workerId,
  assignedBy,
  assignedByRole
) => {
  const complaint = complaints.find((item) => item.id === id);
  if (!complaint)
    return { success: false, message: "Complaint not found." };

  if (complaint.type === "mess")
    return {
      success: false,
      message: "Mess complaints cannot be assigned to workers.",
    };

  complaint.assignedWorker = workerName;
  complaint.assignedWorkerId = workerId;
  complaint.assignedBy = assignedBy;
  complaint.assignedByRole = assignedByRole;
  complaint.assignedAt = new Date().toISOString();

  complaint.workerStatus = "assigned";

  return { success: true };
};

/* =========================
   WORKER ACTIONS
========================= */

export const markComplaintCompleted = (id) => {
  const complaint = complaints.find((item) => item.id === id);
  if (!complaint) return;

  complaint.workerStatus = "completed";
  complaint.workerCompletedAt = new Date().toISOString();
};

export const confirmComplaintResolvedByStudent = (id) => {
  const complaint = complaints.find((item) => item.id === id);
  if (!complaint) return;

  complaint.studentStatus = "completed";
  complaint.completedAt = new Date().toISOString();
};

/* =========================
   HIGHLIGHT SYSTEM
========================= */

export const highlightByStudent = (id) => {
  const complaint = complaints.find((item) => item.id === id);
  if (!complaint) return;

  complaint.studentHighlighted = true;
  complaint.studentHighlightedAt = new Date().toISOString();
};

export const highlightByCouncil = (id) => {
  const complaint = complaints.find((item) => item.id === id);
  if (!complaint) return;

  complaint.councilHighlighted = true;
  complaint.councilHighlightedAt = new Date().toISOString();
};

export const forwardToWarden = (id, forwardedBy, forwardedByRole) => {
  const complaint = complaints.find((item) => item.id === id);
  if (!complaint) return;

  complaint.forwardedToWarden = true;
  complaint.forwardedToWardenAt = new Date().toISOString();
  complaint.forwardedBy = forwardedBy;
  complaint.forwardedByRole = forwardedByRole;
};

/* =========================
   OVERALL STATE
========================= */

export const getOverallComplaintState = (complaint) => {
  if (
    complaint.workerStatus === "completed" &&
    complaint.studentStatus === "completed"
  ) {
    return "completed";
  }

  if (
    complaint.workerStatus === "completed" &&
    complaint.studentStatus === "pending"
  ) {
    return "conflict";
  }

  if (complaint.workerStatus === "assigned") {
    return "in-progress";
  }

  return "pending";
};

/* =========================
   SEARCH + FILTER
========================= */

export const searchAndFilterComplaints = ({
  complaintsList,
  searchText = "",
  state = "all",
  priority = "all",
}) => {
  const text = searchText.trim().toLowerCase();

  return complaintsList.filter((complaint) => {
    const overallState = getOverallComplaintState(complaint);

    const matchesSearch =
      !text ||
      complaint.title?.toLowerCase().includes(text) ||
      complaint.description?.toLowerCase().includes(text) ||
      complaint.roomNo?.toLowerCase().includes(text) ||
      complaint.studentName?.toLowerCase().includes(text) ||
      complaint.roll?.toLowerCase().includes(text) ||
      complaint.assignedWorker?.toLowerCase().includes(text);

    const matchesState = state === "all" || overallState === state;

    const matchesPriority =
      priority === "all" || complaint.priority === priority;

    return matchesSearch && matchesState && matchesPriority;
  });
};

/* =========================
   PRIORITY SORTING
========================= */

export const priorityRank = (priority) => {
  if (priority === "urgent") return 1;
  if (priority === "medium") return 2;
  if (priority === "low") return 3;
  return 4;
};

export const sortByPriority = (list) => {
  return [...list].sort((a, b) => {
    const diff = priorityRank(a.priority) - priorityRank(b.priority);
    if (diff !== 0) return diff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

/* =========================
   HALL BASED FILTERING
========================= */

export const getHallComplaints = (hall) => {
  return complaints.filter((c) => c.hall === hall);
};

export const getAssignedComplaintsForWorker = (workerId) => {
  return complaints.filter((c) => c.assignedWorkerId === workerId);
};

export const getForwardedComplaintsForWarden = (hall) => {
  return complaints.filter(
    (c) => c.hall === hall && c.forwardedToWarden
  );
};

/* =========================
   WARDEN STATS
========================= */

export const getWardenStats = (hall) => {
  const hallComplaints = getForwardedComplaintsForWarden(hall);

  let total = hallComplaints.length;
  let pending = 0;
  let completed = 0;
  let conflict = 0;

  hallComplaints.forEach((c) => {
    const state = getOverallComplaintState(c);

    if (state === "completed") completed++;
    else if (state === "conflict") conflict++;
    else pending++;
  });

  return {
    total,
    pending,
    completed,
    conflict,
  };
};