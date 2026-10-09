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

  const responsive = true;
  const margin = {
    t: 30,
    b: 40,
    l: 40,
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
            text: hovertext,
            hovertemplate: "%{text}<extra></extra>",
          },
        ],
        {
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
          margin,
          xaxis: { title: { text: "Random value" }, range: [0, 1] },
          yaxis: { title: { text: "Count" } },
          bargap: 0.02,
        },
        { responsive },
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
        { margin },
        { responsive },
      );
      break;
    }
  }

  if (chartSpinner) {
    chartSpinner.setAttribute("hidden", "");
  }
}
