/* =====================================================================
   ÍNDICE DESTE ARQUIVO
   1. Configurações gerais (data do casamento, WhatsApp, lista de presentes)
   2. Funções utilitárias (formatar data, escapar texto, etc.)
   3. Cabeçalho: menu "sólido" ao rolar a página
   4. Menu mobile (botão hambúrguer)
   5. Animação de entrada das seções ao rolar (scroll reveal)
   6. Contagem regressiva
   7. Lista de presentes interativa
   8. Contato: links de WhatsApp e e-mail
   9. Confirmação de presença (RSVP)
   10. Inicialização: roda tudo quando a página carrega

   Cada função tem um comentário em cima explicando o que ela faz.
===================================================================== */


/* =====================================================================
   1. CONFIGURAÇÕES GERAIS
   Os valores mais comuns de editar ficam concentrados aqui no topo.
===================================================================== */

// Data e horário da cerimônia, usados na contagem regressiva.
// Formato: 'AAAA-MM-DDTHH:MM:SS-03:00'  (o -03:00 é o fuso de Brasília)
const WEDDING_DATE = new Date('2027-02-14T16:00:00-03:00').getTime();

// E-mail que recebe as mensagens do formulário de contato.
// TROQUE pelo e-mail real do casal.
const CONTACT_EMAIL = 'felipe.e.ana@exemplo.com';

// Número de WhatsApp do casal, só números, com código do país e DDD
// (ex: 55 = Brasil, 41 = DDD de Curitiba/região). É usado no link de
// WhatsApp da seção de contato, e também para avisar o casal quando
// alguém reserva um presente ou confirma presença.
// TROQUE por um número real — esse é só um exemplo.
const WHATSAPP_NUMBER = '5541999999999';

// Lista de presentes exibida na seção "Lista de presentes".
// Para adicionar um presente novo, copie um objeto abaixo e ajuste:
//   id   -> um "apelido" único, sem espaços/acentos (usado internamente)
//   name -> nome mostrado ao convidado
//   note -> frase curta explicando o presente
//   type -> 'gift' (ícone de caixa) ou 'honeymoon' (ícone de coração,
//           para contribuições com a lua de mel)
const GIFTS = [
  { id: 'panelas',          name: 'Jogo de panelas',        note: 'Para cozinharmos juntos no novo lar.',              type: 'gift' },
  { id: 'liquidificador',   name: 'Liquidificador',         note: 'Vitaminas de domingo de manhã.',                    type: 'gift' },
  { id: 'jogo-cama',        name: 'Jogo de cama casal',     note: 'Noites de sono tranquilas.',                        type: 'gift' },
  { id: 'toalhas',          name: 'Kit de toalhas',         note: 'Pra deixar a casa nova com mais aconchego.',        type: 'gift' },
  { id: 'cafeteira',        name: 'Cafeteira',              note: 'Café coado é ritual sagrado por aqui.',             type: 'gift' },
  { id: 'jantar-lua-mel',   name: 'Jantar na lua de mel',   note: 'Uma noite especial só dos dois.',                   type: 'honeymoon' },
  { id: 'passeio-lua-mel',  name: 'Passeio na lua de mel',  note: 'Ajude a gente a explorar o novo destino.',          type: 'honeymoon' },
  { id: 'churrasqueira',    name: 'Churrasqueira portátil', note: 'Pros primeiros churrascos com os amigos.',         type: 'gift' }
];

// Chave usada para salvar as reservas no localStorage do navegador do
// convidado. Se você mudar esse texto, reservas antigas "somem".
const STORAGE_KEY = 'casamento-felipe-ana-reservas';


/* =====================================================================
   2. FUNÇÕES UTILITÁRIAS
===================================================================== */

/** Adiciona um zero à esquerda em números menores que 10. pad(7) -> "07" */
function pad(number) {
  return String(number).padStart(2, '0');
}

