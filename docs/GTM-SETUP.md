# Configuração do Google Tag Manager

Contêiner: **GTM-TVGSS6TM**. O site instala somente o GTM. GA4, Google Ads, Meta Pixel e Microsoft Clarity devem ser configurados dentro dele, uma única vez cada (no site antigo o Pixel e o GA4 estavam duplicados).

| Ferramenta | ID |
|---|---|
| Google Analytics 4 | `G-ZSTTK6FEFY` |
| Google Ads | `AW-720963502` (ID visto no contêiner atual; confirme na conta do Google Ads) |
| Meta Pixel | `3920024521561453` |
| Microsoft Clarity | `y2dkyxmmcb` |

> Antes de começar: abra o contêiner e revise as tags que já existem. No teste feito em 28/10/2026 o contêiner já carregava o Google tag do GA4 (`G-ZSTTK6FEFY`) e do Google Ads (`AW-720963502`). Mantenha uma única tag de cada, pause as antigas que forem substituídas e publique só depois de testar no modo Preview.

## 1. Como o site conversa com o GTM

- **Consentimento (Consent Mode v2):** antes do GTM, o site define o padrão `denied` para `ad_storage`, `ad_user_data`, `ad_personalization` e `analytics_storage` (ou `granted`, se a pessoa já aceitou antes). Quando a pessoa clica em Aceitar ou Recusar no aviso de cookies, o site envia `gtag('consent', 'update', ...)` e o evento `consent_update`. Também ficam ativos `ads_data_redaction` e `url_passthrough`.
- **Carregamento:** o GTM carrega na primeira interação (toque, rolagem, tecla ou mouse) ou 3,5 s depois do carregamento da página, o que vier primeiro. Os eventos enviados antes disso ficam na fila do `dataLayer` e são processados quando o GTM carrega. A página `/obrigado/` carrega o GTM imediatamente. Para voltar ao carregamento imediato em todas as páginas, use `GTM_CARREGAMENTO: 'imediato'` em `assets/js/config.js`.
- **Eventos no `dataLayer`:**

| Evento | Quando | Parâmetros |
|---|---|---|
| `cta_click` | Clique em qualquer botão "Agendar avaliação" | `cta_texto`, `cta_secao`, `procedimento` |
| `form_start` | Primeira interação com o formulário (uma vez por página) | `form_id`, `procedimento` |
| `form_error` | Envio com campo inválido (um evento por campo) | `form_id`, `campo`, `erro` |
| `form_submit_attempt` | Envio com todos os campos válidos | `form_id`, `procedimento` |
| `generate_lead` | Na `/obrigado/`, uma única vez por lead | `lead_id`, `procedimento`, `procedimento_slug`, `value`, `currency`, `user_data` |
| `whatsapp_redirect` | Abertura do WhatsApp (automática ou por clique) | `origem`, `procedimento`, `lead_id` |
| `phone_click` | Clique em link `tel:` | `telefone`, `cta_secao` |
| `consent_update` | Aceite ou recusa no aviso de cookies | `consentimento` (`granted` ou `denied`) |

`user_data` segue o formato do Google para conversões otimizadas:

```js
user_data: {
  phone_number: '+5548999999999',            // E.164
  address: { first_name: 'Maria', last_name: 'da Silva', country: 'BR' }
}
```

O `generate_lead` usa `eventCallback` e `eventTimeout`: o site espera as tags dispararem (no máximo 2,5 s) antes de abrir o WhatsApp. Recarregar a `/obrigado/` não dispara outra conversão.

## 2. Configurações do contêiner

1. **Administrador > Configurações do contêiner:** marque "Ativar visão geral do consentimento".
2. **Variáveis integradas:** ative `Click Text`, `Click URL`, `Page Path`, `Page URL`.

## 3. Variáveis (Variáveis > Variáveis definidas pelo usuário > Nova > Variável da camada de dados)

| Nome no GTM | Nome da variável da camada de dados |
|---|---|
| `DLV - procedimento` | `procedimento` |
| `DLV - procedimento_slug` | `procedimento_slug` |
| `DLV - lead_id` | `lead_id` |
| `DLV - value` | `value` |
| `DLV - currency` | `currency` |
| `DLV - telefone E164` | `user_data.phone_number` |
| `DLV - primeiro nome` | `user_data.address.first_name` |
| `DLV - sobrenome` | `user_data.address.last_name` |
| `DLV - cta_texto` | `cta_texto` |
| `DLV - cta_secao` | `cta_secao` |
| `DLV - campo` | `campo` |
| `DLV - origem` | `origem` |
| `DLV - consentimento` | `consentimento` |

