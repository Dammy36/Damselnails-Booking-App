(function () {
  "use strict";

  const SUPABASE_URL = "https://wjdvoxmbxxjenrxdgtqs.supabase.co";
  const SUPABASE_KEY = "sb_publishable_6HSqskUgiSlxsYBw7XfJRQ_2E-mcs1M";
  const SUPABASE_IMAGE_BUCKET = "gallery";
  const SESSION_KEY = "damsel_admin_session";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* =========================================================
     ENTITY CONFIG — one source of truth for all 3 tables
  ========================================================= */
  const ENTITIES = {
    services: {
      table: "services",
      textId: true, // id is a readable slug, generated from name
      title: "Service",
      order: "sort_order.asc",
      listTitle: (r) => r.name,
      listSub: (r) =>
        `₦${Number(r.price).toLocaleString("en-NG")}${r.price_suffix || ""} · ${r.duration} min`,
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "price", label: "Price (₦)", type: "number", required: true },
        { key: "price_suffix", label: "Price suffix (e.g. +)", type: "text" },
        {
          key: "duration",
          label: "Duration (minutes)",
          type: "number",
          required: true,
        },
        {
          key: "image",
          label: "Photo",
          type: "image",
          required: true,
        },
        { key: "description", label: "Description", type: "textarea" },
        { key: "sort_order", label: "Sort order", type: "number" },
      ],
    },
    artists: {
      table: "artists",
      textId: false,
      title: "Nail Artist",
      order: "sort_order.asc",
      listTitle: (r) => r.name,
      listSub: (r) => r.role,
      fields: [
        { key: "initials", label: "Initials (e.g. AO)", type: "text", required: true },
        { key: "name", label: "Name", type: "text", required: true },
        { key: "role", label: "Role", type: "text", required: true },
        { key: "bio", label: "Bio", type: "textarea" },
        { key: "sort_order", label: "Sort order", type: "number" },
      ],
    },
    reviews: {
      table: "reviews",
      textId: false,
      title: "Review",
      order: "sort_order.asc",
      listTitle: (r) => r.name,
      listSub: (r) => `${"★".repeat(r.rating)} · ${r.service || ""}`,
      fields: [
        { key: "name", label: "Client name", type: "text", required: true },
        { key: "rating", label: "Rating (1-5)", type: "number", required: true },
        { key: "quote", label: "Quote", type: "textarea", required: true },
        { key: "service", label: "Service", type: "text" },
        { key: "sort_order", label: "Sort order", type: "number" },
      ],
    },
  };

  /* =========================================================
     SESSION
  ========================================================= */
  function loadSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function saveSession(session) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      /* ignore */
    }
  }
  function clearSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  let session = loadSession();

  /* =========================================================
     SUPABASE HELPERS
  ========================================================= */
  function authHeaders() {
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session ? session.access_token : SUPABASE_KEY}`,
      "Content-Type": "application/json",
    };
  }

  async function login(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "Login failed");
    return data;
  }

  async function fetchRows(entityKey) {
    const entity = ENTITIES[entityKey];
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${entity.table}?select=*&order=${entity.order}`,
      { headers: authHeaders() },
    );
    if (res.status === 401) return handleExpiredSession();
    if (!res.ok) throw new Error(`Failed to load ${entityKey}`);
    return res.json();
  }

  async function createRow(entityKey, data) {
    const entity = ENTITIES[entityKey];
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${entity.table}`, {
      method: "POST",
      headers: { ...authHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    if (res.status === 401) return handleExpiredSession();
    if (!res.ok) throw new Error((await res.json()).message || "Save failed");
    return res.json();
  }

  async function updateRow(entityKey, id, data) {
    const entity = ENTITIES[entityKey];
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${entity.table}?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { ...authHeaders(), Prefer: "return=representation" },
        body: JSON.stringify(data),
      },
    );
    if (res.status === 401) return handleExpiredSession();
    if (!res.ok) throw new Error((await res.json()).message || "Save failed");
    return res.json();
  }

  async function uploadImage(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    const path = `service-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${SUPABASE_IMAGE_BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": file.type,
        },
        body: file,
      },
    );
    if (res.status === 401) return handleExpiredSession();
    if (!res.ok) throw new Error((await res.json()).message || "Photo upload failed");
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_IMAGE_BUCKET}/${path}`;
  }

  async function deleteRow(entityKey, id) {
    const entity = ENTITIES[entityKey];
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${entity.table}?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE", headers: authHeaders() },
    );
    if (res.status === 401) return handleExpiredSession();
    if (!res.ok) throw new Error("Delete failed");
  }

  function handleExpiredSession() {
    clearSession();
    session = null;
    showLogin("Your session expired — please log in again.");
    throw new Error("Session expired");
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  /* =========================================================
     LOGIN / LOGOUT UI
  ========================================================= */
  function showLogin(message) {
    $("#adminDashboard").hidden = true;
    $("#adminLogin").hidden = false;
    const err = $("#loginError");
    if (message) {
      err.textContent = message;
      err.hidden = false;
    } else {
      err.hidden = true;
    }
  }

  function showDashboard() {
    $("#adminLogin").hidden = true;
    $("#adminDashboard").hidden = false;
    loadAllLists();
  }

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;
    const submitBtn = $("#loginSubmit");
    const err = $("#loginError");
    err.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in…";
    try {
      const data = await login(email, password);
      session = { access_token: data.access_token, email };
      saveSession(session);
      showDashboard();
    } catch (error) {
      err.textContent = error.message;
      err.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Log In";
    }
  });

  $("#logoutBtn").addEventListener("click", () => {
    clearSession();
    session = null;
    showLogin();
  });

  /* =========================================================
     TABS
  ========================================================= */
  $$(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".admin-tab").forEach((t) => t.classList.toggle("active", t === tab));
      $$(".admin-panel").forEach((p) =>
        p.classList.toggle("visible", p.id === `tab-${tab.dataset.tab}`),
      );
    });
  });

  /* =========================================================
     LIST RENDERING
  ========================================================= */
  async function loadAllLists() {
    renderList("services");
    renderList("artists");
    renderList("reviews");
  }

  async function renderList(entityKey) {
    const entity = ENTITIES[entityKey];
    const listEl = $(`#${entityKey}List`);
    listEl.innerHTML = `<div class="admin-empty">Loading…</div>`;
    try {
      const rows = await fetchRows(entityKey);
      if (!rows || !rows.length) {
        listEl.innerHTML = `<div class="admin-empty">No ${entityKey} yet. Click "+ New" to add one.</div>`;
        return;
      }
      listEl.innerHTML = rows
        .map(
          (r) => `
        <div class="admin-row" data-id="${r.id}">
          <div class="admin-row-main">
            <div class="r-title">${entity.listTitle(r)}</div>
            <div class="r-sub">${entity.listSub(r)}</div>
          </div>
          <div class="admin-row-actions">
            <button class="btn btn-outline btn-small edit-row" data-entity="${entityKey}" data-id="${r.id}">Edit</button>
          </div>
        </div>`,
        )
        .join("");

      $$(".edit-row", listEl).forEach((btn) => {
        btn.addEventListener("click", () => {
          const row = rows.find((r) => String(r.id) === btn.dataset.id);
          openModal(entityKey, row);
        });
      });
    } catch (err) {
      if (err.message !== "Session expired") {
        listEl.innerHTML = `<div class="admin-empty">Couldn't load ${entityKey}. ${err.message}</div>`;
      }
    }
  }

  /* =========================================================
     MODAL (shared add/edit form)
  ========================================================= */
  const modal = $("#adminModal");
  const modalForm = $("#modalForm");
  const modalNote = $("#modalNote");
  let modalEntityKey = null;
  let modalRow = null;

  function openModal(entityKey, row) {
    modalEntityKey = entityKey;
    modalRow = row || null;
    const entity = ENTITIES[entityKey];

    $("#modalTitle").textContent = row ? `Edit ${entity.title}` : `New ${entity.title}`;
    modalNote.textContent = "";
    modalNote.classList.remove("error");
    $("#modalDelete").style.display = row ? "block" : "none";

    modalForm.innerHTML = entity.fields
      .map((f) => {
        const value = row && row[f.key] != null ? row[f.key] : "";
        if (f.type === "textarea") {
          return `
          <div class="field">
            <label>${f.label}</label>
            <textarea data-key="${f.key}" ${f.required ? "required" : ""}>${escapeHtml(String(value))}</textarea>
          </div>`;
        }
        if (f.type === "image") {
          return `
          <div class="field">
            <label>${f.label}</label>
            ${
              value
                ? `<img src="${escapeHtml(String(value))}" alt="" style="width:100%;max-height:140px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:8px;border:1px solid var(--line)" />`
                : ""
            }
            <input type="file" data-key="${f.key}" data-type="image" accept="image/*" data-existing="${escapeHtml(String(value))}" ${f.required && !value ? "required" : ""} />
            ${value ? `<div style="font-size:11.5px;color:var(--taupe-light);margin-top:4px;">Leave empty to keep the current photo</div>` : ""}
          </div>`;
        }
        return `
        <div class="field">
          <label>${f.label}</label>
          <input type="${f.type}" data-key="${f.key}" value="${escapeHtml(String(value))}" ${f.required ? "required" : ""} />
        </div>`;
      })
      .join("");

    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
    modalEntityKey = null;
    modalRow = null;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  $("#modalCancel").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  modalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const entity = ENTITIES[modalEntityKey];
    const saveBtn = $("#modalSave");
    saveBtn.disabled = true;
    modalNote.textContent = "";
    modalNote.classList.remove("error");

    const data = {};
    try {
      for (const f of entity.fields) {
        const input = modalForm.querySelector(`[data-key="${f.key}"]`);
        if (f.type === "image") {
          const file = input.files[0];
          if (file) {
            saveBtn.textContent = "Uploading photo…";
            data[f.key] = await uploadImage(file);
          } else {
            data[f.key] = input.dataset.existing || null;
          }
          continue;
        }
        const value = input.value.trim();
        if (f.type === "number") {
          data[f.key] = value === "" ? null : Number(value);
        } else {
          data[f.key] = value === "" ? null : value;
        }
      }
    } catch (err) {
      if (err.message !== "Session expired") {
        modalNote.textContent = err.message;
        modalNote.classList.add("error");
      }
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
      return;
    }

    saveBtn.textContent = "Saving…";

    try {
      if (modalRow) {
        await updateRow(modalEntityKey, modalRow.id, data);
      } else {
        if (entity.textId) {
          data.id = slugify(data.name) || `item-${Date.now()}`;
        }
        await createRow(modalEntityKey, data);
      }
      closeModal();
      renderList(modalEntityKey);
    } catch (err) {
      if (err.message !== "Session expired") {
        modalNote.textContent = err.message;
        modalNote.classList.add("error");
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }
  });

  $("#modalDelete").addEventListener("click", async () => {
    if (!modalRow) return;
    if (!confirm(`Delete this ${ENTITIES[modalEntityKey].title.toLowerCase()}? This cannot be undone.`))
      return;
    const deleteBtn = $("#modalDelete");
    deleteBtn.disabled = true;
    try {
      await deleteRow(modalEntityKey, modalRow.id);
      closeModal();
      renderList(modalEntityKey);
    } catch (err) {
      if (err.message !== "Session expired") {
        modalNote.textContent = err.message;
        modalNote.classList.add("error");
      }
    } finally {
      deleteBtn.disabled = false;
    }
  });

  $("#newServiceBtn").addEventListener("click", () => openModal("services", null));
  $("#newArtistBtn").addEventListener("click", () => openModal("artists", null));
  $("#newReviewBtn").addEventListener("click", () => openModal("reviews", null));

  /* =========================================================
     INIT
  ========================================================= */
  if (session && session.access_token) {
    showDashboard();
  } else {
    showLogin();
  }
})();
