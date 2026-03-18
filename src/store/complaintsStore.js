let complaints = [];

export const addComplaint = (complaint) => {
  complaints.push(complaint);
};

export const getComplaints = () => {
  return complaints;
};

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

export const markComplaintEscalated = (id) => {
  const complaint = complaints.find((item) => item.id === id);
  if (!complaint) return;

  complaint.escalated = true;
};

export const assignWorkerToComplaint = (id, workerName, workerId) => {
  const complaint = complaints.find((item) => item.id === id);

  if (!complaint) {
    return { success: false, message: "Complaint not found." };
  }

  if (complaint.type === "mess") {
    return {
      success: false,
      message: "Mess complaints cannot be taken by workers.",
    };
  }

  if (complaint.assignedWorker) {
    return {
      success: false,
      message: "This complaint has already been taken by another worker.",
    };
  }

  complaint.assignedWorker = workerName;
  complaint.assignedWorkerId = workerId;
  complaint.assignedAt = new Date().toISOString();

  // IMPORTANT:
  // Taking over should NOT mark it completed.
  complaint.workerStatus = "pending";

  return { success: true };
};

export const getOverallComplaintState = (complaint) => {
  if (complaint.type === "mess") {
    return complaint.escalated ? "escalated" : "open";
  }

  if (complaint.escalated) return "escalated";

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

  return "pending";
};

export const searchAndFilterComplaints = ({
  complaintsList,
  searchText = "",
  state = "all",
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

    return matchesSearch && matchesState;
  });
};

export const priorityRank = (priority) => {
  if (priority === "urgent") return 1;
  if (priority === "high") return 2;
  if (priority === "medium") return 3;
  return 4;
};