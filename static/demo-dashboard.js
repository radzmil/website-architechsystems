(() => {
  const leads = [
    { name: 'Aina', phone: '01X-XXX 1201', messages: [[{ ms: 'Hai, saya nak tahu tentang pakej bot.', en: 'Hi, I would like to know about the bot packages.' }, false], [{ ms: 'Hai Aina! Kami ada pilihan pakej untuk perniagaan. Nak saya terangkan?', en: 'Hi Aina! We offer several packages for businesses. Would you like to know more?' }, true]] },
    { name: 'Hafiz', phone: '01X-XXX 2402', messages: [[{ ms: 'Boleh bot jawab pelanggan waktu malam?', en: 'Can the bot answer customers at night?' }, false], [{ ms: 'Ya, bot boleh membalas pertanyaan lazim secara automatik 24/7.', en: 'Yes, the bot can automatically answer common questions 24/7.' }, true]] },
    { name: 'Sara', phone: '01X-XXX 3603', messages: [[{ ms: 'Macam mana nak mula?', en: 'How do I get started?' }, false], [{ ms: 'Pasukan kami boleh bantu persediaan awal dan tetapan aliran bot.', en: 'Our team can help with the initial setup and bot conversation flow.' }, true]] }
  ];
  const copy = {
    ms: { sample: ' (contoh)', fictional: ' · nombor rekaan', conversation: 'Perbualan contoh: ', empty: 'Tiada prospek contoh ditemui.', view: 'Paparan ', suffix: ' · data simulasi sahaja.', mode: 'Mod ', chosen: ' dipilih untuk simulasi sahaja.', sent: 'Mesej simulasi dipaparkan. Tiada mesej WhatsApp dihantar.', saved: 'Tetapan simulasi dikemas kini dalam paparan ini sahaja. Tiada data disimpan.', initial: 'Pilih prospek untuk melihat perbualan contoh.' },
    en: { sample: ' (sample)', fictional: ' · fictional number', conversation: 'Sample conversation: ', empty: 'No sample leads found.', view: 'View: ', suffix: ' · simulated data only.', mode: 'Mode ', chosen: ' selected for simulation only.', sent: 'Simulated message displayed. No WhatsApp message was sent.', saved: 'Simulation settings updated in this view only. No data was saved.', initial: 'Select a lead to view a sample conversation.' }
  };
  const language = () => localStorage.getItem('architech_lang') === 'ms' ? 'ms' : 'en';
  const label = (lead) => lead.name + copy[language()].sample;
  let noticeKind = 'initial';
  let noticeValue = '';
  function updateNotice() {
    const text = copy[language()];
    const view = document.querySelector('.demo-nav[data-view="' + noticeValue + '"]');
    notice.textContent = noticeKind === 'lead' ? text.conversation + label(leads[Number(noticeValue)])
      : noticeKind === 'view' ? text.view + view.textContent.trim() + text.suffix
      : noticeKind === 'mode' ? text.mode + document.querySelector('#demo-mode option:checked').textContent + text.chosen
      : text[noticeKind];
  }
  function setNotice(kind, value = '') { noticeKind = kind; noticeValue = value; updateNotice(); }
  let selected = 0;
  const notice = document.getElementById('demo-notice');
  const leadList = document.getElementById('demo-leads');
  const messages = document.getElementById('demo-messages');
  function showLead() {
    document.getElementById('demo-contact').textContent = label(leads[selected]);
    document.getElementById('demo-phone').textContent = leads[selected].phone + copy[language()].fictional;
    messages.replaceChildren();
    leads[selected].messages.forEach(([text, sent]) => {
      const bubble = document.createElement('div');
      bubble.className = 'demo-bubble' + (sent ? ' sent' : '');
      bubble.textContent = typeof text === 'string' ? text : text[language()];
      messages.appendChild(bubble);
    });
    leadList.querySelectorAll('button').forEach((button) => button.classList.toggle('active', Number(button.dataset.index) === selected));
  }
  function renderLeads() {
    const query = document.getElementById('demo-search').value.trim().toLowerCase();
    leadList.replaceChildren();
    leads.forEach((lead, index) => {
      if (!(lead.name + ' ' + lead.phone + ' ' + copy.ms.sample + ' ' + copy.en.sample).toLowerCase().includes(query)) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'demo-lead';
      button.dataset.index = index;
      button.textContent = label(lead);
      const small = document.createElement('small');
      small.textContent = lead.phone;
      button.appendChild(small);
      button.addEventListener('click', () => { selected = index; showLead(); setNotice('lead', index); });
      leadList.appendChild(button);
    });
    if (!leadList.children.length) leadList.textContent = copy[language()].empty;
    showLead();
  }
  document.getElementById('demo-search').addEventListener('input', renderLeads);
  document.querySelectorAll('.demo-nav').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.demo-nav').forEach((nav) => nav.classList.toggle('active', nav === button));
    document.querySelectorAll('.demo-view').forEach((view) => { view.hidden = view.id !== 'view-' + button.dataset.view; });
    setNotice('view', button.dataset.view);
  }));
  document.getElementById('demo-mode').addEventListener('change', () => setNotice('mode'));
  document.getElementById('demo-reply').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('demo-text');
    const text = input.value.trim();
    if (!text) return;
    leads[selected].messages.push([text, true]);
    input.value = '';
    showLead();
    setNotice('sent');
  });
  document.getElementById('demo-save').addEventListener('click', () => setNotice('saved'));
  window.addEventListener('architech:languagechange', () => { renderLeads(); updateNotice(); });
  renderLeads();
})();