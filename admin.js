import { auth, db } from "./firebase-config.js";
import { buildAnnounceCard, escapeHtml, FALLBACK_ANNOUNCEMENTS } from "./announcements.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const authLoading = document.getElementById("auth-loading");
const dashboard = document.getElementById("admin-dashboard");
const logoutBtn = document.getElementById("logout-btn");
const adminEmail = document.getElementById("admin-email-display");
const announceList = document.getElementById("announce-list");
const announcePreview = document.getElementById("announce-preview");
const announceForm = document.getElementById("announce-form");
const formTitle = document.getElementById("form-title");
const formSubmitBtn = document.getElementById("form-submit-btn");
const formCancelBtn = document.getElementById("form-cancel-btn");
const addNewBtn = document.getElementById("add-new-btn");
const formError = document.getElementById("form-error");
const toast = document.getElementById("toast");
const fieldEditingId = document.getElementById("field-editing-id");

const fieldTitle = document.getElementById("field-title");
const fieldBody = document.getElementById("field-body");
const fieldDate = document.getElementById("field-date");
const fieldTag = document.getElementById("field-tag");
const fieldImage = document.getElementById("field-image");
const imagePreview = document.getElementById("image-preview");

let unsubscribeAnnouncements = null;
let seedingInProgress = false;
let cleanupInProgress = false;
let announcementsById = {};

function getEditingId() {
  return fieldEditingId.value || null;
}

function setEditingId(id) {
  fieldEditingId.value = id || "";
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () {
    toast.hidden = true;
  }, 2800);
}

