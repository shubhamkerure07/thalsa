/**
 * THALSA Client Application
 * Experience: Student → THALSA → Best possible student-friendly answer
 * Features:
 * - Direct "ASK THALSA" workflow
 * - Exam Mode (2, 5, 8, 10 marks)
 * - Study Mode (interactive tutor flow)
 * - Key Points + Expandable Sources Used
 * - Contextual Follow-Up Actions
 * - Persistent History & Settings
 */

const state = {
  currentView: 'home',
  currentQuestion: '',
  currentAnswer: '',
  currentKeyPoints: [],
  currentSources: [],
  selectedMarks: null,
  isAsking: false,
  isStudyMode: false,
  history: []
};

// DOM Elements
const elements = {
  views: {
    home: document.getElementById('view-home'),
    answer: document.getElementById('view-answer'),
    study: document.getElementById('view-study'),
    history: document.getElementById('view-history'),
    settings: document.getElementById('view-settings')
  },
  navLinks: document.querySelectorAll('.nav-links .nav-item, .mobile-bottom-nav .mobile-nav-btn'),
  navBrand: document.getElementById('nav-brand'),
  questionInput: document.getElementById('main-question-input'),
  submitBtn: document.getElementById('main-submit-btn'),
  markButtons: document.querySelectorAll('.mark-btn'),
  samplePrompts: document.querySelectorAll('.sample-prompt-pill'),
  progressContainer: document.getElementById('progress-container'),
  progressSubStepText: document.getElementById('progress-sub-step-text'),
  // Answer screen elements
  btnBackHome: document.getElementById('btn-back-home'),
  answerModeBadge: document.getElementById('answer-mode-badge'),
  answerQuestionDisplay: document.getElementById('answer-question-display'),
  answerBodyContent: document.getElementById('answer-body-content'),
  btnCopyAnswer: document.getElementById('btn-copy-answer'),
  keyPointsCard: document.getElementById('key-points-card'),
  keyPointsList: document.getElementById('key-points-list'),
  btnToggleSources: document.getElementById('btn-toggle-sources'),
  sourcesSummaryText: document.getElementById('sources-summary-text'),
  sourcesDrawer: document.getElementById('sources-drawer'),
  sourcesListContainer: document.getElementById('sources-list-container'),
  sourcesChevron: document.getElementById('sources-chevron'),
  followUpActionsContainer: document.getElementById('follow-up-actions-container'),
  followUpTextInput: document.getElementById('follow-up-text-input'),
  btnSendFollowUp: document.getElementById('btn-send-follow-up'),
  // Study screen
  studyTopicInput: document.getElementById('study-topic-input'),
  btnStartStudy: document.getElementById('btn-start-study'),
  // History screen
  historyItemsContainer: document.getElementById('history-items-container'),
  btnClearHistoryAll: document.getElementById('btn-clear-history-all'),
  // Settings
  settingGeminiKey: document.getElementById('setting-gemini-key'),
  settingGroqKey: document.getElementById('setting-groq-key'),
  settingCerebrasKey: document.getElementById('setting-cerebras-key'),
  settingOpenaiKey: document.getElementById('setting-openai-key'),
  settingAnthropicKey: document.getElementById('setting-anthropic-key'),
  btnSaveApiKeys: document.getElementById('btn-save-api-keys'),
  btnDangerClearDb: document.getElementById('btn-danger-clear-db'),
  toastContainer: document.getElementById('toast-container')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initRouting();
  initEventListeners();
  fetchHistory();
});

function initRouting() {
  const handleHash = () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    switchView(hash);
  };

  window.addEventListener('hashchange', handleHash);
  if (window.location.hash) {
    handleHash();
  }
}

