const API_BASE = "https://topik-backend-ae3y.onrender.com/admin";

/* =========================
   DASHBOARD – LIST ALL
   ========================= */
async function loadRegistrations() {
  try {
    const res = await fetch(`${API_BASE}/registrations`);
    const data = await res.json();

    console.log("ADMIN.JS LOADED");
    console.log("DATA FROM API:", data);

    const tbody = document.getElementById("tableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    // SAFETY GUARD
    if (!Array.isArray(data)) {
      console.error("Expected array, got:", data);
      return;
    }

    data.forEach(item => {
      const tr = document.createElement("tr");

      // ===== STATUS BADGE =====
      const statusText = item.status || "PENDING";
      const statusClass = statusText.toLowerCase();

      const statusHTML = `
        <span class="status ${statusClass}">
          ${statusText}
        </span>
      `;

      // ===== REJECTION REASON ===== //
      const rejectionReason =
        statusText === "REJECTED" && item.rejection_reason
          ? item.rejection_reason
          : "-";

      const reasonClass =
        rejectionReason === "-" ? "reason empty" : "reason";

      tr.innerHTML = `
        <td>${item.registration_number || "-"}</td>
        <td>${item.english_name || item.korean_name || "-"}</td>
        <td>${item.test_level || "-"}</td>
        <td>${statusHTML}</td>
        <td class="${reasonClass}">
          ${rejectionReason}
        </td>
        <td>
          <a class="action-btn" href="view.html?id=${item.id}">
            View
          </a>
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("LOAD REGISTRATIONS ERROR:", err);
  }
}

/* =========================
   VIEW – APPROVE & REJECT
   ========================= */
async function loadRegistrationActions() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const approveBtn = document.getElementById("approveBtn");
  const rejectBtn = document.getElementById("rejectBtn");
  const statusEl = document.getElementById("statusText");

  // ===== GET CURRENT STATUS =====
  const resStatus = await fetch(`${API_BASE}/registrations/${id}`);
  const data = await resStatus.json();

  if (statusEl) {
    statusEl.textContent = data.status || "PENDING";
    statusEl.style.fontWeight = "bold";
    if (data.status === "APPROVED") statusEl.style.color = "green";
    if (data.status === "REJECTED") statusEl.style.color = "red";
  }

  // ===== LOCK IF NOT PENDING =====
  if (data.status !== "PENDING") {
    if (approveBtn) approveBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;
    return;
  }

  /* ===== APPROVE ===== */
  if (approveBtn) {
    approveBtn.onclick = async () => {
      if (!confirm("Approve this application?")) return;

      const res = await fetch(
        `${API_BASE}/registrations/${id}/approve`,
        { method: "POST" }
      );

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Failed to approve application");
        return;
      }

      if (statusEl) {
        statusEl.textContent = "APPROVED";
        statusEl.style.color = "green";
      }

      approveBtn.disabled = true;
      rejectBtn.disabled = true;

      alert("Application approved.\n\nDecision is now locked.");

      window.open(
        `${API_BASE}/registrations/${id}/pdf`,
        "_blank"
      );
    };
  }

  /* ===== REJECT (MODAL) ===== */
  const rejectModal = document.getElementById("rejectModal");
  const rejectReasonInput = document.getElementById("rejectReason");
  const cancelRejectBtn = document.getElementById("cancelRejectBtn");
  const confirmRejectBtn = document.getElementById("confirmRejectBtn");

  if (rejectBtn) {
    rejectBtn.onclick = () => {
      rejectReasonInput.value = "";
      rejectModal.style.display = "block";
      rejectReasonInput.focus();
    };
  }

  if (cancelRejectBtn) {
    cancelRejectBtn.onclick = () => {
      rejectModal.style.display = "none";
    };
  }

  if (confirmRejectBtn) {
    confirmRejectBtn.onclick = async () => {
      const reason = rejectReasonInput.value.trim();

      if (!reason) {
        alert("Please enter rejection reason.");
        return;
      }

      await rejectRegistration(id, reason);

      rejectModal.style.display = "none";

      if (statusEl) {
        statusEl.textContent = "REJECTED";
        statusEl.style.color = "red";
      }

      approveBtn.disabled = true;
      rejectBtn.disabled = true;

      alert("Application rejected.\n\nDecision is now locked.");
    };
  }
}

/* =========================
   REJECT API
   ========================= */
async function rejectRegistration(id, reason) {
  const res = await fetch(
    `${API_BASE}/registrations/${id}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    }
  );

  const result = await res.json();
  if (!res.ok) {
    alert(result.error || "Failed to reject application");
    throw new Error("Reject failed");
  }
}

/* =========================
   ADMIN VIEW – FORM + PHOTO
   ========================= */
async function loadStudentFormForAdmin() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const res = await fetch(`${API_BASE}/registrations/${id}`);
  const data = await res.json();

  console.log("Admin viewing registration:", data);

  /* ===== PHOTO ===== */
  const img = document.getElementById("studentPhoto");
  if (img && data.photo) {
    img.src =data.photo;
    img.style.display = "block";
  } else {
    img.style.display = "none";

  }

  /* ===== TEXT BINDING (KEKAL 100%) ===== */
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  };

  setText("test_level", data.test_level);
  setText("registration_number", data.registration_number);
  setText("name_korean", data.korean_name);
  setText("name_english", data.english_name);
  setText("gender", data.gender);
  setText("nationality", data.nationality);
  setText("occupation", data.occupation);

  function formatDOB(dob) {
    if (!dob) return "";
    const d = new Date(dob);
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  setText("dob", formatDOB(data.date_of_birth));
  setText("address", data.address);
  setText("home_phone", data.home_phone);
    const mobileFull = data.mobile_phone
    ? `+${data.calling_code}${data.mobile_phone}`
    : "";
  setText("mobile_phone", mobileFull);
  setText("email", data.email);
  setText("purpose", data.purpose_of_application);
  setText(
    "motive",
    Array.isArray(data.motive_of_application)
      ? data.motive_of_application.join(", ")
      : data.motive_of_application
  );

  /* ===== LOCK FORM (READ-ONLY) ===== */
  document
    .querySelectorAll("input, textarea:not(#rejectReason), select")
    .forEach(el => {
      el.disabled = true;
    });
}

/* =========================
   INIT
   ========================= */
document.addEventListener("DOMContentLoaded", () => {

  if (document.getElementById("tableBody")) {
    loadRegistrations();
  }

  if (
    document.getElementById("approveBtn") ||
    document.getElementById("rejectBtn")
  ) {
    loadRegistrationActions();
  }

  if (document.getElementById("studentPhoto")) {
    loadStudentFormForAdmin();
  }

  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.onclick = () => history.back();
  }
});