/** Transforma uma data ISO em "31/07/2026". */
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Evita que um texto digitado pelo convidado quebre o HTML da página
 * (por exemplo, se alguém digitar "<b>" no campo nome).
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


/* =====================================================================
   3. CABEÇALHO: MENU "SÓLIDO" AO ROLAR
===================================================================== */

/**
 * Deixa o menu do topo com fundo claro depois que o visitante rola um
 * pouco a página. Antes disso, o menu fica transparente sobre o hero.
 */
function initHeaderScroll() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }

  document.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
}


/* =====================================================================
   4. MENU MOBILE (BOTÃO HAMBÚRGUER)
===================================================================== */

/**
 * Controla o botão "hambúrguer" que abre/fecha o menu no celular.
 * Como agora o site é uma única página, cada link do menu é uma
 * âncora (ex: #local) — por isso é importante fechar o menu assim
 * que o convidado toca em uma opção, senão ele fica cobrindo a seção
 * para a qual acabou de navegar.
 */
function initMobileMenu() {
  const toggleButton = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggleButton || !links) return;

  function setMenuOpen(isOpen) {
    links.classList.toggle('open', isOpen);
    toggleButton.classList.toggle('open', isOpen);
    toggleButton.setAttribute('aria-expanded', String(isOpen));
  }

  toggleButton.addEventListener('click', function () {
    setMenuOpen(!links.classList.contains('open'));
  });

  // Fecha o menu automaticamente ao clicar em algum link (essencial no celular)
  links.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () { setMenuOpen(false); });
  });
}


/* =====================================================================
   5. ANIMAÇÃO DE ENTRADA AO ROLAR (SCROLL REVEAL)
===================================================================== */

/**
 * Faz as seções com classe "reveal" aparecerem suavemente conforme o
 * visitante rola a página, usando a IntersectionObserver — uma API do
 * navegador que avisa quando um elemento entra na área visível da tela.
 */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (elements.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(function (el) { el.classList.add('in-view'); });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(function (el) { observer.observe(el); });
}


/* =====================================================================
   6. CONTAGEM REGRESSIVA
===================================================================== */

/**
 * Atualiza os números da contagem regressiva a cada segundo, com base
 * na constante WEDDING_DATE definida no topo deste arquivo.
 */
function initCountdown() {
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-min');
  const secondsEl = document.getElementById('cd-sec');
  if (!daysEl) return;

  function updateCountdown() {
    const millisecondsLeft = WEDDING_DATE - Date.now();

    if (millisecondsLeft <= 0) {
      daysEl.textContent = hoursEl.textContent = minutesEl.textContent = secondsEl.textContent = '00';
      return;
    }

    const oneSecond = 1000, oneMinute = oneSecond * 60, oneHour = oneMinute * 60, oneDay = oneHour * 24;

    daysEl.textContent = pad(Math.floor(millisecondsLeft / oneDay));
    hoursEl.textContent = pad(Math.floor((millisecondsLeft / oneHour) % 24));
    minutesEl.textContent = pad(Math.floor((millisecondsLeft / oneMinute) % 60));
    secondsEl.textContent = pad(Math.floor((millisecondsLeft / oneSecond) % 60));
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}


/* =====================================================================
   7. LISTA DE PRESENTES INTERATIVA
   - GIFTS (lá em cima) é a lista "fixa" de presentes disponíveis.
   - reservations é um objeto salvo no localStorage, no formato
     { idDoPresente: { name, date } }.
   - render() reconstrói a lista inteira a cada mudança.
===================================================================== */

function loadReservations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Não foi possível ler as reservas salvas:', error);
    return {};
  }
}

function saveReservations(reservations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  } catch (error) {
    console.error('Não foi possível salvar a reserva:', error);
  }
}

/**
 * Monta o HTML de um único card de presente, de acordo com o estado
 * atual dele: disponível, com o formulário de reserva aberto, ou já
 * reservado por alguém.
 */
