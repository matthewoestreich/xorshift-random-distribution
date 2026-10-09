const seedInput = document.getElementById("seed");
const useRandomSeed = document.getElementById("use-random-seed");
const resultDiv = document.getElementById("result");
const resultContainer = document.getElementById("result-container");
const generateRands = document.getElementById("generate-rands");
const randsCount = document.getElementById("randoms-count");
const optionsForm = document.getElementById("options-form");
const tabContainer = document.getElementById("result-tabs");
const charts = document.querySelectorAll(".chart-container");
const tabs = tabContainer.querySelectorAll('button[data-bs-toggle="tab"]');
const chartsReadyText = document.getElementById("charts-ready-text");

seedInput.value = Date.now();

const randoms = [];

useRandomSeed.addEventListener("change", (event) => {
  const isChecked = event.target.checked;
  seedInput.disabled = isChecked;
  seedInput.value = isChecked ? "" : Date.now();
});

optionsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!isFormValid(optionsForm)) {
    return;
  }

  const activeTab = document.querySelector("#result-tabs .nav-link.active");

  resetRenderedCharts(charts);
  normalizeRandomsCount(randsCount);
  showTabSpinner(activeTab);
  resultContainer.removeAttribute("hidden");

  await generateRandomNumbersInChunks(
    randoms,
    useRandomSeed.checked,
    seedInput.value,
    randsCount.value,
    10_000,
  );

  if (activeTab) {
    renderChartForTab(activeTab.id, randoms);
    showChartReadyText(chartsReadyText);
  }
});

tabs.forEach((tab) => {
  tab.addEventListener("shown.bs.tab", async (event) => {
    const activeTabId = event.target.id;
    await renderChartForTab(activeTabId, randoms);
  });
});

function showTabSpinner(tabElement) {
  if (!tabElement) {
    return;
  }
  const spinner = document.querySelector(tabElement.dataset.chartSpinner);
  if (spinner) {
    spinner.removeAttribute("hidden");
  }
}

async function generateRandomNumbersInChunks(
  outArray = [],
  useRandomSeed = false,
  seedValue = 0, // Number
  count = 0,
  chunkSize = 0,
) {
  randoms.length = 0; // reset array
  const seed = BigInt(useRandomSeed ? Date.now() : seedValue);
  const prng = new PRNG(seed);

  for (let i = 0; i < count; i += chunkSize) {
    const size = Math.min(chunkSize, count - i);

    for (let j = 0; j < size; j++) {
      randoms.push(prng.random());
    }

    // Let the browser process pending UI work.
    await scheduler.yield();
  }
}

function normalizeRandomsCount(inputElement) {
  let v = Number(inputElement.value);
  if (v % 2 !== 0) {
    v++;
    randsCount.value = v;
  }
}

function isFormValid(formElement) {
  const isValid = formElement.checkValidity();
  formElement.classList.add("was-validated");
  return isValid;
}

// charts : array of elements. each element should be root element of plotly chart.
function resetRenderedCharts(charts) {
  for (const chart of charts) {
    chart.replaceChildren();
  }
}

function showChartReadyText(chartsReadyText) {
  if (!window.chartReadyTextTimer) {
    chartsReadyText.removeAttribute("hidden");
    window.chartReadyTextTimer = setTimeout(() => {
      chartsReadyText.setAttribute("hidden", "");
      clearTimeout(window.chartReadyTextTimer);
    }, 3500);
  }
}