function switchView(viewName) {
  if (!elements.views[viewName]) {
    viewName = 'home';
  }

  state.currentView = viewName;

  Object.keys(elements.views).forEach((key) => {
    if (elements.views[key]) {
      elements.views[key].classList.toggle('active', key === viewName);
    }
  });

  elements.navLinks.forEach((link) => {
    const target = link.dataset.view;
    link.classList.toggle('active', target === viewName);
  });

  if (viewName === 'history') {
    fetchHistory();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initEventListeners() {
  // Navigation
  elements.navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.view;
      window.location.hash = target;
    });
  });

  if (elements.navBrand) {
    elements.navBrand.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = 'home';
    });
  }

  // Question Input auto-grow and button enable
  elements.questionInput.addEventListener('input', () => {
    const hasText = elements.questionInput.value.trim().length > 0;
    elements.submitBtn.disabled = !hasText || state.isAsking;

    elements.questionInput.style.height = 'auto';
    elements.questionInput.style.height = `${Math.min(elements.questionInput.scrollHeight, 180)}px`;
  });

  elements.questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!elements.submitBtn.disabled) {
        askThalsa(elements.questionInput.value.trim());
      }
    }
  });

  elements.submitBtn.addEventListener('click', () => {
    askThalsa(elements.questionInput.value.trim());
  });

  // Exam Marks Toggle Buttons
  elements.markButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const marks = parseInt(btn.dataset.marks, 10);
      if (state.selectedMarks === marks) {
        state.selectedMarks = null;
        btn.classList.remove('active');
      } else {
        elements.markButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedMarks = marks;
      }
    });
  });

  // Quick Prompt Pills
  elements.samplePrompts.forEach((pill) => {
    pill.addEventListener('click', () => {
      const prompt = pill.dataset.prompt;
      elements.questionInput.value = prompt;
      elements.questionInput.dispatchEvent(new Event('input'));
      elements.questionInput.focus();
    });
  });

  // Answer screen buttons
  if (elements.btnBackHome) {
    elements.btnBackHome.addEventListener('click', () => {
      elements.questionInput.value = '';
      elements.questionInput.dispatchEvent(new Event('input'));
      window.location.hash = 'home';
      setTimeout(() => elements.questionInput.focus(), 100);
    });
  }

  if (elements.btnCopyAnswer) {
    elements.btnCopyAnswer.addEventListener('click', () => {
      if (state.currentAnswer) {
        navigator.clipboard.writeText(state.currentAnswer);
        showToast('Answer copied to clipboard.');
      }
    });
  }

  // Sources Accordion Toggle
  if (elements.btnToggleSources) {
    elements.btnToggleSources.addEventListener('click', () => {
      const isHidden = elements.sourcesDrawer.style.display === 'none';
      elements.sourcesDrawer.style.display = isHidden ? 'block' : 'none';
      elements.sourcesChevron.textContent = isHidden ? '▴' : '▾';
    });
  }

  // Follow-up actions grid (Smart Pills)
  if (elements.followUpActionsContainer) {
    elements.followUpActionsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.smart-action-pill');
      if (!btn) return;
      const actionType = btn.dataset.action;
      handleSmartAction(actionType);
    });
  }

  // Follow-up text submission
  if (elements.btnSendFollowUp) {
    elements.btnSendFollowUp.addEventListener('click', () => {
      const text = elements.followUpTextInput.value.trim();
      if (text) {
        askThalsa(text, { previousContext: state.currentAnswer });
        elements.followUpTextInput.value = '';
      }
    });
  }

  if (elements.followUpTextInput) {
    elements.followUpTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = elements.followUpTextInput.value.trim();
        if (text) {
          askThalsa(text, { previousContext: state.currentAnswer });
          elements.followUpTextInput.value = '';
        }
      }
    });
  }

  // Study Mode trigger
  if (elements.btnStartStudy) {
    elements.btnStartStudy.addEventListener('click', () => {
      const topic = elements.studyTopicInput.value.trim();
      if (!topic) {
        showToast('Please enter a topic to study.', 'danger');
        return;
      }
      askThalsa(topic, { isStudyMode: true });
    });
  }

  // History Clear
  if (elements.btnClearHistoryAll) {
    elements.btnClearHistoryAll.addEventListener('click', async () => {
      if (confirm('Clear all past study history?')) {
        try {
          await fetch('/api/history', { method: 'DELETE' });
          showToast('History cleared.');
          fetchHistory();
        } catch (err) {
          showToast('Error clearing history', 'danger');
        }
      }
    });
  }

  // Settings: Save Keys
  if (elements.btnSaveApiKeys) {
    elements.btnSaveApiKeys.addEventListener('click', async () => {
      const payload = {
        geminiKey: elements.settingGeminiKey?.value.trim() || undefined,
        groqKey: elements.settingGroqKey?.value.trim() || undefined,
        cerebrasKey: elements.settingCerebrasKey?.value.trim() || undefined,
        openaiKey: elements.settingOpenaiKey?.value.trim() || undefined,
        anthropicKey: elements.settingAnthropicKey?.value.trim() || undefined,
      };

      try {
        const res = await fetch('/api/settings/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast('API Keys saved in server memory.');
        } else {
          showToast(data.error || 'Failed to save keys', 'danger');
        }
      } catch (e) {
        showToast('Error connecting to server', 'danger');
      }
    });
  }

  if (elements.btnDangerClearDb) {
    elements.btnDangerClearDb.addEventListener('click', async () => {
      if (confirm('Erase all saved questions and answers?')) {
        try {
          await fetch('/api/history', { method: 'DELETE' });
          showToast('Study database erased.');
          fetchHistory();
        } catch (e) {
          showToast('Error erasing database', 'danger');
        }
      }
    });
  }
}

