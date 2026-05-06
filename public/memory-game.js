(() => {
  const CAT_IMAGES = [
    { image: "/cats/cat1.jpg", label: "貓咪 1" },
    { image: "/cats/cat2.jpg", label: "貓咪 2" },
    { image: "/cats/cat3.jpg", label: "貓咪 3" },
    { image: "/cats/cat4.jpg", label: "貓咪 4" },
    { image: "/cats/cat5.jpg", label: "貓咪 5" },
    { image: "/cats/cat6.jpg", label: "貓咪 6" },
    { image: "/cats/cat7.jpg", label: "貓咪 7" },
    { image: "/cats/cat8.jpg", label: "貓咪 8" }
  ];

  const GRID_SIZE = 4;
  const TOTAL_CARDS = GRID_SIZE * GRID_SIZE;
  const TOTAL_PAIRS = TOTAL_CARDS / 2;
  const DROP_DURATION_MS = 380;

  const state = {
    round: 1,
    score: 0,
    cards: [],
    openedIds: [],
    locked: false,
    effectById: {},
    droppedById: {},
    removedById: {}
  };
  let clickTransitionTimer = null;

  function shuffle(items) {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function buildRound() {
    const selectedImages = shuffle(CAT_IMAGES).slice(0, Math.min(TOTAL_PAIRS, CAT_IMAGES.length));
    const pairs = Array.from({ length: TOTAL_PAIRS }, (_, idx) => {
      const imageItem = selectedImages[idx % selectedImages.length];
      return [
        {
          id: `${idx}-a`,
          pairId: idx,
          image: imageItem.image,
          label: `${imageItem.label} #${idx + 1}`,
          flipped: false,
          matched: false
        },
        {
          id: `${idx}-b`,
          pairId: idx,
          image: imageItem.image,
          label: `${imageItem.label} #${idx + 1}`,
          flipped: false,
          matched: false
        }
      ];
    }).flat();

    return shuffle(pairs);
  }

  function getCardById(id) {
    return state.cards.find((card) => card.id === id);
  }

  function updateHud() {
    const roundEl = document.getElementById("round-value");
    const scoreEl = document.getElementById("score-value");
    if (roundEl) roundEl.textContent = String(state.round);
    if (scoreEl) scoreEl.textContent = String(state.score);
  }

  function createCardElement(card) {
    if (state.removedById[card.id]) {
      return null;
    }

    const button = document.createElement("button");
    button.type = "button";
    const isClickable = !state.locked && !card.flipped && !card.matched;
    const effectClass = state.effectById[card.id] || "";
    const droppedClass = state.droppedById[card.id] ? "is-drop" : "";
    const clickableClass = isClickable ? "is-clickable" : "";
    button.className = `memory-card ${card.flipped || card.matched ? "is-flipped" : ""} ${effectClass} ${droppedClass} ${clickableClass}`.trim();
    button.setAttribute("aria-label", `翻開${card.label}卡牌`);
    button.dataset.id = card.id;

    button.innerHTML = `
      <span class="memory-card-inner">
        <span class="memory-card-face memory-card-back">
          <span>🐱</span>
        </span>
        <span class="memory-card-face memory-card-front">
          <img src="${card.image}" alt="${card.label}" draggable="false" />
        </span>
      </span>
    `;

    button.addEventListener("click", () => onFlip(card.id));
    return button;
  }

  function renderBoard() {
    const board = document.getElementById("board");
    if (!board) return;

    board.innerHTML = "";
    state.cards.forEach((card) => {
      const cardEl = createCardElement(card);
      if (cardEl) {
        board.appendChild(cardEl);
      }
    });
    updateHud();
  }

  function beginRound() {
    state.cards = buildRound();
    state.openedIds = [];
    state.locked = false;
    state.effectById = {};
    state.droppedById = {};
    state.removedById = {};
    renderBoard();
  }

  function onFlip(id) {
    if (state.locked) return;
    const card = getCardById(id);
    if (!card || card.flipped || card.matched) return;

    card.flipped = true;
    state.openedIds.push(id);
    renderBoard();

    if (state.openedIds.length < 2) return;

    state.locked = true;
    const [firstId, secondId] = state.openedIds;
    const first = getCardById(firstId);
    const second = getCardById(secondId);
    // Matching rule: same source image counts as a valid match,
    // even when cards come from different generated groups.
    const isMatch = first && second && first.image === second.image;

    if (isMatch) {
      if (first) first.matched = true;
      if (second) second.matched = true;
      if (first) state.droppedById[first.id] = true;
      if (second) state.droppedById[second.id] = true;
      state.score += 5;
      state.openedIds = [];
      state.locked = true;
      renderBoard();

      window.setTimeout(() => {
        if (first) {
          state.removedById[first.id] = true;
          delete state.droppedById[first.id];
        }
        if (second) {
          state.removedById[second.id] = true;
          delete state.droppedById[second.id];
        }
        renderBoard();

        const matchedCount = state.cards.filter((item) => item.matched).length;
        if (matchedCount === state.cards.length && state.cards.length > 0) {
          state.locked = true;
          window.setTimeout(() => {
            state.round += 1;
            beginRound();
          }, 950);
        } else {
          state.locked = false;
        }
      }, DROP_DURATION_MS);
      return;
    }

    if (first) state.effectById[first.id] = "is-miss";
    if (second) state.effectById[second.id] = "is-miss";
    renderBoard();
    window.setTimeout(() => {
      if (first) {
        first.flipped = false;
        delete state.effectById[first.id];
      }
      if (second) {
        second.flipped = false;
        delete state.effectById[second.id];
      }
      state.openedIds = [];
      state.locked = false;
      renderBoard();
    }, 360);
  }

  function restart() {
    state.round = 1;
    state.score = 0;
    beginRound();
  }

  function init() {
    const restartBtn = document.getElementById("restart-btn");
    if (restartBtn) {
      restartBtn.addEventListener("click", restart);
    }

    document.addEventListener("pointerdown", () => {
      if (clickTransitionTimer) {
        window.clearTimeout(clickTransitionTimer);
      }
      document.body.classList.remove("is-pointer-down");
      document.body.classList.add("is-click-start");
      clickTransitionTimer = window.setTimeout(() => {
        document.body.classList.remove("is-click-start");
        document.body.classList.add("is-pointer-down");
      }, 70);
    });
    document.addEventListener("pointerup", () => {
      if (clickTransitionTimer) {
        window.clearTimeout(clickTransitionTimer);
        clickTransitionTimer = null;
      }
      document.body.classList.remove("is-click-start");
      document.body.classList.remove("is-pointer-down");
    });
    document.addEventListener("pointercancel", () => {
      if (clickTransitionTimer) {
        window.clearTimeout(clickTransitionTimer);
        clickTransitionTimer = null;
      }
      document.body.classList.remove("is-click-start");
      document.body.classList.remove("is-pointer-down");
    });
    document.addEventListener("pointerleave", () => {
      if (clickTransitionTimer) {
        window.clearTimeout(clickTransitionTimer);
        clickTransitionTimer = null;
      }
      document.body.classList.remove("is-click-start");
      document.body.classList.remove("is-pointer-down");
    });

    beginRound();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
