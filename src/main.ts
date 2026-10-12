import { Plots } from "plotly.js-dist-min";
import "scheduler-polyfill";
import renderChart from "./charts.ts";
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

seedInput.addEventListener("input", () => {
  validateInputFitsIn64Bits(seedInput);
});

for (const input of requiredInputs) {
  input.addEventListener("input", () => {
    if (optionsForm.classList.contains("has-been-submitted")) {
      isInputValid(input);
    }
  });
}

useRandomSeed.addEventListener("change", () => {
  seedInput.disabled = useRandomSeed.checked;
  if (useRandomSeed.checked && seedInput.value === "") {
    seedInput.value = String(getCryptoRandomBigInt());
  }
});

for (const tab of tabs) {
  tab.addEventListener("shown.bs.tab", async () => {
    await handleTabShown(tab);
  });
}

optionsForm.addEventListener("submit", async (event) => {
  await handleFormSubmit(optionsForm, event);
});

async function handleFormSubmit(form: HTMLFormElement, event: Event) {
  event.preventDefault();
  event.stopPropagation();
  // Helps us handle input validation
  form.classList.add("has-been-submitted");

  validateInputFitsIn64Bits(seedInput);
  if (!isFormRequiredInputsValid(form)) {
    return;
  }

  normalizeRandomsCount(numRandsToGen);

  const submission = getSubmissionParameters({
    seedInput,
    countInput: numRandsToGen,
    useRandomSeed,
  });

  if (!submission) {
    return;
  }

  clearRenderedCharts(charts);

  const activeTab = document.querySelector("#result-tabs .nav-link.active") as HTMLElement;
  const tabSpinner = getTabSpinner(activeTab);

  tabSpinner?.removeAttribute("hidden");
  resultContainer?.removeAttribute("hidden");

  try {
    await generateRandomNumbersInChunks({
      seed: submission.seed,
      count: submission.count,
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
      numRandsToGen.dataset.lastCount = numRandsToGen.value;
    }
  } finally {
    tabSpinner?.setAttribute("hidden", "");
  }
}

function getSubmissionParameters(params: GetSubmissionParametersParams): SubmissionParameters | null {
  let seed = BigInt(params.seedInput.value);
  const count = BigInt(params.countInput.value);
  const lastSeed = BigInt(params.seedInput.dataset.lastSeed || 0);
  const lastCount = BigInt(params.countInput.dataset.lastCount || 0);

  // Skip rendering if the inputs haven't changed and random seeding is disabled.
  if (seed === lastSeed && count === lastCount) {
    if (!useRandomSeed.checked) {
      return null;
    }

    seed = getCryptoRandomBigInt();
    seedInput.value = String(seed);
  }

  return { seed, count };
}

async function handleTabShown(tab: HTMLElement) {
  if (!tab.dataset.chart) {
    return;
  }

  const root = document.querySelector(tab.dataset.chart) as HTMLElement;
  // Force a resize in case the window was resized while the tab was inactive.
  if (root.hasChildNodes()) {
    Plots.resize(root);
    return;
  }

  const spinner = getTabSpinner(tab);
  spinner?.removeAttribute("hidden");
  await scheduler.yield();
  await renderChart(root, RANDOMS);
  spinner?.setAttribute("hidden", "");
}

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

async function generateRandomNumbersInChunks(params: GenerateRandomNumbersInChunksParams) {
  params.outArray.length = 0; // reset array
  const prng = new PRNG(BigInt(params.seed));
  const chunkBig = BigInt(params.chunkSize);

  for (let i = 0n; i < params.count; i += chunkBig) {
    const remaining = params.count - i;
    const size = remaining < chunkBig ? Number(remaining) : params.chunkSize;

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

function validateInputFitsIn64Bits(inputElement: HTMLInputElement): boolean {
  const max64BitValue = 18446744073709551615n;
  const value = inputElement.value;

  let valid = /^[0-9]+$/.test(value);
  if (valid) {
    const seed = BigInt(value);
    valid = seed >= 1n && seed <= max64BitValue;
  }

  seedInput.setCustomValidity(valid ? "" : "invalid");
  return valid;
}
