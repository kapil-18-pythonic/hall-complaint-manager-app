export const createMessComplaint = ({
  title,
  description,
  hall,
  priority = "medium",
}) => {
  return {
    id: `mess-${Date.now()}`,
    type: "mess",
    title,
    description,
    hall,
    priority,
    escalated: false,
    createdAt: new Date().toISOString(),

    highlightedByWarden: false,
    highlightedAt: null,
  };
};

export const createTrackedComplaint = ({
  type,
  title,
  description,
  roomNo,
  mobileNo,
  photo,
  hall,
  studentName,
  roll,
  priority = "medium",

  // NEW
  issueType = "",
}) => {
  return {
    id: `${type}-${Date.now()}`,
    type,
    title,
    description,
    roomNo: roomNo || null,
    mobileNo: mobileNo || null,
    photo: photo || null,
    hall,
    studentName,
    roll,
    priority,
    escalated: false,

    // NEW (only meaningful for "other")
    issueType: type === "other" ? issueType : "",

    workerStatus: "pending",
    studentStatus: "pending",

    assignedWorker: null,
    assignedWorkerId: null,
    assignedAt: null,

    createdAt: new Date().toISOString(),
    workerCompletedAt: null,
    completedAt: null,

    highlightedByWarden: false,
    highlightedAt: null,
  };
};