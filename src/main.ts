import { Plots } from "plotly.js-dist-min";
import { renderChartForTab } from "./charts.ts";
import PRNG from "./chrome-math-random.ts";

declare global {
  interface Window {
    chartReadyTextTimer: number | undefined;
    lastSeed: bigint | undefined;
    lastRandomsCount: number | undefined;
  }
}

const seedInput = document.getElementById("seed") as HTMLInputElement;
const resultContainer = document.getElementById("result-container");
const optionsForm = document.getElementById("options-form") as HTMLFormElement;
const tabContainer = document.getElementById("result-tabs") as HTMLUListElement;
const numRandsToGen = document.getElementById("randoms-count") as HTMLInputElement;
const useRandomSeed = document.getElementById("use-random-seed") as HTMLInputElement;
const chartsReadyText = document.getElementById("charts-ready-text") as HTMLDivElement;
const charts = document.querySelectorAll(".chart-container") as NodeListOf<HTMLElement>;
const requiredInputs = optionsForm.querySelectorAll("input[required]") as NodeListOf<HTMLInputElement>;
const tabs = tabContainer?.querySelectorAll('button[data-bs-toggle="tab"]') as NodeListOf<HTMLElement>;

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
    if (root.hasChildNodes()) {
      Plots.resize(root);
      return;
    }

    const spinner = getTabSpinner(tab);

    spinner?.removeAttribute("hidden");
    await renderChartForTab(root, RANDOMS);
    spinner?.setAttribute("hidden", "");
  });
}

useRandomSeed.addEventListener("change", () => {
  const isChecked = useRandomSeed.checked;
  seedInput.disabled = isChecked;
  if (isChecked) {
    seedInput.value = String(getCryptoRandomNumber());
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
  const numRands = Number(numRandsToGen.value);

  if (window.lastSeed === seed && window.lastRandomsCount === numRands) {
    // Dont waste compute if we already rendered these options.
    if (!useRandomSeed.checked) {
      return;
    }
    seed = BigInt(getCryptoRandomNumber());
    seedInput.value = String(seed);
  }

  const activeTab = document.querySelector("#result-tabs .nav-link.active") as HTMLElement;

  clearRenderedCharts(charts);

  const tabSpinner = getTabSpinner(activeTab);
  tabSpinner?.removeAttribute("hidden");
  resultContainer?.removeAttribute("hidden");

  await generateRandomNumbersInChunks({
    seed,
    count: Number(numRandsToGen.value),
    chunkSize: 10_000,
    outArray: RANDOMS,
  });

  if (activeTab && activeTab.dataset.chart) {
    await renderChartForTab(document.querySelector(activeTab.dataset.chart) as HTMLElement, RANDOMS);
    showChartReadyText({ chartsReadyText, timeoutMs: 5000 });
    window.lastSeed = seed;
    window.lastRandomsCount = numRands;
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

// Gets N cryptographically secure random numbers, where N = `count`.
function getCryptoRandomNumber(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
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
    inputElement.value = n.toString();
  }
}

function clearRenderedCharts(charts: NodeListOf<HTMLElement>) {
  for (const chart of charts) {
    chart.replaceChildren();
  }
}

// Show text letting user know that charts are ready and they need to scroll down.
function showChartReadyText(params: { chartsReadyText: HTMLDivElement; timeoutMs: number }) {
  if (!window.chartReadyTextTimer) {
    chartsReadyText.removeAttribute("hidden");
    window.chartReadyTextTimer = setTimeout(() => {
      chartsReadyText.setAttribute("hidden", "");
      clearTimeout(window.chartReadyTextTimer);
    }, params.timeoutMs);
  }
}
