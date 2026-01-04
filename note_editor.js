// ============================================
// AI-Powered Note Editor - Core JavaScript
// ============================================

// Gemini API Configuration
const API_KEY = 'AIzaSyB0uubDnewamodxhxTLz7WIvhZUTjl5b_4';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

// ============================================
// DOM Elements
// ============================================
const noteTextarea = document.getElementById('note-textarea');
const noteTitleText = document.getElementById('note-title-text');
const noteTitleInput = document.getElementById('note-title-input');
const editTitleBtn = document.getElementById('edit-title-btn');
const lastEditedText = document.getElementById('last-edited-text');
const aiOutputContainer = document.getElementById('ai-output-container');
const aiContentArea = document.getElementById('ai-content-area');
const loadingOverlay = document.getElementById('loading-overlay');
const processBtn = document.getElementById('process-btn');
const copyBtn = document.getElementById('copy-btn');
const regenerateBtn = document.getElementById('regenerate-btn');
const modeChips = document.querySelectorAll('.mode-chip');
const currentModeText = document.getElementById('current-mode-text');
const backBtn = document.getElementById('back-btn');
const tokenCount = document.getElementById('token-count');
const generationTime = document.getElementById('generation-time');
const translateSelect = document.getElementById('translate-language');

// ============================================
// State Management
// ============================================
let currentNote = {
    id: null,
    title: 'Untitled Note',
    content: '',
    aiResponse: '',
    createdAt: null,
    updatedAt: null
};

let currentMode = 'summarize';
let isProcessing = false;
let autoSaveTimer = null;

// ============================================
// AI Mode Prompts
// ============================================
const modePrompts = {
    summarize: (text) => `You are an expert at summarizing notes. Please provide a concise executive summary of the following notes. Include:
- Key points and main ideas
- Any action items or tasks mentioned
- Important dates or deadlines

Format your response in clean HTML with appropriate headings, bullet points, and emphasis. Use these classes for styling:
- For main headings use <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
- For paragraphs use <p class="mb-4">
- For lists use <ul class="list-disc pl-5 space-y-2 mb-4 marker:text-primary">
- For action items, create checkboxes like: <div class="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-[#201c36] border border-gray-200 dark:border-[#3b3267]"><input class="mt-1 rounded border-gray-300 text-primary focus:ring-primary bg-transparent" type="checkbox" /><span class="text-sm">Task text here</span></div>

Notes to summarize:
${text}`,

    expand: (text) => `You are an expert writer. Please expand and elaborate on the following notes with more details, context, and explanations. Make it comprehensive while maintaining clarity.

Format your response in clean HTML with appropriate headings, paragraphs, and emphasis. Use these classes for styling:
- For main headings use <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
- For subheadings use <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
- For paragraphs use <p class="mb-4 text-gray-600 dark:text-[#c4bcdc]">
- For emphasis use <strong> tags

Notes to expand:
${text}`,

    critique: (text) => `You are a constructive critic and mentor. Please review the following notes and provide:
- Strengths of the content
- Areas that could be improved
- Suggestions for better organization
- Missing elements that could be added
- Overall feedback

Be constructive and helpful. Format your response in clean HTML with appropriate sections. Use these classes for styling:
- For main headings use <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
- For positive feedback sections use a green-tinted container
- For improvement suggestions use a yellow-tinted container
- For paragraphs use <p class="mb-4 text-gray-600 dark:text-[#c4bcdc]">

Notes to critique:
${text}`,

    translate: (text, targetLang = 'Arabic') => `You are a professional translator. Please translate the following notes to ${targetLang}. Maintain the meaning, tone, and structure of the original content.

Format your response in clean HTML. Use these classes for styling:
- For the translated content wrapper use <div class="space-y-4">
- For paragraphs use <p class="mb-4 text-gray-600 dark:text-[#c4bcdc]">
- Preserve any lists or structure from the original

Notes to translate:
${text}`
};

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeNote();
    setupEventListeners();
    updateLastEdited();
});

function initializeNote() {
    // Check for noteId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('noteId');

    if (noteId) {
        loadExistingNote(noteId);
    } else {
        // Create new note
        currentNote.id = generateNoteId();
        currentNote.createdAt = new Date().toISOString();
        currentNote.updatedAt = new Date().toISOString();
        noteTextarea.value = '';
        updateTitleDisplay();
    }
}

