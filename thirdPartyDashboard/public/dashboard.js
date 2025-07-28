// All dashboard logic from <script> in index.html
// This file should be included in index.html as <script src="dashboard.js"></script>

// DOM Elements
const submitForm = document.getElementById("submit-form");
const statusForm = document.getElementById("status-form");
const jsonPayload = document.getElementById("json-payload");
const createWebhookCheckbox = document.getElementById(
  "create-webhook-checkbox"
);
const jobIdInput = document.getElementById("job-id-input");
const responseContainer = document.getElementById("response-container");
const submitButton = document.getElementById("submit-button");
const submitButtonText = document.getElementById("submit-button-text");
const submitSpinner = document.getElementById("submit-spinner");
const statusButton = document.getElementById("status-button");
const statusButtonText = document.getElementById("status-button-text");
const statusSpinner = document.getElementById("status-spinner");

const API_BASE_URL = "http://127.0.0.1:5000";
const JWT_SECRET = "abbajabbadabba";

// Function to generate JWT using jsrsasign
function generateJWT(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const claims = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 5,
  };
  const sHeader = JSON.stringify(header);
  const sPayload = JSON.stringify(claims);
  // Get secret from textbox if provided
  const jwtSecretInput = document.getElementById("jwt-secret-input");
  let secret = "abbajabbadabba";
  if (jwtSecretInput && jwtSecretInput.value.trim() !== "") {
    secret = jwtSecretInput.value.trim();
  }
  const sJWT = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, { utf8: secret });
  return sJWT;
}

document.addEventListener("DOMContentLoaded", () => {
  const defaultPayload = {
    source: "Higfi Fintech",
    purpose: "To check user cibil_score",
    data_requested: [
      "account_balance",
      "transaction_history",
      "salary",
      "Address",
      "Aadhar Number",
      "cibil_score",
    ],
    zk_thres: {
      cibil_score: 750,
      account_balance: 1000000,
    },
    acc_num: "6025d18fe48abd45168528f18a82e265dd98d421a7084aa09f61b341703901a3",
  };
  jsonPayload.value = JSON.stringify(defaultPayload, null, 4);
});

function showSubmitSpinner(show) {
  submitSpinner.classList.toggle("hidden", !show);
  submitButtonText.textContent = show ? "Submitting..." : "🚀 Submit Task";
  submitButton.disabled = show;
}

function showStatusSpinner(show) {
  statusSpinner.classList.toggle("hidden", !show);
  statusButtonText.textContent = show ? "" : "Check";
  statusButton.disabled = show;
}

function renderResponse(data, type = "info") {
  let bgColor, borderColor, textColor;
  if (type === "success") {
    bgColor = "bg-green-900";
    borderColor = "border-green-700";
    textColor = "text-green-300";
  } else if (type === "error") {
    bgColor = "bg-red-900";
    borderColor = "border-red-700";
    textColor = "text-red-300";
  } else if (type === "pending") {
    bgColor = "bg-yellow-900";
    borderColor = "border-yellow-700";
    textColor = "text-yellow-300";
  } else {
    bgColor = "bg-gray-900";
    borderColor = "border-gray-700";
    textColor = "text-gray-300";
  }
  let content;
  if (typeof data === "string") {
    content = `<p>${data}</p>`;
  } else {
    let jsonContent = `<pre class="whitespace-pre-wrap text-sm">${JSON.stringify(
      data,
      null,
      2
    )}</pre>`;
    if (data.webhook_viewer_url) {
      jsonContent += `<div class="mt-4 flex justify-center"><button id="webhook-viewer-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 shadow-md" style="margin-top:8px;">View Webhook Result</button></div>`;
    }
    content = jsonContent;
  }
  responseContainer.innerHTML = `<div class="${bgColor} border ${borderColor} p-4 rounded-md ${textColor}">${content}</div>`;
  // Add event listener for webhook button if present
  if (data && data.webhook_viewer_url) {
    const btn = document.getElementById("webhook-viewer-btn");
    if (btn) {
      btn.onclick = () => {
        window.open(data.webhook_viewer_url, "_blank");
      };
    }
  }
}

submitForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showSubmitSpinner(true);
  let payload;
  try {
    payload = JSON.parse(jsonPayload.value);
  } catch (error) {
    renderResponse("Error: Invalid JSON format in payload.", "error");
    showSubmitSpinner(false);
    return;
  }
  // Generate JWT for authentication
  const token = generateJWT(payload);
  const requestBody = {
    payload,
    create_webhook: createWebhookCheckbox.checked,
  };
  try {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });
    const result = await response.json();
    if (response.status === 202) {
      renderResponse(result, "success");
      if (result.job_id) jobIdInput.value = result.job_id;
    } else {
      if (response.status === 401) {
        renderResponse(`Authentication Error: ${result.message}`, "error");
      } else {
        renderResponse(result, "error");
      }
    }
  } catch (error) {
    renderResponse(
      "Connection Error: Could not connect to the API server.",
      "error"
    );
  } finally {
    showSubmitSpinner(false);
  }
});

statusForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const jobId = jobIdInput.value.trim();
  if (!jobId) {
    renderResponse("Please enter a Job ID.", "error");
    return;
  }
  showStatusSpinner(true);
  try {
    const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
    const result = await response.json();
    if (response.status === 200) {
      const status = result.status;
      if (status === "completed") renderResponse(result, "success");
      else if (status === "failed") renderResponse(result, "error");
      else renderResponse(result, "pending");
    } else if (response.status === 202) {
      renderResponse(result, "pending");
    } else {
      renderResponse(result, "error");
    }
  } catch (error) {
    renderResponse(
      "Connection Error: Could not connect to the API server.",
      "error"
    );
  } finally {
    showStatusSpinner(false);
  }
});
