# Droplet Metrics Dashboard

Use DigitalOcean's [Public API](https://docs.digitalocean.com/reference/api/api-reference/) to fetch metrics for [tagged droplets](https://www.digitalocean.com/blog/droplet-tagging-organize-your-infrastructure).

Serve fetched metrics using a local http server ([Caddy](https://caddyserver.com/docs/)), rendered into graphs using [Highcharts](https://www.highcharts.com/docs/chart-and-series-types/line-chart):

```bash
export DIGITALOCEAN_TOKEN='[REDACTED]'
./serve.sh
```

Available query parameters:
* `tag` applied to your droplets (MANDATORY)
* `refresh` metrics every X minutes (OPTIONAL)

For example, to view metrics for droplets tagged with `wibble`, refreshed every 5 minutes, you would use this following URL: http://localhost:3000/index.html?tag=wibble&refresh=5

## Example

![Example Droplet Metrics](example.png)
