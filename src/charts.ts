import Plotly from "plotly.js-dist-min";

export default async function (root: HTMLElement, randoms: number[]): Promise<void> {
  const dragmode = "pan";
  const responsive = true;
  const margin = {
    t: 30,
    b: 40,
    l: 45,
    r: 10,
  };

  switch (root.id) {
    case "heatmap-chart":
      await renderHeatmap(root, randoms, dragmode, margin, responsive);
      break;
    case "histogram-chart":
      await renderHistogram(root, randoms, dragmode, margin, responsive);
      break;
    case "cumulative-chart":
      await renderCumulative(root, randoms, dragmode, margin, responsive);
      break;
  }
}

async function renderHeatmap(
  root: HTMLElement,
  randoms: number[],
  dragmode: NonNullable<Plotly.Layout["dragmode"]>,
  margin: NonNullable<Plotly.Layout["margin"]>,
  responsive: boolean | undefined,
) {
  const pairCount = Math.max(0, randoms.length - 1);
  const targetBinCount = Math.min(200, Math.floor(Math.sqrt(pairCount)));
  const binCount = Math.max(1, targetBinCount);
  const uniformBinSize = 1 / binCount;
  const bins = Array.from({ length: binCount }, () => new Array(binCount).fill(0));

  for (let i = 0; i < pairCount; i++) {
    const x = Math.min(binCount - 1, Math.floor(randoms[i] * binCount));
    const y = Math.min(binCount - 1, Math.floor(randoms[i + 1] * binCount));
    bins[y][x]++;
  }

  const hovertext = Array.from({ length: binCount }, (_, y) =>
    Array.from({ length: binCount }, (_, x) => {
      const xStart = x * uniformBinSize;
      const xEnd = (x + 1) * uniformBinSize;
      const yStart = y * uniformBinSize;
      const yEnd = (y + 1) * uniformBinSize;

      return (
        `X: ${xStart.toFixed(4)}–${xEnd.toFixed(4)}` +
        `<br>Y: ${yStart.toFixed(4)}–${yEnd.toFixed(4)}` +
        `<br>Count: ${bins[y][x]}`
      );
    }),
  );

  await Plotly.newPlot(
    root,
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
}

async function renderHistogram(
  root: HTMLElement,
  randoms: number[],
  dragmode: NonNullable<Plotly.Layout["dragmode"]>,
  margin: NonNullable<Plotly.Layout["margin"]>,
  responsive: boolean | undefined,
) {
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
    root,
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
        type: "scattergl",
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
}

async function renderCumulative(
  root: HTMLElement,
  randoms: number[],
  dragmode: NonNullable<Plotly.Layout["dragmode"]>,
  margin: NonNullable<Plotly.Layout["margin"]>,
  responsive: boolean | undefined,
) {
  await Plotly.newPlot(
    root,
    [
      {
        x: randoms,
        type: "histogram",
        histnorm: "probability",
        cumulative: { enabled: true },
        hovertemplate: "Random Value: %{x:.4f}<br>" + "Cumulative Probability: %{y:.2%}" + "<extra></extra>",
      },
      {
        x: [0, 1],
        y: [0, 1],
        type: "scattergl",
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
}
