const API_URL = "https://jsonplaceholder.typicode.com/posts";
const MAX_TITLE = 100;

const loadBtn = document.querySelector("#load-btn");
const statusText = document.querySelector("#status");
const form = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");

let notes = [];
let busy = false;

function setStatus(message, type = "") {
  statusText.textContent = message;
  statusText.className = type;
}

function setBusy(isBusy) {
  busy = isBusy;
  loadBtn.disabled = isBusy;
  submitBtn.disabled = isBusy;
  for (const button of document.querySelectorAll(".delete-btn")) {
    button.disabled = isBusy;
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

function render() {
  notesList.textContent = "";

  for (const note of notes) {
    const li = document.createElement("li");

    const title = document.createElement("strong");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.disabled = busy;
    deleteBtn.addEventListener("click", () => deleteNote(note));

    li.append(title, body, deleteBtn);
    notesList.append(li);
  }
}

async function loadNotes() {
  setStatus("Loading notes...", "loading");
  setBusy(true);

  try {
    notes = await request(`${API_URL}?_limit=10`);
    render();

    if (notes.length === 0) {
      setStatus("No notes found.", "empty");
    } else {
      setStatus(`Loaded ${notes.length} notes.`, "success");
    }
  } catch (error) {
    setStatus(`Could not load notes: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (title === "") {
    setStatus("A title is required.", "error");
    return;
  }
  if (title.length > MAX_TITLE) {
    setStatus(`Title must be ${MAX_TITLE} characters or fewer (now ${title.length}).`, "error");
    return;
  }

  setStatus("Saving note...", "loading");
  setBusy(true);

  try {
    const created = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    notes.unshift(created);
    render();
    form.reset();
    // Change your success status call inside createNote to:
    setStatus(`Note created successfully (Status: 201, ID: ${createdNote.id})`, "success");
  } catch (error) {
    setStatus(`Could not create note: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

// Note on simulated API deletions:
// JSONPlaceholder simulates HTTP DELETE requests by returning a 200 OK status 
// response without actually persisting changes on the server. Because the server 
// does not modify its underlying dataset, refreshing the page will reload the 
// original notes list.

async function deleteNote(note) {
  setStatus("Deleting note...", "loading");
  setBusy(true);

  try {
    await request(`${API_URL}/${note.id}`, { method: "DELETE" });
    notes = notes.filter((item) => item !== note);
    render();

    if (notes.length === 0) {
      setStatus("No notes left.", "empty");
    } else {
      setStatus("Note deleted.", "success");
    }
  } catch (error) {
    setStatus(`Could not delete note: ${error.message}`, "error");
  } finally {
    setBusy(false);
  }
}

loadBtn.addEventListener("click", loadNotes);
form.addEventListener("submit", createNote);
setStatus("Click “Load notes” to begin.");