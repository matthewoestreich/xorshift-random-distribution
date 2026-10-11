import { Plots } from "plotly.js-dist-min";
import "scheduler-polyfill";
import { renderChart } from "./charts.ts";
import PRNG from "./chrome-math-random.ts";

const seedInput = document.getElementById("seed") as HTMLInputElement;
const resultContainer = document.getElementById("result-container");
const optionsForm = document.getElementById("options-form") as HTMLFormElement;
const tabContainer = document.getElementById("result-tabs") as HTMLUListElement;
const numRandsToGen = document.getElementById("randoms-count") as HTMLInputElement;
const useRandomSeed = document.getElementById("use-random-seed") as HTMLInputElement;
const chartsReadyAlert = document.getElementById("charts-ready-alert") as HTMLDivElement;
const charts = document.querySelectorAll(".chart-container") as NodeListOf<HTMLElement>;
const requiredInputs = optionsForm.querySelectorAll("input[required]") as NodeListOf<HTMLInputElement>;
const tabs = tabContainer.querySelectorAll('button[data-bs-toggle="tab"]') as NodeListOf<HTMLElement>;

const RANDOMS: number[] = [];

for (const input of requiredInputs) {
  input.addEventListener("input", () => {
    if (optionsForm.classList.contains("has-been-submitted")) {
      isInputValid(input);
    }
  });
}

for (const tab of tabs) {
  tab.addEventListener("shown.bs.tab", async () => {
    if (!tab.dataset.chart) {
      return;
    }

    const root = document.querySelector(tab.dataset.chart) as HTMLElement;
    // Force a resize. If someone clicks on a tab that they've already clicked
    // on, it is possible the windows was resized in between those clicks.
    if (root.hasChildNodes()) {
      Plots.resize(root);
      return;
    }

    const spinner = getTabSpinner(tab);
    spinner?.removeAttribute("hidden");
    await scheduler.yield();
    await renderChart(root, RANDOMS);
    spinner?.setAttribute("hidden", "");
  });
}

useRandomSeed.addEventListener("change", () => {
  seedInput.disabled = useRandomSeed.checked;
  if (useRandomSeed.checked) {
    seedInput.value = String(getCryptoRandomBigInt());
  }
});

optionsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  // Helps us handle input validation
  optionsForm.classList.add("has-been-submitted");

  if (!isFormRequiredInputsValid(optionsForm)) {
    return;
  }

  normalizeRandomsCount(numRandsToGen);

  let seed = BigInt(seedInput.value);
  const count = Number(numRandsToGen.value);
  const lastSeed = BigInt(seedInput.dataset.lastSeed || 0);
  const lastCount = Number(numRandsToGen.dataset.lastCount || 0);

  // If someone submits a form with the same values we've aleady seen,
  // we don't need to render charts since they're already rendered.
  if (lastSeed === seed && lastCount === count) {
    if (!useRandomSeed.checked) {
      return;
    }
    seed = getCryptoRandomBigInt();
    seedInput.value = String(seed);
  }

  const activeTab = document.querySelector("#result-tabs .nav-link.active") as HTMLElement;

  clearRenderedCharts(charts);

  const tabSpinner = getTabSpinner(activeTab);
  tabSpinner?.removeAttribute("hidden");
  resultContainer?.removeAttribute("hidden");

  await generateRandomNumbersInChunks({
    seed,
    count,
    chunkSize: 10_000,
    outArray: RANDOMS,
  });

  if (activeTab && activeTab.dataset.chart) {
    const chart = document.querySelector(activeTab.dataset.chart) as HTMLElement;
    await renderChart(chart, RANDOMS);

    // If the user cannot see the results, inform them they need to scroll down.
    if (tabContainer && !isAnyPartOfElementInViewport(tabContainer)) {
      showChartsReadyAlert(chartsReadyAlert);
    }

    seedInput.dataset.lastSeed = seedInput.value;
    numRandsToGen.dataset.lastCount = String(count);
  }

  tabSpinner?.setAttribute("hidden", ""); // Hide spinner
});

function isInputValid(input: HTMLInputElement): boolean {
  let isValid = true;
  if (!input.checkValidity()) {
    isValid = false;
    input.classList.add("is-invalid");
    input.classList.remove("is-valid");
  } else {
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
  }
  return isValid;
}

function isFormRequiredInputsValid(form: HTMLFormElement): boolean {
  let isValid = true;
  const inputs = form.querySelectorAll("input[required]") as NodeListOf<HTMLInputElement>;
  for (const input of inputs) {
    if (!isInputValid(input)) {
      isValid = false;
    }
  }
  return isValid;
}

function getTabSpinner(tab: HTMLElement): HTMLDivElement | null {
  if (!tab.dataset.chartSpinner) {
    return null;
  }
  return document.querySelector(tab.dataset.chartSpinner);
}

function getCryptoRandomBigInt(): bigint {
  return crypto.getRandomValues(new BigUint64Array(1))[0];
}

async function generateRandomNumbersInChunks(params: {
  seed: number | bigint;
  count: number;
  chunkSize: number;
  outArray: number[];
}) {
  params.outArray.length = 0; // reset array
  const prng = new PRNG(BigInt(params.seed));

  for (let i = 0; i < params.count; i += params.chunkSize) {
    const size = Math.min(params.chunkSize, params.count - i);
    for (let j = 0; j < size; j++) {
      params.outArray.push(prng.random());
    }
    await scheduler.yield();
  }
}

function normalizeRandomsCount(inputElement: HTMLInputElement) {
  let n = Number(inputElement.value);
  if (n % 2 !== 0) {
    n++;
    inputElement.value = String(n);
  }
}

function clearRenderedCharts(charts: NodeListOf<HTMLElement>) {
  for (const chart of charts) {
    chart.replaceChildren();
  }
}

function showChartsReadyAlert(chartsReadyAlertEl: HTMLDivElement): void {
  if (Boolean(chartsReadyAlertEl.dataset.hasShown)) {
    return;
  }
  chartsReadyAlertEl.removeAttribute("hidden");
  chartsReadyAlertEl.dataset.hasShown = "true";
}

function isAnyPartOfElementInViewport(element: HTMLElement): boolean {
  const bounds = element.getBoundingClientRect();
  return (
    bounds.top < (window.innerHeight || document.documentElement.clientHeight) &&
    bounds.bottom > 0 &&
    bounds.left < (window.innerWidth || document.documentElement.clientWidth) &&
    bounds.right > 0
  );
}
