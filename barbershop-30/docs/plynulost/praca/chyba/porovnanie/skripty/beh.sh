#!/bin/bash
# Spustí snímanie po jednom webe s tvrdým časovým limitom (zaseknutá stránka nezablokuje ostatné).
P=/tmp/claude-0/-home-user-head-spa-30/e4fc08a7-9804-506e-a6e2-06fd64c3d915/scratchpad/barber/chyba/porovnanie
export SPKI=$(openssl x509 -in /root/.ccr/agent-proxy-ca.crt -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64)
cd /tmp
for a in "$@"; do
  timeout -k 5 240 node $P/skripty/snimaj.mjs "$a" || echo "${a%%=*} TIMEOUT/CHYBA $?"
done
