#!/bin/bash

# Directory for SSL files
SSL_DIR="/etc/nginx/ssl"
mkdir -p $SSL_DIR

# Generate strong DH parameters for better security
openssl dhparam -out $SSL_DIR/dhparam.pem 2048

# Generate private key with stronger encryption
openssl genrsa -out $SSL_DIR/nginx.key 4096

# Generate CSR with proper subject information
openssl req -new -key $SSL_DIR/nginx.key -out $SSL_DIR/nginx.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=btc.hega4444.com"

# Generate self-signed certificate valid for 1 year
openssl x509 -req -days 365 -in $SSL_DIR/nginx.csr -signkey $SSL_DIR/nginx.key -out $SSL_DIR/nginx.crt

# Set proper permissions
chmod 600 $SSL_DIR/nginx.key
chmod 644 $SSL_DIR/nginx.crt
chmod 644 $SSL_DIR/dhparam.pem

# Remove CSR as it's no longer needed
rm $SSL_DIR/nginx.csr

echo "SSL certificate generation complete!" 