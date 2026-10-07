(() => {
  const translations = [
    ['SIMULATOR DEMO · DATA REKAAN', 'DEMO SIMULATOR · FICTIONAL DATA'],
    ['Tiada sambungan WhatsApp atau akaun klien sebenar', 'No connection to real WhatsApp or customer accounts'],
    ['Pelan demonstrasi', 'Demonstration plan'],
    ['WORKSPACE', 'RUANG KERJA', 'WORKSPACE'],
    ['Pusat Kawalan', 'Control Centre'], ['Phone Book', 'Buku Telefon', 'Phone Book'],
    ['Profil Bot WhatsApp', 'WhatsApp Bot Profile'], ['Penggunaan Token', 'Token Usage'],
    ['CLIENT PORTAL', 'PORTAL PELANGGAN', 'CLIENT PORTAL'],
    ['← Kembali ke produk', '← Back to products'], ['Dashboard / Pusat Kawalan', 'Papan Pemuka / Pusat Kawalan', 'Dashboard / Control Centre'],
    ['Aktiviti mesej simulasi untuk demonstrasi sahaja.', 'Simulated messaging activity for demonstration only.'],
    ['Muat semula', 'Refresh'], ['Pilih prospek untuk melihat perbualan contoh.', 'Select a lead to view a sample conversation.'],
    ['PERBUALAN HARI INI', "TODAY'S CONVERSATIONS"], ['WHATSAPP LEAD', 'PROSPEK WHATSAPP', 'WHATSAPP LEADS'],
    ['BALASAN AUTOMATIK', 'AUTOMATED REPLIES'], ['Data simulasi', 'Simulated data'],
    ['Prospek aktif · demo', 'Active leads · demo'], ['Aktif', 'Active'], ['Simulasi sahaja', 'Simulation only'],
    ['Perbualan Live', 'Perbualan Langsung', 'Live Conversations'],
    ['Pantau perbualan WhatsApp pelanggan (contoh sahaja)', 'Monitor customer WhatsApp conversations (sample only)'],
    ['LIVE DEMO', 'DEMO LANGSUNG', 'LIVE DEMO'], ['Cari prospek', 'Search leads'],
    ['Perbualan', 'Conversation'], ['Pilih prospek di sebelah', 'Select a lead on the left'],
    ['Mod balasan', 'Reply mode'], ['AI automatik', 'Automatic AI'], ['Manual', 'Manual'],
    ['Mesej simulasi', 'Simulated message'], ['Hantar simulasi', 'Send simulation'],
    ['Prospek contoh: Aina, Hafiz dan Sara. Pilih Pusat Kawalan untuk melihat perbualan.', 'Sample leads: Aina, Hafiz and Sara. Select Control Centre to view conversations.'],
    ['Angka berikut ialah contoh untuk demonstrasi sahaja.', 'The following figures are examples for demonstration only.'],
    ['JUMLAH PROSPEK', 'TOTAL LEADS'], ['MESEJ DIJAWAB', 'MESSAGES ANSWERED'],
    ['STATUS', 'STATUS'], ['Demo', 'Demo'], ['Tetapan bot', 'Bot Settings'],
    ['Ubah tetapan contoh untuk melihat cara kawalan dashboard berfungsi.', 'Change sample settings to see how the dashboard controls work.'],
    ['Nama bot (demo)', 'Bot name (demo)'], ['Ucapan pembuka (demo)', 'Opening greeting (demo)'],
    ['Simpan simulasi', 'Save simulation'],
    ['Tetapan ini hanya dipaparkan dalam pelayar anda dan tidak disimpan pada pelayan.', 'These settings are only shown in your browser and are not saved on the server.']
  ];
  const root = document.querySelector('.demo-wrap');
  const lookup = new Map(translations.map(([original, ms, en]) => [original, [en || ms, en ? ms : original]]));
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = node.nodeValue.trim();
    if (!lookup.has(value)) continue;
    const [en, ms] = lookup.get(value);
    let element = node.parentElement;
    // Preserve icons and status dots when the translatable text has siblings.
    if (element.children.length) {
      const span = document.createElement('span');
      node.replaceWith(span);
      element = span;
    }
    element.dataset.ms = ms;
    element.dataset.en = en;
  }
  const placeholders = {
    'demo-search': ['Cari nama atau nombor contoh', 'Search sample names or numbers'],
    'demo-text': ['Taip mesej contoh...', 'Type a sample message...']
  };
  Object.entries(placeholders).forEach(([id, [ms, en]]) => {
    const input = document.getElementById(id);
    input.dataset.ms = ms;
    input.dataset.en = en;
  });
  const greeting = document.getElementById('demo-greeting');
  let initialGreeting = greeting.value;
  function sync() {
    const lang = localStorage.getItem('architech_lang') === 'ms' ? 'ms' : 'en';
    root.querySelectorAll('[data-ms]').forEach((element) => {
      if (element.tagName === 'INPUT') element.placeholder = element.dataset[lang];
      else if (!element.children.length) element.textContent = element.dataset[lang];
    });
    if (greeting.value === initialGreeting) {
      greeting.value = lang === 'ms' ? 'Hai! Ada yang boleh saya bantu?' : 'Hello! How can I help you?';
    }
    initialGreeting = greeting.value;
  }
  document.getElementById('lang-toggle').addEventListener('click', () => requestAnimationFrame(sync));
  sync();
})();