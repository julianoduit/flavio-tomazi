# Publicação do site

O site é estático (HTML, CSS e JS). Não precisa de PHP, banco de dados nem build. Qualquer hospedagem que sirva arquivos funciona.

## 1. O que publicar

Publique a pasta do projeto inteira, **exceto**:

- `scripts/` (ferramentas locais)
- `docs/` (documentação)
- `assets/img/original/` (imagens originais do Wix, 30 MB, usadas só para gerar as otimizadas)
- `README.md`

Na Vercel, o `.vercelignore` já tira esses arquivos do deploy. No Apache, o `.htaccess` bloqueia esses caminhos com 404; na Netlify, o `_redirects` faz o mesmo.

## 2. Opções de hospedagem

### Vercel (hospedagem atual do projeto)
O repositório já está ligado ao projeto `juliano-duit/flavio-tomazi` na Vercel. A `main` é o branch de produção: cada push nela publica o site, e cada PR ou outro branch gera um link de preview.

1. **Branch de produção:** em **Settings > Environments > Production > Branch Tracking** (em versões antigas do painel, **Settings > Git > Production Branch**), confirme que o branch é `main`. No GitHub, em **Settings > General > Default branch**, deixe `main` como padrão. O projeto foi criado quando o único branch do repositório era `claude/exciting-meitner-jyqj4l`, então a Vercel pode ter registrado esse branch como produção.
2. Em **Settings > Build and Deployment**, deixe Framework Preset **Other**, Build Command vazio e Output Directory vazio (raiz do projeto).
3. O `vercel.json` cuida de:
   - barra final nas URLs (`trailingSlash`), por exemplo `/cirurgia-ortognatica` vira `/cirurgia-ortognatica/`;
   - redirecionamento de `flaviotomazi.com.br` para `www.flaviotomazi.com.br`;
   - `/index.html` para `/`;
   - redirecionamentos do blog antigo (seção 4);
   - cabeçalhos de segurança, cache (CSS e JS 7 dias, `config.js` sempre revalidado, fontes 1 ano, imagens 30 dias) e `noindex` na `/obrigado/`.
4. A `404.html` da raiz é usada automaticamente. HTTPS e compressão (gzip/brotli) são automáticos.
5. O `.vercelignore` tira do deploy `scripts/`, `docs/`, `assets/img/original/`, `README.md` e os arquivos de outras hospedagens. Depois do primeiro deploy, abra `https://www.flaviotomazi.com.br/docs/DEPLOY.md`: deve dar 404.
6. A Vercel responde aos redirecionamentos permanentes com o código 308, que o Google trata como o 301.
7. **Domínio:** em **Settings > Domains**, adicione `www.flaviotomazi.com.br` e `flaviotomazi.com.br`. Defina o `www` como principal e o domínio sem www como "Redirect to www.flaviotomazi.com.br" (o `vercel.json` também faz esse redirecionamento, como garantia). A Vercel mostra os registros DNS a criar, normalmente:
   - `A` em `@` apontando para o IP indicado pela Vercel;
   - `CNAME` em `www` apontando para o endereço `*.vercel-dns.com` indicado pela Vercel.

   Crie esses registros no DNS atual (Wix, Registro.br ou outro), seguindo os cuidados da seção 3.

### Hostinger (Apache)
1. hPanel > **Sites** > **Gerenciador de arquivos**, pasta `public_html`.
2. Envie os arquivos (ou use **Git** no hPanel apontando para este repositório).
3. O `.htaccess` já cuida de: HTTPS e www, página 404, compressão gzip/brotli, cache, cabeçalhos de segurança, barra final nas URLs e redirecionamentos do blog antigo.
4. Ative o SSL gratuito em **Segurança > SSL** antes de forçar HTTPS.
5. Se aparecer redirecionamento infinito (acontece quando o servidor fica atrás de um proxy que não informa HTTPS), troque a linha `RewriteCond %{HTTPS} off` por `RewriteCond %{HTTP:X-Forwarded-Proto} !https`.

### Netlify
1. **Add new site > Import an existing project**, escolha este repositório. Build command: vazio. Publish directory: `.`
2. O `_redirects` e o `_headers` são lidos automaticamente. A página `404.html` também.
3. Em **Domain management**, adicione `www.flaviotomazi.com.br` como domínio principal e `flaviotomazi.com.br` como alias (a Netlify redireciona o domínio sem www para o com www). HTTPS é automático.

### Cloudflare Pages
1. **Workers & Pages > Create > Pages > Connect to Git**, escolha o repositório. Build command: vazio. Output directory: `/`.
2. `_redirects`, `_headers` e `404.html` são lidos automaticamente. As regras `404!` do `_redirects` não são suportadas no Cloudflare Pages: para não publicar `scripts/`, `docs/` e `assets/img/original/`, mantenha um branch de produção sem essas pastas ou use um build command que copie só os arquivos do site para uma pasta `dist`.
3. Em **Custom domains**, adicione `www.flaviotomazi.com.br`. Para redirecionar o domínio sem www, crie uma **Redirect Rule** em **Rules > Redirect Rules**: `flaviotomazi.com.br/*` para `https://www.flaviotomazi.com.br/${1}`, 301.