function loadExistingNote(noteId) {
    const currentUserId = JSON.parse(localStorage.getItem('current_user'));
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === currentUserId);

    if (user && user.notes) {
        const note = user.notes.find(n => n.id === parseInt(noteId));
        if (note) {
            currentNote = { ...note };
            noteTextarea.value = note.content || '';
            updateTitleDisplay();
            updateLastEdited();
            
            // Restore AI response if exists
            if (note.aiResponse) {
                aiContentArea.innerHTML = note.aiResponse;
            }
        }
    }
}

function generateNoteId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Note content auto-save
    noteTextarea.addEventListener('input', debounce(() => {
        currentNote.content = noteTextarea.value;
        currentNote.updatedAt = new Date().toISOString();
        saveNote();
        updateLastEdited();
    }, 1000));

    // Title editing
    editTitleBtn.addEventListener('click', enableTitleEdit);
    noteTitleInput.addEventListener('blur', saveTitleEdit);
    noteTitleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveTitleEdit();
        }
    });

    // Mode chip selection
    modeChips.forEach(chip => {
        chip.addEventListener('click', () => selectMode(chip));
    });

    // Process with AI
    processBtn.addEventListener('click', processWithAI);

    // Copy to clipboard
    copyBtn.addEventListener('click', copyToClipboard);

    // Regenerate
    regenerateBtn.addEventListener('click', processWithAI);

    // Back button
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            saveNote();
            window.location.href = 'dashboard.html';
        });
    }

    // Translate language change
    if (translateSelect) {
        translateSelect.addEventListener('change', () => {
            if (currentMode === 'translate' && currentNote.content) {
                processWithAI();
            }
        });
    }
}

// ============================================
// Title Editing
// ============================================
function updateTitleDisplay() {
    noteTitleText.textContent = currentNote.title || 'Untitled Note';
}

function enableTitleEdit() {
    noteTitleText.classList.add('hidden');
    noteTitleInput.classList.remove('hidden');
    noteTitleInput.value = currentNote.title;
    noteTitleInput.focus();
    noteTitleInput.select();
}

function saveTitleEdit() {
    const newTitle = noteTitleInput.value.trim() || 'Untitled Note';
    currentNote.title = newTitle;
    currentNote.updatedAt = new Date().toISOString();
    
    noteTitleInput.classList.add('hidden');
    noteTitleText.classList.remove('hidden');
    updateTitleDisplay();
    saveNote();
    updateLastEdited();
}

// ============================================
// Mode Selection
// ============================================
function selectMode(selectedChip) {
    // Remove active state from all chips
    modeChips.forEach(chip => {
        chip.classList.remove('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/25');
        chip.classList.add('bg-white', 'dark:bg-border-dark', 'text-gray-600', 'dark:text-gray-300', 'border', 'border-gray-200', 'dark:border-transparent');
    });

    // Add active state to selected chip
    selectedChip.classList.remove('bg-white', 'dark:bg-border-dark', 'text-gray-600', 'dark:text-gray-300', 'border', 'border-gray-200', 'dark:border-transparent');
    selectedChip.classList.add('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/25');

    // Update current mode
    currentMode = selectedChip.dataset.mode;
    currentModeText.textContent = selectedChip.querySelector('span:last-child')?.textContent || 'Summarize';

    // Show/hide translate language selector
    if (translateSelect) {
        translateSelect.parentElement.classList.toggle('hidden', currentMode !== 'translate');
    }
}