// Ask THALSA Lifecycle
async function askThalsa(question, options = {}) {
  if (!question || state.isAsking) return;

  state.isAsking = true;
  elements.submitBtn.disabled = true;

  // Show thinking indicator
  elements.progressContainer.style.display = 'block';

  const marks = options.examMarks || state.selectedMarks;
  const isStudy = options.isStudyMode || state.isStudyMode;

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        examMarks: marks,
        isStudyMode: isStudy,
        previousContext: options.previousContext || '',
        mode: options.mode || 'standard'
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    renderStudentAnswer(data, { marks, isStudy });

    // Transition to answer view
    elements.progressContainer.style.display = 'none';
    window.location.hash = 'answer';
    fetchHistory();
  } catch (err) {
    console.error('Ask error:', err);
    showToast(`Error: ${err.message}`, 'danger');
    elements.progressContainer.style.display = 'none';
  } finally {
    state.isAsking = false;
    elements.submitBtn.disabled = elements.questionInput.value.trim().length === 0;
  }
}

// Render student answer view
function renderStudentAnswer(data, context = {}) {
  state.currentQuestion = data.question;
  state.currentAnswer = data.answer;
  state.currentKeyPoints = data.keyPoints || [];
  state.currentSources = data.sourcesUsed || [];

  // Question & Badge
  elements.answerQuestionDisplay.textContent = data.question;
  if (context.marks) {
    elements.answerModeBadge.textContent = `${context.marks} Marks Exam Answer`;
  } else if (context.isStudy) {
    elements.answerModeBadge.textContent = 'Study Tutor Session';
  } else {
    elements.answerModeBadge.textContent = 'Student Explanation';
  }

  // Answer Markdown body
  elements.answerBodyContent.innerHTML = renderMarkdown(data.answer);

  // Key Points
  if (data.keyPoints && data.keyPoints.length > 0) {
    elements.keyPointsCard.style.display = 'block';
    elements.keyPointsList.innerHTML = '';
    data.keyPoints.forEach(pt => {
      const li = document.createElement('li');
      li.textContent = pt;
      elements.keyPointsList.appendChild(li);
    });
  } else {
    elements.keyPointsCard.style.display = 'none';
  }

  // Sources Used Drawer
  const sources = data.sourcesUsed || [];
  if (sources.length > 0) {
    const sourceNames = sources.map(s => s.name).filter((v, i, a) => a.indexOf(v) === i);
    elements.sourcesSummaryText.textContent = `${sourceNames.join(' · ')} · Verified public knowledge`;
    elements.sourcesListContainer.innerHTML = '';

    sources.forEach(s => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${escapeHtml(s.name)}:</strong> <a href="${escapeHtml(s.url || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title || s.name)}</a>`;
      elements.sourcesListContainer.appendChild(li);
    });
  } else {
    elements.sourcesSummaryText.textContent = 'Public Knowledge Base';
    elements.sourcesListContainer.innerHTML = '<li>Authoritative verified open educational resources.</li>';
  }

  // Close sources drawer by default to keep main answer clean
  elements.sourcesDrawer.style.display = 'none';
  elements.sourcesChevron.textContent = '▾';
}