function renderGiftCard(gift, reservation, isFormOpen) {
  const iconId = gift.type === 'honeymoon' ? 'ico-heart' : 'ico-gift';

  if (reservation) {
    const guestName = reservation.name ? escapeHtml(reservation.name) : 'um convidado especial';
    return `
      <article class="gift-card is-reserved" data-gift-id="${gift.id}">
        <span class="reserved-ribbon">Reservado</span>
        <svg class="gift-icon"><use href="#${iconId}"/></svg>
        <h3>${escapeHtml(gift.name)}</h3>
        <p class="gift-note">${escapeHtml(gift.note)}</p>
        <p class="gift-reserved-info">
          Reservado por <strong>${guestName}</strong><br>
          em ${formatDate(reservation.date)}
        </p>
        <button type="button" class="btn-ghost gift-unreserve" data-action="unreserve" data-gift-id="${gift.id}">Cancelar reserva</button>
      </article>`;
  }

  if (isFormOpen) {
    return `
      <article class="gift-card" data-gift-id="${gift.id}">
        <svg class="gift-icon"><use href="#${iconId}"/></svg>
        <h3>${escapeHtml(gift.name)}</h3>
        <p class="gift-note">${escapeHtml(gift.note)}</p>
        <div class="gift-form">
          <label for="input-${gift.id}">Seu nome (opcional)</label>
          <input type="text" id="input-${gift.id}" data-gift-id="${gift.id}" placeholder="Ex: Ana e João" maxlength="60">
          <div class="gift-form-actions">
            <button type="button" class="btn-ghost" data-action="cancel" data-gift-id="${gift.id}">Cancelar</button>
            <button type="button" class="btn-primary" data-action="confirm" data-gift-id="${gift.id}">Confirmar reserva</button>
          </div>
        </div>
      </article>`;
  }

  return `
    <article class="gift-card" data-gift-id="${gift.id}">
      <svg class="gift-icon"><use href="#${iconId}"/></svg>
      <h3>${escapeHtml(gift.name)}</h3>
      <p class="gift-note">${escapeHtml(gift.note)}</p>
      <button type="button" class="btn-reserve" data-action="open" data-gift-id="${gift.id}">Quero presentear</button>
    </article>`;
}

/**
 * Liga toda a funcionalidade da lista de presentes: desenha os cards,
 * abre/fecha o formulário de reserva e salva a escolha do convidado.
 */
function initGiftRegistry() {
  const grid = document.getElementById('giftGrid');
  if (!grid) return;

  let reservations = loadReservations();
  let openFormId = null;

  function render() {
    grid.innerHTML = GIFTS.map(function (gift) {
      return renderGiftCard(gift, reservations[gift.id], gift.id === openFormId);
    }).join('');
  }

  // Confirma a reserva e redireciona o convidado para o WhatsApp do
  // casal, com uma mensagem pronta avisando qual presente ele
  // escolheu — assim o casal fica sabendo de verdade, e não só o
  // navegador do próprio convidado (ver STORAGE_KEY, lá em cima).
  function confirmReservation(giftId) {
    const gift = GIFTS.find(function (g) { return g.id === giftId; });
    const input = document.getElementById('input-' + giftId);
    const guestName = input ? input.value.trim() : '';

    reservations[giftId] = { name: guestName, date: new Date().toISOString() };
    saveReservations(reservations);
    openFormId = null;
    render();

    const message = 'Oi Felipe e Ana! Aqui é ' + (guestName || 'um convidado') + '. '
      + 'Quero presentear vocês com: ' + (gift ? gift.name : 'um presente da lista') + ' 🎁';
    window.location.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  }

  function unreserveGift(giftId) {
    if (!window.confirm('Cancelar a reserva deste presente?')) return;
    delete reservations[giftId];
    saveReservations(reservations);
    render();
  }

  // Delegação de eventos: um único listener no container cuida de
  // todos os botões, mesmo que os cards sejam recriados a cada render().
  grid.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const giftId = button.dataset.giftId;
    const action = button.dataset.action;

    if (action === 'open') { openFormId = giftId; render(); }
    else if (action === 'cancel') { openFormId = null; render(); }
    else if (action === 'confirm') { confirmReservation(giftId); }
    else if (action === 'unreserve') { unreserveGift(giftId); }
  });

  grid.addEventListener('keydown', function (event) {
    if (event.target.matches('input[data-gift-id]') && event.key === 'Enter') {
      event.preventDefault();
      confirmReservation(event.target.dataset.giftId);
    }
  });

  render();
}


