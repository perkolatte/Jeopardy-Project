// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

/** Configuration variables used across the app */
const CONFIG = {
  NUM_CATEGORIES: 6,
  NUM_CLUES: 5,
  // Using a replacement API here because the Springboard project API
  // is missing convenient sampling features; keeping this configurable
  // makes swapping the endpoint simple if desired later.
  API_BASE: "https://rithm-jeopardy.herokuapp.com/api",
};

// Note: the original assignment references the Springboard API at
// "https://projects.springboard.com/jeopardy/api". That API is missing
// convenient sampling endpoints, so this code uses a replacement
// API (Rithm's hosted jService mirror) by default. Swap CONFIG.API_BASE
// to the Springboard URL if/when their API provides the necessary features.

/**
 * Sanitize HTML from API so we allow a small set of formatting tags
 * (like <i>, <em>, <b>, <strong>, <u>, <br>) but strip any other tags/attributes.
 */
function sanitizeHtml(dirty) {
  if (!dirty) return "";
  // Unescape common backslash-escaped characters that may come from the API
  dirty = String(dirty).replace(/\\'/g, "'").replace(/\\"/g, '"');

  // Whitelist of tags we allow through DOMPurify
  const ALLOWED_TAGS = [
    "b",
    "strong",
    "i",
    "em",
    "u",
    "br",
    "p",
    "span",
    "small",
    "sub",
    "sup",
  ];

  // Use DOMPurify if available; fall back to a minimal text-escaping.
  if (typeof DOMPurify !== "undefined" && DOMPurify.sanitize) {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS });
  }

  // Fallback: strip tags by creating a template and reading textContent
  const template = document.createElement("template");
  template.textContent = dirty;
  return template.innerHTML;
}

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds(num = CONFIG.NUM_CATEGORIES) {
  // Request more categories than we need to give better randomization room,
  // then shuffle and pick `num` ids.
  const fetchCount = Math.max(14, num * 3);
  const response = await axios.get(
    `${CONFIG.API_BASE}/categories?count=${fetchCount}`
  );
  const categoriesArr = response.data;

  // Shuffle the array (Fisher-Yates shuffle)
  for (let i = categoriesArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [categoriesArr[i], categoriesArr[j]] = [categoriesArr[j], categoriesArr[i]];
  }

  // Take the first `num` categories and extract their IDs
  const categoryIds = categoriesArr
    .slice(0, num)
    .map((category) => category.id);

  return categoryIds;
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  console.log("getCategory called with catId:", catId);
  try {
    // 1. Fetch category data from the API
    const response = await axios.get(`${CONFIG.API_BASE}/category?id=${catId}`);
    const categoryData = response.data;

    // 2. Extract the title
    const title = categoryData.title;

    // 3. Randomly pick NUM_CLUES clues for this category (safer than taking first 5)
    const chosen =
      typeof _ !== "undefined" && _.sampleSize
        ? _.sampleSize(categoryData.clues, CONFIG.NUM_CLUES)
        : categoryData.clues.slice(0, CONFIG.NUM_CLUES);

    const clues = chosen.map((clue) => ({
      question: clue.question,
      answer: clue.answer,
      showing: null,
    }));

    // 4. Return the formatted object
    return {
      title,
      clues,
    };
  } catch (err) {
    console.warn(`Failed to fetch category for id ${catId}:`, err.message);
    return null;
  }
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
  console.log("fillTable called");
  console.log("categories:", categories);

  const $thead = $("#jeopardy thead");
  const $tbody = $("#jeopardy tbody");

  $thead.empty();
  $tbody.empty();

  const $tr = $("<tr>");
  for (let category of categories) {
    // wrap category title in a .category-title so CSS can center/wrap it
    const $th = $("<th>").append(
      $("<span>").addClass("category-title").html(sanitizeHtml(category.title))
    );
    $tr.append($th);
  }
  $thead.append($tr);

  // Create 5 rows for clues
  for (let clueIdx = 0; clueIdx < 5; clueIdx++) {
    const $row = $("<tr>");
    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      // Each cell starts as '?', with data attributes for lookup
      // each cell contains a span.cell-content we can measure and scale
      const $cell = $("<td>")
        .attr("data-cat", catIdx)
        .attr("data-clue", clueIdx)
        .addClass("clue-cell")
        .append($("<span>").addClass("cell-content").text("?"));
      $row.append($cell);
    }
    $tbody.append($row);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  // In a delegated handler, `this` is the element matched by the selector (the <td>).
  const $cell = $(this);
  const catIdx = $cell.data("cat");
  const clueIdx = $cell.data("clue");
  const clue = categories[catIdx].clues[clueIdx];

  if (clue.showing === null) {
    $cell.find(".cell-content").html(sanitizeHtml(clue.question));
    clue.showing = "question";
  } else if (clue.showing === "question") {
    $cell.find(".cell-content").html(sanitizeHtml(clue.answer));
    clue.showing = "answer";
  }
  // If already showing answer, do nothing
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.style.display = "flex";
    overlay.setAttribute("aria-hidden", "false");
    document.body.setAttribute("aria-busy", "true");
  }
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.style.display = "none";
    overlay.setAttribute("aria-hidden", "true");
    document.body.removeAttribute("aria-busy");
  }
}

/**
 * Start game:
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 */
async function setupAndStart() {
  console.log("setupAndStart called");
  showLoadingView();
  // 1. Get random category IDs (6 for the board)
  const categoryIds = await getCategoryIds(6);

  // 2. Fetch data for each category (in parallel)
  let catData = await Promise.all(categoryIds.map((id) => getCategory(id)));
  // Filter out any nulls (failed fetches)
  categories = catData.filter((c) => c !== null);

  // 3. Fill the table with the categories and clues
  fillTable();
  hideLoadingView();
}

/** On click of start / restart button, set up game. */

/** On page load, add event handler for clicking clues */
$(function () {
  $("#jeopardy").on("click", ".clue-cell", handleClick);
  $("#start-btn").on("click", async function () {
    const $btn = $(this);
    $btn.prop("disabled", true);
    await setupAndStart();
    $btn.prop("disabled", false);
  });
});

$(async function () {
  await setupAndStart();
  // No dynamic per-cell fitting is used in this build; the CSS provides
  // readable static font sizes. If you need automatic fitting, reintroduce
  // fitAllCellText() and fitTextInCell() implementations here.
});
