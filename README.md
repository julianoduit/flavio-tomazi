# Site Dr. Flávio Tomazi

Site estático (HTML, CSS e JavaScript puros) do Dr. Flávio Tomazi, cirurgião bucomaxilofacial em Criciúma, SC. Substitui o site antigo no Wix. Foco: gerar leads qualificados do Google Ads e da busca orgânica, com rastreamento confiável de conversão.

Não há framework nem build obrigatório. Para ver localmente:

```bash
python3 -m http.server 8080
```

Depois abra http://localhost:8080.

## Estrutura

```
/
├── index.html                          Home
├── cirurgia-ortognatica/index.html     LP da campanha de cirurgia ortognática
├── obrigado/index.html                 Página de obrigado (noindex, dispara a conversão)
├── politica-de-privacidade/index.html  Política de privacidade (LGPD)
├── 404.html                            Página de erro
├── assets/
│   ├── css/critical.css                CSS do topo da página (copiado inline no <head>)
│   ├── css/style.css                   Restante do CSS
│   ├── js/config.js                    Configurações editáveis (WhatsApp, GTM, webhook, valores)
│   ├── js/main.js                      Consentimento, gclid/UTM, CTAs, menu, galeria, mapa
│   ├── js/form.js                      Formulário (máscara, validação, envio)
│   ├── js/obrigado.js                  Conversão e redirecionamento para o WhatsApp
│   ├── fonts/                          Montserrat (variável) e Yellowtail, WOFF2 self-hosted
│   └── img/                            Imagens otimizadas (WebP e AVIF) e originais do Wix
├── robots.txt, sitemap.xml, llms.txt, llms-full.txt, site.webmanifest, favicon.ico
├── .htaccess                           Apache/Hostinger
├── _redirects, _headers                Netlify/Cloudflare Pages
├── docs/
│   ├── GTM-SETUP.md                    Passo a passo do Google Tag Manager
│   ├── DEPLOY.md                       Hospedagem, domínio, blog antigo, Search Console, webhook
│   └── classificar-antes-depois.md     Lista das fotos para classificar por procedimento
└── scripts/
    ├── baixar-imagens-wix.py           Baixa as imagens do site antigo
    ├── otimizar-imagens.py             Gera WebP/AVIF, favicons e imagem Open Graph
    ├── sincronizar-blocos.py           Copia header, footer etc. para todas as páginas
    ├── verificar-faq.py                Confere se o FAQ do schema é igual ao da página
    └── partials/                       Blocos repetidos (header, footer, head, banner etc.)
```

## Como o site funciona

### Conversão
1. Todos os botões "Agendar avaliação" rolam até o formulário (`#agendar`). Nenhum botão abre o WhatsApp direto. Botões dentro de um card de procedimento já selecionam o procedimento no formulário (`data-procedimento`).
2. No celular, uma barra fixa no rodapé tem "Agendar avaliação" e o telefone. Ela some quando o formulário está na tela.
3. O formulário valida os campos, envia o lead para a planilha (se `LEAD_WEBHOOK_URL` estiver preenchido), guarda os dados na sessão e leva para `/obrigado/?p=<procedimento>`.
4. A `/obrigado/` dispara `generate_lead` uma única vez (com `lead_id`, valor e dados para conversões otimizadas) e abre o WhatsApp com a mensagem pronta em cerca de 1,5 s. Recarregar a página não conta outra conversão.
5. `gclid`, `gbraid`, `wbraid` e UTMs são guardados no navegador por 90 dias na primeira página visitada e enviados com o lead.

Detalhes dos eventos e da configuração do GTM em `docs/GTM-SETUP.md`.

### Rastreamento
Só o Google Tag Manager (`GTM-TVGSS6TM`) está no HTML. GA4, Google Ads, Meta Pixel e Clarity ficam dentro do GTM. O aviso de cookies usa o Google Consent Mode v2 (padrão negado até a pessoa aceitar).

Para não atrasar a abertura da página no celular, o GTM carrega na primeira interação ou 3,5 s depois do carregamento, o que vier primeiro (a `/obrigado/` carrega na hora). Para carregar imediatamente em todas as páginas, mude `GTM_CARREGAMENTO` para `'imediato'` em `config.js` (o Lighthouse de desempenho cai, ver resultados abaixo).

## Como editar

### Configurações (`assets/js/config.js`)
- `WHATSAPP_NUMERO`, `TELEFONE_E164`, `TELEFONE_EXIBICAO`
- `GTM_ID`, `GTM_CARREGAMENTO`, `GTM_ATRASO_MS`
- `LEAD_WEBHOOK_URL`: URL do Google Apps Script (ver `docs/DEPLOY.md`)
- `PROCEDIMENTOS`: slug e valor de conversão de cada procedimento do formulário
- `MENSAGEM_BASE`, `ROTULOS_MENSAGEM`, `MENSAGEM_GENERICA`: textos da mensagem do WhatsApp