// ============================================
// AI Processing
// ============================================
async function processWithAI() {
    const noteContent = noteTextarea.value.trim();
    
    if (!noteContent) {
        showToast('Please enter some notes first!', 'error');
        return;
    }

    if (isProcessing) return;

    isProcessing = true;
    showLoadingState();

    const startTime = performance.now();

    try {
        // Get the appropriate prompt
        let prompt;
        if (currentMode === 'translate') {
            const targetLang = translateSelect?.value || 'Arabic';
            prompt = modePrompts.translate(noteContent, targetLang);
        } else {
            prompt = modePrompts[currentMode](noteContent);
        }

        // Call Gemini API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const aiText = data.candidates[0].content.parts[0].text;
            const endTime = performance.now();
            const timeElapsed = ((endTime - startTime) / 1000).toFixed(1);

            // Update UI with response
            displayAIResponse(aiText);
            updateMetadata(timeElapsed, data.usageMetadata?.candidatesTokenCount || 'N/A');

            // Save AI response to note
            currentNote.aiResponse = aiText;
            currentNote.updatedAt = new Date().toISOString();
            saveNote();
        } else {
            throw new Error('Invalid response format from API');
        }

    } catch (error) {
        console.error('AI Processing Error:', error);
        showToast(`Error: ${error.message}`, 'error');
        displayErrorState(error.message);
    } finally {
        isProcessing = false;
        hideLoadingState();
    }
}

function displayAIResponse(htmlContent) {
    // Clean up any markdown code blocks if present
    let cleanContent = htmlContent
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    aiContentArea.innerHTML = `
        <div class="animate-fade-in-up">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">stars</span>
                AI ${currentModeText.textContent}
            </h2>
            <div class="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-[#c4bcdc] leading-relaxed">
                ${cleanContent}
            </div>
        </div>
    `;
}

function displayErrorState(message) {
    aiContentArea.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center p-8">
            <span class="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Processing Failed</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">${message}</p>
            <button onclick="processWithAI()" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                Try Again
            </button>
        </div>
    `;
}

function updateMetadata(time, tokens) {
    if (generationTime) generationTime.textContent = `Generated in ${time}s`;
    if (tokenCount) tokenCount.textContent = `${tokens} tokens used`;
}

// ============================================
// Loading States
// ============================================
function showLoadingState() {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
    processBtn.disabled = true;
    processBtn.innerHTML = `
        <span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
        <span>Processing...</span>
    `;
}

function hideLoadingState() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
    processBtn.disabled = false;
    processBtn.innerHTML = `
        <span class="material-symbols-outlined text-[20px] group-hover:animate-pulse">motion_photos_auto</span>
        <span>Process with AI</span>
    `;
}

// ============================================
// Copy to Clipboard
// ============================================
async function copyToClipboard() {
    const content = aiContentArea.innerText || aiContentArea.textContent;
    
    if (!content.trim()) {
        showToast('Nothing to copy!', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(content);
        showToast('Copied to clipboard!', 'success');
        
        // Visual feedback
        const originalIcon = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] text-green-500">check</span>';
        setTimeout(() => {
            copyBtn.innerHTML = originalIcon;
        }, 2000);
    } catch (err) {
        showToast('Failed to copy', 'error');
    }
}

// ============================================
// Note Persistence (LocalStorage)
// ============================================
function saveNote() {
    const currentUserId = JSON.parse(localStorage.getItem('current_user'));
    
    if (!currentUserId) {
        // Save without user context for demo purposes
        localStorage.setItem('temp_note', JSON.stringify(currentNote));
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUserId);

    if (userIndex === -1) return;

    // Initialize notes array if not exists
    if (!users[userIndex].notes) {
        users[userIndex].notes = [];
    }

    // Find or create note
    const noteIndex = users[userIndex].notes.findIndex(n => n.id === currentNote.id);
    
    if (noteIndex >= 0) {
        users[userIndex].notes[noteIndex] = { ...currentNote };
    } else {
        users[userIndex].notes.push({ ...currentNote });
    }

    localStorage.setItem('users', JSON.stringify(users));
}

// ============================================
// UI Helpers
// ============================================
function updateLastEdited() {
    if (!lastEditedText) return;

    const now = new Date();
    const updatedAt = new Date(currentNote.updatedAt);
    const diffMs = now - updatedAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeText;
    if (diffMins < 1) {
        timeText = 'Just now';
    } else if (diffMins < 60) {
        timeText = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        timeText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
        timeText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    lastEditedText.textContent = `Last edited ${timeText}`;
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl z-50 transition-all transform translate-y-4 opacity-0 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-gray-800 text-white'
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
    });

    // Remove after delay
    setTimeout(() => {
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// Utility Functions
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update last edited time periodically
setInterval(updateLastEdited, 60000);