// Contextual Follow-up handlers
function handleSmartAction(actionType) {
  const currentQ = state.currentQuestion || 'this topic';

  if (actionType === 'simpler') {
    askThalsa(`Explain ${currentQ} in much simpler terms with a daily life analogy.`, {
      mode: 'simpler',
      previousContext: state.currentAnswer
    });
  } else if (actionType === 'example') {
    askThalsa(`Give a clear, practical example or solved problem for: ${currentQ}.`, {
      previousContext: state.currentAnswer
    });
  } else if (actionType === '5-mark') {
    askThalsa(`Give me a 5-mark exam answer on: ${currentQ}.`, {
      examMarks: 5,
      previousContext: state.currentAnswer
    });
  } else if (actionType === '8-mark') {
    askThalsa(`Give me an 8-mark exam answer on: ${currentQ}.`, {
      examMarks: 8,
      previousContext: state.currentAnswer
    });
  } else if (actionType === 'step-by-step') {
    askThalsa(`Break down ${currentQ} step-by-step with clear numbered steps.`, {
      previousContext: state.currentAnswer
    });
  } else if (actionType === 'quiz') {
    askThalsa(`Give me 2 short practice questions with answers to test my understanding of: ${currentQ}.`, {
      previousContext: state.currentAnswer
    });
  }
}

// Fetch History
async function fetchHistory() {
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    state.history = data.history || [];
    renderHistoryList(state.history);
  } catch (err) {
    console.warn('Failed to load history:', err);
  }
}

function renderHistoryList(items) {
  if (!elements.historyItemsContainer) return;

  if (items.length === 0) {
    elements.historyItemsContainer.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
        <p style="font-size: 15px; margin-bottom: 6px;">No study history yet.</p>
        <p style="font-size: 13px;">Ask THALSA your first question to save it here for quick exam revision.</p>
      </div>
    `;
    return;
  }

  elements.historyItemsContainer.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div style="flex: 1; min-width: 0;">
        <div class="history-question">${escapeHtml(item.question)}</div>
        <div class="history-meta">
          <span>${formatTime(item.created_at)}</span>
          ${item.mode ? `<span> · ${escapeHtml(item.mode)}</span>` : ''}
        </div>
      </div>
      <button class="history-delete-btn" title="Delete" data-id="${item.id}">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.history-delete-btn')) return;
      loadSavedConversation(item.id);
    });

    const delBtn = card.querySelector('.history-delete-btn');
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await fetch(`/api/history/${item.id}`, { method: 'DELETE' });
        showToast('Item deleted.');
        fetchHistory();
      } catch (err) {
        showToast('Failed to delete item', 'danger');
      }
    });

    elements.historyItemsContainer.appendChild(card);
  });
}

async function loadSavedConversation(id) {
  try {
    const res = await fetch(`/api/history/${id}`);
    if (!res.ok) throw new Error('Could not open item');
    const data = await res.json();
    renderStudentAnswer(data);
    window.location.hash = 'answer';
  } catch (err) {
    showToast(`Error opening item: ${err.message}`, 'danger');
  }
}

// Markdown Formatter
function renderMarkdown(text) {
  if (!text) return '';
  if (typeof marked !== 'undefined') {
    return marked.parse(text, { breaks: true, gfm: true });
  }
  return escapeHtml(text).replace(/\n/g, '<br>');
}

// Toast
function showToast(message, type = 'info') {
  if (!elements.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'danger') {
    toast.style.borderColor = 'rgba(229, 62, 62, 0.4)';
    toast.style.color = '#FEB2B2';
  }
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 2600);
}

function formatTime(dateString) {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

