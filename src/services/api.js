const BASE_URL = "https://hall-complaint-manager.onrender.com";

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok || data?.success === false) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// =========================
// AUTH
// =========================
export async function sendOtp(role, identifier) {
  const response = await fetch(`${BASE_URL}/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, identifier }),
  });

  return handleResponse(response);
}

export async function verifyOtp(role, identifier, otp) {
  const response = await fetch(`${BASE_URL}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, identifier, otp }),
  });

  return handleResponse(response);
}

// =========================
// COMPLAINTS
// =========================

export async function createComplaint(data) {
  const response = await fetch(`${BASE_URL}/api/complaints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function getComplaintById(complaintId) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}`
  );
  return handleResponse(response);
}

export async function getComplaintsByHall(hall) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/hall/${encodeURIComponent(hall)}`
  );
  return handleResponse(response);
}

// =========================
// COUNCIL
// =========================

export async function getCouncilComplaints(hall, por) {
  const normalizedPor = String(por || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ");

  const response = await fetch(
    `${BASE_URL}/api/complaints/council/view?hall=${encodeURIComponent(
      hall
    )}&por=${encodeURIComponent(normalizedPor)}`
  );

  return handleResponse(response);
}

export async function councilHighlightComplaint(complaintId, payload) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/council-highlight`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(response);
}

export async function councilForwardToWarden(complaintId, payload) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/forward-to-warden`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(response);
}

export async function councilAssignWorker(complaintId, data) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/council-assign`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  return handleResponse(response);
}

// =========================
// SUPERVISOR / MANAGER
// =========================

export async function supervisorAssignWorker(complaintId, data) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/supervisor-assign`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  return handleResponse(response);
}

export async function getHallSupervisorComplaints(hall) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/hall/${encodeURIComponent(hall)}`
  );
  return handleResponse(response);
}

// =========================
// WORKER
// =========================

export async function getWorkerComplaints(hall, type, workerId) {
  const query = new URLSearchParams();

  if (hall) query.append("hall", hall);
  if (type) query.append("type", type);
  if (workerId) query.append("workerId", workerId);

  const response = await fetch(
    `${BASE_URL}/api/complaints/worker/view?${query.toString()}`
  );

  return handleResponse(response);
}

export async function workerCompleteComplaint(complaintId) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/worker-complete`,
    {
      method: "PATCH",
    }
  );

  return handleResponse(response);
}

// =========================
// STUDENT
// =========================

export async function studentConfirmComplaint(complaintId) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/student-confirm`,
    {
      method: "PATCH",
    }
  );

  return handleResponse(response);
}

export async function studentHighlightComplaint(complaintId, payload = {}) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/student-highlight`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(response);
}

// =========================
// WORKERS LIST
// =========================

export async function getWorkers(hall, type) {
  const query = new URLSearchParams();
  if (hall) query.append("hall", hall);
  if (type) query.append("type", type);

  const response = await fetch(
    `${BASE_URL}/api/workers?${query.toString()}`
  );

  return handleResponse(response);
}

// =========================
// MEMBER MANAGEMENT
// =========================

export async function getMembersByRole(role, hall) {
  const query = new URLSearchParams();
  if (role) query.append("role", role);
  if (hall) query.append("hall", hall);

  const response = await fetch(
    `${BASE_URL}/api/members?${query.toString()}`
  );

  return handleResponse(response);
}

export async function addMember(data) {
  const response = await fetch(`${BASE_URL}/api/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function deleteMember(memberId, role) {
  const response = await fetch(
    `${BASE_URL}/api/members/${memberId}?role=${encodeURIComponent(role)}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse(response);
}

export const getAllComplaints = async () => {
  const response = await fetch(
    "https://hall-complaint-manager.onrender.com/api/complaints"
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch complaints");
  }

  return data;
};