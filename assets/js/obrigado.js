/*
 * Página /obrigado/: dispara a conversão (generate_lead) uma única vez por lead
 * e abre o WhatsApp com a mensagem pronta.
 */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var push = (window.FT && window.FT.push) || function (o) { (window.dataLayer = window.dataLayer || []).push(o); };
  var numero = CFG.WHATSAPP_NUMERO;

  var blocoLead = document.getElementById('estado-lead');
  var blocoGenerico = document.getElementById('estado-generico');
  var botaoLead = document.getElementById('abrir-whatsapp');
  var botaoGenerico = document.getElementById('whatsapp-generico');

  function urlWhatsApp(texto) {
    return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto);
  }

  if (botaoGenerico) botaoGenerico.href = urlWhatsApp(CFG.MENSAGEM_GENERICA || '');

  var lead = null;
  var pendente = false;
  try {
    pendente = window.sessionStorage.getItem('lead_pending') === 'true';
    lead = JSON.parse(window.sessionStorage.getItem('ft_lead') || 'null');
  } catch (e) {
    pendente = false;
  }

  if (!pendente || !lead || !lead.lead_id) return; // acesso direto ou recarregamento: só o estado genérico

  // Marca como processado antes de qualquer outra coisa, para não contar de novo
  try { window.sessionStorage.setItem('lead_pending', 'false'); } catch (e) { /* ignora */ }

  function montarMensagem(l) {
    var r = CFG.ROTULOS_MENSAGEM || {};
    var linhas = [CFG.MENSAGEM_BASE || 'Olá! Vim pelo site e gostaria de agendar uma avaliação.', ''];
    linhas.push((r.nome || 'Nome') + ': ' + l.nome);
    linhas.push((r.procedimento || 'Procedimento de interesse') + ': ' + l.procedimento);
    if (l.periodo) linhas.push((r.periodo || 'Melhor período para contato') + ': ' + l.periodo);
    if (l.mensagem) linhas.push((r.mensagem || 'Mensagem') + ': ' + l.mensagem);
    return linhas.join('\n');
  }

  function telefoneE164(digitos) {
    var d = String(digitos || '').replace(/\D/g, '');
    if (d.indexOf('55') === 0 && d.length > 11) return '+' + d;
    return '+55' + d;
  }

  var url = urlWhatsApp(montarMensagem(lead));
  if (botaoLead) botaoLead.href = url;
  if (blocoGenerico) blocoGenerico.hidden = true;
  if (blocoLead) blocoLead.hidden = false;

  var primeiroNome = lead.nome.split(' ')[0] || '';
  var sobrenome = lead.nome.split(' ').slice(1).join(' ');
  var saudacao = document.getElementById('saudacao-nome');
  if (saudacao && primeiroNome) saudacao.textContent = ', ' + primeiroNome;

  var redirecionou = false;
  function irParaWhatsApp() {
    if (redirecionou) return;
    redirecionou = true;
    push({ event: 'whatsapp_redirect', origem: 'obrigado_automatico', procedimento: lead.procedimento, lead_id: lead.lead_id });
    window.location.href = url;
  }

  var inicio = Date.now();
  var atraso = typeof CFG.REDIRECT_DELAY_MS === 'number' ? CFG.REDIRECT_DELAY_MS : 1500;
  var limite = typeof CFG.REDIRECT_TIMEOUT_MS === 'number' ? CFG.REDIRECT_TIMEOUT_MS : 2500;

  var userData = { phone_number: telefoneE164(lead.whatsapp), address: { first_name: primeiroNome, country: 'BR' } };
  if (sobrenome) userData.address.last_name = sobrenome;

  push({ ecommerce: null, user_data: null });
  push({
    event: 'generate_lead',
    lead_id: lead.lead_id,
    procedimento: lead.procedimento,
    procedimento_slug: lead.procedimento_slug,
    value: lead.valor,
    currency: CFG.MOEDA || 'BRL',
    user_data: userData,
    eventCallback: function () {
      var restante = Math.max(0, atraso - (Date.now() - inicio));
      window.setTimeout(irParaWhatsApp, restante);
    },
    eventTimeout: limite
  });

  // Rede de segurança caso o GTM esteja bloqueado (bloqueador de anúncios, falha de rede)
  window.setTimeout(irParaWhatsApp, limite);

  // Clique manual no botão também conta como redirecionamento
  if (botaoLead) {
    botaoLead.setAttribute('data-sem-evento', '');
    botaoLead.addEventListener('click', function () {
      if (redirecionou) return;
      redirecionou = true;
      push({ event: 'whatsapp_redirect', origem: 'obrigado_botao', procedimento: lead.procedimento, lead_id: lead.lead_id });
    });
  }
})();
