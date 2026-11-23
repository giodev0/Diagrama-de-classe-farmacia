FROM nginx:1.27-alpine

# Configuracao do servidor e do proxy para os microsservicos.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY proxy-comum.inc /etc/nginx/conf.d/proxy-comum.inc

# Arquivos estaticos.
COPY index.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js

EXPOSE 80
