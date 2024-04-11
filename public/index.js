"use strict";

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

function reportError(elementID, error) {
  console.error(elementID, error);
  document.getElementById(elementID).innerText = error.toString();
}

function newSearchUnixTime(hours) {
  let millis = Date.now();
  if (hours > 0) {
    millis = millis - (hours * 60 * 60 * 1000);
  }
  return (millis / 1000).toFixed(0);
}

const searchEnd = newSearchUnixTime(0); // now
const searchStart = newSearchUnixTime(1); // 1 hour ago

function fetchJson(searchType, searchArg) {
  let searchUrl = "";
  const query = new URLSearchParams();
  switch (searchType) {
    case "droplets":
      query.set("tag_name", searchArg);
      searchUrl = "/v2/droplets";
      break;
    case "bandwidth-inbound":
      query.set("host_id", searchArg.toString());
      query.set("interface", "public");
      query.set("direction", "inbound");
      query.set("start", searchStart);
      query.set("end", searchEnd);
      searchUrl = "/v2/monitoring/metrics/droplet/bandwidth";
      break;
    case "bandwidth-outbound":
      query.set("host_id", searchArg.toString());
      query.set("interface", "public");
      query.set("direction", "outbound");
      query.set("start", searchStart);
      query.set("end", searchEnd);
      searchUrl = "/v2/monitoring/metrics/droplet/bandwidth";
      break;
    case "cpu-usage":
      query.set("host_id", searchArg.toString());
      query.set("start", searchStart);
      query.set("end", searchEnd);
      searchUrl = "/v2/monitoring/metrics/droplet/cpu";
      break;
    case "memory-free":
      query.set("host_id", searchArg.toString());
      query.set("start", searchStart);
      query.set("end", searchEnd);
      searchUrl = "/v2/monitoring/metrics/droplet/memory_free";
      break;
    case "memory-total":
      query.set("host_id", searchArg.toString());
      query.set("start", searchStart);
      query.set("end", searchEnd);
      searchUrl = "/v2/monitoring/metrics/droplet/memory_total";
      break;
    default:
      return Promise.reject(new Error(`Unknown search type: "${searchType}"`));
  }
  return fetch(`${searchUrl}?${query}`).then((res) => {
    if (res.ok) {
      return res.json();
    }
    throw new Error(`${res.status} ${res.statusText}\n${res.url}`);
  });
}

function noResults(data) {
  return data["data"]["result"].length === 0;
}

function bandwidthSeries(dropletName, data) {
  if (noResults(data)) {
    return {
      name: dropletName,
      data: [],
    };
  }
  const values = data["data"]["result"][0]["values"].map((value) => {
    return [value[0] * 1000, parseFloat(value[1])];
  });
  return {
    name: dropletName,
    data: values,
  };
}

function inboundMetrics(droplets) {
  const dropletMetrics = droplets["droplets"].map((droplet) => {
    return fetchJson("bandwidth-inbound", droplet["id"]).then((data) => {
      return bandwidthSeries(droplet["name"], data);
    });
  });
  Promise.all(dropletMetrics).then((series) => {
    renderChart("bandwidth-inbound", "Droplet Bandwidth (public, inbound)", "Bandwidth (Mbps)", series);
  }).catch((error) => {
    reportError("bandwidth-inbound", error);
  });
}

function outboundMetrics(droplets) {
  const dropletMetrics = droplets["droplets"].map((droplet) => {
    return fetchJson("bandwidth-outbound", droplet["id"]).then((data) => {
      return bandwidthSeries(droplet["name"], data);
    });
  });
  Promise.all(dropletMetrics).then((series) => {
    renderChart("bandwidth-outbound", "Droplet Bandwidth (public, outbound)", "Bandwidth (Mbps)", series);
  }).catch((error) => {
    reportError("bandwidth-outbound", error);
  });
}

function usedCpuSeries(dropletName, data) {
  if (noResults(data)) {
    return {
      name: dropletName,
      data: [],
    };
  }
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
    name: dropletName,
    data: series,
  };
}

function cpuUsageMetrics(droplets) {
  const dropletMetrics = droplets["droplets"].map((droplet) => {
    return fetchJson("cpu-usage", droplet["id"]).then((data) => {
      return usedCpuSeries(droplet["name"], data);
    });
  });
  Promise.all(dropletMetrics).then((series) => {
    renderChart("cpu-usage", "CPU Usage", "Used %", series);
  }).catch((error) => {
    reportError("cpu-usage", error);
  });
}

function usedMemorySeries(dropletName, freeData, totalData) {
  if (noResults(freeData) || noResults(totalData)) {
    return {
      name: dropletName,
      data: [],
    };
  }
  const freeValues = freeData["data"]["result"][0]["values"];
  const totalValues = totalData["data"]["result"][0]["values"];
  const series = []
  for (let i = 0; i < freeValues.length; i++) {
    const tick = freeValues[i][0] * 1000;
    const freeMem = parseFloat(freeValues[i][1]);
    const totalMem = parseFloat(totalValues[i][1]);
    const usedMem = (totalMem - freeMem) / totalMem * 100.0;
    series.push([tick, usedMem]);
  }
  return {
    name: dropletName,
    data: series,
  };
}

function memoryUsageMetrics(droplets) {
  const dropletMetrics = droplets["droplets"].map((droplet) => {
    const freeReq = fetchJson("memory-free", droplet["id"]);
    const totalReq = fetchJson("memory-total", droplet["id"]);
    return Promise.all([freeReq, totalReq]).then((data) => {
      return usedMemorySeries(droplet["name"], data[0], data[1]);
    });
  });
  Promise.all(dropletMetrics).then((series) => {
    renderChart("memory-usage", "Memory Usage", "Used %", series);
  }).catch((error) => {
    reportError("memory-usage", error);
  });
}

let tagName = null;
let refreshMinutes = 0;
const pageQuery = window.location.search;
if (!!pageQuery) {
  const pageParams = new URLSearchParams(pageQuery);
  tagName = pageParams.get("tag");
  const refreshTxt = pageParams.get("refresh");
  refreshMinutes = (!!refreshTxt) ? parseInt(refreshTxt) : 0;
}
if (!!tagName) {
  fetchJson("droplets", tagName).then((droplets) => {
    inboundMetrics(droplets);
    outboundMetrics(droplets);
    cpuUsageMetrics(droplets);
    memoryUsageMetrics(droplets);
  }).catch((error) => {
    reportError("container", error);
  });
  if (!isNaN(refreshMinutes) && refreshMinutes > 0) {
    const reloadMillis = refreshMinutes * 60 * 1000;
    window.setTimeout(function () {
      window.location.reload();
    }, reloadMillis);
  }
} else {
  const error = new Error("Missing 'tag' parameter");
  reportError("container", error);
}
