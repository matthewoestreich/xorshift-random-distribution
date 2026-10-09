const seedInput = document.getElementById("seed");
const randomSeedCheckbox = document.getElementById("use-random-seed");
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

randomSeedCheckbox.addEventListener("change", (event) => {
  const isChecked = event.target.checked;
  seedInput.disabled = isChecked;
  seedInput.value = isChecked ? "" : Date.now();
});

optionsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  const isFormValid = optionsForm.checkValidity();
  optionsForm.classList.add("was-validated");

  if (!isFormValid) {
    return;
  }

  resultContainer.removeAttribute("hidden");
  resetRenderedCharts(charts);
  resetRandoms(randoms);

  const seed = BigInt(
    randomSeedCheckbox.checked ? Date.now() : seedInput.value,
  );

  const prng = new PRNG(seed);

  let randsCountValue = Number(randsCount.value);
  if (randsCountValue % 2 !== 0) {
    randsCountValue++;
    randsCount.value = randsCountValue;
  }

  for (let i = 0; i < randsCountValue; i++) {
    randoms.push(prng.random());
  }

  const activeTab = document.querySelector("#result-tabs .nav-link.active");
  if (activeTab) {
    renderChartForTab(activeTab.id, randoms);

    if (!window.chartReadyTextTimer) {
      chartsReadyText.removeAttribute("hidden");
      window.chartReadyTextTimer = setTimeout(() => {
        chartsReadyText.setAttribute("hidden", "");
        clearTimeout(window.chartReadyTextTimer);
      }, 3500);
    }
  }
});

tabs.forEach((tab) => {
  tab.addEventListener("shown.bs.tab", async (event) => {
    const activeTabId = event.target.id;
    await renderChartForTab(activeTabId, randoms);
  });
});

// charts : array of elements. each element should be root element of plotly chart.
function resetRenderedCharts(charts) {
  for (const chart of charts) {
    chart.replaceChildren();
  }
}

function resetRandoms(randoms) {
  randoms.length = 0;
}
