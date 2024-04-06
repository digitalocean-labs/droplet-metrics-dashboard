function renderChart(elementID, title, yAxis, series) {
  Highcharts.chart(elementID, {
    chart: {
      type: "line"
    },
    title: {
      text: title
    },
    yAxis: {
      title: {
        text: yAxis
      }
    },
    xAxis: {
      title: {
        text: "Time (UTC)"
      },
      type: "datetime",
      labels: {
        format: "{value:%Y-%m-%d<br>%H:%M}"
      }
    },
    legend: {
      layout: "vertical",
      align: "right",
      verticalAlign: "middle"
    },
    series: series
  });
}

function fetchJson(url) {
  return fetch(url).then((res) => {
    if (res.ok) {
      return res.json();
    }
    throw new Error(`${res.status} ${res.statusText}\n${res.url}`)
  });
}

function bandwidthMetrics(dropletName, metricsUrl) {
  return fetchJson(metricsUrl).then((metrics) => {
    const values = metrics["data"]["result"][0]["values"].map((value) => {
      return [value[0] * 1000, parseFloat(value[1])];
    });
    return {
      name: dropletName,
      data: values,
    };
  });
}

function inboundMetrics(droplets) {
  const dropletMetrics = droplets["droplets"].map((droplet) => {
    const url = `/data/bandwidth-inbound-${droplet["id"]}.json`;
    return bandwidthMetrics(droplet["name"], url);
  });
  Promise.all(dropletMetrics).then((series) => {
    renderChart("bandwidth-inbound", "Droplet Bandwidth (public, inbound)", "Bandwidth (Mbps)", series);
  }).catch((error) => {
    const div = document.getElementById("bandwidth-inbound");
    div.innerText = error.toString();
  });
}

function outboundMetrics(droplets) {
  const dropletMetrics = droplets["droplets"].map((droplet) => {
    const url = `/data/bandwidth-outbound-${droplet["id"]}.json`;
    return bandwidthMetrics(droplet["name"], url);
  });
  Promise.all(dropletMetrics).then((series) => {
    renderChart("bandwidth-outbound", "Droplet Bandwidth (public, outbound)", "Bandwidth (Mbps)", series);
  }).catch((error) => {
    const div = document.getElementById("bandwidth-outbound");
    div.innerText = error.toString();
  });
}

function cpuUsageMetrics(droplets) {
  const dropletMetrics = droplets["droplets"].map((droplet) => {
    const url = `/data/cpu-${droplet["id"]}.json`;
    return fetchJson(url).then((data) => {
      const ticks = new Map();
      data["data"]["result"].forEach((res) => {
        const mode = res["metric"]["mode"];
        res["values"].forEach((value) => {
          const tick = value[0] * 1000;
          const metric = parseFloat(value[1]);
          if (ticks.has(tick)) {
            const metrics = ticks.get(tick);
            metrics.set(mode, metric);
          } else {
            const metrics = new Map();
            metrics.set(mode, metric);
            ticks.set(tick, metrics);
          }
        });
      });
      const series = [];
      for (const tick of ticks.keys()) {
        const metrics = ticks.get(tick);
        const idleCpu = metrics.get("idle");
        let totalCpu = 0;
        for (const metric of metrics.values()) {
          totalCpu = totalCpu + metric;
        }
        const usedCpu = (totalCpu - idleCpu) / totalCpu * 100.0;
        series.push([tick, usedCpu]);
      }
      return {
        name: droplet["name"],
        data: series,
      };
    });
  });
  Promise.all(dropletMetrics).then((series) => {
    renderChart("cpu-usage", "CPU Usage", "Used %", series);
  }).catch((error) => {
    const div = document.getElementById("cpu-usage");
    div.innerText = error.toString();
  });
}

function memoryUsageMetrics(droplets) {
  const dropletMetrics = droplets["droplets"].map((droplet) => {
    const freeReq = fetchJson(`/data/memory-free-${droplet["id"]}.json`);
    const totalReq = fetchJson(`/data/memory-total-${droplet["id"]}.json`);
    return Promise.all([freeReq, totalReq]).then((data) => {
      const freeValues = data[0]["data"]["result"][0]["values"];
      const totalValues = data[1]["data"]["result"][0]["values"];
      const series = []
      for (let i = 0; i < freeValues.length; i++) {
        const tick = freeValues[i][0] * 1000;
        const freeMem = parseFloat(freeValues[i][1]);
        const totalMem = parseFloat(totalValues[i][1]);
        const usedMem = (totalMem - freeMem) / totalMem * 100.0;
        series.push([tick, usedMem]);
      }
      return {
        name: droplet["name"],
        data: series,
      };
    });
  });
  Promise.all(dropletMetrics).then((series) => {
    renderChart("memory-usage", "Memory Usage", "Used %", series);
  }).catch((error) => {
    const div = document.getElementById("memory-usage");
    div.innerText = error.toString();
  });
}

fetchJson("/data/droplets.json").then((droplets) => {
  inboundMetrics(droplets);
  outboundMetrics(droplets);
  cpuUsageMetrics(droplets);
  memoryUsageMetrics(droplets);
}).catch((error) => {
  const div = document.getElementById("container");
  div.innerText = error.toString();
});
