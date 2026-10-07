(() => {
  const leads = [
    { name: 'Aina (contoh)', phone: '01X-XXX 1201', messages: [['Hai, saya nak tahu tentang pakej bot.', false], ['Hai Aina! Kami ada pilihan pakej untuk perniagaan. Nak saya terangkan?', true]] },
    { name: 'Hafiz (contoh)', phone: '01X-XXX 2402', messages: [['Boleh bot jawab pelanggan waktu malam?', false], ['Ya, bot boleh membalas pertanyaan lazim secara automatik 24/7.', true]] },
    { name: 'Sara (contoh)', phone: '01X-XXX 3603', messages: [['Macam mana nak mula?', false], ['Pasukan kami boleh bantu persediaan awal dan tetapan aliran bot.', true]] }
  ];
  let selected = 0;
  const notice = document.getElementById('demo-notice');
  const leadList = document.getElementById('demo-leads');
  const messages = document.getElementById('demo-messages');
  function showLead() {
    document.getElementById('demo-contact').textContent = leads[selected].name;
    document.getElementById('demo-phone').textContent = leads[selected].phone + ' · nombor rekaan';
    messages.replaceChildren();
    leads[selected].messages.forEach(([text, sent]) => {
      const bubble = document.createElement('div');
      bubble.className = 'demo-bubble' + (sent ? ' sent' : '');
      bubble.textContent = text;
      messages.appendChild(bubble);
    });
    leadList.querySelectorAll('button').forEach((button) => button.classList.toggle('active', Number(button.dataset.index) === selected));
  }
  function renderLeads() {
    const query = document.getElementById('demo-search').value.trim().toLowerCase();
    leadList.replaceChildren();
    leads.forEach((lead, index) => {
      if (!(lead.name + ' ' + lead.phone).toLowerCase().includes(query)) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'demo-lead';
      button.dataset.index = index;
      button.textContent = lead.name;
      const small = document.createElement('small');
      small.textContent = lead.phone;
      button.appendChild(small);
      button.addEventListener('click', () => { selected = index; showLead(); notice.textContent = 'Perbualan contoh: ' + lead.name; });
      leadList.appendChild(button);
    });
    if (!leadList.children.length) leadList.textContent = 'Tiada prospek contoh ditemui.';
    showLead();
  }
  document.getElementById('demo-search').addEventListener('input', renderLeads);
  document.querySelectorAll('.demo-nav').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.demo-nav').forEach((nav) => nav.classList.toggle('active', nav === button));
    document.querySelectorAll('.demo-view').forEach((view) => { view.hidden = view.id !== 'view-' + button.dataset.view; });
    notice.textContent = 'Paparan ' + button.textContent.trim() + ' · data simulasi sahaja.';
  }));
  document.getElementById('demo-mode').addEventListener('change', (event) => { notice.textContent = 'Mod ' + (event.target.value === 'ai' ? 'AI automatik' : 'Manual') + ' dipilih untuk simulasi sahaja.'; });
  document.getElementById('demo-reply').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('demo-text');
    const text = input.value.trim();
    if (!text) return;
    leads[selected].messages.push([text, true]);
    input.value = '';
    showLead();
    notice.textContent = 'Mesej simulasi dipaparkan. Tiada mesej WhatsApp dihantar.';
  });
  document.getElementById('demo-save').addEventListener('click', () => { notice.textContent = 'Tetapan simulasi dikemas kini dalam paparan ini sahaja. Tiada data disimpan.'; });
  renderLeads();
})();