Telefone, endereço e WhatsApp também aparecem escritos no HTML (links `tel:`, rodapé, schema, `llms.txt`). Se mudarem, use a busca do editor em todo o projeto.

### Textos
Edite direto no HTML de cada página. Regras:
- Linguagem do paciente primeiro, termo técnico depois.
- Sem promessa de resultado, superlativos, preços ou promoções (Código de Ética Odontológica e normas do CFO).
- Mantenha um único `<h1>` por página.
- Ao alterar uma pergunta ou resposta do FAQ, altere o mesmo texto no JSON-LD (`FAQPage`) do `<head>` e rode `python3 scripts/verificar-faq.py`.

### Blocos repetidos (header, footer, aviso de cookies, barra do celular)
Estão em `scripts/partials/` e entre comentários `<!-- bloco:nome -->` e `<!-- /bloco:nome -->` nas páginas. Para mudar em todas as páginas de uma vez, edite o arquivo em `scripts/partials/` e rode:

```bash
python3 scripts/sincronizar-blocos.py
```

O mesmo script copia `assets/css/critical.css` para dentro do `<head>` de cada página e atualiza o `?v=` dos arquivos CSS e JS (para o navegador baixar a versão nova). **Rode sempre depois de editar CSS ou JS.** Se preferir não usar o script, é possível editar cada página à mão; nesse caso, troque o `?v=` manualmente.

### Imagens
1. Coloque o arquivo original em `assets/img/original/`.
2. Ajuste `scripts/otimizar-imagens.py` (lista de arquivos e tamanhos) e rode `python3 scripts/otimizar-imagens.py` (requer `pip install pillow`, versão 11.3 ou superior).
3. Use `<picture>` com `srcset` AVIF e WebP, `width` e `height`, `loading="lazy"` abaixo da dobra e `alt` descritivo, como nas imagens existentes.

### Fotos de antes e depois
Preencha `docs/classificar-antes-depois.md` com o procedimento de cada caso. Depois, atualize as legendas da home e troque os placeholders da LP (instruções no próprio arquivo).

## Como criar uma nova LP (ex.: `/extracao-de-siso/`)

1. Copie a pasta `cirurgia-ortognatica/` para `extracao-de-siso/`.
2. No `<head>`: troque `<title>`, `meta description`, `canonical`, `og:url`, `og:title`, `og:description`, `twitter:*` e o JSON-LD (`MedicalWebPage`, `MedicalProcedure`, `BreadcrumbList` e `FAQPage`). Mantenha os `@id` do Dentist (`https://www.flaviotomazi.com.br/#dentist`) e do Person (`#dr-flavio`).
3. No `<body>`: troque `data-procedimento="Cirurgia ortognática"` pelo procedimento exato da lista do `config.js` (ex.: `Extração de siso`) em todos os botões, e o campo oculto `procedimento` do formulário e o texto do campo fixo.
4. Reescreva as seções mantendo o padrão: H2 em forma de pergunta, `p.resposta-direta` com a resposta em 2 ou 3 frases, depois o detalhamento. Seções reaproveitáveis: `.hero` + `.hero-foto`, `.lista-sinais`, `.prosa` com `.autoria`, `.passos.seis`, `.duas-colunas`, `.galeria`, `.sobre-grid`, `.faq`, `#agendar`, `#localizacao`.
5. Atualize a data de revisão (`.autoria` e `lastReviewed`).
6. Adicione a URL no `sitemap.xml`, no `llms.txt` e no `llms-full.txt`, e um link no card correspondente da home (`card-link`), como o de ortognática.
7. Se houver redirecionamento antigo do blog para esse tema, aponte para a nova LP no `.htaccess` e no `_redirects`.
8. Rode `python3 scripts/sincronizar-blocos.py` e `python3 scripts/verificar-faq.py` (adicione a nova página na lista `PAGINAS` do script).

## Pendências: [CONFIRMAR COM O DR]

Fontes já consultadas: o site antigo no Wix (home, os 9 posts do blog e os dados estruturados). Dele saíram as coordenadas exatas (geohash do link do Waze do Dr.: -28.67597, -49.35932), a internação de 1 dia na ortognática, o sorriso gengival como indicação de ortognática e os detalhes dos cards de siso, harmonização e trauma. O site antigo não informa horário, convênios, RQE nem CEP.

Os pontos abaixo estão marcados com comentários `[CONFIRMAR COM O DR]` ou `[VALIDAÇÃO JURÍDICA]` no HTML. Para encontrar todos: busque por `CONFIRMAR` no projeto.

