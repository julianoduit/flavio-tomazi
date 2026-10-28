/*
 * Formulário de agendamento: máscara, validação acessível, eventos no dataLayer,
 * backup opcional do lead via webhook e redirecionamento para /obrigado/.
 */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var form = document.getElementById('form-agendar');
  if (!form) return;

  var FT = window.FT || {};
  var push = FT.push || function (o) { (window.dataLayer = window.dataLayer || []).push(o); };
  var lerAtribuicao = FT.lerAtribuicao || function () { return {}; };

  form.setAttribute('novalidate', '');
  var resumo = form.querySelector('.form-resumo-erros');
  var botao = form.querySelector('button[type="submit"]');
  var campoTel = form.elements.whatsapp;

  /* ---------- Máscara de telefone: (48) 99999-9999 ---------- */

  function soDigitos(v) {
    return (v || '').replace(/\D/g, '');
  }

  function formatarTelefone(v) {
    var d = soDigitos(v);
    if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
    d = d.slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  if (campoTel) {
    campoTel.addEventListener('input', function () {
      var fim = campoTel.selectionStart === campoTel.value.length;
      campoTel.value = formatarTelefone(campoTel.value);
      if (fim) campoTel.setSelectionRange(campoTel.value.length, campoTel.value.length);
    });
  }

  /* ---------- form_start (uma vez por página) ---------- */

  var iniciou = false;
  function marcarInicio() {
    if (iniciou) return;
    iniciou = true;
    push({ event: 'form_start', form_id: form.id, procedimento: valorProcedimento() });
  }
  form.addEventListener('focusin', marcarInicio);
  form.addEventListener('input', marcarInicio);

  function valorProcedimento() {
    var el = form.elements.procedimento;
    return el ? (el.value || '') : '';
  }

  /* ---------- Validação ---------- */

  var regras = {
    nome: function (v) {
      if (!v.trim()) return 'Informe seu nome.';
      if (v.trim().length < 2) return 'Informe seu nome completo.';
      return '';
    },
    whatsapp: function (v) {
      var d = soDigitos(v);
      if (!d) return 'Informe seu WhatsApp com DDD.';
      if (d.length < 10 || d.length > 11) return 'Informe um número com DDD, por exemplo (48) 99999-9999.';
      return '';
    },
    procedimento: function (v) {
      return v ? '' : 'Selecione o procedimento de interesse.';
    },
    consentimento: function (v, el) {
      return el.checked ? '' : 'Para continuar, aceite a política de privacidade.';
    }
  };

  function mostrarErro(nome, msg) {
    var el = form.elements[nome];
    var erro = document.getElementById('erro-' + nome);
    if (!el || !erro) return;
    erro.textContent = msg;
    if (msg) {
      el.setAttribute('aria-invalid', 'true');
    } else {
      el.removeAttribute('aria-invalid');
    }
  }

  function validarCampo(nome) {
    var el = form.elements[nome];
    if (!el || el.type === 'hidden') return '';
    var msg = regras[nome](el.value || '', el);
    mostrarErro(nome, msg);
    return msg;
  }

  Object.keys(regras).forEach(function (nome) {
    var el = form.elements[nome];
    if (!el || el.type === 'hidden') return;
    var evento = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(evento, function () {
      if (el.type === 'checkbox' || el.tagName === 'SELECT' || el.value) validarCampo(nome);
    });
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validarCampo(nome);
    });
  });

  /* ---------- Lead ---------- */

  function gerarId() {
    var aleatorio = '';
    try {
      var arr = new Uint32Array(2);
      window.crypto.getRandomValues(arr);
      aleatorio = arr[0].toString(36) + arr[1].toString(36);
    } catch (e) {
      aleatorio = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
    return 'ft-' + Date.now().toString(36) + '-' + aleatorio.slice(0, 10);
  }

  function texto(nome) {
    var el = form.elements[nome];
    return el ? String(el.value || '').trim() : '';
  }

  function textoSelecionado(nome) {
    var el = form.elements[nome];
    if (!el) return '';
    if (el.tagName === 'SELECT') {
      var op = el.options[el.selectedIndex];
      return op && op.value ? op.text.trim() : '';
    }
    if (el.length && !el.tagName) {
      // grupo de radios
      for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value;
      return '';
    }
    return String(el.value || '').trim();
  }

  function montarLead() {
    var atrib = lerAtribuicao();
    var procedimento = texto('procedimento');
    var info = (CFG.PROCEDIMENTOS || {})[procedimento] || {};
    var lead = {
      lead_id: gerarId(),
      data_hora: new Date().toISOString(),
      nome: texto('nome').replace(/\s+/g, ' '),
      whatsapp: soDigitos(texto('whatsapp')),
      procedimento: procedimento,
      procedimento_slug: info.slug || 'outro-assunto',
      valor: typeof info.valor === 'number' ? info.valor : (CFG.VALOR_PADRAO || 0),
      periodo: textoSelecionado('periodo'),
      mensagem: texto('mensagem').slice(0, 1000),
      pagina_origem: window.location.href.split('#')[0],
      landing_page: atrib.landing_page || '',
      consentimento_lgpd: true
    };
    ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (p) {
      var oculto = form.elements[p];
      lead[p] = (oculto && oculto.value) || atrib[p] || '';
    });
    return lead;
  }

  // Preenche os campos ocultos (útil para quem inspeciona o formulário e para o webhook)
  function preencherOcultos() {
    var atrib = lerAtribuicao();
    if (form.elements.pagina_origem) form.elements.pagina_origem.value = window.location.href.split('#')[0];
    ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (p) {
      if (form.elements[p] && atrib[p]) form.elements[p].value = atrib[p];
    });
  }
  preencherOcultos();

  function enviarWebhook(lead) {
    var url = CFG.LEAD_WEBHOOK_URL;
    if (!url || typeof window.fetch !== 'function') return;
    try {
      window.fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(lead)
      }).catch(function () { /* o fluxo segue mesmo se falhar */ });
    } catch (e) { /* ignora */ }
  }

  function salvarSessao(lead) {
    try {
      window.sessionStorage.setItem('ft_lead', JSON.stringify(lead));
      window.sessionStorage.setItem('lead_pending', 'true');
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- Envio ---------- */

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    marcarInicio();

    var erros = [];
    Object.keys(regras).forEach(function (nome) {
      var msg = validarCampo(nome);
      if (msg) erros.push({ campo: nome, msg: msg });
    });

    if (erros.length) {
      erros.forEach(function (e) {
        push({ event: 'form_error', form_id: form.id, campo: e.campo, erro: e.msg });
      });
      resumo.textContent = erros.length === 1
        ? 'Corrija 1 campo para continuar: ' + erros[0].msg
        : 'Corrija ' + erros.length + ' campos para continuar.';
      var primeiro = form.elements[erros[0].campo];
      if (primeiro && primeiro.focus) primeiro.focus();
      return;
    }

    resumo.textContent = '';
    var lead = montarLead();
    push({ event: 'form_submit_attempt', form_id: form.id, procedimento: lead.procedimento });

    if (botao) {
      botao.disabled = true;
      botao.setAttribute('aria-busy', 'true');
      botao.querySelector('.btn-texto').textContent = 'Enviando...';
    }

    enviarWebhook(lead);

    if (!salvarSessao(lead)) {
      // Sem sessionStorage (modo restrito): abre o WhatsApp direto, sem passar pela /obrigado/
      var linhas = [CFG.MENSAGEM_BASE || '', ''];
      var r = CFG.ROTULOS_MENSAGEM || {};
      linhas.push((r.nome || 'Nome') + ': ' + lead.nome);
      linhas.push((r.procedimento || 'Procedimento de interesse') + ': ' + lead.procedimento);
      if (lead.periodo) linhas.push((r.periodo || 'Melhor período para contato') + ': ' + lead.periodo);
      if (lead.mensagem) linhas.push((r.mensagem || 'Mensagem') + ': ' + lead.mensagem);
      window.location.href = 'https://wa.me/' + CFG.WHATSAPP_NUMERO + '?text=' + encodeURIComponent(linhas.join('\n'));
      return;
    }

    window.location.href = '/obrigado/?p=' + encodeURIComponent(lead.procedimento_slug);
  });

  // Ao voltar para a página pelo botão "voltar", reabilita o botão
  window.addEventListener('pageshow', function () {
    if (botao) {
      botao.disabled = false;
      botao.removeAttribute('aria-busy');
      botao.querySelector('.btn-texto').textContent = botao.getAttribute('data-texto') || 'Enviar e abrir WhatsApp';
    }
  });
})();
