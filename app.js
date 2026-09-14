(function () {
  "use strict";

  /* =========================================================
     DATA — services
  ========================================================= */
  const SERVICES = [
    {
      id: "classic",
      name: "Classic Manicure",
      price: 25,
      duration: 45,
      image: "images/classic-manicure.jpg",
      description:
        "A tidy, no-fuss shape-and-polish finish for hands that need to look put together fast.",
    },
    {
      id: "gel",
      name: "Gel Manicure",
      price: 35,
      duration: 60,
      image: "images/gel-manicure.jpg",
      description:
        "Long-wearing, high-shine gel color that resists chips for weeks.",
    },
    {
      id: "acrylic",
      name: "Acrylic Full Set",
      price: 50,
      duration: 90,
      image: "images/acrylic.jpg",
      description:
        "A full sculpted set for length and strength, ready for any design.",
    },
    {
      id: "artdesign",
      name: "Nail Art Design",
      price: 15,
      duration: 30,
      image: "images/nail-art.jpg",
      priceSuffix: "+",
      description:
        "Hand-painted detail added to any manicure — from minimal lines to statement art.",
    },
    {
      id: "pedicure",
      name: "Pedicure",
      price: 40,
      duration: 60,
      image: "images/pedicure.jpg",
      description:
        "A relaxing soak, exfoliation and polish to keep feet just as polished as your hands.",
    },
    {
      id: "spa",
      name: "Damsel Spa Package",
      price: 70,
      duration: 120,
      image: "images/spa-image.jpg",
      description:
        "Our signature top-to-toe treatment — manicure, pedicure and a hand-and-foot massage.",
    },
  ];

  const ARTISTS = [
    {
      initials: "AO",
      name: "Ada O.",
      role: "Lead Nail Artist",
      bio: "Specialises in acrylic sculpting and fine-line nail art, with 8+ years behind the table.",
    },
    {
      initials: "TB",
      name: "Tomi B.",
      role: "Gel & Color Specialist",
      bio: "Known for long-lasting gel sets and finding the exact shade you didn't know you wanted.",
    },
    {
      initials: "RF",
      name: "Rita F.",
      role: "Nail Art Designer",
      bio: "Hand-paints custom sets, from minimalist lines to intricate 3D florals.",
    },
    {
      initials: "KE",
      name: "Kemi E.",
      role: "Spa & Pedicure Specialist",
      bio: "Runs our spa treatments — the appointment people book when they need to properly switch off.",
    },
  ];

  const REVIEWS = [
    {
      name: "Ngozi A.",
      rating: 5,
      quote:
        "My acrylics have never lasted this long without lifting. Booking online took two minutes.",
      service: "Acrylic Full Set",
    },
    {
      name: "Bisola K.",
      rating: 5,
      quote:
        "The gel manicure was flawless and the studio itself is so calming.",
      service: "Gel Manicure",
    },
    {
      name: "Funmi O.",
      rating: 4,
      quote:
        "Loved the nail art detail — exactly what I showed in my reference photo.",
      service: "Nail Art Design",
    },
    {
      name: "Zainab M.",
      rating: 5,
      quote:
        "The spa package is worth every minute. I left feeling completely reset.",
      service: "Damsel Spa Package",
    },
  ];

  const GALLERY_IMAGES = [
    "images/3be56728-333c-441c-842c-8994c49f67c9.jpg",
    "images/4b30351b-3f40-49d8-8db4-0d504a9c740d.jpg",
    "images/6a743289-f896-4b31-89c5-e6bf89ea1414.jpg",
    "images/almond red nails.jpg",
    "images/amod pink nails.jpg",
    "images/nail-art.jpg",
    "images/acrylic.jpg",
    "images/spa-image.jpg",
  ];

  const TIMES = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
  ];

  const AI_ADVICE_URL =
    "https://damselnails-booking-app.onrender.com/api/style-advice";

  // Routed through our own backend (not n8n directly) so the browser never
  // has to deal with n8n's CORS/preflight handling — the backend forwards
  // this server-to-server, which browsers don't restrict. Leave empty to
  // disable booking notifications entirely.
  const N8N_BOOKING_WEBHOOK_URL =
    "https://damselnails-booking-app.onrender.com/api/notify-booking";

  const VIEW_TITLES = {
    booking: "Book Appointment",
    confirm: "Booking Confirmed",
    appointments: "My Appointments",
    services: "Our Services",
    artists: "Nail Artists",
    gallery: "Gallery",
    reviews: "Reviews",
    profile: "Profile",
    settings: "Settings",
  };

  /* =========================================================
     LOCAL STORAGE
  ========================================================= */
  const LS_KEYS = {
    bookings: "damsel_bookings",
    profile: "damsel_profile",
    settings: "damsel_settings",
    offerClaimed: "damsel_offer_claimed",
    offerUsed: "damsel_offer_used",
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable (private mode, quota, etc.) — fail silently */
    }
  }

  let bookings = loadJSON(LS_KEYS.bookings, []);
  let profile = loadJSON(LS_KEYS.profile, {
    fullName: "",
    phone: "",
    email: "",
  });
  let settings = loadJSON(LS_KEYS.settings, {
    emailReminders: true,
    smsReminders: false,
  });
  let offerClaimed = loadJSON(LS_KEYS.offerClaimed, false);
  let offerUsed = loadJSON(LS_KEYS.offerUsed, false);

  /* =========================================================
     STATE
  ========================================================= */
  const state = {
    view: "booking",
    step: 1,
    serviceId: null,
    calMonth: new Date().getMonth(),
    calYear: new Date().getFullYear(),
    selectedDate: null, // Date object
    selectedTime: null,
    form: { fullName: "", phone: "", email: "", artist: "", notes: "" },
  };

  /* =========================================================
     HELPERS
  ========================================================= */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function getService(id) {
    return SERVICES.find((s) => s.id === id);
  }

  function formatDate(d) {
    if (!d) return null;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function money(n) {
    return `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
  }

  function discountedPrice(price) {
    return offerClaimed ? Math.round(price * 0.9 * 100) / 100 : price;
  }

  function uid() {
    return "bk_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* =========================================================
     RENDER: service grid (Step 1)
  ========================================================= */
  function renderServiceGrid() {
    const grid = $("#serviceGrid");
    grid.innerHTML = SERVICES.map(
      (s) => `
      <button type="button" class="service-card ${s.id === state.serviceId ? "selected" : ""}"
        data-id="${s.id}" role="listitem" aria-pressed="${s.id === state.serviceId}">
        <span class="check-badge" aria-hidden="true">✓</span>
       <img class="service-img" src="${s.image}" alt="${s.name}">
        <div class="service-body">
          <div class="service-title-row">
            <span class="name">${s.name}</span>
            <span class="price">${money(s.price)}${s.priceSuffix || ""}</span>
          </div>
          <div class="service-meta">🕐 ${s.duration} min</div>
        </div>
      </button>
    `,
    ).join("");

    $$(".service-card", grid).forEach((card) => {
      card.addEventListener("click", () => {
        state.serviceId = card.dataset.id;
        renderServiceGrid();
        renderSummary();
        $("#toStep2").disabled = false;
      });
    });
  }

  /* =========================================================
     RENDER: calendar (Step 2)
  ========================================================= */
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  function renderCalendar() {
    const y = state.calYear,
      m = state.calMonth;
    $("#calTitle").textContent = `${MONTH_NAMES[m]} ${y}`;

    const grid = $("#calGrid");
    const dowRow = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
      .map((d) => `<div class="dow">${d}</div>`)
      .join("");

    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cells = "";
    // leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      cells += `<button class="cal-day disabled" disabled>${daysInPrevMonth - i}</button>`;
    }
    // days of this month
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(y, m, d);
      const isPast = thisDate < today;
      const isToday = thisDate.getTime() === today.getTime();
      const isSelected =
        state.selectedDate &&
        thisDate.getTime() === state.selectedDate.getTime();
      cells += `<button class="cal-day ${isPast ? "disabled" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}"
        data-date="${thisDate.toISOString()}" ${isPast ? "disabled" : ""}
        aria-label="${formatDate(thisDate)}">${d}</button>`;
    }
    // trailing days to fill grid (up to next multiple of 7)
    const totalCells = firstDay + daysInMonth;
    const trailing = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= trailing; d++) {
      cells += `<button class="cal-day disabled" disabled>${d}</button>`;
    }

    grid.innerHTML = dowRow + cells;

    $$(".cal-day:not(.disabled)", grid).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedDate = new Date(btn.dataset.date);
        state.selectedDate.setHours(0, 0, 0, 0);
        renderCalendar();
        renderSummary();
        checkStep2Continue();
      });
    });
  }

  function renderTimeGrid() {
    const grid = $("#timeGrid");
    grid.innerHTML = TIMES.map(
      (t) => `
      <button type="button" class="time-slot ${state.selectedTime === t ? "selected" : ""}" data-time="${t}">${t}</button>
    `,
    ).join("");
    $$(".time-slot", grid).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedTime = btn.dataset.time;
        renderTimeGrid();
        renderSummary();
        checkStep2Continue();
      });
    });
  }

  function checkStep2Continue() {
    const ok = !!(state.selectedDate && state.selectedTime);
    $("#toStep3").disabled = !ok;
    $("#summaryContinue").disabled = state.step === 2 ? !ok : false;
  }

  /* =========================================================
     RENDER: summary panel
  ========================================================= */
  function renderSummary() {
    const svc = getService(state.serviceId);
    const thumb = $("#summaryThumb");
    if (svc) {
      thumb.style.backgroundImage = `url(${svc.image})`;
      thumb.textContent = "";
      const price = discountedPrice(svc.price);
      $("#summaryName").textContent = svc.name;
      $("#summaryPrice").textContent = `${money(price)}${svc.priceSuffix || ""}`;
      $("#summaryDur").textContent = `🕐 ${svc.duration} min`;
      $("#summaryTotal").textContent = `${money(price)}${svc.priceSuffix || ""}`;
      $("#summaryDiscountRow").hidden = !offerClaimed;
    } else {
      thumb.style.backgroundImage = "";
      thumb.textContent = "No service selected";
      $("#summaryName").textContent = "—";
      $("#summaryPrice").textContent = "";
      $("#summaryDur").textContent = "";
      $("#summaryTotal").textContent = "$0";
      $("#summaryDiscountRow").hidden = true;
    }
    $("#summaryArtist").textContent = state.form.artist || "Any Available";
    $("#summaryArtist").classList.toggle("muted", !state.form.artist);
    $("#summaryDate").textContent = state.selectedDate
      ? formatDate(state.selectedDate)
      : "Not selected";
    $("#summaryDate").classList.toggle("muted", !state.selectedDate);
    $("#summaryTime").textContent = state.selectedTime || "Not selected";

    $("#summaryBack").disabled = state.step === 1;
    updateSummaryContinueLabel();
  }

  function updateSummaryContinueLabel() {
    const btn = $("#summaryContinue");
    if (state.step === 1) {
      btn.textContent = "Continue";
      btn.disabled = !state.serviceId;
    } else if (state.step === 2) {
      btn.textContent = "Continue";
      btn.disabled = !(state.selectedDate && state.selectedTime);
    } else if (state.step === 3) {
      btn.textContent = "Confirm Booking";
      btn.disabled = false;
    }
  }

  /* =========================================================
     STEP NAVIGATION
  ========================================================= */
  function goToStep(n) {
    state.step = n;
    $$(".step-panel").forEach((p) => p.classList.remove("visible"));
    $(`#step${n}`).classList.add("visible");

    $$(".step[data-step]").forEach((el) => {
      const s = Number(el.dataset.step);
      el.classList.toggle("active", s === n);
      el.classList.toggle("done", s < n);
    });

    if (n === 3) prefillDetailsFromProfile();

    updateSummaryContinueLabel();
    $("#summaryBack").disabled = n === 1;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prefillDetailsFromProfile() {
    if (!$("#fullName").value && profile.fullName)
      $("#fullName").value = profile.fullName;
    if (!$("#phone").value && profile.phone) $("#phone").value = profile.phone;
    if (!$("#email").value && profile.email) $("#email").value = profile.email;
  }

  function populateArtistSelect() {
    const select = $("#artistSelect");
    ARTISTS.forEach((a) => {
      const opt = document.createElement("option");
      opt.value = a.name;
      opt.textContent = `${a.name} — ${a.role}`;
      select.appendChild(opt);
    });
  }

  $("#artistSelect").addEventListener("change", (e) => {
    state.form.artist = e.target.value;
    renderSummary();
  });

  $("#toStep2").addEventListener("click", () => goToStep(2));
  $("#backTo1").addEventListener("click", () => goToStep(1));
  $("#toStep3").addEventListener("click", () => goToStep(3));
  $("#backTo2").addEventListener("click", () => goToStep(2));

  $("#summaryContinue").addEventListener("click", () => {
    if (state.step === 1 && state.serviceId) goToStep(2);
    else if (state.step === 2 && state.selectedDate && state.selectedTime)
      goToStep(3);
    else if (state.step === 3) submitBooking();
  });
  $("#summaryBack").addEventListener("click", () => {
    if (state.step === 2) goToStep(1);
    else if (state.step === 3) goToStep(2);
  });

  $("#prevMonth").addEventListener("click", () => {
    state.calMonth--;
    if (state.calMonth < 0) {
      state.calMonth = 11;
      state.calYear--;
    }
    renderCalendar();
  });
  $("#nextMonth").addEventListener("click", () => {
    state.calMonth++;
    if (state.calMonth > 11) {
      state.calMonth = 0;
      state.calYear++;
    }
    renderCalendar();
  });

  /* =========================================================
     FORM VALIDATION (Step 3)
  ========================================================= */
  function validateForm() {
    let valid = true;
    const name = $("#fullName").value.trim();
    const phone = $("#phone").value.trim();
    const email = $("#email").value.trim();

    const nameField = $("#fieldName");
    nameField.classList.toggle("invalid", name.length < 2);
    if (name.length < 2) valid = false;

    const phoneField = $("#fieldPhone");
    const phoneOk = /^[+\d][\d\s-]{6,}$/.test(phone);
    phoneField.classList.toggle("invalid", !phoneOk);
    if (!phoneOk) valid = false;

    const emailField = $("#fieldEmail");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    emailField.classList.toggle("invalid", !emailOk);
    if (!emailOk) valid = false;

    return valid;
  }

  ["fullName", "phone", "email"].forEach((id) => {
    $("#" + id).addEventListener("blur", validateForm);
  });

  $("#toConfirm").addEventListener("click", () => submitBooking());

  function submitBooking() {
    if (!validateForm()) {
      const firstInvalid = $(".field.invalid input");
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    state.form.fullName = $("#fullName").value.trim();
    state.form.phone = $("#phone").value.trim();
    state.form.email = $("#email").value.trim();
    state.form.artist = $("#artistSelect").value;
    state.form.notes = $("#notes").value.trim();

    const svc = getService(state.serviceId);
    const total = discountedPrice(svc.price);

    const booking = {
      id: uid(),
      serviceId: svc.id,
      serviceName: svc.name,
      basePrice: svc.price,
      total,
      discountApplied: offerClaimed,
      dateISO: state.selectedDate.toISOString(),
      dateDisplay: formatDate(state.selectedDate),
      time: state.selectedTime,
      artistName: state.form.artist || "Any Available",
      fullName: state.form.fullName,
      phone: state.form.phone,
      email: state.form.email,
      notes: state.form.notes,
      status: "upcoming",
      createdAt: new Date().toISOString(),
    };
    bookings.push(booking);
    saveJSON(LS_KEYS.bookings, bookings);

    profile = {
      fullName: state.form.fullName,
      phone: state.form.phone,
      email: state.form.email,
    };
    saveJSON(LS_KEYS.profile, profile);

    if (offerClaimed) {
      offerClaimed = false;
      offerUsed = true;
      saveJSON(LS_KEYS.offerClaimed, offerClaimed);
      saveJSON(LS_KEYS.offerUsed, offerUsed);
      updateOfferUI();
    }

    notifyBookingWebhook(booking);

    renderConfirmation(booking);
    switchView("confirm");
  }

  function notifyBookingWebhook(booking) {
    if (!N8N_BOOKING_WEBHOOK_URL) return;
    fetch(N8N_BOOKING_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    }).catch((err) => {
      // Non-critical: the booking is already saved locally either way.
      console.error("n8n webhook notification failed", err);
    });
  }

  function renderConfirmation(booking) {
    const svc = getService(booking.serviceId);
    const thumb = $("#confirmThumb");
    thumb.style.background = `url(${svc.image}) center/cover no-repeat`;
    const suffix = svc.priceSuffix && !booking.discountApplied ? svc.priceSuffix : "";
    $("#confirmName").textContent =
      `${booking.serviceName} — ${money(booking.total)}${suffix}` +
      (booking.discountApplied ? " (10% new client discount applied)" : "");
    $("#confirmDate").textContent = booking.dateDisplay;
    $("#confirmTime").textContent = booking.time;
    $("#confirmArtist").textContent = booking.artistName;
  }

  $("#backHome").addEventListener("click", resetToStart);
  $("#viewAppointments").addEventListener("click", () => switchView("appointments"));

  function resetToStart() {
    state.step = 1;
    state.serviceId = null;
    state.selectedDate = null;
    state.selectedTime = null;
    state.form.artist = "";
    $("#detailsForm").reset();
    $$(".field").forEach((f) => f.classList.remove("invalid"));

    renderServiceGrid();
    renderCalendar();
    renderTimeGrid();
    renderSummary();
    $("#toStep2").disabled = true;
    switchView("booking");
    goToStep(1);
  }

  /* =========================================================
     VIEW SWITCHING (sidebar navigation)
  ========================================================= */
  function switchView(view) {
    state.view = view;
    $$(".view").forEach((v) => v.classList.remove("visible"));
    const el = $("#" + view + "View");
    if (el) el.classList.add("visible");

    $("#pageTitle").textContent = VIEW_TITLES[view] || "Damsel Nails";
    $$(".nav-item[data-view]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
    $("#stepper").style.display = view === "booking" ? "flex" : "none";

    if (view === "appointments") renderAppointments();
    if (view === "services") renderServicesCatalog();
    if (view === "artists") renderArtists();
    if (view === "gallery") renderGallery();
    if (view === "reviews") renderReviews();
    if (view === "profile") renderProfileView();
    if (view === "settings") renderSettingsView();

    const sb = $("#sidebar");
    if (sb.classList.contains("open")) {
      sb.classList.remove("open");
      $("#menuToggle").setAttribute("aria-expanded", "false");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $$(".nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view === "booking" && state.view === "confirm") resetToStart();
      else switchView(view);
    });
  });

  /* =========================================================
     MY APPOINTMENTS
  ========================================================= */
  function renderAppointments() {
    const list = $("#appointmentsList");
    if (!bookings.length) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🗓️</div>
          <p>You don't have any appointments yet.</p>
          <button class="btn btn-primary btn-small" id="emptyBookBtn">Book an Appointment</button>
        </div>`;
      $("#emptyBookBtn").addEventListener("click", () => switchView("booking"));
      return;
    }

    const sorted = [...bookings].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    list.innerHTML =
      `<div class="appt-list">` +
      sorted
        .map((b) => {
          const svc = getService(b.serviceId);
          const img = svc ? svc.image : "";
          return `
      <div class="appt-card" data-id="${b.id}">
        <div class="appt-thumb" style="background-image:url('${img}')"></div>
        <div class="appt-info">
          <div class="s-name">${b.serviceName}</div>
          <div class="appt-meta">
            <span>📅 ${b.dateDisplay}</span>
            <span>🕐 ${b.time}</span>
            <span>👤 ${b.artistName || "Any Available"}</span>
            <span>${money(b.total)}</span>
          </div>
        </div>
        <span class="appt-status ${b.status}">${b.status}</span>
        <div class="appt-actions">
          ${b.status === "upcoming" ? `<button class="btn btn-outline btn-small cancel-appt" data-id="${b.id}">Cancel</button>` : ""}
        </div>
      </div>`;
        })
        .join("") +
      `</div>`;

    $$(".cancel-appt", list).forEach((btn) => {
      btn.addEventListener("click", () => {
        const b = bookings.find((x) => x.id === btn.dataset.id);
        if (b) {
          b.status = "cancelled";
          saveJSON(LS_KEYS.bookings, bookings);
          renderAppointments();
        }
      });
    });
  }

  /* =========================================================
     SERVICES CATALOG
  ========================================================= */
  function renderServicesCatalog() {
    const grid = $("#servicesCatalog");
    grid.innerHTML = SERVICES.map(
      (s) => `
      <div class="catalog-card">
        <img src="${s.image}" alt="${s.name}">
        <div class="catalog-body">
          <div class="row"><span class="name">${s.name}</span><span class="price">${money(s.price)}${s.priceSuffix || ""}</span></div>
          <div class="desc">${s.description}</div>
          <div class="meta">🕐 ${s.duration} min</div>
          <button class="btn btn-outline btn-small book-this" data-id="${s.id}">Book This</button>
        </div>
      </div>`,
    ).join("");

    $$(".book-this", grid).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.serviceId = btn.dataset.id;
        switchView("booking");
        renderServiceGrid();
        renderSummary();
        $("#toStep2").disabled = false;
        goToStep(1);
      });
    });
  }

  /* =========================================================
     NAIL ARTISTS
  ========================================================= */
  function renderArtists() {
    $("#artistsGrid").innerHTML = ARTISTS.map(
      (a) => `
      <div class="artist-card">
        <div class="artist-avatar">${a.initials}</div>
        <div class="a-name">${a.name}</div>
        <div class="a-role">${a.role}</div>
        <div class="a-bio">${a.bio}</div>
      </div>`,
    ).join("");
  }

  /* =========================================================
     GALLERY
  ========================================================= */
  function renderGallery() {
    const grid = $("#galleryGrid");
    grid.innerHTML = GALLERY_IMAGES.map(
      (src, i) => `
      <button type="button" class="gallery-item" data-src="${src}">
        <img src="${src}" alt="Nail art example ${i + 1}" loading="lazy">
      </button>`,
    ).join("");

    $$(".gallery-item", grid).forEach((btn) => {
      btn.addEventListener("click", () => openLightbox(btn.dataset.src));
    });
  }

  function openLightbox(src) {
    $("#lightboxImg").src = src;
    $("#lightbox").hidden = false;
  }
  function closeLightbox() {
    $("#lightbox").hidden = true;
    $("#lightboxImg").src = "";
  }
  $("#lightboxClose").addEventListener("click", closeLightbox);
  $("#lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  /* =========================================================
     REVIEWS
  ========================================================= */
  function renderReviews() {
    $("#reviewsList").innerHTML = REVIEWS.map(
      (r) => `
      <div class="review-card">
        <div class="review-top">
          <span class="review-name">${r.name}</span>
          <span class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
        </div>
        <div class="review-quote">"${r.quote}"</div>
        <div class="review-service">${r.service}</div>
      </div>`,
    ).join("");
  }

  /* =========================================================
     PROFILE
  ========================================================= */
  function renderProfileView() {
    $("#profileName").value = profile.fullName || "";
    $("#profilePhone").value = profile.phone || "";
    $("#profileEmail").value = profile.email || "";
    $("#statTotalBookings").textContent = bookings.length;
    $("#statUpcoming").textContent = bookings.filter(
      (b) => b.status === "upcoming",
    ).length;
  }

  $("#profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    profile = {
      fullName: $("#profileName").value.trim(),
      phone: $("#profilePhone").value.trim(),
      email: $("#profileEmail").value.trim(),
    };
    saveJSON(LS_KEYS.profile, profile);
    const note = $("#profileSaveNote");
    note.classList.add("visible");
    setTimeout(() => note.classList.remove("visible"), 2500);
  });

  /* =========================================================
     SETTINGS
  ========================================================= */
  function renderSettingsView() {
    $("#settingEmail").checked = !!settings.emailReminders;
    $("#settingSms").checked = !!settings.smsReminders;
  }

  $("#settingEmail").addEventListener("change", (e) => {
    settings.emailReminders = e.target.checked;
    saveJSON(LS_KEYS.settings, settings);
  });
  $("#settingSms").addEventListener("change", (e) => {
    settings.smsReminders = e.target.checked;
    saveJSON(LS_KEYS.settings, settings);
  });

  $("#clearDataBtn").addEventListener("click", () => {
    if (
      !confirm(
        "This will remove your saved appointments, profile and preferences from this device. Continue?",
      )
    )
      return;
    bookings = [];
    profile = { fullName: "", phone: "", email: "" };
    settings = { emailReminders: true, smsReminders: false };
    offerClaimed = false;
    offerUsed = false;
    saveJSON(LS_KEYS.bookings, bookings);
    saveJSON(LS_KEYS.profile, profile);
    saveJSON(LS_KEYS.settings, settings);
    saveJSON(LS_KEYS.offerClaimed, offerClaimed);
    saveJSON(LS_KEYS.offerUsed, offerUsed);
    updateOfferUI();
    renderAppointments();
    renderProfileView();
    renderSettingsView();
    renderNotifications();
    renderSummary();
  });

  /* =========================================================
     CLAIM OFFER
  ========================================================= */
  function updateOfferUI() {
    const btn = $("#claimOfferBtn");
    if (offerUsed) {
      btn.textContent = "✓ Offer Used";
      btn.disabled = true;
    } else if (offerClaimed) {
      btn.textContent = "✓ Offer Applied";
      btn.disabled = true;
    } else {
      btn.textContent = "Claim Offer";
      btn.disabled = false;
    }
  }

  $("#claimOfferBtn").addEventListener("click", () => {
    if (offerClaimed || offerUsed) return;
    offerClaimed = true;
    saveJSON(LS_KEYS.offerClaimed, offerClaimed);
    updateOfferUI();
    renderSummary();
    renderNotifications();
  });

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */
  function buildNotifications() {
    const notes = [];
    const upcoming = bookings
      .filter((b) => b.status === "upcoming")
      .sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
    if (upcoming[0]) {
      notes.push({
        title: "Upcoming appointment",
        body: `${upcoming[0].serviceName} on ${upcoming[0].dateDisplay} at ${upcoming[0].time}.`,
      });
    }
    if (offerClaimed) {
      notes.push({
        title: "Discount applied",
        body: "Your 10% new client discount is active on your next booking.",
      });
    }
    notes.push({
      title: "Welcome to Damsel Nails",
      body: "Book, manage and track your appointments right here.",
    });
    return notes;
  }

  function renderNotifications() {
    const list = $("#notifList");
    const notes = buildNotifications();
    list.innerHTML = notes.length
      ? notes
          .map(
            (n) =>
              `<div class="notif-item"><span class="n-title">${n.title}</span>${n.body}</div>`,
          )
          .join("")
      : `<div class="notif-empty">No notifications</div>`;
  }

  const notifBtn = $("#notifBtn");
  const notifDropdown = $("#notifDropdown");
  const notifDot = $("#notifDot");

  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasHidden = notifDropdown.hidden;
    notifDropdown.hidden = !wasHidden;
    notifBtn.setAttribute("aria-expanded", String(wasHidden));
    if (wasHidden) {
      renderNotifications();
      notifDot.hidden = true;
    }
  });
  document.addEventListener("click", (e) => {
    if (
      !notifDropdown.hidden &&
      !notifDropdown.contains(e.target) &&
      e.target !== notifBtn
    ) {
      notifDropdown.hidden = true;
      notifBtn.setAttribute("aria-expanded", "false");
    }
  });

  /* =========================================================
     MOBILE NAV TOGGLE
  ========================================================= */
  const sidebar = $("#sidebar");
  const menuToggle = $("#menuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    document.addEventListener("click", (e) => {
      if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        e.target !== menuToggle
      ) {
        sidebar.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* =========================================================
     AI STYLE ADVISOR
  ========================================================= */
  async function aiSummary(event) {
    event.preventDefault();

    const input = $(".ai-slot");
    const userInput = input.value.trim();
    if (!userInput) return;

    const suggestionElement = $("#suggestion");
    const submitBtn = $("#aiSubmit");
    const originalLabel = submitBtn.textContent;

    suggestionElement.classList.remove("error");
    suggestionElement.classList.add("visible");
    suggestionElement.textContent = "Thinking...";
    submitBtn.disabled = true;
    submitBtn.textContent = "…";

    try {
      const response = await fetch(AI_ADVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userInput }),
      });

      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data = await response.json();
      if (!data.advice) throw new Error("No advice returned");

      suggestionElement.textContent = data.advice;
    } catch (error) {
      suggestionElement.classList.add("error");
      suggestionElement.textContent =
        "Sorry, the Style Advisor is temporarily unavailable. Please try again in a moment.";
      console.error(error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  }

  $("#aiForm").addEventListener("submit", aiSummary);

  /* =========================================================
     INIT
  ========================================================= */
  updateOfferUI();
  populateArtistSelect();
  renderServiceGrid();
  renderCalendar();
  renderTimeGrid();
  renderSummary();
  renderNotifications();
  switchView("booking");
  goToStep(1);
})();
