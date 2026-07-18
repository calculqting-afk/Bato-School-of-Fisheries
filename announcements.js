import { db } from "./firebase-config.js";
import {
  collection,
  onSnapshot,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

var FALLBACK_ANNOUNCEMENTS = [
  {
    slug: "enrollment-sy-2026",
    title: "📣 ENROLLMENT IS NOW OPEN! 🌊🎓",
    body: "Be part of the future of fisheries education at Bato School of Fisheries for S.Y. 2026–2027!🐟💙",
    eventDate: "2026-05-07",
    displayDate: "May 7, 2026",
    tag: "Event",
    imageUrl: "Pictures/Enrollment.jpg"
  },
  {
    slug: "sslg-election-2026",
    title: "SSLG Election 2026",
    body: "An event where student leaders present their ideas and vision for the school.",
    eventDate: "2026-02-09",
    displayDate: "February 9, 2026",
    tag: "Election",
    imageUrl: "Pictures/SSLG Campaign.jpg"
  }
];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildAnnounceCard(item) {
  var img = item.imageUrl
    ? '<img src="' + escapeHtml(item.imageUrl) + '" alt="' + escapeHtml(item.title) + '" loading="lazy" decoding="async">'
    : "";

  return (
    '<article class="announce-card reveal-card">' +
      '<div class="announce-img">' +
        img +
        '<span class="announce-tag">' + escapeHtml(item.tag || "News") + '</span>' +
      '</div>' +
      '<div class="announce-body">' +
        '<span class="announce-date">' + escapeHtml(item.displayDate || "") + '</span>' +
        '<h3>' + escapeHtml(item.title || "") + '</h3>' +
        '<p>' + escapeHtml(item.body || "") + '</p>' +
      '</div>' +
    '</article>'
  );
}

function renderAnnouncements(items, grid) {
  if (!grid) return;

  var limit = parseInt(grid.dataset.limit || "0", 10);
  var visibleItems = limit > 0 ? items.slice(0, limit) : items;

  if (!visibleItems.length) {
    grid.innerHTML = '<p class="announce-empty">No announcements at the moment. Check back soon.</p>';
    return;
  }

  grid.innerHTML = visibleItems.map(buildAnnounceCard).join("");
  revealAnnounceCards(grid);
}

function revealAnnounceCards(grid) {
  if (!grid) return;

  grid.querySelectorAll(".reveal-card").forEach(function (el, index) {
    setTimeout(function () {
      el.classList.add("visible");
    }, index * 80);
  });
}

function startAnnouncementsListener() {
  var grid = document.getElementById("announce-grid");
  if (!grid) return;

  var q = query(collection(db, "announcements"), orderBy("eventDate", "desc"));

  onSnapshot(q, function (snapshot) {
    var items = snapshot.empty
      ? FALLBACK_ANNOUNCEMENTS
      : snapshot.docs.map(function (docSnap) {
          return docSnap.data();
        });

    renderAnnouncements(items, grid);
  }, function () {
    renderAnnouncements(FALLBACK_ANNOUNCEMENTS, grid);
  });
}

startAnnouncementsListener();

export { buildAnnounceCard, escapeHtml, FALLBACK_ANNOUNCEMENTS };
