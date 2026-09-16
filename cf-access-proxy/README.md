# Cloudflare Access Proxy

Add-on para Home Assistant que liga a uma instância HA remota protegida por
**Cloudflare Access (Zero Trust)**, injetando os headers `CF-Access-Client-Id`
e `CF-Access-Client-Secret` em todos os pedidos (HTTP e WebSocket).

## Porquê

Algumas integrações (ex.: `remote_homeassistant`) só sabem ligar-se a um
`host:porta` simples com um token de longa duração — não suportam enviar
headers HTTP personalizados. Se a instância remota estiver atrás de
Cloudflare Access, esse pedido nunca passa: fica preso num redirecionamento
302 antes de chegar à Home Assistant.

Este add-on resolve isso correndo um proxy local que já sabe injetar os
headers certos, para a outra integração falar com `<ip-desta-maquina>:8099`
como se fosse uma ligação normal, sem saber nada de Cloudflare.

## Configuração

No separador **Configuração** do add-on, preenche:

- `target_host`: o domínio da instância remota (ex.: `alg.elevesec.com`, sem `https://`)
- `cf_access_client_id`: o Client ID do Service Token do Cloudflare Access
- `cf_access_client_secret`: o Client Secret correspondente

Depois, na integração que precisa de ligar à instância remota (ex.:
`remote_homeassistant`), usa como endereço o IP/hostname desta máquina HA na
porta **8099**, e o token de acesso de longa duração (Long-Lived Access
Token) gerado na própria instância remota.

## Segurança

Os segredos ficam guardados só nas opções do add-on (geridas pelo
Supervisor), nunca no código deste repositório.