/* =====================================================================
   8. CONTATO: LINKS DE WHATSAPP E E-MAIL
   Como o site não tem servidor por trás, os links funcionam abrindo o
   aplicativo (WhatsApp ou e-mail) do PRÓPRIO convidado, já pronto
   para enviar — não existe formulário de contato separado: use o
   RSVP para mensagens relacionadas à presença, e estes links para
   qualquer outra coisa.
===================================================================== */

/**
 * Preenche automaticamente os links de contato que dependem das
 * constantes lá no topo deste arquivo:
 *   - qualquer link com id="whatsappLink" recebe o número de WHATSAPP_NUMBER
 *   - qualquer link com id="emailLink" recebe o endereço de CONTACT_EMAIL
 * Assim, só se edita o número/e-mail em UM lugar (aqui em cima) em vez
 * de precisar mexer no HTML.
 */
function initContactLinks() {
  document.querySelectorAll('#whatsappLink').forEach(function (link) {
    link.href = 'https://wa.me/' + WHATSAPP_NUMBER;
  });
  document.querySelectorAll('#emailLink').forEach(function (link) {
    link.href = 'mailto:' + CONTACT_EMAIL;
    if (!link.textContent.trim()) link.textContent = CONTACT_EMAIL;
  });
}


/* =====================================================================
   9. CONFIRMAÇÃO DE PRESENÇA (RSVP)
   Uma das funcionalidades mais importantes do site. Como não há
   servidor, a confirmação é enviada como mensagem de WhatsApp para o
   casal — o convidado preenche o formulário e só confirma o envio.
===================================================================== */

/**
 * Liga o formulário de confirmação de presença. Monta uma mensagem de
 * WhatsApp com nome, se vai ou não comparecer, quantas pessoas e uma
 * mensagem opcional, e redireciona o convidado para o WhatsApp do casal.
 */
function initRsvpForm() {
  const form = document.getElementById('rsvpForm');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('rsvp-name').value.trim();
    const attendingInput = form.querySelector('input[name="attending"]:checked');
    const attending = attendingInput ? attendingInput.value : 'sim';
    const guestCount = document.getElementById('rsvp-guests').value.trim();
    const note = document.getElementById('rsvp-message').value.trim();

    let message = 'Oi Felipe e Ana! Aqui é ' + (name || 'um convidado') + '. ';
    if (attending === 'sim') {
      message += 'Confirmo minha presença no casamento de vocês! 🎉';
      if (guestCount) message += ' Vamos ' + guestCount + ' pessoa(s), incluindo eu.';
    } else {
      message += 'Infelizmente não vou conseguir comparecer ao casamento de vocês. 💔';
    }
    if (note) message += ' Mensagem: ' + note;

    window.location.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  });
}


/* =====================================================================
   10. INICIALIZAÇÃO
   Ponto de entrada do arquivo: roda todas as funções acima assim que
   o HTML da página termina de carregar. Cada função verifica sozinha
   se os elementos que ela precisa existem — por isso é seguro chamar
   todas elas mesmo sendo uma única página.
===================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  initHeaderScroll();
  initMobileMenu();
  initScrollReveal();
  initCountdown();
  initGiftRegistry();
  initContactLinks();
  initRsvpForm();
});
