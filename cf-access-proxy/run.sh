#!/usr/bin/with-contenv bashio

export CF_TARGET_HOST=$(bashio::config 'target_host')
export CF_ACCESS_CLIENT_ID=$(bashio::config 'cf_access_client_id')
export CF_ACCESS_CLIENT_SECRET=$(bashio::config 'cf_access_client_secret')
export CF_PROXY_PORT=8099

bashio::log.info "A ligar a ${CF_TARGET_HOST} via proxy Cloudflare Access, porta local 8099..."

exec node /proxy.mjs
