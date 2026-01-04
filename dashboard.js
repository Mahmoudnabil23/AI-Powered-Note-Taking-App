const users = JSON.parse(localStorage.getItem("users"));
console.log(users);

const currentUser = users.find((user) => user.id == localStorage.getItem("current_user"));


const notesContainer = document.getElementById("notes");
const noteModal = document.getElementById("noteModal");
const modalNoteTitle = document.getElementById("modalNoteTitle");
const modalNoteContent = document.getElementById("modalNoteContent");
const modalNoteDate = document.getElementById("modalNoteDate");
const closeModal = document.getElementById("closeModal");

// Close modal when clicking the close button or outside the modal
closeModal.addEventListener('click', () => {
    noteModal.classList.add('hidden');
});

noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) {
        noteModal.classList.add('hidden');
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        noteModal.classList.add('hidden');
    }
});

// Function to open modal with note details
function openNoteModal(note) {
    console.log(note);
    modalNoteTitle.textContent = note.title;
    modalNoteContent.innerHTML = note.aiResponse || 'No content available';
    modalNoteDate.textContent = `Created ${timeAgo(note.createdAt)}`;
    noteModal.classList.remove('hidden');
    console.log(modalNoteContent);
}

currentUser.notes.forEach((note, index) => {
    const noteCard = document.createElement("div");
    noteCard.classList.add("note");
    
    noteCard.innerHTML = ` <div class="group flex flex-col gap-3 rounded-xl border border-[#3b3267] bg-[#1e1933] p-5 hover:border-primary/50 hover:bg-[#251f40] hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer relative" data-note-index="${index}">
                    <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="material-symbols-outlined text-[#9b92c9] hover:text-white">more_horiz</span>
                    </div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
                        <span class="text-xs font-bold text-primary tracking-wider uppercase">AI Processed</span>
                    </div>
                    <div class="flex flex-col gap-2 flex-1">
                        <h2 class="text-white text-lg font-bold leading-tight">${note.title}</h2>
                        
                    </div>
                    <div class="flex items-center justify-between mt-2 pt-3 border-t border-[#3b3267]/50">
                        <div class="flex gap-2">
                            <span
                                class="px-2 py-1 rounded bg-[#3b3267]/30 text-[#c2bdf0] text-xs font-medium">#Work</span>
                            <span
                                class="px-2 py-1 rounded bg-[#3b3267]/30 text-[#c2bdf0] text-xs font-medium">#Strategy</span>
                        </div>
                        <span class="text-[#6b6391] text-xs">${timeAgo(note.createdAt)}</span>
                    </div>
                </div>
                `;
    notesContainer.appendChild(noteCard);
    
    // Add click event to the note card
    const card = noteCard.querySelector('[data-note-index]');
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking on the more options button
        if (!e.target.closest('.material-symbols-outlined')) {
            openNoteModal(note);
        }
    });
});

function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);

    const intervals = [
        { label: "y", seconds: 31536000 },
        { label: "mo", seconds: 2592000 },
        { label: "d", seconds: 86400 },
        { label: "h", seconds: 3600 },
        { label: "m", seconds: 60 }
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count}${interval.label} ago`;
        }
    }

    return "just now";
}
