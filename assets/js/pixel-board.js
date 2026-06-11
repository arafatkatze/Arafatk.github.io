document.addEventListener("DOMContentLoaded", function () {
  const GRID_SIZE = 50;
  const STORAGE_KEY = "pixel-board-state";
  const SYNC_URL =
    "https://getpantry.cloud/apiv1/pantry/1fe0a904-31b9-467b-9667-7d46e6ab5773/basket/pixelboard";
  var syncTimeout = null;

  const COLORS = [
    { hex: "#E8A6A6", name: "blush" },
    { hex: "#D4647A", name: "rose" },
    { hex: "#4A4A4A", name: "charcoal" },
    { hex: "#EFEFEF", name: "cloud" },
    { hex: "#B0B0B0", name: "silver" },
    { hex: "#7B6B8D", name: "mauve" },
    { hex: "#E84855", name: "coral" },
    { hex: "#6FEDD6", name: "mint" },
    { hex: "#F4D35E", name: "honey" },
    { hex: "#45B69C", name: "teal" },
    { hex: "#FF6B6B", name: "salmon" },
  ];

  const canvas = document.getElementById("pixel-canvas");
  const ctx = canvas.getContext("2d");
  const swatchContainer = document.getElementById("color-swatches");
  const positionEl = document.getElementById("pixel-position");
  const metaEl = document.getElementById("pixel-meta");
  const countEl = document.getElementById("pixel-count");
  const downloadBtn = document.getElementById("download-board");

  let selectedColor = COLORS[7].hex;
  let grid = [];
  let pixelCount = 0;
  let cellSize = 0;
  let isDrawing = false;
  let drawMode = null; // "draw" or "erase", set on mousedown for consistent drag behavior

  function emptyGrid() {
    return Array.from({ length: GRID_SIZE }, function () {
      return Array.from({ length: GRID_SIZE }, function () {
        return null;
      });
    });
  }

  function loadLocal() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        grid = parsed.grid || [];
        pixelCount = parsed.pixelCount || 0;
      } catch (e) {
        grid = [];
        pixelCount = 0;
      }
    }
    if (!grid.length || grid.length !== GRID_SIZE) {
      grid = emptyGrid();
      pixelCount = 0;
    }
  }

  function initGrid() {
    loadLocal();
    updateCount();

    if (SYNC_URL) {
      fetch(SYNC_URL, { headers: { Accept: "application/json" } })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (data && data.grid && data.grid.length === GRID_SIZE) {
            grid = data.grid;
            pixelCount = data.pixelCount || 0;
            updateCount();
            drawGrid();
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ grid: grid, pixelCount: pixelCount })
            );
          }
        })
        .catch(function () {});
    }
  }

  function saveGrid() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ grid: grid, pixelCount: pixelCount })
    );
    if (SYNC_URL) {
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(function () {
        fetch(SYNC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grid: grid, pixelCount: pixelCount }),
        }).catch(function () {});
      }, 500);
    }
  }

  function sizeCanvas() {
    const wrapper = canvas.parentElement;
    const maxSize = Math.min(wrapper.clientWidth, 700);
    cellSize = Math.floor(maxSize / GRID_SIZE);
    const canvasSize = cellSize * GRID_SIZE;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = canvasSize + "px";
    canvas.style.height = canvasSize + "px";
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const color = grid[y][x];
        if (color) {
          ctx.fillStyle = color;
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        }
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }
  }

  function getGridPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / cellSize);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / cellSize);
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      return { x: x, y: y };
    }
    return null;
  }

  function placePixel(x, y) {
    if (!grid[y][x]) {
      pixelCount++;
    }
    grid[y][x] = selectedColor;
    updateCount();
    drawGrid();
    saveGrid();
  }

  function clearPixel(x, y) {
    if (grid[y][x]) {
      pixelCount = Math.max(0, pixelCount - 1);
      grid[y][x] = null;
      updateCount();
      drawGrid();
      saveGrid();
    }
  }

  function updateCount() {
    countEl.textContent =
      pixelCount + (pixelCount === 1 ? " pixel" : " pixels") + " placed";
  }

  function buildPalette() {
    COLORS.forEach(function (c) {
      var swatch = document.createElement("button");
      swatch.className = "color-swatch";
      swatch.style.backgroundColor = c.hex;
      swatch.title = c.hex;
      swatch.setAttribute("aria-label", "Select color " + c.name);
      if (c.hex === selectedColor) {
        swatch.classList.add("selected");
      }
      swatch.addEventListener("click", function () {
        selectedColor = c.hex;
        document.querySelectorAll(".color-swatch").forEach(function (s) {
          s.classList.remove("selected");
        });
        swatch.classList.add("selected");
      });
      swatchContainer.appendChild(swatch);
    });
  }

  function handleCanvasMouseMove(e) {
    var pos = getGridPos(e);
    if (pos) {
      positionEl.textContent = "(" + pos.x + ", " + pos.y + ")";
      var cellColor = grid[pos.y][pos.x];
      if (cellColor) {
        if (cellColor === selectedColor) {
          metaEl.textContent = "click to clear";
          metaEl.style.color = cellColor;
        } else {
          metaEl.textContent = cellColor;
          metaEl.style.color = cellColor;
        }
      } else {
        metaEl.textContent = "click to place";
        metaEl.style.color = "";
      }
      if (isDrawing) {
        if (drawMode === "erase") {
          clearPixel(pos.x, pos.y);
        } else {
          placePixel(pos.x, pos.y);
        }
      }
    }
  }

  function handleCanvasMouseDown(e) {
    e.preventDefault();
    isDrawing = true;
    var pos = getGridPos(e);
    if (pos) {
      if (grid[pos.y][pos.x] === selectedColor) {
        drawMode = "erase";
        clearPixel(pos.x, pos.y);
      } else {
        drawMode = "draw";
        placePixel(pos.x, pos.y);
      }
    }
  }

  function handleCanvasMouseUp() {
    isDrawing = false;
    drawMode = null;
  }

  function handleCanvasMouseLeave() {
    isDrawing = false;
    drawMode = null;
    positionEl.textContent = "hover to see position";
    metaEl.textContent = "click to place";
    metaEl.style.color = "";
  }

  canvas.addEventListener("mousemove", handleCanvasMouseMove);
  canvas.addEventListener("mousedown", handleCanvasMouseDown);
  canvas.addEventListener("mouseup", handleCanvasMouseUp);
  canvas.addEventListener("mouseleave", handleCanvasMouseLeave);
  document.addEventListener("mouseup", handleCanvasMouseUp);

  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvas.dispatchEvent(mouseEvent);
  });
  canvas.addEventListener("touchmove", function (e) {
    e.preventDefault();
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvas.dispatchEvent(mouseEvent);
  });
  canvas.addEventListener("touchend", function (e) {
    e.preventDefault();
    canvas.dispatchEvent(new MouseEvent("mouseup"));
  });

  function renderBoardImage(cellPx) {
    var exportCanvas = document.createElement("canvas");
    var exportSize = GRID_SIZE * cellPx;
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    var exportCtx = exportCanvas.getContext("2d");

    exportCtx.fillStyle = "#1a1a2e";
    exportCtx.fillRect(0, 0, exportSize, exportSize);

    for (var y = 0; y < GRID_SIZE; y++) {
      for (var x = 0; x < GRID_SIZE; x++) {
        if (grid[y][x]) {
          exportCtx.fillStyle = grid[y][x];
          exportCtx.fillRect(x * cellPx, y * cellPx, cellPx, cellPx);
        }
      }
    }

    return exportCanvas;
  }

  downloadBtn.addEventListener("click", function () {
    var link = document.createElement("a");
    link.download = "pixel-board.png";
    link.href = renderBoardImage(16).toDataURL("image/png");
    link.click();
  });

  // --- Submit board as image (anonymous, via Formspree) ---
  var SUBMIT_URL = "https://formspree.io/f/mqeenowa";
  var submitBtn = document.getElementById("submit-board");
  var submitModal = document.getElementById("pixel-submit-modal");
  var submitCloseBtn = document.getElementById("pixel-submit-close");
  var submitDoneBtn = document.getElementById("pixel-submit-done");
  var submitFormState = document.getElementById("pixel-submit-form-state");
  var submitSuccessState = document.getElementById("pixel-submit-success-state");
  var submitForm = document.getElementById("pixel-submit-form");
  var submitMessage = document.getElementById("pixel-submit-message");
  var submitSendBtn = document.getElementById("pixel-submit-btn");
  var submitError = document.getElementById("pixel-submit-error");
  var previewImg = document.getElementById("pixel-submit-preview-img");
  var previewCaption = document.getElementById("pixel-submit-caption");

  function openSubmitModal() {
    previewImg.src = renderBoardImage(16).toDataURL("image/png");
    previewCaption.textContent =
      pixelCount + (pixelCount === 1 ? " pixel" : " pixels");

    var isEmpty = pixelCount === 0;
    submitSendBtn.disabled = isEmpty;
    submitMessage.disabled = isEmpty;
    if (isEmpty) {
      submitError.textContent =
        "your board is empty — place a few pixels first";
      submitError.style.display = "block";
    } else {
      submitError.style.display = "none";
    }

    submitFormState.style.display = "block";
    submitSuccessState.style.display = "none";
    submitMessage.classList.remove("input-error");
    submitModal.classList.add("open");
    document.body.style.overflow = "hidden";
    if (!isEmpty) {
      submitMessage.focus();
    }
  }

  function closeSubmitModal() {
    submitModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  submitBtn.addEventListener("click", openSubmitModal);
  submitCloseBtn.addEventListener("click", closeSubmitModal);
  submitDoneBtn.addEventListener("click", closeSubmitModal);
  submitModal.addEventListener("click", function (e) {
    if (e.target === submitModal) {
      closeSubmitModal();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && submitModal.classList.contains("open")) {
      closeSubmitModal();
    }
  });

  submitMessage.addEventListener("input", function () {
    submitError.style.display = "none";
    submitMessage.classList.remove("input-error");
  });

  submitForm.addEventListener("submit", function (e) {
    e.preventDefault();

    var message = submitMessage.value.trim();
    if (!message) {
      submitError.textContent = "a message is required — say anything!";
      submitError.style.display = "block";
      submitMessage.classList.add("input-error");
      submitMessage.focus();
      return;
    }

    submitError.style.display = "none";
    submitSendBtn.disabled = true;
    submitSendBtn.textContent = "sending...";

    var formData = new FormData();
    formData.append("_subject", "New Pixelboard submission");
    formData.append("message", message);
    formData.append("pixelsPlaced", pixelCount + " pixels");
    formData.append("boardImage", renderBoardImage(8).toDataURL("image/png"));

    fetch(SUBMIT_URL, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("submit failed");
        }
        submitFormState.style.display = "none";
        submitSuccessState.style.display = "block";
        submitForm.reset();
      })
      .catch(function () {
        submitError.textContent = "something went wrong — please try again";
        submitError.style.display = "block";
      })
      .finally(function () {
        submitSendBtn.disabled = false;
        submitSendBtn.textContent = "send it";
      });
  });

  function createParticles() {
    var container = document.getElementById("pixel-board-app");
    var particleCount = 12;
    for (var i = 0; i < particleCount; i++) {
      var particle = document.createElement("div");
      particle.className = "pixel-particle";
      var size = Math.random() * 6 + 3;
      particle.style.width = size + "px";
      particle.style.height = size + "px";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = Math.random() * 100 + "%";
      particle.style.backgroundColor =
        COLORS[Math.floor(Math.random() * COLORS.length)].hex;
      particle.style.animationDelay = Math.random() * 6 + "s";
      particle.style.animationDuration = 4 + Math.random() * 4 + "s";
      particle.style.opacity = 0.15 + Math.random() * 0.2;
      container.appendChild(particle);
    }
  }

  initGrid();
  buildPalette();
  sizeCanvas();
  drawGrid();
  createParticles();

  window.addEventListener("resize", function () {
    sizeCanvas();
    drawGrid();
  });
});
