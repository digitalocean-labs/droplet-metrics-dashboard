# Droplet Metrics Dashboard

Use DigitalOcean's [Public API](https://docs.digitalocean.com/reference/api/api-reference/) to fetch metrics for [tagged droplets](https://www.digitalocean.com/blog/droplet-tagging-organize-your-infrastructure).

Serve fetched metrics using a local http server ([Caddy](https://caddyserver.com/docs/)), rendered into graphs using [Highcharts](https://www.highcharts.com/docs/chart-and-series-types/line-chart):

```bash
export DIGITALOCEAN_TOKEN='[REDACTED]'
./serve.sh
```

Your metrics for droplets tagged with a given tag will be available at  
http://localhost:3000/index.html?tag=YOUR_TAG

Available query parameters:
* `tag` applied to your droplets (MANDATORY)
* `refresh` metrics every X minutes (OPTIONAL)

## Example

![Example Droplet Metrics](example.png)