Crie também:

- **`UPD - lead`** (tipo "Dados fornecidos pelo usuário", configuração manual): Telefone = `{{DLV - telefone E164}}`, Nome = `{{DLV - primeiro nome}}`, Sobrenome = `{{DLV - sobrenome}}`, País = `BR`.

## 4. Acionadores (Acionadores > Novo > Evento personalizado)

| Nome | Nome do evento | Condição |
|---|---|---|
| `CE - generate_lead` | `generate_lead` | Todos os eventos personalizados |
| `CE - cta_click` | `cta_click` | Todos |
| `CE - form_start` | `form_start` | Todos |
| `CE - form_submit_attempt` | `form_submit_attempt` | Todos |
| `CE - form_error` | `form_error` | Todos |
| `CE - whatsapp_redirect` | `whatsapp_redirect` | Todos |
| `CE - phone_click` | `phone_click` | Todos |
| `CE - consent aceito` | `consent_update` | `DLV - consentimento` igual a `granted` |

## 5. Tags

### 5.1 Vinculador de conversões
- Tipo: **Vinculador de conversões** (Conversion Linker)
- Acionador: **Initialization - All Pages**

### 5.2 Google tag (GA4)
- Tipo: **Google tag**, ID `G-ZSTTK6FEFY`
- Acionador: **Initialization - All Pages**
- Se já existir no contêiner, mantenha só uma.

### 5.3 Eventos do GA4
Crie uma tag **Google Analytics: evento GA4** para cada evento, com ID de medição `G-ZSTTK6FEFY` e o mesmo nome do evento:

| Tag | Nome do evento | Parâmetros | Acionador |
|---|---|---|---|
| `GA4 - generate_lead` | `generate_lead` | `value` = `{{DLV - value}}`, `currency` = `{{DLV - currency}}`, `procedimento` = `{{DLV - procedimento}}`, `lead_id` = `{{DLV - lead_id}}` | `CE - generate_lead` |
| `GA4 - cta_click` | `cta_click` | `cta_texto`, `cta_secao`, `procedimento` | `CE - cta_click` |
| `GA4 - form_start` | `form_start` | `procedimento` | `CE - form_start` |
| `GA4 - form_submit_attempt` | `form_submit_attempt` | `procedimento` | `CE - form_submit_attempt` |
| `GA4 - form_error` | `form_error` | `campo` = `{{DLV - campo}}` | `CE - form_error` |
| `GA4 - whatsapp_redirect` | `whatsapp_redirect` | `origem`, `procedimento` | `CE - whatsapp_redirect` |
| `GA4 - phone_click` | `phone_click` | `cta_secao` | `CE - phone_click` |

No GA4, em **Administrador > Eventos**, marque `generate_lead` como **evento principal** (key event). Em **Definições personalizadas**, crie dimensões de evento para `procedimento`, `cta_secao` e `origem`.

### 5.4 Google Ads: conversão do formulário (principal)
1. No Google Ads, crie a ação de conversão **Site > Manual**: nome "Lead - Formulário do site", categoria **Enviar formulário de lead**, valor "Usar valores diferentes para cada conversão" (valor padrão 50), contagem **Uma**, janela de clique 90 dias. Copie o ID e o rótulo da conversão.
2. Em **Configurações da ação > Conversões otimizadas para leads**, ative e escolha **Google Tag Manager**. Aceite os termos de dados do cliente.
3. No GTM, crie a tag **Acompanhamento de conversões do Google Ads**:
   - ID da conversão: `720963502` (confirme) e rótulo da conversão
   - Valor: `{{DLV - value}}`; Código da moeda: `{{DLV - currency}}`
   - ID da transação: `{{DLV - lead_id}}` (evita contar o mesmo lead duas vezes)
   - Marque **Incluir dados fornecidos pelo usuário do seu site** e selecione `{{UPD - lead}}`
   - Acionador: `CE - generate_lead`
4. Defina esta ação como **Principal**. Todas as demais ações (telefone, WhatsApp, GA4 importado) devem ser **Secundárias**, para o lance otimizar pelo formulário.