## 3. Apontar o domínio que hoje está no Wix

1. Descubra onde o DNS está: consulte `flaviotomazi.com.br` em https://registro.br/tecnologia/ferramentas/whois/ e veja os servidores DNS. Se forem `ns*.wixdns.net`, o DNS está no Wix.
2. **Antes de trocar**, anote todos os registros DNS atuais no Wix (Domínios > Gerenciar registros DNS), principalmente MX, TXT (verificação do Google Search Console, Meta, e-mail) e CNAME de outros serviços. Eles precisam ser recriados no novo DNS.
3. Escolha o novo DNS:
   - **Vercel**: mantenha o DNS onde está e crie os registros `A` e `CNAME` que a Vercel indicar em **Settings > Domains** (ou troque os servidores DNS no Registro.br para `ns1.vercel-dns.com` e `ns2.vercel-dns.com` e recrie os outros registros na Vercel).
   - **Hostinger**: no Registro.br, troque os servidores DNS para os da Hostinger (`ns1.dns-parking.com` e `ns2.dns-parking.com`, confira no hPanel) e adicione o domínio no hPanel.
   - **Netlify**: use Netlify DNS ou, mantendo outro DNS, crie `CNAME www -> <seu-site>.netlify.app` e `A @ -> 75.2.60.5`.
   - **Cloudflare**: adicione o domínio na Cloudflare, ela importa os registros; troque os servidores DNS no Registro.br pelos informados.
4. No Registro.br: **Domínios > flaviotomazi.com.br > DNS > Alterar servidores DNS**.
5. A propagação leva de minutos a 48 horas. Só cancele o plano do Wix (ou desconecte o domínio) depois de confirmar que o site novo está no ar com HTTPS.
6. Teste: `https://flaviotomazi.com.br`, `http://www.flaviotomazi.com.br` e `https://www.flaviotomazi.com.br/cirurgia-ortognatica` devem terminar em `https://www.flaviotomazi.com.br/...` com barra final.

## 4. Blog do Wix (`/blog`)

O site antigo tem um blog com 9 posts (de 2017 e 2018). O site novo não tem blog, então os endereços antigos recebem redirecionamento permanente, já configurado no `vercel.json`, no `.htaccess` e no `_redirects`:

| Post antigo | Destino |
|---|---|
| `/single-post/2018/03/27/mostro-muito-a-gengiva-quando-vou-sorrir-o-que-fazer` | `/` |
| `/single-post/2018/02/05/meu-rosto-parece-torto-o-que-pode-ser-e-o-que-posso-fazer` | `/cirurgia-ortognatica/` |
| `/single-post/2017/10/18/está-feliz-com-a-sua-face` | `/` |
| `/single-post/2017/10/17/trauma-de-face` | `/` |
| `/single-post/2017/08/08/por-que-devo-remover-os-terceiros-molares-dentes-do-siso` | `/` (trocar para `/extracao-de-siso/` quando a LP existir) |
| `/single-post/2017/07/18/o-que-você-precisa-saber-sobre-sorriso-gengival` | `/` |
| `/single-post/2017/06/13/décima-turma-cirurgia-oral` | `/` |
| `/single-post/2017/05/29/cirurgia-ortognática` | `/cirurgia-ortognatica/` |
| `/single-post/2017/05/22/lipoplastia-facial-bichectomia` | `/` |
| `/blog`, `/blog-feed.xml`, `/post/*` | `/` |

Recomendações:

1. **Antes de desligar o Wix**, salve o texto e as imagens dos posts (copiar e colar ou exportar). Os de siso, ortognática, rosto torto e trauma podem virar conteúdo das futuras LPs e do FAQ.
2. No Google Search Console, em **Desempenho**, veja quais URLs do blog ainda recebem cliques. Se algum post tiver tráfego relevante, vale migrá-lo como página (por exemplo, `/blog/por-que-remover-o-siso/`) e ajustar o redirecionamento para o novo endereço.
3. Quando criar as LPs de siso, ATM etc., atualize os destinos acima.

## 5. Search Console e sitemap

1. Acesse https://search.google.com/search-console e confirme que a propriedade `flaviotomazi.com.br` (tipo Domínio) está verificada. Se a verificação era por TXT no DNS do Wix, recrie o registro no novo DNS.
2. **Sitemaps** > envie `https://www.flaviotomazi.com.br/sitemap.xml`. Remova o sitemap antigo do Wix se ele estiver listado.
3. **Inspeção de URL** > teste a home e a `/cirurgia-ortognatica/` e clique em "Solicitar indexação".
4. Acompanhe **Páginas > Não indexadas** nas semanas seguintes: as URLs antigas devem aparecer como "Página com redirecionamento".
5. Atualize o `lastmod` do `sitemap.xml` sempre que publicar mudanças relevantes.

