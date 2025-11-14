const chatBody = document.getElementById('chatBody');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const langSelect = document.getElementById('langSelect');

// storage keys
const LS_LANG = 'hb_lang';
const LS_CHAT = 'hb_chat';

// data holders
let translations = null;
let clinics = []; // optional if you add clinics.json later
let currentLang = localStorage.getItem(LS_LANG) || 'en';

// load translations.json on startup
async function loadTranslations() {
  try {
    const r = await fetch('translations.json');
    if (!r.ok) throw new Error('Unable to fetch translations.json');
    translations = await r.json();
    if (!translations[currentLang]) currentLang = 'en';
    if (langSelect) langSelect.value = currentLang;
    applyTranslations();
  } catch (err) {
    console.error('translations.json load failed:', err);
    // fallback: minimal inline translations to keep site usable
    translations = {
      en: {
        siteTitle: "Health Buddy — Easy Disease Help",
        siteSubtitle: "Friendly advice and simple tips. Talk to the bot — it listens.",
        placeholder: "Type your question here...",
        bot_welcome: "Hello! I am Health Buddy. Ask about fever, cough, vaccines or nearby help.",
        rep_fever: "For fever: give water, keep cool, and visit clinic if high or lasting long.",
        rep_cough: "Cough: cover mouth, give warm drinks, seek care if breathing is hard.",
        rep_rash: "For skin rashes: keep area clean, avoid scratching.",
        rep_diarr: "Give ORS and clean fluids.",
        rep_vaccine: "Tell me your village name and I will try to guide you to the nearest clinic.",
        rep_help: "Call your local clinic or tell me your town."
      }
    };
    applyTranslations();
  }
}

// safe translation helper
function t(key) {
  if (translations && translations[currentLang] && translations[currentLang][key]) {
    return translations[currentLang][key];
  }
  if (translations && translations['en'] && translations['en'][key]) {
    return translations['en'][key];
  }
  return key;
}

// apply translations to DOM
function applyTranslations() {
  const title = document.getElementById('siteTitle');
  if (title) title.innerText = t('siteTitle');

  const subtitle = document.getElementById('siteSubtitle');
  if (subtitle) subtitle.innerText = t('siteSubtitle');

  const about = document.getElementById('aboutTitle');
  if (about) about.innerText = t('howThisHelps') || about.innerText;

  const aboutLead = document.querySelector('.card .lead');
  if (aboutLead) aboutLead.innerText = t('howThisHelpsLead') || aboutLead.innerText;

  const faqTitle = document.getElementById('faqTitle');
  if (faqTitle) faqTitle.innerText = t('commonQuestions') || faqTitle.innerText;

  const contactTitle = document.getElementById('contactTitle');
  if (contactTitle) contactTitle.innerText = t('emergencyTitle') || contactTitle.innerText;

  // update FAQ items
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems && faqItems.length >= 3) {
    faqItems[0].querySelector('.faq-q').innerText = t('faq_q1');
    faqItems[0].querySelector('.faq-a').innerText = t('faq_a1');
    faqItems[1].querySelector('.faq-q').innerText = t('faq_q2');
    faqItems[1].querySelector('.faq-a').innerText = t('faq_a2');
    faqItems[2].querySelector('.faq-q').innerText = t('faq_q3');
    faqItems[2].querySelector('.faq-a').innerText = t('faq_a3');
  }

  // update buttons text
  document.querySelectorAll('.btn').forEach(b => {
    const txt = b.classList.contains('light') ? t('chatNow') : t('seeTips');
    b.innerText = txt;
  });

  if (userInput) userInput.placeholder = t('placeholder');
  const foot = document.querySelector('footer');
  if (foot) foot.innerText = t('footer');
}

// language switching
if (langSelect) {
  langSelect.value = currentLang;
  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value || 'en';
    localStorage.setItem(LS_LANG, currentLang);
    applyTranslations();
    // optionally announce language change in chat
    botSay(t('bot_welcome'));
  });
}

// chat history load
let history = JSON.parse(localStorage.getItem(LS_CHAT) || '[]');
history.forEach(m => renderMessage(m));

// if empty, show welcome (translated)
if (!history.length) {
  botSay(t('bot_welcome'));
}

// UI events
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;
  pushMessage({ who: 'user', text, time: Date.now() });
  userInput.value = '';

  // Try server LLM first
  try {
    const reply = await askServerLLM(text, currentLang);
    if (reply) {
      botSay(reply);
      return;
    }
  } catch (err) {
    console.warn('Server LLM failed or not available, falling back:', err);
  }

  // fallback: local keyword replies
  const local = getLocalReply(text);
  botSay(local);
}

function pushMessage(msg) {
  history.push(msg);
  localStorage.setItem(LS_CHAT, JSON.stringify(history));
  renderMessage(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function renderMessage(m) {
  const el = document.createElement('div');
  el.className = 'msg ' + (m.who === 'bot' ? 'bot' : 'user');
  el.innerHTML = `<div>${escapeHtml(m.text)}</div><span class="time">${new Date(m.time).toLocaleString()}</span>`;
  chatBody.appendChild(el);
}

function botSay(text) {
  pushMessage({ who: 'bot', text, time: Date.now() });
}

function escapeHtml(unsafe) {
  return ('' + unsafe)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

/* ------------------ Local fallback keyword replies (translated) ------------------ */
function getLocalReply(text) {
  text = (text || '').toLowerCase();
  if (/where|near|clinic|hospital|vaccin|vaccine|camp|क्लिनिक|कहाँ|नज़दीक/.test(text)) {
    return t('rep_vaccine');
  }
  if (/fever|temperature|hot|cold|बुखार|ಜ್ವರ|జ్వర|காய்ச்சல்/.test(text)) {
    return t('rep_fever');
  }
  if (/cough|cold|breath|breathing|chest|खाँसी|केश|ಕೆಮ್ಮು/.test(text)) {
    return t('rep_cough');
  }
  if (/rash|spot|itch|skin|blister|दाने|ತೋಲು|தோல்/.test(text)) {
    return t('rep_rash');
  }
  if (/diarr|vomit|vomiting|dehydrat|दस्त|దస్త్/.test(text)) {
    return t('rep_diarr');
  }
  if (text.split(/\s+/).length <= 3) return t('bot_more_short');
  return t('bot_more_short');
}

/* ------------- Server LLM function -------------
   - POSTs { message, lang } to /api/chat
   - expects JSON { reply: "text" }
   - your server proxies to an LLM provider (OpenAI, etc.)
   - this keeps the API key out of the browser
----------------------------------------------------------------- */
async function askServerLLM(message, lang) {
  // change path if your server listens elsewhere
  const url = '/api/chat';
  const payload = { message, lang };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('LLM server returned ' + res.status);
  }
  const j = await res.json();
  // server should return { reply: "..." }
  return j && j.reply ? j.reply : null;
}

// helper UI functions used by left column buttons
function showFAQ() {
  botSay(t('rep_fever') + '\n• ' + t('rep_cough') + '\n• ' + t('rep_vaccine'));
  userInput.focus();
}
function startChat() {
  botSay(t('bot_welcome'));
  userInput.focus();
}

// finish startup
loadTranslations();

what changes do I make in this to make this like your given one

