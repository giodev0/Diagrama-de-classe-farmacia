proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# O servico de destino pode estar subindo ainda; melhor falhar rapido
# do que deixar a tela do usuario travada esperando.
proxy_connect_timeout 5s;
proxy_read_timeout 15s;
