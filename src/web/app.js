import Papa from "papaparse";

const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const fileName = document.querySelector("#file-name");
const fileSize = document.querySelector("#file-size");
const fileDetails = document.querySelector("#file-details");
const importOptions = document.querySelector("#import-options");
const parseButton = document.querySelector("#parse-button");
const clearButton = document.querySelector("#clear-button");
const notice = document.querySelector("#notice");
const emptyState = document.querySelector("#empty-state");
const previewSection = document.querySelector("#preview-section");
const resultsPanel = document.querySelector("#results-panel");
const resultSummary = document.querySelector("#result-summary");
const tableHead = document.querySelector("#csv-head");
const tableBody = document.querySelector("#csv-body");

let selectedFile = null;
let headers = [];
let records = [];
let sortColumn = -1;
let sortDirection = 1;

const collator = new Intl.Collator("en-US", { numeric: true, sensitivity: "base" });

/** Displays accessible feedback for file selection and parsing. */
function showNotice(message, tone = "info") {
  notice.className = `alert mt-5 ${tone === "error" ? "alert-error" : tone === "warning" ? "alert-warning" : "alert-info"}`;
  notice.textContent = message;
  notice.hidden = false;
}

function hideNotice() {
  notice.hidden = true;
  notice.textContent = "";
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Validates a selected CSV file and clears any previous preview. */
function chooseFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".csv")) {
    showNotice("Choose a file with the .csv extension.", "error");
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    showNotice("The file exceeds the 50 MB limit.", "error");
    return;
  }

  selectedFile = file;
  headers = [];
  records = [];
  sortColumn = -1;
  sortDirection = 1;
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  fileDetails.hidden = false;
  importOptions.hidden = false;
  previewSection.hidden = true;
  resultsPanel.hidden = true;
  emptyState.hidden = false;
  resultSummary.textContent = "Waiting for a file";
  tableHead.replaceChildren();
  tableBody.replaceChildren();
  parseButton.disabled = false;
  hideNotice();
}

/** Converts common decimal and thousands separators into a sortable number. */
function parseNumber(value) {
  const compact = value.trim().replace(/\s/g, "");
  if (!compact) return null;

  let normalized = compact;
  if (compact.includes(",") && compact.includes(".")) {
    normalized = compact.lastIndexOf(",") > compact.lastIndexOf(".")
      ? compact.replace(/\./g, "").replace(",", ".")
      : compact.replace(/,/g, "");
  } else if (compact.includes(",")) {
    normalized = compact.replace(",", ".");
  }

  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  return Number(normalized);
}

/** Sorts numeric values numerically and falls back to English collation. */
function compareValues(left, right) {
  const leftValue = left.trim();
  const rightValue = right.trim();
  if (!leftValue && !rightValue) return 0;
  if (!leftValue) return 1;
  if (!rightValue) return -1;

  const leftNumber = parseNumber(leftValue);
  const rightNumber = parseNumber(rightValue);
  if (leftNumber !== null && rightNumber !== null) {
    return leftNumber - rightNumber;
  }
  return collator.compare(leftValue, rightValue);
}

/** Rebuilds the preview table and applies a stable sort to the selected column. */
function renderTable() {
  tableHead.replaceChildren();
  tableBody.replaceChildren();

  const headerRow = document.createElement("tr");
  headers.forEach((header, columnIndex) => {
    const heading = document.createElement("th");
    heading.scope = "col";
    heading.setAttribute("aria-sort", sortColumn === columnIndex
      ? sortDirection === 1 ? "ascending" : "descending"
      : "none");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-ghost btn-sm min-w-max justify-start gap-2 px-2 font-semibold normal-case";
    button.setAttribute("aria-label", `Sort by ${header}`);
    const label = document.createElement("span");
    label.textContent = header;
    const direction = document.createElement("span");
    direction.className = "text-base-content/45";
    direction.setAttribute("aria-hidden", "true");
    direction.textContent = sortColumn !== columnIndex ? "↕" : sortDirection === 1 ? "↑" : "↓";
    button.append(label, direction);
    button.addEventListener("click", () => {
      if (sortColumn === columnIndex) {
        sortDirection *= -1;
      } else {
        sortColumn = columnIndex;
        sortDirection = 1;
      }
      renderTable();
    });
    heading.append(button);
    headerRow.append(heading);
  });
  tableHead.append(headerRow);

  const orderedRecords = records.map((record, originalIndex) => ({ record, originalIndex }));
  if (sortColumn >= 0) {
    orderedRecords.sort((left, right) => {
      const comparison = compareValues(left.record[sortColumn] ?? "", right.record[sortColumn] ?? "");
      return comparison === 0 ? left.originalIndex - right.originalIndex : comparison * sortDirection;
    });
  }

  orderedRecords.forEach(({ record }) => {
    const row = document.createElement("tr");
    record.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    tableBody.append(row);
  });

  resultSummary.textContent = `${records.length.toLocaleString("en-US")} rows · ${headers.length} columns`;
  previewSection.hidden = false;
  resultsPanel.hidden = false;
  emptyState.hidden = records.length > 0;
}

/** Parses the selected file and lets PapaParse detect its delimiter. */
function parseSelectedFile() {
  if (!selectedFile) return;

  parseButton.disabled = true;
  parseButton.textContent = "Reading file...";
  previewSection.hidden = true;
  hideNotice();

  Papa.parse(selectedFile, {
    skipEmptyLines: "greedy",
    complete: (result) => {
      parseButton.disabled = false;
      parseButton.textContent = "Load data";

      const rows = result.data.filter((row) => Array.isArray(row) && row.some((value) => String(value ?? "").trim() !== ""));
      if (rows.length === 0) {
        showNotice("The file contains no data to display.", "error");
        return;
      }

      const columnCount = rows.reduce((count, row) => Math.max(count, row.length), 0);
      headers = Array.from({ length: columnCount }, (_, index) => String(rows[0][index] ?? "").trim() || `Column ${index + 1}`);
      records = rows.slice(1).map((row) => Array.from({ length: columnCount }, (_, index) => String(row[index] ?? "")));
      sortColumn = -1;
      sortDirection = 1;
      renderTable();
      previewSection.scrollIntoView({
        behavior: "auto",
        block: "center",
      });

      if (result.errors.length > 0) {
        showNotice(`Data loaded with ${result.errors.length} warning(s): ${result.errors[0].message}`, "warning");
      }
    },
    error: (error) => {
      parseButton.disabled = false;
      parseButton.textContent = "Load data";
      showNotice(`Could not read the file: ${error.message}`, "error");
    },
  });
}

fileInput.addEventListener("change", () => chooseFile(fileInput.files?.[0]));
dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});
dropZone.addEventListener("dragleave", (event) => {
  if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove("is-dragging");
});
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  chooseFile(event.dataTransfer.files?.[0]);
});

document.querySelector("#choose-file-button").addEventListener("click", () => fileInput.click());
parseButton.addEventListener("click", parseSelectedFile);
clearButton.addEventListener("click", () => {
  selectedFile = null;
  headers = [];
  records = [];
  fileInput.value = "";
  fileDetails.hidden = true;
  importOptions.hidden = true;
  previewSection.hidden = true;
  resultsPanel.hidden = true;
  emptyState.hidden = false;
  resultSummary.textContent = "Waiting for a file";
  parseButton.disabled = true;
  parseButton.textContent = "Load data";
  hideNotice();
});