function formatDisplayDate(value) {
  if (!value) return "";
  var date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function buildAnnouncementPayload(item, includeCreatedAt) {
  var payload = {
    title: item.title,
    body: item.body,
    tag: item.tag,
    imageUrl: item.imageUrl,
    eventDate: item.eventDate,
    displayDate: item.displayDate,
    updatedAt: serverTimestamp()
  };

  if (item.slug) payload.slug = item.slug;
  if (includeCreatedAt) payload.createdAt = serverTimestamp();

  return payload;
}

function upsertAnnouncement(item, includeCreatedAt) {
  var ref = item.slug
    ? doc(db, "announcements", item.slug)
    : doc(collection(db, "announcements"));

  return setDoc(ref, buildAnnouncementPayload(item, includeCreatedAt), { merge: !includeCreatedAt });
}

function seedDefaultAnnouncements() {
  if (seedingInProgress) return Promise.resolve(0);
  seedingInProgress = true;

  var promises = FALLBACK_ANNOUNCEMENTS.map(function (item) {
    return upsertAnnouncement(item, true);
  });

  return Promise.all(promises)
    .then(function () { return FALLBACK_ANNOUNCEMENTS.length; })
    .finally(function () {
      seedingInProgress = false;
    });
}

function getTimestampSeconds(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return Math.floor(value.toMillis() / 1000);
  if (typeof value.seconds === "number") return value.seconds;
  return 0;
}

function getDuplicateKey(docSnap) {
  var data = docSnap.data();
  return (data.eventDate || "") + "|" + (data.imageUrl || "");
}

function getDocKeepScore(docSnap) {
  var data = docSnap.data();
  var score = getTimestampSeconds(data.updatedAt) || getTimestampSeconds(data.createdAt);

  if (data.slug) score += 1000000000;
  if (FALLBACK_ANNOUNCEMENTS.some(function (item) { return item.slug === docSnap.id; })) {
    score += 1000000000;
  }

  return score;
}

function cleanupDuplicateAnnouncements(snapshot) {
  if (cleanupInProgress || snapshot.empty) return Promise.resolve(0);

  var groups = {};

  snapshot.docs.forEach(function (docSnap) {
    var key = getDuplicateKey(docSnap);
    if (!groups[key]) groups[key] = [];
    groups[key].push(docSnap);
  });

  var docsToDelete = [];

  Object.keys(groups).forEach(function (key) {
    var group = groups[key];
    if (group.length <= 1) return;

    group.sort(function (a, b) {
      return getDocKeepScore(b) - getDocKeepScore(a);
    });

    docsToDelete = docsToDelete.concat(group.slice(1));
  });

  if (!docsToDelete.length) return Promise.resolve(0);

  cleanupInProgress = true;

  return Promise.all(docsToDelete.map(function (docSnap) {
    return deleteDoc(doc(db, "announcements", docSnap.id));
  }))
    .then(function () { return docsToDelete.length; })
    .finally(function () {
      cleanupInProgress = false;
    });
}

function resetForm() {
  setEditingId(null);
  announceForm.reset();
  formTitle.textContent = "Add Announcement";
  formSubmitBtn.textContent = "Save Announcement";
  formCancelBtn.hidden = true;
  formError.hidden = true;
  imagePreview.hidden = true;
  imagePreview.removeAttribute("src");
  highlightEditingItem(null);
  updatePreview();
}

function getFormPreviewData() {
  return {
    title: fieldTitle.value.trim() || "Announcement title",
    body: fieldBody.value.trim() || "Announcement description will appear here.",
    tag: fieldTag.value || "News",
    imageUrl: fieldImage.value.trim(),
    displayDate: fieldDate.value ? formatDisplayDate(fieldDate.value) : "Select a date"
  };
}

function updatePreview() {
  if (!announcePreview) return;
  announcePreview.innerHTML = buildAnnounceCard(getFormPreviewData());
}

function highlightEditingItem(id) {
  announceList.querySelectorAll(".admin-item").forEach(function (item) {
    item.classList.toggle("admin-item--editing", item.dataset.id === id);
  });
}

function fillFormFromAnnouncement(id) {
  var data = announcementsById[id];
  if (!data) return;

  setEditingId(id);
  fieldTitle.value = data.title || "";
  fieldBody.value = data.body || "";
  fieldTag.value = data.tag || "Event";
  fieldImage.value = data.imageUrl || "";
  fieldDate.value = data.eventDate || "";

  if (data.imageUrl) {
    imagePreview.src = data.imageUrl;
    imagePreview.hidden = false;
  } else {
    imagePreview.hidden = true;
    imagePreview.removeAttribute("src");
  }

  formTitle.textContent = "Edit Announcement";
  formSubmitBtn.textContent = "Update Announcement";
  formCancelBtn.hidden = false;
  formError.hidden = true;
  highlightEditingItem(id);
  updatePreview();
}

function renderAnnouncementList(snapshot) {
  announcementsById = {};

  announceList.innerHTML = snapshot.docs.map(function (docSnap) {
    var data = docSnap.data();
    announcementsById[docSnap.id] = data;

    var img = data.imageUrl
      ? '<img class="admin-item-thumb" src="' + escapeHtml(data.imageUrl) + '" alt="" loading="lazy">'
      : '<div class="admin-item-thumb admin-item-thumb--empty">No image</div>';

    var editingClass = getEditingId() === docSnap.id ? " admin-item--editing" : "";

    return (
      '<article class="admin-item' + editingClass + '" data-id="' + docSnap.id + '">' +
        img +
        '<div class="admin-item-content">' +
          '<span class="admin-item-tag">' + escapeHtml(data.tag || "News") + '</span>' +
          '<h3>' + escapeHtml(data.title || "Untitled") + '</h3>' +
          '<p class="admin-item-date">' + escapeHtml(data.displayDate || "") + '</p>' +
          '<p class="admin-item-body">' + escapeHtml(data.body || "") + '</p>' +
        '</div>' +
        '<div class="admin-item-actions">' +
          '<button type="button" class="admin-btn admin-btn--ghost" data-action="edit">Edit</button>' +
          '<button type="button" class="admin-btn admin-btn--danger" data-action="delete">Delete</button>' +
        '</div>' +
      '</article>'
    );
  }).join("");
}

function showDashboard(user) {
  authLoading.classList.add("is-hidden");
  dashboard.classList.remove("is-hidden");
  adminEmail.textContent = user.email;

  if (unsubscribeAnnouncements) unsubscribeAnnouncements();

  var q = query(collection(db, "announcements"), orderBy("eventDate", "desc"));
  unsubscribeAnnouncements = onSnapshot(q, function (snapshot) {
    if (snapshot.empty) {
      announceList.innerHTML = '<p class="admin-empty">Loading website announcements...</p>';
      seedDefaultAnnouncements()
        .then(function (count) {
          if (count) showToast("Website announcements loaded. You can edit them below.");
        })
        .catch(function () {
          announceList.innerHTML = '<p class="admin-empty admin-empty--error">Could not load default announcements. Check your connection and Firestore rules.</p>';
        });
      return;
    }

    cleanupDuplicateAnnouncements(snapshot)
      .then(function (removedCount) {
        if (removedCount) showToast(removedCount + " duplicate announcement(s) removed.");
      });

    renderAnnouncementList(snapshot);
  }, function () {
    announceList.innerHTML = '<p class="admin-empty admin-empty--error">Could not load announcements. Check Firestore setup and security rules.</p>';
  });
}

onAuthStateChanged(auth, function (user) {
  if (user) {
    showDashboard(user);
  } else {
    window.location.replace("login.html");
  }
});

logoutBtn.addEventListener("click", function () {
  signOut(auth).then(function () {
    window.location.replace("login.html");
  });
});

addNewBtn.addEventListener("click", function () {
  resetForm();
  fieldTitle.focus();
});

formCancelBtn.addEventListener("click", resetForm);

[fieldTitle, fieldBody, fieldDate, fieldTag, fieldImage].forEach(function (field) {
  field.addEventListener("input", updatePreview);
});

fieldImage.addEventListener("input", function () {
  var url = fieldImage.value.trim();
  if (!url) {
    imagePreview.hidden = true;
    imagePreview.removeAttribute("src");
    return;
  }
  imagePreview.src = url;
  imagePreview.hidden = false;
});

announceList.addEventListener("click", function (e) {
  var btn = e.target.closest("[data-action]");
  if (!btn) return;

  var item = btn.closest(".admin-item");
  if (!item) return;

  var id = item.dataset.id;
  var action = btn.dataset.action;

  if (action === "delete") {
    if (!window.confirm("Delete this announcement? It will be removed from the website.")) return;

    deleteDoc(doc(db, "announcements", id))
      .then(function () {
        if (getEditingId() === id) resetForm();
        showToast("Announcement deleted.");
      })
      .catch(function () {
        showToast("Could not delete announcement.");
      });
    return;
  }

  if (action === "edit") {
    fillFormFromAnnouncement(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fieldTitle.focus();
  }
});

announceForm.addEventListener("submit", function (e) {
  e.preventDefault();
  formError.hidden = true;

  var title = fieldTitle.value.trim();
  var body = fieldBody.value.trim();
  var eventDate = fieldDate.value;
  var tag = fieldTag.value;
  var imageUrl = fieldImage.value.trim();
  var currentEditingId = getEditingId();

  if (!title || !body || !eventDate) {
    formError.textContent = "Title, description, and date are required.";
    formError.hidden = false;
    return;
  }

  var payload = {
    title: title,
    body: body,
    tag: tag,
    imageUrl: imageUrl,
    eventDate: eventDate,
    displayDate: formatDisplayDate(eventDate),
    updatedAt: serverTimestamp()
  };

  formSubmitBtn.disabled = true;
  formSubmitBtn.textContent = currentEditingId ? "Updating..." : "Saving...";

  var promise = currentEditingId
    ? updateDoc(doc(db, "announcements", currentEditingId), payload)
    : addDoc(collection(db, "announcements"), Object.assign({}, payload, { createdAt: serverTimestamp() }));

  promise
    .then(function () {
      showToast(currentEditingId ? "Announcement updated." : "Announcement added.");
      resetForm();
    })
    .catch(function () {
      formError.textContent = "Could not save announcement. Check your connection and Firestore rules.";
      formError.hidden = false;
    })
    .finally(function () {
      formSubmitBtn.disabled = false;
      formSubmitBtn.textContent = "Save Announcement";
    });
});

updatePreview();