| # | Pendência | Onde |
|---|---|---|
| 1 | Número de inscrição de especialista (RQE) no CRO, para a identificação profissional exigida pelo CFO | Rodapé (`scripts/partials/footer.html`) |
| 2 | Horário de atendimento | Localização (home e LP), schema (`openingHoursSpecification`, ainda não incluído), texto "horário comercial" da `/obrigado/` |
| 3 | Convênios aceitos (ex.: Unimed) | FAQ da home e da LP |
| 4 | CEP 88811-550: obtido na base dos Correios (ViaCEP) para a Rua Cruz e Souza até o nº 499, bairro Pio Corrêa | Localização, rodapé, schema, `llms.txt` |
| 5 | Quais procedimentos são feitos no consultório e quais no hospital (o blog antigo já confirma harmonização na clínica e ortognática em hospital; falta confirmar siso, implantes, enxertos e biópsias) | FAQ da home |
| 6 | Se algum convênio exige encaminhamento | FAQ da home |
| 7 | LP: prazos de recuperação, afastamento e dieta; acessos da cirurgia (cicatriz); cobertura do plano; critério de idade; duração do preparo ortodôntico. A internação de 1 dia veio do post do Dr. de 2017 e só precisa ser revalidada | FAQ e etapas da LP |
| 8 | Classificar as 20 fotos de antes e depois por procedimento e confirmar a autorização escrita de cada paciente | `docs/classificar-antes-depois.md` |
| 9 | Card "Cirurgia estética da face (rejuvenescimento de face e pescoço)": texto mantido do site antigo; confirmar se os procedimentos ofertados estão dentro do permitido ao cirurgião-dentista pela Resolução CFO 230/2020, que veda alguns procedimentos estéticos da face (como ritidoplastia/face lifting) | Home, schema `availableService` |
| 10 | Valores de conversão por procedimento (definir com o time de mídia) | `config.js` |
| 11 | Política de privacidade: controlador (CPF ou CNPJ), bases legais, prazo de retenção e lista de ferramentas | `politica-de-privacidade/index.html` |
| 12 | Avaliações reais do Google para o bloco de depoimentos (sem schema de review até lá) | Home, seção "O que dizem os pacientes" |
| 13 | Perfil da Empresa no Google: o schema usa o identificador estável do perfil (`kgmid=/g/11hzr545n1`), tirado do link do site antigo. Os botões de rota e avaliações seguem com o link curto `https://g.co/kgs/nUxCNwR` | Schema `sameAs`, botões |
| 14 | ID e rótulo das conversões do Google Ads (`AW-720963502` foi visto no contêiner atual) | `docs/GTM-SETUP.md` |

## Checklist de deploy

- [ ] Resolver ou aceitar as pendências acima
- [ ] Preencher `LEAD_WEBHOOK_URL` (`docs/DEPLOY.md`, seção 6)
- [ ] Rodar `python3 scripts/sincronizar-blocos.py` e `python3 scripts/verificar-faq.py`
- [ ] Publicar sem `scripts/`, `docs/`, `assets/img/original/` e `README.md` (`docs/DEPLOY.md`, seção 1)
- [ ] Apontar o domínio e ativar HTTPS (`docs/DEPLOY.md`, seção 3)
- [ ] Conferir redirecionamentos do blog antigo (`docs/DEPLOY.md`, seção 4)
- [ ] Configurar e publicar o GTM (`docs/GTM-SETUP.md`)
- [ ] Testar o fluxo completo no celular: CTA, formulário, `/obrigado/`, WhatsApp, planilha
- [ ] Testar no Tag Assistant e no Google Ads (conversão principal = formulário)
- [ ] Validar o schema no [Teste de pesquisa aprimorada](https://search.google.com/test/rich-results) e no [Schema Markup Validator](https://validator.schema.org/)
- [ ] Enviar `https://www.flaviotomazi.com.br/sitemap.xml` no Google Search Console e pedir indexação da home e da LP
- [ ] Rodar o Lighthouse mobile na home e na LP em produção
- [ ] Atualizar URL final dos anúncios de ortognática para `/cirurgia-ortognatica/`

## Resultados do Lighthouse (mobile, teste local com compressão brotli, 28/10/2026)

| Página | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Home | 100 | 100 | 100 | 100 | 1,7 s | 0 ms | 0 |
| Cirurgia ortognática | 100 | 100 | 100 | 100 | 1,5 s | 0 ms | 0 |

Resultado igual em três rodadas por página. Política de privacidade: 100 nas quatro categorias. A `/obrigado/` tem SEO 66 de propósito (`noindex`) e carrega o GTM na hora.

Com `GTM_CARREGAMENTO: 'imediato'`, o contêiner atual (que já carrega GA4 e Google Ads) adicionou de 370 ms a 1,8 s de bloqueio da thread principal no celular simulado, e o desempenho ficou entre 52 e 88 na home e entre 90 e 91 na LP, conforme a rodada. Em produção os números variam conforme a hospedagem e as tags configuradas no GTM.
