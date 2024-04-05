# Droplet Metrics Dashboard

Use DigitalOcean's [Public API](https://docs.digitalocean.com/reference/api/api-reference/) to fetch metrics for [tagged droplets](https://www.digitalocean.com/blog/droplet-tagging-organize-your-infrastructure), using [curl](https://curl.se/) and [jq](https://jqlang.github.io/jq/tutorial/):

```bash
TAG_NAME="wibble" DIGITALOCEAN_TOKEN="[REDACTED]" ./metrics.sh
```

Serve fetched metrics using a local http server ([Caddy](https://caddyserver.com/docs/)), rendered into graphs using [Highcharts](https://www.highcharts.com/docs/chart-and-series-types/line-chart):

```bash
./serve.sh
```

View your collected metrics at http://localhost:3000/

## Example

![Example Droplet Metrics](example.png)
