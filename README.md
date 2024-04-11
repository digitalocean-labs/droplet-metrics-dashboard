# Droplet Metrics Dashboard

> [!WARNING]
> We do NOT recommend running this configuration over the internet, or on unsecured networks, without any access controls. Your infrastructure is confidential and its details should not be easily accessible by unauthorised individuals. Please configure [https](https://caddyserver.com/docs/quick-starts/https) and at a minimum [basic user authentication](https://caddyserver.com/docs/caddyfile/directives/basicauth).

Use DigitalOcean's [Public API](https://docs.digitalocean.com/reference/api/api-reference/) to fetch metrics for [tagged droplets](https://www.digitalocean.com/blog/droplet-tagging-organize-your-infrastructure).

Serve fetched metrics using a local http server ([Caddy](https://caddyserver.com/docs/)), rendered into graphs using [Highcharts](https://www.highcharts.com/docs/chart-and-series-types/line-chart):

```bash
export DIGITALOCEAN_TOKEN='[REDACTED]'
./serve.sh
```

Navigate to http://localhost:3000/index.html?tag=YOUR_TAG to see metrics for droplets tagged with the given tag name.

Available query parameters:
* `tag` applied to your droplets (MANDATORY)
* `refresh` metrics every X minutes (OPTIONAL)

## Example

![Example Droplet Metrics](example.png)