## 6. Webhook de leads (Google Apps Script + Planilha)

Serve como backup: cada envio do formulário grava uma linha na planilha, mesmo que a pessoa não envie a mensagem no WhatsApp.

### Passo a passo
1. Crie uma planilha no Google Planilhas (ex.: "Leads - Site Dr. Flávio") com a conta do consultório.
2. Menu **Extensões > Apps Script**. Apague o conteúdo e cole o código abaixo. Salve.
3. (Opcional) Preencha `EMAIL_AVISO` para receber um e-mail a cada lead.
4. **Implantar > Nova implantação** > tipo **App da Web**:
   - Descrição: "Webhook leads site"
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Autorize o acesso (a conta Google vai pedir permissão para editar a planilha e, se usar aviso, enviar e-mail).
6. Copie a **URL do app da Web** (termina em `/exec`) e cole em `assets/js/config.js`:
   ```js
   LEAD_WEBHOOK_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
   ```
7. Publique o `config.js` e faça um envio de teste. A linha deve aparecer na aba "Leads".
8. Se editar o código depois, use **Implantar > Gerenciar implantações > Editar > Nova versão**, para manter a mesma URL.

### Código

```js
// Webhook de leads do site www.flaviotomazi.com.br
// Recebe o JSON enviado por assets/js/form.js e grava na aba "Leads".
const NOME_ABA = 'Leads';
const EMAIL_AVISO = ''; // ex.: 'fhtomazi@hotmail.com' para receber aviso por e-mail
const CAMPOS = [
  'data_hora', 'lead_id', 'nome', 'whatsapp', 'procedimento', 'periodo', 'mensagem',
  'valor', 'pagina_origem', 'landing_page', 'gclid', 'gbraid', 'wbraid',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'consentimento_lgpd'
];

function doPost(e) {
  const trava = LockService.getScriptLock();
  trava.tryLock(10000);
  try {
    const dados = JSON.parse(e.postData.contents);
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const aba = planilha.getSheetByName(NOME_ABA) || planilha.insertSheet(NOME_ABA);
    if (aba.getLastRow() === 0) {
      aba.appendRow(CAMPOS.concat(['recebido_em']));
      aba.setFrozenRows(1);
    }
    // Ignora reenvio do mesmo lead
    if (dados.lead_id && aba.getLastRow() > 1) {
      const ids = aba.getRange(2, 2, aba.getLastRow() - 1, 1).getValues().flat();
      if (ids.indexOf(dados.lead_id) !== -1) return resposta('duplicado');
    }
    aba.appendRow(CAMPOS.map(function (c) { return limpar(dados[c]); }).concat([new Date()]));

    if (EMAIL_AVISO) {
      MailApp.sendEmail(EMAIL_AVISO, 'Novo lead do site: ' + limpar(dados.procedimento),
        'Nome: ' + limpar(dados.nome) + '\n' +
        'WhatsApp: ' + limpar(dados.whatsapp) + '\n' +
        'Procedimento: ' + limpar(dados.procedimento) + '\n' +
        'Período: ' + limpar(dados.periodo) + '\n' +
        'Mensagem: ' + limpar(dados.mensagem) + '\n' +
        'Origem: ' + limpar(dados.utm_source) + ' / ' + limpar(dados.utm_campaign));
    }
    return resposta('ok');
  } catch (erro) {
    return resposta('erro');
  } finally {
    trava.releaseLock();
  }
}

// Evita que um texto seja interpretado como fórmula na planilha
function limpar(valor) {
  if (valor === undefined || valor === null) return '';
  let texto = String(valor).slice(0, 1000);
  if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
  return texto;
}

function resposta(texto) {
  return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.TEXT);
}
```

Observações:

- O site envia com `fetch` em modo `no-cors` e `keepalive`, sem esperar resposta. Se o webhook falhar, o fluxo do formulário segue normalmente para a `/obrigado/` e o WhatsApp.
- A planilha contém dados pessoais: compartilhe só com quem atende os agendamentos e defina um prazo para apagar linhas antigas, conforme a política de privacidade.

## 7. Depois de publicar

- Teste o formulário de ponta a ponta no celular (envio, `/obrigado/`, WhatsApp abrindo com a mensagem, linha na planilha).
- Teste no Tag Assistant conforme `docs/GTM-SETUP.md`.
- Rode o Lighthouse (Chrome DevTools > Lighthouse > Mobile) na home e na LP.
- Valide os dados estruturados no [Teste de pesquisa aprimorada](https://search.google.com/test/rich-results) e no [Schema Markup Validator](https://validator.schema.org/).
- Atualize no Google Ads o URL final dos anúncios de ortognática para `https://www.flaviotomazi.com.br/cirurgia-ortognatica/`.
- Atualize o link do site no Perfil da Empresa no Google, Instagram e Facebook, se necessário.
