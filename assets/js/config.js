/*
 * Configurações editáveis do site Dr. Flávio Tomazi.
 * Este arquivo é carregado no <head> de todas as páginas, antes do GTM.
 * Depois de editar, não é preciso rodar nenhum build.
 */
window.SITE_CONFIG = {
  // Google Tag Manager (o snippet no <head> lê este valor).
  // Se trocar o ID, troque também no <noscript> logo após o <body> (scripts/partials/gtm-noscript.html).
  GTM_ID: 'GTM-TVGSS6TM',
  // 'interacao': o GTM carrega na primeira interação (toque, rolagem, tecla, mouse) ou
  // GTM_ATRASO_MS depois do carregamento da página, o que vier primeiro. Libera o celular
  // para mostrar a página mais rápido. A página /obrigado/ sempre carrega o GTM na hora.
  // 'imediato': carrega o GTM assim que a página abre (padrão do Google).
  GTM_CARREGAMENTO: 'interacao',
  GTM_ATRASO_MS: 3500,

  // WhatsApp no formato internacional, só dígitos (usado em https://wa.me/<numero>)
  WHATSAPP_NUMERO: '5548999219930',

  // Telefone fixo
  TELEFONE_E164: '+554830456621',
  TELEFONE_EXIBICAO: '(48) 3045-6621',

  // Backup dos leads (ex.: Google Apps Script que grava numa planilha).
  // Deixe vazio para não enviar. Veja docs/DEPLOY.md.
  LEAD_WEBHOOK_URL: '',

  // Conversão no Google Ads: valor por procedimento (em BRL).
  // São valores relativos para o lance inteligente, não preços. AJUSTAR com o time de mídia.
  MOEDA: 'BRL',
  VALOR_PADRAO: 50,
  PROCEDIMENTOS: {
    'Cirurgia ortognática': { slug: 'cirurgia-ortognatica', valor: 500 },
    'Extração de siso': { slug: 'extracao-de-siso', valor: 100 },
    'Implantes dentários': { slug: 'implantes-dentarios', valor: 300 },
    'Enxerto ósseo': { slug: 'enxerto-osseo', valor: 200 },
    'Dor ou estalo na mandíbula (ATM/DTM)': { slug: 'atm-dtm', valor: 150 },
    'Cirurgia estética da face': { slug: 'cirurgia-estetica-da-face', valor: 300 },
    'Harmonização facial': { slug: 'harmonizacao-facial', valor: 150 },
    'Trauma facial': { slug: 'trauma-facial', valor: 100 },
    'Lesão ou alteração na boca': { slug: 'lesao-na-boca', valor: 80 },
    'Outro assunto': { slug: 'outro-assunto', valor: 50 }
  },

  // Mensagem enviada no WhatsApp depois do formulário.
  // As linhas de campos opcionais vazios são omitidas automaticamente.
  MENSAGEM_BASE: 'Olá! Vim pelo site e gostaria de agendar uma avaliação.',
  ROTULOS_MENSAGEM: {
    nome: 'Nome',
    procedimento: 'Procedimento de interesse',
    periodo: 'Melhor período para contato',
    mensagem: 'Mensagem'
  },

  // Mensagem do botão de WhatsApp quando não há lead pendente (acesso direto à /obrigado/)
  MENSAGEM_GENERICA: 'Olá! Vim pelo site e gostaria de agendar uma avaliação.',

  // Tempo até abrir o WhatsApp na página de obrigado (ms)
  REDIRECT_DELAY_MS: 1500,
  // Limite máximo de espera caso o GTM não responda (ms)
  REDIRECT_TIMEOUT_MS: 2500,

  // Por quantos dias guardar gclid/UTM no navegador
  ATRIBUICAO_DIAS: 90
};