### 5.5 Google Ads: clique no telefone (secundária)
- No Google Ads, crie a ação "Clique no telefone do site" (categoria Contato, contagem Uma, **Secundária**).
- Tag **Acompanhamento de conversões do Google Ads** com o ID e o rótulo dessa ação, acionador `CE - phone_click`.

### 5.6 Meta Pixel
Use o modelo da Galeria de modelos **"Facebook Pixel"** (autor facebookarchive) ou uma tag HTML personalizada.

- `Meta - PageView`: Pixel ID `3920024521561453`, evento `PageView`. Acionadores: **All Pages** e `CE - consent aceito` (para registrar a página quando a pessoa aceita depois de abrir o site). Consentimento adicional exigido: `ad_storage`.
- `Meta - Lead`: evento padrão `Lead`, **Event ID** = `{{DLV - lead_id}}` (deduplicação com a API de Conversões, se for ativada depois), parâmetros `value` = `{{DLV - value}}`, `currency` = `{{DLV - currency}}`, `content_name` = `{{DLV - procedimento}}`. Acionador: `CE - generate_lead`. Consentimento adicional exigido: `ad_storage`.

Exemplo de HTML personalizado do Lead, caso não use o modelo:

```html
<script>
  fbq('track', 'Lead', {
    value: {{DLV - value}},
    currency: '{{DLV - currency}}',
    content_name: '{{DLV - procedimento}}'
  }, { eventID: '{{DLV - lead_id}}' });
</script>
```

### 5.7 Microsoft Clarity
- Modelo da Galeria **"Microsoft Clarity - Official"**, Project ID `y2dkyxmmcb`.
- Acionadores: **All Pages** e `CE - consent aceito`. Consentimento adicional exigido: `analytics_storage`.
- No painel do Clarity, em **Settings > Masking**, mantenha o modo **Balanced** ou **Strict** para não gravar o que é digitado no formulário.

### 5.8 Consentimento nas tags
- Tags do Google (GA4, Ads, Vinculador) já respeitam o Consent Mode: deixe "Não é necessário consentimento adicional".
- Meta e Clarity: em **Configurações avançadas > Configurações de consentimento**, marque "Exigir consentimento adicional" com `ad_storage` (Meta) e `analytics_storage` (Clarity).

## 6. Como testar

1. No GTM, clique em **Visualizar** e informe `https://www.flaviotomazi.com.br/?gclid=teste123&utm_source=google&utm_medium=cpc&utm_campaign=teste`.
2. No Tag Assistant, confira em cada evento:
   - **Consent**: estado padrão `denied`; depois de clicar em Aceitar, `granted` e o evento `consent_update`.
   - Clique em um botão "Agendar avaliação" de um card: `cta_click` com o `procedimento` certo.
   - Toque no formulário: `form_start` (uma vez).
   - Envie vazio: `form_error` para cada campo.
   - Preencha e envie: `form_submit_attempt`, depois a página `/obrigado/` com `generate_lead` (valor, moeda, `lead_id` e `user_data`). Verifique se as tags do Google Ads (formulário), GA4 e Meta Lead dispararam **uma vez**.
   - `whatsapp_redirect` e a abertura do WhatsApp com a mensagem pronta.
   - Recarregue a `/obrigado/`: **nenhum** `generate_lead` novo.
   - Clique no telefone: `phone_click` e a tag de conversão do telefone.
3. **GA4 > Administrador > DebugView**: os eventos aparecem em tempo real durante o Preview.
4. **Google Ads > Metas > Conversões > Diagnóstico** (algumas horas depois): status da tag e das conversões otimizadas.
5. **Meta Events Manager > Testar eventos**: `PageView` e `Lead` com o mesmo `eventID` do `lead_id`.
6. Publique o contêiner com um nome de versão descritivo (ex.: "Site novo - eventos e conversões").

## 7. Backup do lead e conversões offline

Quando `LEAD_WEBHOOK_URL` está preenchido em `assets/js/config.js`, cada lead também vai para a planilha com `gclid`, `gbraid`, `wbraid` e UTMs (ver `docs/DEPLOY.md`). Isso permite, se necessário, importar conversões offline no Google Ads (por exemplo, marcar os leads que viraram consulta), e recuperar contatos de quem não enviou a mensagem no WhatsApp.
