// Get current user ID
const currentUserId = localStorage.getItem("current_user");
console.log(currentUserId);

// Parse the stored object
const users = JSON.parse(localStorage.getItem("users"));

console.log(users);

// Find current user

const currentUserNotes = users.forEach((user) => {
  user.id === currentUserId;
});



// console.log(currentUser);

// if (currentUser) {
//   // Add notes
//   currentUser.notes.push({
//     id: 103,
//     title: "Third note",
//     content: "New note added",
//     createdAt: "2026-01-04",
//     updatedAt: "2026-01-04",
//   });

//   // Save back to localStorage
//   localStorage.setItem("users", JSON.stringify(data));

//   console.log(currentUser.notes);
// } else {
//   console.error("No user found with id:", currentUserId);
// }
