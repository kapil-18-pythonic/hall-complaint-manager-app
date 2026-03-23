const BASE_URL = "https://hall-complaint-backend.onrender.com";

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

// AUTH
export async function sendOtp(role, identifier) {
  const response = await fetch(`${BASE_URL}/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role, identifier }),
  });

  return handleResponse(response);
}

export async function verifyOtp(role, identifier, otp) {
  const response = await fetch(`${BASE_URL}/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role, identifier, otp }),
  });

  return handleResponse(response);
}

// COMPLAINTS
export async function createComplaint(data) {
  const response = await fetch(`${BASE_URL}/api/complaints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function getAllComplaints() {
  const response = await fetch(`${BASE_URL}/api/complaints`);
  return handleResponse(response);
}

export async function getComplaintsByHall(hall) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/hall/${encodeURIComponent(hall)}`
  );
  return handleResponse(response);
}

export async function getCouncilComplaints(hall, por) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/council/view?hall=${encodeURIComponent(
      hall
    )}&por=${encodeURIComponent(por)}`
  );
  return handleResponse(response);
}

export async function getWorkerComplaints(hall, type) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/worker/view?hall=${encodeURIComponent(
      hall
    )}&type=${encodeURIComponent(type)}`
  );
  return handleResponse(response);
}

export async function councilAssignWorker(complaintId, data) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/council-assign`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return handleResponse(response);
}

export async function workerTakeoverComplaint(complaintId, data) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/takeover`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
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

export async function studentConfirmComplaint(complaintId) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/student-confirm`,
    {
      method: "PATCH",
    }
  );

  return handleResponse(response);
}

export async function escalateComplaint(complaintId) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/escalate`,
    {
      method: "PATCH",
    }
  );

  return handleResponse(response);
}

export async function highlightComplaint(complaintId) {
  const response = await fetch(
    `${BASE_URL}/api/complaints/${complaintId}/highlight`,
    {
      method: "PATCH",
    }
  );

  return handleResponse(response);
}

// WORKERS
export async function getWorkers(hall, type) {
  const query = new URLSearchParams();

  if (hall) query.append("hall", hall);
  if (type) query.append("type", type);

  const response = await fetch(`${BASE_URL}/api/workers?${query.toString()}`);
  return handleResponse(response);
}