(function () {
  "use strict";

  /* =========================================================
     DATA — services (edit freely; swap colors for real photos)
  ========================================================= */
  const SERVICES = [
    {
      id: "classic",
      name: "Classic Manicure",
      price: 25,
      duration: 45,
      color: "linear-gradient(135deg,#F4A6C1,#E8547A)",
      label: "CLASSIC\nMANICURE",
      image: "images/classic-manicure.jpg",
    },
    {
      id: "gel",
      name: "Gel Manicure",
      price: 35,
      duration: 60,
      color: "linear-gradient(135deg,#C79EC4,#9A6B9E)",
      label: "GEL\nMANICURE",
      image: "images/gel-manicure.png",
    },
    {
      id: "acrylic",
      name: "Acrylic Full Set",
      price: 50,
      duration: 90,
      color: "linear-gradient(135deg,#F6C9D6,#E894AE)",
      label: "ACRYLIC\nFULL SET",
      image: "images/acrylic.PNG",
    },
    {
      id: "artdesign",
      name: "Nail Art Design",
      price: 15,
      duration: 30,
      color: "linear-gradient(135deg,#D97BA0,#8E5075)",
      label: "NAIL ART\nDESIGN",
      image: "images/nail-art.JPG",
      priceSuffix: "+",
    },
    {
      id: "pedicure",
      name: "Pedicure",
      price: 40,
      duration: 60,
      color: "linear-gradient(135deg,#F7D9C4,#E9A9A0)",
      label: "PEDICURE",
      image: "images/pedicure.jpg",
    },
    {
      id: "spa",
      name: "Damsel Spa Package",
      price: 70,
      duration: 120,
      color: "linear-gradient(135deg,#F0B8C8,#C9648A)",
      label: "Damsel SPA\nPACKAGE",
      image: "images/spa-image.jpg",
    },
  ];

  /* =========================================================
     STATE
  ========================================================= */
  const state = {
    step: 1,
    serviceId: null,
    calMonth: new Date().getMonth(),
    calYear: new Date().getFullYear(),
    selectedDate: null, // Date object
    selectedTime: null,
    form: { fullName: "", phone: "", email: "", notes: "" },
  };

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
            <span class="price">$${s.price}${s.priceSuffix || ""}</span>
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
      thumb.style.backgroundSize = "cover";
      thumb.style.backgroundPosition = "center";
      thumb.textContent = "";
      $("#summaryName").textContent = svc.name;
      $("#summaryPrice").textContent = `$${svc.price}${svc.priceSuffix || ""}`;
      $("#summaryDur").textContent = `🕐 ${svc.duration} min`;
      $("#summaryTotal").textContent = `$${svc.price}${svc.priceSuffix || ""}`;
    } else {
      thumb.style.backgroundImage = "";
      thumb.style.background = "var(--border)";
      thumb.textContent = "No service selected";
      $("#summaryName").textContent = "—";
      $("#summaryPrice").textContent = "";
      $("#summaryDur").textContent = "";
      $("#summaryTotal").textContent = "$0";
    }
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

    updateSummaryContinueLabel();
    $("#summaryBack").disabled = n === 1;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    state.form.notes = $("#notes").value.trim();

    renderConfirmation();
    $("#bookingView").classList.remove("visible");
    $("#confirmView").classList.add("visible");
    $("#stepper").style.display = "none";
    $("#pageTitle").textContent = "Booking Confirmed";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderConfirmation() {
    const svc = getService(state.serviceId);
    const thumb = $("#confirmThumb");
    thumb.style.background = `url(${svc.image}) center/cover no-repeat`;
    $("#confirmName").textContent =
      `${svc.name} — $${svc.price}${svc.priceSuffix || ""}`;
    $("#confirmDate").textContent = formatDate(state.selectedDate);
    $("#confirmTime").textContent = state.selectedTime;
  }

  $("#backHome").addEventListener("click", resetToStart);
  $("#viewAppointments").addEventListener("click", () => {
    alert(
      'This would navigate to "My Appointments" — hook this button up to your appointments view.',
    );
  });

  function resetToStart() {
    state.step = 1;
    state.serviceId = null;
    state.selectedDate = null;
    state.selectedTime = null;
    $("#detailsForm").reset();
    $$(".field").forEach((f) => f.classList.remove("invalid"));

    $("#confirmView").classList.remove("visible");
    $("#bookingView").classList.add("visible");
    $("#stepper").style.display = "flex";
    $("#pageTitle").textContent = "Book Appointment";

    renderServiceGrid();
    renderCalendar();
    renderTimeGrid();
    renderSummary();
    $("#toStep2").disabled = true;
    goToStep(1);
  }

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

  //AI style advisor intergration

  async function aiSummary(event) {
    event.preventDefault();

    const userInput = document.querySelector(".ai-slot").value;
    const suggestionElement = document.getElementById("suggestion");

    suggestionElement.textContent = "Thinking...";

    try {
      const response = await fetch(
        "https://damselnails-booking-app.onrender.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: userInput }),
        },
      );

      const data = await response.json();

      const advice = data.advice.replace(/\*/g, "").split("\n")[0].trim();

      suggestionElement.textContent = advice;

      suggestionElement.textContent = data.advice;
    } catch (error) {
      suggestionElement.textContent =
        "Sorry, I couldn't get a suggestion right now.";
      console.error(error);
    }
  }

  document.getElementById("aiForm").addEventListener("submit", aiSummary);

  /* =========================================================
     INIT
  ========================================================= */
  renderServiceGrid();
  renderCalendar();
  renderTimeGrid();
  renderSummary();
  goToStep(1);
})();
