/*
 * Comportamentos gerais: consentimento (LGPD/Consent Mode v2), atribuição (gclid/UTM),
 * CTAs, cliques em telefone, menu mobile, barra fixa, galeria, mapa e ano do rodapé.
 */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  var dataLayer = (window.dataLayer = window.dataLayer || []);
  var reduzMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function push(obj) {
    dataLayer.push(obj);
  }

  function lsGet(chave) {
    try { return window.localStorage.getItem(chave); } catch (e) { return null; }
  }
  function lsSet(chave, valor) {
    try { window.localStorage.setItem(chave, valor); } catch (e) { /* armazenamento indisponível */ }
  }

  /* ---------- Atribuição: gclid, gbraid, wbraid e UTM ---------- */

  var CHAVE_ATRIB = 'ft_atribuicao';
  var PARAMS = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  function lerAtribuicao() {
    var bruto = lsGet(CHAVE_ATRIB);
    if (!bruto) return {};
    try {
      var dados = JSON.parse(bruto);
      if (!dados || !dados.expira || Date.now() > dados.expira) return {};
      return dados;
    } catch (e) {
      return {};
    }
  }

  function capturarAtribuicao() {
    var busca;
    try { busca = new URLSearchParams(window.location.search); } catch (e) { return; }
    var novos = {};
    var achou = false;
    PARAMS.forEach(function (p) {
      var v = busca.get(p);
      if (v) { novos[p] = v.slice(0, 300); achou = true; }
    });
    var atual = lerAtribuicao();
    if (achou) {
      // Novo clique de campanha substitui a atribuição anterior (último clique)
      novos.landing_page = window.location.pathname;
      novos.capturado_em = new Date().toISOString();
      novos.expira = Date.now() + (CFG.ATRIBUICAO_DIAS || 90) * 864e5;
      lsSet(CHAVE_ATRIB, JSON.stringify(novos));
    } else if (!atual.landing_page) {
      lsSet(CHAVE_ATRIB, JSON.stringify({
        landing_page: window.location.pathname,
        capturado_em: new Date().toISOString(),
        expira: Date.now() + (CFG.ATRIBUICAO_DIAS || 90) * 864e5
      }));
    }
  }

  capturarAtribuicao();

  /* ---------- Consentimento (Google Consent Mode v2) ---------- */

  var CHAVE_CONSENT = 'ft_consentimento';

  function aplicarConsentimento(aceito) {
    var estado = aceito ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: estado,
        ad_user_data: estado,
        ad_personalization: estado,
        analytics_storage: estado
      });
    }
    push({ event: 'consent_update', consentimento: estado });
  }

  function iniciarBannerConsentimento() {
    var banner = document.getElementById('consentimento');
    if (!banner) return;
    var escolha = lsGet(CHAVE_CONSENT);
    if (escolha === 'granted' || escolha === 'denied') return;
    banner.hidden = false;
    banner.addEventListener('click', function (ev) {
      var botao = ev.target.closest('[data-consentimento]');
      if (!botao) return;
      var aceito = botao.getAttribute('data-consentimento') === 'aceitar';
      lsSet(CHAVE_CONSENT, aceito ? 'granted' : 'denied');
      aplicarConsentimento(aceito);
      banner.hidden = true;
    });
  }

  // Link "Preferências de cookies" no rodapé reabre o banner
  document.addEventListener('click', function (ev) {
    var link = ev.target.closest('[data-abrir-consentimento]');
    if (!link) return;
    ev.preventDefault();
    try { window.localStorage.removeItem(CHAVE_CONSENT); } catch (e) { /* ignora */ }
    iniciarBannerConsentimento();
    var banner = document.getElementById('consentimento');
    if (banner) {
      var primeiro = banner.querySelector('button');
      if (primeiro) primeiro.focus();
    }
  });

  /* ---------- CTAs: rolar até o formulário e pré-selecionar procedimento ---------- */

  function secaoDe(el) {
    var s = el.closest('[data-secao]');
    if (s) return s.getAttribute('data-secao');
    var sec = el.closest('section[id], header, footer, nav, aside');
    if (!sec) return '';
    return sec.id || sec.tagName.toLowerCase();
  }

  function rolarAte(alvo) {
    alvo.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth', block: 'start' });
  }

  document.addEventListener('click', function (ev) {
    var cta = ev.target.closest('.js-cta');
    if (!cta) return;
    var procedimento = cta.getAttribute('data-procedimento') || '';
    push({
      event: 'cta_click',
      cta_texto: (cta.getAttribute('data-cta-texto') || cta.textContent || '').trim().replace(/\s+/g, ' '),
      cta_secao: secaoDe(cta),
      procedimento: procedimento
    });

    var url;
    try { url = new URL(cta.href, window.location.href); } catch (e) { return; }
    if (url.pathname !== window.location.pathname || !url.hash) return;
    var alvo = document.getElementById(url.hash.slice(1));
    if (!alvo) return;
    ev.preventDefault();

    if (procedimento) {
      var select = alvo.querySelector('select[name="procedimento"]');
      if (select) {
        select.value = procedimento;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    fecharMenu();
    rolarAte(alvo);
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', url.hash);
    }
    var campo = alvo.querySelector('input:not([type="hidden"]), select, textarea');
    if (campo) {
      window.setTimeout(function () {
        try { campo.focus({ preventScroll: true }); } catch (e) { campo.focus(); }
      }, reduzMovimento ? 0 : 600);
    }
  });

  /* ---------- Cliques em telefone e WhatsApp ---------- */

  document.addEventListener('click', function (ev) {
    var link = ev.target.closest('a[href^="tel:"]');
    if (link) {
      push({ event: 'phone_click', telefone: link.getAttribute('href').replace('tel:', ''), cta_secao: secaoDe(link) });
      return;
    }
    var wa = ev.target.closest('a[href*="wa.me/"]');
    if (wa && !wa.hasAttribute('data-sem-evento')) {
      push({ event: 'whatsapp_redirect', origem: wa.getAttribute('data-origem') || secaoDe(wa) });
    }
  });

  /* ---------- Menu mobile ---------- */

  var botaoMenu = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu-principal');

  function fecharMenu() {
    if (!botaoMenu || !menu) return;
    botaoMenu.setAttribute('aria-expanded', 'false');
    menu.classList.remove('aberto');
  }

  if (botaoMenu && menu) {
    botaoMenu.addEventListener('click', function () {
      var aberto = botaoMenu.getAttribute('aria-expanded') === 'true';
      botaoMenu.setAttribute('aria-expanded', String(!aberto));
      menu.classList.toggle('aberto', !aberto);
    });
    menu.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) fecharMenu();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && menu.classList.contains('aberto')) {
        fecharMenu();
        botaoMenu.focus();
      }
    });
  }

  /* ---------- Barra fixa no mobile: some quando o formulário está visível ---------- */

  var barra = document.querySelector('.barra-mobile');
  var secaoForm = document.getElementById('agendar');
  if (barra && secaoForm && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        barra.classList.toggle('oculta', e.isIntersecting);
      });
    }, { threshold: 0.15 });
    obs.observe(secaoForm);
  }

  /* ---------- Galeria de antes e depois com lightbox ---------- */

  function iniciarGaleria(galeria) {
    var itens = Array.prototype.slice.call(galeria.querySelectorAll('.galeria-item'));
    var verMais = galeria.parentNode.querySelector('.js-ver-mais');
    if (verMais) {
      verMais.addEventListener('click', function () {
        galeria.classList.add('expandida');
        verMais.hidden = true;
        var proximo = galeria.querySelector('.galeria-item.extra button');
        if (proximo) proximo.focus();
      });
    }

    function visiveis() {
      var expandida = galeria.classList.contains('expandida');
      return itens.filter(function (it) { return expandida || !it.classList.contains('extra'); });
    }

    var dialogo = document.getElementById('lightbox');
    if (!dialogo || typeof dialogo.showModal !== 'function') return;
    var imgGrande = dialogo.querySelector('img');
    var fonteAvif = dialogo.querySelector('source[type="image/avif"]');
    var fonteWebp = dialogo.querySelector('source[type="image/webp"]');
    var legenda = dialogo.querySelector('.lightbox-legenda');
    var contador = dialogo.querySelector('.lightbox-contador');
    var indice = 0;

    function mostrar(i) {
      var lista = visiveis();
      if (!lista.length) return;
      indice = (i + lista.length) % lista.length;
      var b = lista[indice].querySelector('button');
      var base = b.getAttribute('data-base');
      fonteAvif.srcset = base + '-1080.avif';
      fonteWebp.srcset = base + '-1080.webp';
      imgGrande.src = base + '-1080.webp';
      imgGrande.alt = b.querySelector('img').alt;
      legenda.textContent = b.getAttribute('data-legenda') || '';
      contador.textContent = (indice + 1) + ' de ' + lista.length;
    }

    galeria.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-base]');
      if (!b) return;
      mostrar(visiveis().indexOf(b.closest('.galeria-item')));
      dialogo.showModal();
      dialogo.dataset.origem = itens.indexOf(b.closest('.galeria-item'));
    });

    dialogo.addEventListener('click', function (ev) {
      if (ev.target === dialogo || ev.target.closest('[data-fechar]')) dialogo.close();
      else if (ev.target.closest('[data-anterior]')) mostrar(indice - 1);
      else if (ev.target.closest('[data-proximo]')) mostrar(indice + 1);
    });
    dialogo.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); mostrar(indice - 1); }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); mostrar(indice + 1); }
    });
    dialogo.addEventListener('close', function () {
      var origem = itens[Number(dialogo.dataset.origem)];
      if (origem) origem.querySelector('button').focus();
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('.galeria'), iniciarGaleria);

  /* ---------- Mapa sob demanda (não carrega o Google Maps sem clique) ---------- */

  document.addEventListener('click', function (ev) {
    var botao = ev.target.closest('.js-carregar-mapa');
    if (!botao) return;
    var caixa = botao.closest('.mapa');
    var iframe = document.createElement('iframe');
    iframe.src = botao.getAttribute('data-src');
    iframe.title = 'Mapa da localização do consultório em Criciúma';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.setAttribute('allowfullscreen', '');
    caixa.innerHTML = '';
    caixa.appendChild(iframe);
    caixa.classList.add('carregado');
  });

  /* ---------- Ano no rodapé ---------- */

  Array.prototype.forEach.call(document.querySelectorAll('.js-ano'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  iniciarBannerConsentimento();

  // Utilidades compartilhadas com form.js e obrigado.js
  window.FT = {
    push: push,
    lerAtribuicao: lerAtribuicao
  };
})();
