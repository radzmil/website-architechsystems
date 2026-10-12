(() => {
  const status = document.getElementById('call-status');
  const answer = document.getElementById('call-answer');
  const form = document.getElementById('call-form');
  const input = document.getElementById('call-question');
  const start = document.getElementById('call-start');
  const mic = document.getElementById('call-mic');
  const end = document.getElementById('call-end');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let active = false;
  let recognition = null;

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      status.textContent = 'Suara tidak disokong; jawapan masih boleh dibaca.';
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ms-MY';
    utterance.rate = 0.95;
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.lang.toLowerCase() === 'ms-my') ||
      voices.find(voice => voice.lang.toLowerCase().startsWith('ms')) || null;
    speechSynthesis.speak(utterance);
  }

  function reply(question) {
    const text = question.toLocaleLowerCase('ms-MY');
    let message = 'Ini simulator dengan jawapan contoh sahaja. Untuk maklumat produk atau sebut harga yang disahkan, sila hubungi pasukan Architech Systems melalui halaman Hubungi Kami.';
    if (/hai|helo|hello|assalam/.test(text)) {
      message = 'Helo! Saya Leea Bot, pembantu maya demo. Anda boleh tanya tentang simulasi AI Call Centre.';
    } else if (/harga|pakej|bayar|kos/.test(text)) {
      message = 'Harga dan ciri pakej boleh dilihat pada halaman pricing. Sila hubungi pasukan kami untuk sebut harga terkini; simulator ini tidak memproses pembelian.';
    } else if (/ai call|panggilan|telefon|fungsi|demo/.test(text)) {
      message = 'Ini simulasi perbualan dalam browser, bukan panggilan telefon sebenar. Anda boleh bercakap jika browser menyokong pengecaman suara, atau taip soalan.';
    }
    answer.textContent = message;
    status.textContent = 'Jawapan contoh · Tanya lagi atau tamatkan demo.';
    speak(message);
  }

  start.addEventListener('click', () => {
    active = true;
    start.hidden = true;
    end.hidden = false;
    mic.hidden = !Recognition;
    form.hidden = false;
    status.textContent = Recognition ? 'Taip soalan atau tekan Cakap.' : 'Pengecaman suara tidak tersedia; sila taip soalan.';
    input.focus();
    speak(answer.textContent);
  });
  end.addEventListener('click', () => {
    active = false;
    recognition?.abort();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    start.hidden = false;
    end.hidden = true;
    mic.hidden = true;
    form.hidden = true;
    status.textContent = 'Demo tamat. Tekan mula untuk cuba lagi.';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!active || !input.value.trim()) return;
    reply(input.value.trim());
    input.value = '';
  });
  mic.addEventListener('click', () => {
    if (!active || !Recognition) return;
    recognition = new Recognition();
    recognition.lang = 'ms-MY';
    recognition.onresult = event => {
      if (active) reply(event.results[0][0].transcript);
    };
    recognition.onerror = () => { if (active) status.textContent = 'Mikrofon atau pengecaman suara gagal. Sila taip soalan.'; };
    recognition.onend = () => { if (active && status.textContent === 'Sedang mendengar...') status.textContent = 'Tiada suara dikesan. Sila cuba lagi atau taip soalan.'; };
    try {
      recognition.start();
      status.textContent = 'Sedang mendengar...';
    } catch {
      status.textContent = 'Mikrofon tidak dapat dimulakan. Sila taip soalan.';
    }
  });
  window.addEventListener('pagehide', () => {
    recognition?.abort();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  });
})();