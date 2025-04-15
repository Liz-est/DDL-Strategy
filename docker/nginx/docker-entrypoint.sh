#!/bin/bash

if [ "${NGINX_HTTPS_ENABLED}" = true ]; then
    # Check if the certificate and key files for the specified domain exist
    SSL_CERTIFICATE_PATH="/etc/ssl/${NGINX_SSL_CERT_FILENAME}"
    SSL_CERTIFICATE_KEY_PATH="/etc/ssl/${NGINX_SSL_CERT_KEY_FILENAME}"
    export SSL_CERTIFICATE_PATH
    export SSL_CERTIFICATE_KEY_PATH

    # set the HTTPS_CONFIG environment variable to the content of the https.conf.template
    HTTPS_CONFIG=$(envsubst < /etc/nginx/https.conf.template)
    export HTTPS_CONFIG
    # Substitute the HTTPS_CONFIG in the default.conf.template with content from https.conf.template
    envsubst '${HTTPS_CONFIG}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
fi


env_vars=$(printenv | cut -d= -f1 | sed 's/^/$/g' | paste -sd, -)

envsubst "$env_vars" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx using the default entrypoint
exec nginx -g 'daemon off;'