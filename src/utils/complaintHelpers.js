/* =========================
   CREATE MESS COMPLAINT
========================= */

export const createMessComplaint = ({
  title,
  description,
  hall,
  priority = "medium",
  studentName,
  roll,
}) => {
  return {
    id: `mess-${Date.now()}`,
    type: "mess",

    title,
    description,
    hall,
    priority,

    studentName,
    roll,

    createdAt: new Date().toISOString(),

    // assignment
    assignedWorker: null,
    assignedWorkerId: null,
    assignedBy: null,
    assignedByRole: null,
    assignedAt: null,

    // status
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
  };
};

/* =========================
   CREATE TRACKED COMPLAINT
========================= */

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

  // for "other" category
  subType = "",
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

    // Only meaningful if type === "other"
    subType: type === "other" ? subType : "",

    createdAt: new Date().toISOString(),

    workerCompletedAt: null,
    completedAt: null,

    // assignment
    assignedWorker: null,
    assignedWorkerId: null,
    assignedBy: null,
    assignedByRole: null,
    assignedAt: null,

    // status
    workerStatus: "pending",
    studentStatus: "pending",

    // student highlight
    studentHighlighted: false,
    studentHighlightedAt: null,

    // council highlight
    councilHighlighted: false,
    councilHighlightedAt: null,

    // forwarded to warden
    forwardedToWarden: false,
    forwardedToWardenAt: null,
    forwardedBy: null,
    forwardedByRole: null,
  };
};