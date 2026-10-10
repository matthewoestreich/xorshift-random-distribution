import { renderChartForTab } from "./charts.ts";
import PRNG from "./chrome-math-random.ts";

declare global {
  interface Window {
    chartReadyTextTimer: number | undefined;
  }
}

// const resultDiv = document.getElementById("result");
// const generateRands = document.getElementById("generate-rands");

const seedInput = document.getElementById("seed") as HTMLInputElement;
const resultContainer = document.getElementById("result-container");
const randsCount = document.getElementById("randoms-count") as HTMLInputElement;
const optionsForm = document.getElementById("options-form") as HTMLFormElement;
const tabContainer = document.getElementById("result-tabs");

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

if (seedInput) {
  seedInput.value = Date.now().toString();
}

const randoms: number[] = [];

useRandomSeed?.addEventListener("change", (_event) => {
  const isChecked = useRandomSeed.checked; // event.target.checked;
  seedInput.disabled = isChecked;
  seedInput.value = isChecked ? "" : Date.now().toString();
});

optionsForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!isFormValid(optionsForm)) {
    return;
  }

  const activeTab = document.querySelector(
    "#result-tabs .nav-link.active",
  ) as HTMLElement;

  resetRenderedCharts(charts);
  normalizeRandomsCount(randsCount);
  showTabSpinner(activeTab);
  resultContainer?.removeAttribute("hidden");

  await generateRandomNumbersInChunks(
    randoms,
    useRandomSeed.checked,
    Number(seedInput.value),
    Number(randsCount.value),
    10_000,
  );

  if (activeTab) {
    renderChartForTab(activeTab.id, randoms);
    showChartReadyText(chartsReadyText);
  }
});

tabs?.forEach((tab) => {
  tab.addEventListener("shown.bs.tab", async (event) => {
    const activeTabId = (event.target as Element)?.id;
    await renderChartForTab(activeTabId, randoms);
  });
});

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

async function generateRandomNumbersInChunks(
  outArray: number[],
  useRandomSeed: boolean,
  seedValue: number | bigint,
  count: number,
  chunkSize: number,
) {
  outArray.length = 0; // reset array
  let seed: bigint = BigInt(seedValue);
  if (useRandomSeed) {
    const rands = crypto.getRandomValues(new Uint32Array(1));
    seed = BigInt(rands[0]);
  }

  const prng = new PRNG(seed);

  for (let i = 0; i < count; i += chunkSize) {
    const size = Math.min(chunkSize, count - i);

    for (let j = 0; j < size; j++) {
      outArray.push(prng.random());
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

function isFormValid(formElement: HTMLFormElement) {
  const isValid = formElement.checkValidity();
  formElement.classList.add("was-validated");
  return isValid;
}

// charts : array of elements. each element should be root element of plotly chart.
function resetRenderedCharts(charts: NodeListOf<HTMLElement>) {
  for (const chart of charts) {
    chart.replaceChildren();
  }
}

function showChartReadyText(chartsReadyText: HTMLDivElement) {
  if (!window.chartReadyTextTimer) {
    chartsReadyText.removeAttribute("hidden");
    window.chartReadyTextTimer = setTimeout(() => {
      chartsReadyText.setAttribute("hidden", "");
      clearTimeout(window.chartReadyTextTimer);
    }, 3500);
  }
}
