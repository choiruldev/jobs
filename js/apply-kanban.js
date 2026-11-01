/**
 * Interactive Kanban Board for Job Applications Tracker
 * Drag-and-drop HTML5 Kanban view supporting stages: Saved -> Applied -> Interview -> Offer -> Accepted / Rejected.
 */

import { escapeHtml } from "./bookmark.js?v=20260616z";

export const KANBAN_COLUMNS = [
  { key: "Saved", title: "Disimpan", badgeClass: "kanban-col--saved" },
  { key: "Applied", title: "Dilamar", badgeClass: "kanban-col--applied" },
  { key: "Interview", title: "Interview", badgeClass: "kanban-col--interview" },
  { key: "Offer", title: "Offering", badgeClass: "kanban-col--offer" },
  { key: "Accepted", title: "Diterima", badgeClass: "kanban-col--accepted" },
  { key: "Rejected", title: "Ditolak", badgeClass: "kanban-col--rejected" }
];

/**
 * Render visual Kanban Board HTML
 */
export function renderKanbanBoard(items = []) {
  const columnItems = {};
  KANBAN_COLUMNS.forEach((col) => {
    columnItems[col.key] = [];
  });

  items.forEach((item) => {
    const status = item.application?.status || "Applied";
    if (columnItems[status]) {
      columnItems[status].push(item);
    } else {
      // Default to Applied if custom status
      columnItems["Applied"].push(item);
    }
  });

  return `
    <div class="kanban-board-wrapper">
      <div class="kanban-board" id="kanban-board">
        ${KANBAN_COLUMNS.map((col) => {
          const colCards = columnItems[col.key] || [];
          return `
            <div class="kanban-column ${col.badgeClass}" data-status="${col.key}">
              <div class="kanban-column__header">
                <span class="kanban-column__title">${escapeHtml(col.title)}</span>
                <span class="kanban-column__count">${colCards.length}</span>
              </div>
              <div class="kanban-column__cards" data-dropzone="${col.key}">
                ${colCards.map((item) => renderKanbanCard(item)).join("")}
                ${colCards.length === 0 ? `<div class="kanban-column__empty">Tarik lamaran ke sini</div>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderKanbanCard(item) {
  const job = item.job || {};
  const app = item.application || {};
  const isOverdue = app.followUpAt && new Date(app.followUpAt) <= new Date();

  return `
    <div class="kanban-card" draggable="true" data-job-id="${escapeHtml(job.id)}">
      <div class="kanban-card__header">
        <h3 class="kanban-card__title">${escapeHtml(job.title || "Posisi Lamaran")}</h3>
        <span class="kanban-card__company">${escapeHtml(job.company || "Perusahaan")}</span>
      </div>
      ${job.salary ? `<div class="kanban-card__salary">${escapeHtml(typeof job.salary === 'object' ? job.salary.display : job.salary)}</div>` : ""}
      <div class="kanban-card__footer">
        <span class="kanban-card__location">${escapeHtml(job.location || "Remote")}</span>
        <div class="kanban-card__actions">
          ${isOverdue ? `<span class="badge badge--urgent" title="Waktunya Follow up!">Follow up</span>` : ""}
          <button class="kanban-card__btn" type="button" data-action="open-detail" data-job-id="${escapeHtml(job.id)}">Edit</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Bind HTML5 Drag and Drop events
 */
export function bindKanbanEvents(root, onStatusChange) {
  const cards = root.querySelectorAll(".kanban-card");
  const dropzones = root.querySelectorAll("[data-dropzone]");

  cards.forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card.getAttribute("data-job-id"));
      card.classList.add("kanban-card--dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("kanban-card--dragging");
    });
  });

  dropzones.forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("kanban-column__cards--dragover");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("kanban-column__cards--dragover");
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("kanban-column__cards--dragover");
      const jobId = e.dataTransfer.getData("text/plain");
      const targetStatus = zone.getAttribute("data-dropzone");

      if (jobId && targetStatus && typeof onStatusChange === "function") {
        onStatusChange(jobId, targetStatus);
      }
    });
  });
}
