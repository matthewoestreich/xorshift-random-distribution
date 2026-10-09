async function renderChartForTab(tabId, randoms) {
  const tab = document.getElementById(tabId);
  if (!tab) {
    return;
  }

  const chartDisplay = document.querySelector(tab.dataset.chart);
  if (!chartDisplay || chartDisplay.hasChildNodes()) {
    return;
  }

  const chartSpinner = document.querySelector(tab.dataset.chartSpinner);
  if (chartSpinner) {
    chartSpinner.removeAttribute("hidden");
  }

  await scheduler.yield();

  switch (tabId) {
    case "heatmap-chart-tab": {
      const binCount = Math.max(
        10,
        Math.min(200, Math.floor(Math.sqrt(randoms.length / 10))),
      );

      const bins = Array.from({ length: binCount }, () =>
        new Array(binCount).fill(0),
      );

      for (let i = 0; i < randoms.length - 1; i++) {
        const x = Math.floor(randoms[i] * binCount);
        const y = Math.floor(randoms[i + 1] * binCount);
        bins[y][x]++;
      }

      await Plotly.newPlot(
        chartDisplay,
        [
          {
            type: "heatmap",
            z: bins,
            x: Array.from({ length: binCount }, (_, i) => (i + 0.5) / binCount),
            y: Array.from({ length: binCount }, (_, i) => (i + 0.5) / binCount),
            colorbar: {
              title: "Count",
            },
            hovertemplate:
              "rₙ: %{x:.4f}<br>" +
              "rₙ₊₁: %{y:.4f}<br>" +
              "Count: %{z}<extra></extra>",
          },
        ],
        {
          title: {
            text: `Random Numbers Count : ${randoms.length}`,
          },
          xaxis: {
            title: { text: "random[i]" },
            range: [0, 1],
          },
          yaxis: {
            title: { text: "random[i + 1]" },
            range: [0, 1],
          },
        },
      );
      break;
    }

    case "histogram-chart-tab": {
      const binCount = Math.max(
        10,
        Math.min(200, Math.floor(Math.sqrt(randoms.length))),
      );

      await Plotly.newPlot(
        chartDisplay,
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
        ],
        {
          title: {
            text: `Random Numbers Count : ${randoms.length}`,
          },
          xaxis: { title: { text: "Random value" }, range: [0, 1] },
          yaxis: { title: { text: "Count" } },
          bargap: 0.02,
        },
        { responsive: true },
      );
      break;
    }

    case "cumulative-chart-tab": {
      await Plotly.newPlot(
        chartDisplay,
        [
          {
            x: randoms,
            type: "histogram",
            cumulative: { enabled: true },
          },
        ],
        {
          title: {
            text: `Random Numbers Count : ${randoms.length}`,
          },
        },
      );
      break;
    }
  }

  if (chartSpinner) {
    chartSpinner.setAttribute("hidden", "");
  }
}
