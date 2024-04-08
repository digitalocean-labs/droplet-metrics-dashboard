#!/usr/bin/env bash
set -euo pipefail

if [[ ! -d data ]]; then
  mkdir data
fi

echo "Looking up droplets by tag: ${TAG_NAME}"
curl --silent --show-error --fail \
  --header "Accept: application/json" \
  --header "Authorization: Bearer ${DIGITALOCEAN_TOKEN}" \
  --url-query "tag_name=${TAG_NAME}" \
  "https://api.digitalocean.com/v2/droplets" \
  | jq '[.droplets[] | {"id": .id, "name": .name}] | {"droplets": .}' > data/droplets.json

start_ts="$(date -v-1H +%s)"
end_ts="$(date +%s)"

for droplet_id in $(jq -r '.droplets[] | .id' data/droplets.json); do
  echo "Looking up inbound bandwidth for droplet ${droplet_id}"
  curl --silent --show-error --fail \
    --header "Accept: application/json" \
    --header "Authorization: Bearer ${DIGITALOCEAN_TOKEN}" \
    --url-query "host_id=${droplet_id}" \
    --url-query "interface=public" \
    --url-query "direction=inbound" \
    --url-query "start=${start_ts}" \
    --url-query "end=${end_ts}" \
    "https://api.digitalocean.com/v2/monitoring/metrics/droplet/bandwidth" \
    | jq '.' > "data/bandwidth-inbound-${droplet_id}.json"

  echo "Looking up outbound bandwidth for droplet ${droplet_id}"
  curl --silent --show-error --fail \
    --header "Accept: application/json" \
    --header "Authorization: Bearer ${DIGITALOCEAN_TOKEN}" \
    --url-query "host_id=${droplet_id}" \
    --url-query "interface=public" \
    --url-query "direction=outbound" \
    --url-query "start=${start_ts}" \
    --url-query "end=${end_ts}" \
    "https://api.digitalocean.com/v2/monitoring/metrics/droplet/bandwidth" \
    | jq '.' > "data/bandwidth-outbound-${droplet_id}.json"

  echo "Looking up cpu for droplet ${droplet_id}"
  curl --silent --show-error --fail \
    --header "Accept: application/json" \
    --header "Authorization: Bearer ${DIGITALOCEAN_TOKEN}" \
    --url-query "host_id=${droplet_id}" \
    --url-query "start=${start_ts}" \
    --url-query "end=${end_ts}" \
    "https://api.digitalocean.com/v2/monitoring/metrics/droplet/cpu" \
    | jq '.' > "data/cpu-${droplet_id}.json"

  echo "Looking up free memory for droplet ${droplet_id}"
  curl --silent --show-error --fail \
    --header "Accept: application/json" \
    --header "Authorization: Bearer ${DIGITALOCEAN_TOKEN}" \
    --url-query "host_id=${droplet_id}" \
    --url-query "start=${start_ts}" \
    --url-query "end=${end_ts}" \
    "https://api.digitalocean.com/v2/monitoring/metrics/droplet/memory_free" \
    | jq '.' > "data/memory-free-${droplet_id}.json"

  echo "Looking up total memory for droplet ${droplet_id}"
  curl --silent --show-error --fail \
    --header "Accept: application/json" \
    --header "Authorization: Bearer ${DIGITALOCEAN_TOKEN}" \
    --url-query "host_id=${droplet_id}" \
    --url-query "start=${start_ts}" \
    --url-query "end=${end_ts}" \
    "https://api.digitalocean.com/v2/monitoring/metrics/droplet/memory_total" \
    | jq '.' > "data/memory-total-${droplet_id}.json"
done
