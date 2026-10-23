(() => {
  "use strict";

  // В первую очередь используем ролик с проходом назад, а оригинал оставляем
  // запасным источником. Выбор зависит от ориентации окна.
  (function setupResponsiveVideoBackground() {
    const video = document.getElementById("backgroundVideo");
    const source = document.getElementById("backgroundVideoSource");
    const layer = document.getElementById("videoBackground");
    if (!video || !source || !layer) return;

    const portraitScreen = window.matchMedia("(max-aspect-ratio: 3/4)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    video.loop = true;
    let candidates = [];
    let candidateIndex = 0;
    let currentFile = "";
    let currentOrientation = "";

    function loadCandidate(index) {
      if (index >= candidates.length) {
        layer.classList.remove("video-ready");
        layer.classList.add("video-disabled");
        currentFile = "";
        return;
      }
      candidateIndex = index;
      currentFile = candidates[index];
      layer.classList.remove("video-disabled", "video-ready");
      source.src = currentFile;
      video.load();
      const playRequest = video.play();
      if (playRequest && typeof playRequest.catch === "function") playRequest.catch(() => {});
    }

    function selectVideo() {
      if (reducedMotion.matches) {
        video.pause();
        source.removeAttribute("src");
        video.load();
        layer.classList.remove("video-ready");
        layer.classList.add("video-disabled");
        currentFile = "";
        currentOrientation = "";
        candidates = [];
        return;
      }

      const landscape = ["background-landscape-pingpong.mp4", "background-landscape.mp4"];
      const portrait = ["background-portrait-pingpong.mp4", "background-portrait.mp4"];
      const isPortrait = portraitScreen.matches;
      const orientation = isPortrait ? "portrait" : "landscape";
      const preferredFiles = isPortrait ? [...portrait, ...landscape] : [...landscape, ...portrait];
      if (currentOrientation === orientation && currentFile) return;
      currentOrientation = orientation;
      candidates = preferredFiles;
      loadCandidate(0);
    }

    video.addEventListener("loadeddata", () => {
      layer.classList.remove("video-disabled");
      layer.classList.add("video-ready");
    });
    video.addEventListener("error", () => loadCandidate(candidateIndex + 1));
    portraitScreen.addEventListener?.("change", selectVideo);
    reducedMotion.addEventListener?.("change", selectVideo);
    // Поддержка старых браузеров.
    if (!portraitScreen.addEventListener) portraitScreen.addListener(selectVideo);
    if (!reducedMotion.addEventListener) reducedMotion.addListener(selectVideo);
    selectVideo();
  })();

  const screens = [
    document.getElementById("intro"),
    document.getElementById("planner"),
    document.getElementById("bonus"),
    document.getElementById("final"),
    document.getElementById("decline")
  ];
  const intro = screens[0];
  const planner = screens[1];
  const bonus = screens[2];
  const finalScreen = screens[3];
  const decline = screens[4];
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const backBtn = document.getElementById("backBtn");
  const confirmBtn = document.getElementById("confirmBtn");
  const sendBtn = document.getElementById("sendBtn");
  const copyBtn = document.getElementById("copyBtn");
  const editBtn = document.getElementById("editBtn");
  const dateInput = document.getElementById("dateInput");
  const timeInput = document.getElementById("timeInput");
  const noteInput = document.getElementById("noteInput");
  const formError = document.getElementById("formError");
  const bonusBackBtn = document.getElementById("bonusBackBtn");
  const bonusContinueBtn = document.getElementById("bonusContinueBtn");
  const bonusForm = document.getElementById("bonusForm");
  const bonusAnswer = document.getElementById("bonusAnswer");
  const bonusCheckBtn = document.getElementById("bonusCheckBtn");
  const bonusFeedback = document.getElementById("bonusFeedback");
  const bonusResult = document.getElementById("bonusResult");
  const bonusShareBtn = document.getElementById("bonusShareBtn");
  const bonusReveal = document.getElementById("bonusReveal");
  const bonusCanvas = document.getElementById("bonusCanvas");
  const summary = document.getElementById("summary");
  const telegramHint = document.getElementById("telegramHint");
  const copyStatus = document.getElementById("copyStatus");
  const ideaButtons = [...document.querySelectorAll(".date-option")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let selectedIdea = "";
  const fogGlass = document.getElementById("fogGlass");
  const fogLabel = document.querySelector(".fog-label");
  const fogContext = fogGlass?.getContext("2d", { alpha: true });
  const fogPointers = new Map();
  let fogCanvasWidth = 0;
  let fogCanvasHeight = 0;
  let fogCanvasRatio = 1;
  let fogVisible = false;
  let activeScreen = intro;

  function drawFogSurface(width, height) {
    fogContext.clearRect(0, 0, width, height);

    const wash = fogContext.createLinearGradient(0, 0, width, height);
    wash.addColorStop(0, "rgba(238, 218, 241, .60)");
    wash.addColorStop(.48, "rgba(211, 190, 226, .54)");
    wash.addColorStop(1, "rgba(247, 226, 241, .60)");
    fogContext.fillStyle = wash;
    fogContext.fillRect(0, 0, width, height);

    const hazeSpots = [
      [.17, .24, .39, "rgba(255,255,255,.34)"],
      [.77, .68, .43, "rgba(236,214,246,.34)"],
      [.51, .47, .28, "rgba(255,244,251,.17)"]
    ];
    hazeSpots.forEach(([x, y, spread, color]) => {
      const radius = Math.max(width, height) * spread;
      const haze = fogContext.createRadialGradient(width * x, height * y, 0, width * x, height * y, radius);
      haze.addColorStop(0, color);
      haze.addColorStop(1, "rgba(255,255,255,0)");
      fogContext.fillStyle = haze;
      fogContext.fillRect(0, 0, width, height);
    });

    fogContext.save();
    fogContext.globalAlpha = .22;
    for (let i = 0; i < 125; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 1 + Math.random() * 2.5;
      fogContext.fillStyle = i % 3 === 0 ? "#ffffff" : "#f2dff2";
      fogContext.beginPath();
      fogContext.ellipse(x, y, radius * .7, radius * 1.5, 0, 0, Math.PI * 2);
      fogContext.fill();
    }
    fogContext.restore();
  }

  function resizeFogMask(reset = false) {
    if (!fogGlass || !fogContext) return;
    const bounds = fogGlass.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (!reset && fogGlass.width === pixelWidth && fogGlass.height === pixelHeight && fogCanvasRatio === ratio) return;

    let previousCanvas = null;
    if (!reset && fogCanvasWidth && fogCanvasHeight) {
      previousCanvas = document.createElement("canvas");
      previousCanvas.width = fogGlass.width;
      previousCanvas.height = fogGlass.height;
      previousCanvas.getContext("2d")?.drawImage(fogGlass, 0, 0);
    }

    fogGlass.width = pixelWidth;
    fogGlass.height = pixelHeight;
    fogCanvasWidth = width;
    fogCanvasHeight = height;
    fogCanvasRatio = ratio;
    fogContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (previousCanvas) {
      fogContext.drawImage(previousCanvas, 0, 0, previousCanvas.width, previousCanvas.height, 0, 0, width, height);
    } else {
      drawFogSurface(width, height);
    }
  }

  function setFogVisible(visible) {
    const nextVisible = Boolean(visible && fogGlass && fogLabel && fogContext);
    if (nextVisible && !fogVisible) {
      resizeFogMask(true);
      document.body.classList.remove("fog-wiping");
    }
    fogVisible = nextVisible;
    document.body.classList.toggle("fog-active", fogVisible);
    if (fogGlass) fogGlass.setAttribute("aria-hidden", String(!fogVisible));
    if (!fogVisible) {
      fogPointers.clear();
      document.body.classList.remove("fog-wiping");
    }
  }

  function brushRadius() {
    return Math.max(48, Math.min(88, Math.min(window.innerWidth, window.innerHeight) * .11));
  }

  function eraseFogPoint(x, y, radius) {
    fogContext.save();
    fogContext.globalCompositeOperation = "destination-out";
    fogContext.beginPath();
    fogContext.arc(x, y, radius, 0, Math.PI * 2);
    fogContext.fill();
    fogContext.restore();
    document.body.classList.add("fog-wiping");
  }

  function beginFogWipe(pointerId, x, y, pointerType, preventScroll = false) {
    if (!fogVisible) return null;
    const bounds = fogGlass.getBoundingClientRect();
    x -= bounds.left;
    y -= bounds.top;
    const state = { x, y, radius: brushRadius(), preventScroll };
    fogPointers.set(pointerId, state);
    eraseFogPoint(x, y, state.radius);
    return state;
  }

  function continueFogWipe(pointerId, x, y, pointerType) {
    if (!fogVisible) return;
    let state = fogPointers.get(pointerId);
    if (!state && pointerType === "mouse") {
      beginFogWipe(pointerId, x, y, pointerType);
      return;
    }
    if (!state) return;
    const bounds = fogGlass.getBoundingClientRect();
    x -= bounds.left;
    y -= bounds.top;
    const dx = x - state.x;
    const dy = y - state.y;
    if (dx * dx + dy * dy < 25) return;
    fogContext.save();
    fogContext.globalCompositeOperation = "destination-out";
    fogContext.lineWidth = state.radius * 2;
    fogContext.lineCap = "round";
    fogContext.lineJoin = "round";
    fogContext.beginPath();
    fogContext.moveTo(state.x, state.y);
    fogContext.lineTo(x, y);
    fogContext.stroke();
    fogContext.restore();
    state.x = x;
    state.y = y;
  }

  setFogVisible(true);
  window.addEventListener("resize", resizeFogMask, { passive: true });
  if (window.PointerEvent) {
    window.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      beginFogWipe(event.pointerId, event.clientX, event.clientY, event.pointerType);
    }, { passive: true });
    window.addEventListener("pointermove", event => {
      continueFogWipe(event.pointerId, event.clientX, event.clientY, event.pointerType);
    }, { passive: true });
    window.addEventListener("pointerup", event => fogPointers.delete(event.pointerId), { passive: true });
    window.addEventListener("pointercancel", event => fogPointers.delete(event.pointerId), { passive: true });
    window.addEventListener("pointerleave", event => {
      if (event.pointerType === "mouse") fogPointers.delete(event.pointerId);
    }, { passive: true });
  } else {
    window.addEventListener("mousedown", event => {
      if (event.button === 0) beginFogWipe("mouse", event.clientX, event.clientY, "mouse");
    }, { passive: true });
    window.addEventListener("mousemove", event => continueFogWipe("mouse", event.clientX, event.clientY, "mouse"), { passive: true });
    window.addEventListener("mouseup", () => fogPointers.delete("mouse"), { passive: true });
    window.addEventListener("touchstart", event => {
      [...event.changedTouches].forEach(touch => beginFogWipe(touch.identifier, touch.clientX, touch.clientY, "touch", Boolean(event.target.closest?.(".intro-card"))));
    }, { passive: true });
    window.addEventListener("touchmove", event => {
      [...event.changedTouches].forEach(touch => continueFogWipe(touch.identifier, touch.clientX, touch.clientY, "touch"));
      if ([...event.changedTouches].some(touch => fogPointers.get(touch.identifier)?.preventScroll) && event.cancelable) event.preventDefault();
    }, { passive: false });
    window.addEventListener("touchend", event => [...event.changedTouches].forEach(touch => fogPointers.delete(touch.identifier)), { passive: true });
    window.addEventListener("touchcancel", event => [...event.changedTouches].forEach(touch => fogPointers.delete(touch.identifier)), { passive: true });
  }

  function localDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  dateInput.min = localDateString(new Date());

  function showScreen(screen, headingId) {
    activeScreen = screen;
    screens.forEach(item => item.classList.toggle("hidden", item !== screen));
    setFogVisible(screen === intro);
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    if (headingId) document.getElementById(headingId).focus({ preventScroll: true });
  }

  function getPlan() {
    const date = dateInput.value
      ? new Intl.DateTimeFormat("ru-RU", {
          weekday: "long", day: "numeric", month: "long", year: "numeric"
        }).format(new Date(`${dateInput.value}T12:00:00`))
      : "Договоримся вместе";

    return {
      idea: selectedIdea,
      date,
      time: timeInput.value || "Как будет удобно",
      note: noteInput.value.trim()
    };
  }

  function makeMessage(plan = getPlan()) {
    const lines = [
      "Привет! Я с радостью принимаю приглашение 💗",
      `Идея: ${plan.idea}`,
      `День: ${plan.date}`,
      `Время: ${plan.time}`
    ];
    if (plan.note) lines.push(`Ещё от меня: ${plan.note}`);
    lines.push("\nДавай уточним детали 😊");
    return lines.join("\n");
  }

  function addSummaryRow(label, value, wide = false) {
    const row = document.createElement("div");
    row.className = wide ? "summary-row summary-row-wide" : "summary-row";
    const labelElement = document.createElement("span");
    labelElement.className = "summary-label";
    labelElement.textContent = label;
    const valueElement = document.createElement("strong");
    valueElement.className = "summary-value";
    valueElement.textContent = value;
    row.append(labelElement, valueElement);
    summary.append(row);
  }

  function renderSummary() {
    const plan = getPlan();
    summary.replaceChildren();
    addSummaryRow("НАШ ВАРИАНТ", plan.idea);
    addSummaryRow("ДАТА", plan.date);
    addSummaryRow("ВРЕМЯ", plan.time);
    if (plan.note) addSummaryRow("ТВОИ СЛОВА", plan.note, true);
    return plan;
  }

  function makeTelegramUrl(message) {
    const shareUrl = new URL("https://t.me/share/url");
    shareUrl.searchParams.set("url", window.location.href);
    shareUrl.searchParams.set("text", message);
    return shareUrl.toString();
  }

  function updateSelection(button) {
    selectedIdea = button.dataset.idea;
    ideaButtons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    formError.textContent = "";
  }

  yesBtn.addEventListener("click", () => {
    celebrateButton(yesBtn);
    showScreen(planner, "plannerTitle");
  });
  const noButtonPrompts = ["Может, ещё подумаешь?", "Ты уверена?", "Точно-точно?"];
  let noButtonClickCount = 0;
  let noButtonScale = 1;

  function setNoButtonScale(scale) {
    noBtn.style.setProperty("--no-scale", scale.toFixed(2));
  }

  noBtn.addEventListener("pointerenter", () => setNoButtonScale(Math.max(.5, noButtonScale * .88)));
  noBtn.addEventListener("pointerleave", () => setNoButtonScale(noButtonScale));
  noBtn.addEventListener("pointerdown", () => setNoButtonScale(Math.max(.48, noButtonScale * .72)));
  noBtn.addEventListener("pointerup", () => setNoButtonScale(Math.max(.5, noButtonScale * .88)));
  noBtn.addEventListener("pointercancel", () => setNoButtonScale(noButtonScale));
  noBtn.addEventListener("click", () => {
    if (noBtn.disabled) return;

    if (noButtonClickCount < noButtonPrompts.length) {
      noBtn.textContent = noButtonPrompts[noButtonClickCount];
      noButtonClickCount += 1;
      noButtonScale = [.82, .68, .58][noButtonClickCount - 1];
      setNoButtonScale(noButtonScale);
      return;
    }

    noBtn.disabled = true;
    noBtn.textContent = "Ладно, я понял";
    noBtn.classList.add("is-shrinking");
    noButtonScale = .52;
    setNoButtonScale(noButtonScale);
    window.setTimeout(() => showScreen(decline, "declineTitle"), 220);
  });
  backBtn.addEventListener("click", () => showScreen(intro, "introTitle"));
  editBtn.addEventListener("click", () => showScreen(planner, "plannerTitle"));

  ideaButtons.forEach(button => button.addEventListener("click", () => updateSelection(button)));
  [dateInput, timeInput, noteInput].forEach(field => {
    field.addEventListener("input", () => { formError.textContent = ""; });
    field.addEventListener("change", () => { formError.textContent = ""; });
  });

  function drawPixelatedPhoto(image, pixelSize) {
    const context = bonusCanvas.getContext("2d");
    const buffer = drawPixelatedPhoto.buffer || (drawPixelatedPhoto.buffer = document.createElement("canvas"));
    const bufferContext = buffer.getContext("2d");
    if (!context || !bufferContext || !image.naturalWidth) return false;

    const bounds = bonusCanvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    if (bonusCanvas.width !== width || bonusCanvas.height !== height) {
      bonusCanvas.width = width;
      bonusCanvas.height = height;
    }

    const pixelWidth = Math.max(1, Math.ceil(width / pixelSize));
    const pixelHeight = Math.max(1, Math.ceil(height / pixelSize));
    if (buffer.width !== pixelWidth || buffer.height !== pixelHeight) {
      buffer.width = pixelWidth;
      buffer.height = pixelHeight;
    }

    const coverScale = Math.max(pixelWidth / image.naturalWidth, pixelHeight / image.naturalHeight);
    const cropWidth = pixelWidth / coverScale;
    const cropHeight = pixelHeight / coverScale;
    const cropX = (image.naturalWidth - cropWidth) / 2;
    const cropY = (image.naturalHeight - cropHeight) / 2;
    bufferContext.clearRect(0, 0, pixelWidth, pixelHeight);
    bufferContext.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, pixelWidth, pixelHeight);
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = false;
    context.drawImage(buffer, 0, 0, pixelWidth, pixelHeight, 0, 0, width, height);
    return true;
  }

  function showBonusContinue() {
    bonusBackBtn.disabled = false;
    bonusContinueBtn.hidden = false;
    if (!bonus.classList.contains("hidden")) bonusContinueBtn.focus({ preventScroll: true });
  }

  function revealBonusPhoto() {
    const image = new Image();
    image.onload = () => {
      if (reducedMotion.matches) {
        drawPixelatedPhoto(image, 1);
        showBonusContinue();
        return;
      }

      const start = performance.now();
      const duration = 1750;
      function animate(now) {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        drawPixelatedPhoto(image, 30 - 29 * eased);
        if (progress < 1) {
          window.requestAnimationFrame(animate);
        } else {
          showBonusContinue();
        }
      }
      window.requestAnimationFrame(animate);
    };
    image.onerror = () => {
      bonusFeedback.textContent = "Ответ верный! Фото не загрузилось, но к нашему плану всё равно можно перейти.";
      showBonusContinue();
    };
    image.src = "bonus.jpg";
  }

  const wrongBonusMessages = [
    "Не-а 😄 Осталось 2 попытки.",
    "Пока нет! Осталась последняя попытка 🍿"
  ];
  const bonusResultMessage = "Три попытки закончились 😅 А что было в секретном вопросе — останется загадкой 🤫";
  let wrongBonusAttempts = 0;
  let bonusAnswered = false;

  function normalizeBonusAnswer(value) {
    return value
      .trim()
      .toLocaleLowerCase("ru-RU")
      .replace(/ё/g, "е")
      .replace(/[^\p{L}\p{N}]/gu, "");
  }

  bonusForm.addEventListener("submit", event => {
    event.preventDefault();
    if (bonusAnswered) return;

    if (normalizeBonusAnswer(bonusAnswer.value) === "обсессия") {
      bonusAnswered = true;
      bonusAnswer.disabled = true;
      bonusCheckBtn.disabled = true;
      bonusFeedback.classList.remove("is-wrong");
      bonusFeedback.textContent = "Точно, «Обсессия»! 💗";
      bonusReveal.hidden = false;
      bonusBackBtn.disabled = true;
      revealBonusPhoto();
      return;
    }

    wrongBonusAttempts += 1;
    if (wrongBonusAttempts >= 3) {
      bonusAnswered = true;
      bonusForm.hidden = true;
      bonusFeedback.hidden = true;
      bonusResult.hidden = false;
      bonusShareBtn.dataset.shareUrl = makeTelegramUrl(bonusResultMessage);
      bonusShareBtn.focus({ preventScroll: true });
      return;
    }

    bonusFeedback.textContent = wrongBonusMessages[wrongBonusAttempts - 1];
    bonusFeedback.classList.remove("is-wrong");
    bonusAnswer.classList.remove("is-wrong");
    void bonusFeedback.offsetWidth;
    bonusFeedback.classList.add("is-wrong");
    bonusAnswer.classList.add("is-wrong");
    bonusAnswer.select();
    window.setTimeout(() => bonusAnswer.classList.remove("is-wrong"), 360);
  });

  bonusAnswer.addEventListener("input", () => {
    bonusAnswer.classList.remove("is-wrong");
    bonusFeedback.classList.remove("is-wrong");
  });

  bonusBackBtn.addEventListener("click", () => showScreen(planner, "plannerTitle"));

  bonusContinueBtn.addEventListener("click", () => {
    const plan = renderSummary();
    telegramHint.textContent = "Откроется выбор чата — останется нажать «Отправить».";
    copyStatus.textContent = "";
    showScreen(finalScreen, "finalTitle");
    sendBtn.dataset.shareUrl = makeTelegramUrl(makeMessage(plan));
  });

  bonusShareBtn.addEventListener("click", () => {
    window.open(bonusShareBtn.dataset.shareUrl || makeTelegramUrl(bonusResultMessage), "_blank", "noopener,noreferrer");
  });

  confirmBtn.addEventListener("click", () => {
    if (!selectedIdea) {
      formError.textContent = "Выбери, пожалуйста, что тебе больше нравится 💗";
      ideaButtons[0].focus();
      return;
    }
    if (dateInput.value && dateInput.value < dateInput.min) {
      formError.textContent = "Этот день уже прошёл. Выбери другой или оставь поле пустым.";
      dateInput.focus();
      return;
    }

    showScreen(bonus, "bonusTitle");
  });

  sendBtn.addEventListener("click", () => {
    const shareUrl = sendBtn.dataset.shareUrl || makeTelegramUrl(makeMessage());
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  });

  async function copyMessage() {
    const message = makeMessage();
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(message);
      copyStatus.textContent = "Ответ скопирован — можешь отправить его где удобно ♡";
    } catch {
      const temporaryField = document.createElement("textarea");
      temporaryField.value = message;
      temporaryField.setAttribute("readonly", "");
      temporaryField.style.position = "fixed";
      temporaryField.style.opacity = "0";
      document.body.append(temporaryField);
      temporaryField.select();
      const copied = document.execCommand("copy");
      temporaryField.remove();
      copyStatus.textContent = copied
        ? "Ответ скопирован — можешь отправить его где удобно ♡"
        : "Не получилось скопировать автоматически. Попробуй открыть Telegram.";
    }
  }

  copyBtn.addEventListener("click", copyMessage);

  const effectsLayer = document.getElementById("interactionEffects");
  const petalLayer = document.getElementById("petalLayer");
  const butterflyLayer = document.getElementById("butterflyLayer");
  const heartLayer = document.getElementById("floatingHearts");
  const heartSymbols = ["♥", "♡", "❤", "✧"];
  let lastSparkleAt = 0;
  let lastSparkleX = -100;
  let lastSparkleY = -100;
  let lastPointerEffectAt = 0;

  function addParticle(className, x, y, symbol, customProperties = {}) {
    const node = document.createElement("span");
    node.className = className;
    if (symbol) node.textContent = symbol;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    Object.entries(customProperties).forEach(([name, value]) => node.style.setProperty(name, value));
    effectsLayer.append(node);
    const lifetime = Number.parseFloat(customProperties["--life"] || customProperties["--duration"] || "1000");
    window.setTimeout(() => node.remove(), lifetime + 100);
  }

  function sprinkleHearts(x, y, amount = 3) {
    for (let i = 0; i < amount; i++) {
      const lifetime = 700 + Math.random() * 420;
      addParticle("touch-heart", x + (Math.random() - .5) * 28, y + (Math.random() - .5) * 18,
        heartSymbols[Math.floor(Math.random() * heartSymbols.length)], {
          "--size": `${12 + Math.random() * 14}px`,
          "--life": `${lifetime}ms`,
          "--drift": `${Math.round((Math.random() - .5) * 78)}px`,
          "--rise": `${-(65 + Math.random() * 85)}px`,
          "--rotate": `${Math.round((Math.random() - .5) * 75)}deg`
        });
    }
  }

  function burst(x, y, amount = 28) {
    const palette = ["#ffe0f7", "#ffc0ec", "#e9c7ff", "#ffffff", "#f7a9d9"];
    for (let i = 0; i < amount; i++) {
      const angle = Math.PI * 2 * i / amount + (Math.random() - .5) * .32;
      const distance = 45 + Math.random() * 100;
      const duration = 620 + Math.random() * 450;
      addParticle("heart-burst-particle", x, y, heartSymbols[Math.floor(Math.random() * heartSymbols.length)], {
        "--dx": `${Math.cos(angle) * distance}px`,
        "--dy": `${Math.sin(angle) * distance}px`,
        "--duration": `${duration}ms`,
        "--size": `${11 + Math.random() * 14}px`,
        "--particle-color": palette[Math.floor(Math.random() * palette.length)],
        "--spin": `${Math.round((Math.random() - .5) * 330)}deg`
      });
    }
  }

  function celebrateButton(button) {
    if (Date.now() - lastPointerEffectAt < 450) return;
    const rect = button.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 28);
  }

  window.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse" || reducedMotion.matches) return;
    const now = performance.now();
    const dx = event.clientX - lastSparkleX;
    const dy = event.clientY - lastSparkleY;
    if (now - lastSparkleAt < 68 || dx * dx + dy * dy < 190) return;
    lastSparkleAt = now;
    lastSparkleX = event.clientX;
    lastSparkleY = event.clientY;
    const activeSparkles = effectsLayer.querySelectorAll(".cursor-sparkle").length;
    if (activeSparkles < 14) {
      addParticle("cursor-sparkle", event.clientX, event.clientY, "", { "--size": `${5 + Math.random() * 7}px`, "--life": "650ms" });
    }
  }, { passive: true });

  window.addEventListener("pointerdown", event => {
    if (reducedMotion.matches || (event.pointerType === "mouse" && event.button !== 0)) return;
    lastPointerEffectAt = Date.now();
    sprinkleHearts(event.clientX, event.clientY, event.pointerType === "mouse" ? 2 : 3);
    const primaryButton = event.target.closest(".button-yes");
    if (primaryButton) burst(event.clientX, event.clientY, 24);
  }, { passive: true });

  function addFloatingHeart() {
    if (!heartLayer || heartLayer.childElementCount >= 7) return;
    const heart = document.createElement("span");
    heart.className = "float-heart";
    heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.fontSize = `${12 + Math.random() * 17}px`;
    heart.style.setProperty("--duration", `${8 + Math.random() * 4}s`);
    heartLayer.append(heart);
    window.setTimeout(() => heart.remove(), 13000);
  }

  function addPetal() {
    if (!petalLayer || petalLayer.childElementCount >= 14 || reducedMotion.matches) return;
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.width = `${9 + Math.random() * 7}px`;
    petal.style.height = `${14 + Math.random() * 10}px`;
    petal.style.setProperty("--rotation", `${Math.round(Math.random() * 360)}deg`);
    const duration = 10 + Math.random() * 6;
    petal.style.setProperty("--duration", `${duration}s`);
    petal.style.animationDelay = `${Math.random() * 1.2}s`;
    petalLayer.append(petal);
    window.setTimeout(() => petal.remove(), (duration + 1.5) * 1000);
  }

  function addButterfly() {
    if (!butterflyLayer || butterflyLayer.childElementCount >= 4 || reducedMotion.matches) return;
    const wrap = document.createElement("div");
    wrap.className = "butterfly";
    const id = `w${Math.random().toString(36).slice(2, 9)}`;
    wrap.innerHTML = `<svg viewBox="0 0 100 82" role="presentation" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="${id}a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0ff"/><stop offset=".42" stop-color="#e9a7ed"/><stop offset="1" stop-color="#9e69d5"/></linearGradient><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe9f7"/><stop offset=".5" stop-color="#d99be8"/><stop offset="1" stop-color="#a36dd2"/></linearGradient></defs>
      <g class="wing-left"><path d="M49 39C39 15 18 2 8 15-1 28 12 49 39 52 17 55 18 75 31 76 43 76 49 57 50 44Z" fill="url(#${id}a)" stroke="#b985c8" stroke-width="1.5"/><g fill="none" stroke="#fff8ff" stroke-width="1.2" opacity=".85"><path d="M47 42Q25 25 11 17M43 47Q24 44 13 32M39 53Q28 64 31 73M31 34Q25 20 20 15"/><path d="M24 20Q16 23 15 29M29 43Q20 43 18 39"/></g><circle cx="20" cy="24" r="2" fill="#fff" opacity=".9"/></g>
      <g class="wing-right"><path d="M51 39C61 15 82 2 92 15c9 13-4 34-31 37 22 3 21 23 8 24-12 0-18-19-19-32Z" fill="url(#${id}b)" stroke="#b985c8" stroke-width="1.5"/><g fill="none" stroke="#fff8ff" stroke-width="1.2" opacity=".85"><path d="M53 42Q75 25 89 17M57 47Q76 44 87 32M61 53Q72 64 69 73M69 34Q75 20 80 15"/><path d="M76 20Q84 23 85 29M71 43Q80 43 82 39"/></g><circle cx="80" cy="24" r="2" fill="#fff" opacity=".9"/></g>
      <ellipse cx="50" cy="46" rx="3.1" ry="12" fill="#684477"/><path d="M49 36Q42 25 38 29M51 36Q58 25 62 29" fill="none" stroke="#684477" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`;
    wrap.style.left = `${8 + Math.random() * 82}%`;
    wrap.style.top = `${71 + Math.random() * 23}%`;
    wrap.style.setProperty("--duration", `${15 + Math.random() * 7}s`);
    wrap.style.animationDelay = `${Math.random() * 1.2}s`;
    butterflyLayer.append(wrap);
    window.setTimeout(() => wrap.remove(), 24000);
  }

  if (!reducedMotion.matches) {
    for (let i = 0; i < 5; i++) window.setTimeout(addPetal, i * 260);
    for (let i = 0; i < 2; i++) window.setTimeout(addButterfly, i * 900);
    window.setInterval(addPetal, 920);
    window.setInterval(addButterfly, 6400);
    window.setInterval(addFloatingHeart, 2100);
  }
})();
