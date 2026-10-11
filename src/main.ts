import { renderChartForTab } from "./charts.ts";
import PRNG from "./chrome-math-random.ts";

declare global {
  interface Window {
    chartReadyTextTimer: number | undefined;
  }
}

const seedInput = document.getElementById("seed") as HTMLInputElement;
const resultContainer = document.getElementById("result-container");
const randsCount = document.getElementById("randoms-count") as HTMLInputElement;
const optionsForm = document.getElementById("options-form") as HTMLFormElement;
const tabContainer = document.getElementById("result-tabs") as HTMLUListElement;

const requiredInputs = optionsForm.querySelectorAll(
  "input[required]",
) as NodeListOf<HTMLInputElement>;

const useRandomSeed = document.getElementById(
  "use-random-seed",
) as HTMLInputElement;

const chartsReadyText = document.getElementById(
  "charts-ready-text",
) as HTMLDivElement;

const charts = document.querySelectorAll(
  ".chart-container",
) as NodeListOf<HTMLElement>;

const tabs = tabContainer?.querySelectorAll(
  'button[data-bs-toggle="tab"]',
) as NodeListOf<HTMLElement>;

const RANDOMS: number[] = [];

for (const input of requiredInputs) {
  input.addEventListener("input", () => isInputValid(input));
}

for (const tab of tabs) {
  tab.addEventListener("shown.bs.tab", async (event) => {
    const activeTabId = (event.target as HTMLElement)?.id;
    await renderChartForTab(activeTabId, RANDOMS);
  });
}

useRandomSeed?.addEventListener("change", (_event) => {
  const isChecked = useRandomSeed.checked; // event.target.checked;
  seedInput.disabled = isChecked;
  seedInput.value = "";
});

optionsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!isFormRequiredInputsValid(optionsForm)) {
    return;
  }

  const activeTab = document.querySelector(
    "#result-tabs .nav-link.active",
  ) as HTMLElement;

  resetRenderedCharts(charts);
  normalizeRandomsCount(randsCount);
  showTabSpinner(activeTab);
  resultContainer?.removeAttribute("hidden");

  let seed = BigInt(seedInput.value);
  if (useRandomSeed.checked) {
    seed = BigInt(getCryptoRandomNumbers(1)[0]);
    seedInput.value = String(seed);
  }

  await generateRandomNumbersInChunks({
    seed,
    count: Number(randsCount.value),
    chunkSize: 10_000,
    outArray: RANDOMS,
  });

  if (activeTab) {
    renderChartForTab(activeTab.id, RANDOMS);
    showChartReadyText({ chartsReadyText, timeoutMs: 5000 });
  }
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
  const inputs = form.querySelectorAll(
    "input[required]",
  ) as NodeListOf<HTMLInputElement>;

  let isValid = true;

  for (const input of inputs) {
    if (!isInputValid(input)) {
      isValid = false;
    }
  }

  return isValid;
}

function showTabSpinner(tabElement: HTMLElement | null) {
  if (!tabElement) {
    return;
  }
  if (!tabElement.dataset.chartSpinner) {
    return;
  }
  const spinner = document.querySelector(tabElement.dataset.chartSpinner);
  if (spinner) {
    spinner.removeAttribute("hidden");
  }
}

// Gets N cryptographically secure random numbers, where N = `count`.
function getCryptoRandomNumbers(count: number): Uint32Array {
  const buff = new Uint32Array(count);
  crypto.getRandomValues(buff);
  return buff;
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

    // Let the browser process pending UI work.
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

function resetRenderedCharts(charts: NodeListOf<HTMLElement>) {
  for (const chart of charts) {
    chart.replaceChildren();
  }
}

// Show text letting user know that charts are ready
// and they need to scroll down.
function showChartReadyText(params: {
  chartsReadyText: HTMLDivElement;
  timeoutMs: number;
}) {
  if (!window.chartReadyTextTimer) {
    chartsReadyText.removeAttribute("hidden");
    window.chartReadyTextTimer = setTimeout(() => {
      chartsReadyText.setAttribute("hidden", "");
      clearTimeout(window.chartReadyTextTimer);
    }, params.timeoutMs);
  }
}
