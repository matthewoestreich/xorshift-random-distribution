import Plotly from "plotly.js-dist-min";
import "scheduler-polyfill";

export async function renderChartForTab(
  tabId: string,
  randoms: number[],
): Promise<void> {
  const tab = document.getElementById(tabId);
  if (!tab || !tab.dataset.chart) {
    return;
  }

  const chartDisplay = document.querySelector(tab.dataset.chart);
  if (!chartDisplay) {
    return;
  }

  const chartDisplayRoot = chartDisplay as Plotly.Root;
  if (chartDisplay.hasChildNodes()) {
    Plotly.Plots.resize(chartDisplayRoot);
    return;
  }

  let chartSpinner: Element | null = null;
  if (tab.dataset.chartSpinner) {
    chartSpinner = document.querySelector(tab.dataset.chartSpinner);
  }
  if (chartSpinner) {
    chartSpinner.removeAttribute("hidden");
  }

  await scheduler.yield();

  const dragmode = "pan";
  const responsive = true;
  const margin = {
    t: 30,
    b: 40,
    l: 45,
    r: 10,
  };

  switch (tabId) {
    case "heatmap-chart-tab": {
      const pairCount = Math.max(0, randoms.length - 1);

      const binCount = Math.max(
        1,
        Math.min(200, Math.floor(Math.sqrt(pairCount))),
      );

      const bins = Array.from({ length: binCount }, () =>
        new Array(binCount).fill(0),
      );

      for (let i = 0; i < pairCount; i++) {
        const x = Math.min(binCount - 1, Math.floor(randoms[i] * binCount));
        const y = Math.min(binCount - 1, Math.floor(randoms[i + 1] * binCount));
        bins[y][x]++;
      }

      const binSize = 1 / binCount;
      const hovertext = Array.from({ length: binCount }, (_, y) =>
        Array.from({ length: binCount }, (_, x) => {
          const xStart = x * binSize;
          const xEnd = (x + 1) * binSize;
          const yStart = y * binSize;
          const yEnd = (y + 1) * binSize;

          return (
            `X: ${xStart.toFixed(4)}–${xEnd.toFixed(4)}` +
            `<br>Y: ${yStart.toFixed(4)}–${yEnd.toFixed(4)}` +
            `<br>Count: ${bins[y][x]}`
          );
        }),
      );

      await Plotly.newPlot(
        chartDisplayRoot,
        [
          {
            type: "heatmap",
            z: bins,
            x: Array.from({ length: binCount }, (_, i) => (i + 0.5) / binCount),
            y: Array.from({ length: binCount }, (_, i) => (i + 0.5) / binCount),
            colorbar: {
              title: { text: "Count" },
            },
            text: hovertext,
            hovertemplate: "%{text}<extra></extra>",
          },
        ],
        {
          dragmode,
          margin,
          xaxis: {
            title: { text: "random[i]" },
            range: [0, 1],
          },
          yaxis: {
            title: { text: "random[i + 1]" },
            range: [0, 1],
          },
        },
        { responsive },
      );
      break;
    }

    case "histogram-chart-tab": {
      const binCount = 10;

      // START : This is all done just to make the graph look good.
      const ideal = randoms.length / binCount;
      const counts = Array(binCount).fill(0);
      for (const value of randoms) {
        const index = Math.min(Math.floor(value * binCount), binCount - 1);
        if (index >= 0) counts[index]++;
      }
      const lowestCount = Math.min(...counts);
      const highestCount = Math.max(...counts);
      const buffer = Math.ceil(randoms.length * 0.001);
      const yStart = Math.max(0, Math.max(0, lowestCount - buffer));
      const yEnd = highestCount + Math.max(1, Math.floor(buffer / 2));
      // END : This is all done just to make the graph look good.

      await Plotly.newPlot(
        chartDisplayRoot,
        [
          {
            type: "histogram",
            x: randoms,
            xbins: {
              start: 0,
              end: 1,
              size: 1 / binCount,
            },
            histnorm: "",
            marker: {
              color: "#21918c",
              line: { color: "#ffffff", width: 0.5 },
            },
            hovertemplate: "Range: %{x}<br>" + "Count: %{y}<extra></extra>",
          },
          {
            type: "scatter",
            mode: "lines",
            x: [0, 1],
            y: [ideal, ideal],
            name: "Perfect Uniform Distribution",
            line: { dash: "solid", width: 2 },
            hovertemplate: "Expected count: %{y:.2f}<extra></extra>",
          },
        ],
        {
          margin,
          dragmode,
          showlegend: false,
          xaxis: { title: { text: "Random value" }, range: [0, 1] },
          yaxis: {
            title: { text: "Count" },
            range: [yStart, yEnd],
          },
          bargap: 0.02,
        },
        { responsive },
      );
      break;
    }

    case "cumulative-chart-tab": {
      await Plotly.newPlot(
        chartDisplayRoot,
        [
          {
            x: randoms,
            type: "histogram",
            histnorm: "probability",
            cumulative: { enabled: true },
            hovertemplate:
              "Random Value: %{x:.4f}<br>" +
              "Cumulative Probability: %{y:.2%}" +
              "<extra></extra>",
          },
          {
            x: [0, 1],
            y: [0, 1],
            type: "scatter",
            mode: "lines",
            name: "Perfect Uniform Distribution",
            line: { dash: "solid" },
          },
        ],
        {
          margin,
          dragmode,
          showlegend: false,
          xaxis: { title: { text: "Random value" } },
          yaxis: { title: { text: "Cumulative Probability" } },
        },
        { responsive },
      );
      break;
    }
  }

  if (chartSpinner) {
    chartSpinner.setAttribute("hidden", "");
  }
}
