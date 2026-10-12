(() => {
  const status = document.getElementById('call-status');
  const answer = document.getElementById('call-answer');
  const form = document.getElementById('call-form');
  const input = document.getElementById('call-question');
  const start = document.getElementById('call-start');
  const mic = document.getElementById('call-mic');
  const end = document.getElementById('call-end');
  let active = false;
  let recorder = null;
  let stream = null;
  let sound = null;
  let recordingTimer = null;
  let generation = 0;

  function browserVoice(text) {
    if (!active) return;
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

  async function speak(text) {
    const token = generation;
    try {
      const result = await fetch('/demo-ai-call-centre/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!result.ok) throw new Error('Cartesia tidak tersedia');
      const blob = await result.blob();
      if (!active || token !== generation) return;
      sound = new Audio(URL.createObjectURL(blob));
      sound.onended = () => { URL.revokeObjectURL(sound.src); sound = null; };
      sound.onerror = () => { if (active && token === generation) browserVoice(text); };
      await sound.play();
    } catch {
      if (active && token === generation) browserVoice(text);
    }
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
    generation++;
    if (sound) { sound.pause(); URL.revokeObjectURL(sound.src); sound = null; }
    status.textContent = 'Jawapan contoh · Tanya lagi atau tamatkan demo.';
    speak(message);
  }

  start.addEventListener('click', () => {
    active = true;
    start.hidden = true;
    end.hidden = false;
    mic.hidden = !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder;
    form.hidden = false;
    status.textContent = mic.hidden ? 'Rakaman suara tidak tersedia; sila taip soalan.' : 'Taip soalan atau tekan Cakap.';
    input.focus();
    speak(answer.textContent);
  });
  end.addEventListener('click', () => {
    active = false;
    generation++;
    clearTimeout(recordingTimer);
    if (recorder?.state === 'recording') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    if (sound) { sound.pause(); URL.revokeObjectURL(sound.src); sound = null; }
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
  mic.addEventListener('click', async () => {
    if (!active || mic.disabled) return;
    const format = ['audio/webm', 'audio/mp4', 'audio/ogg'].find(type => MediaRecorder.isTypeSupported(type));
    if (!format) { status.textContent = 'Format rakaman tidak disokong; sila taip soalan.'; return; }
    mic.disabled = true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!active) { stream.getTracks().forEach(track => track.stop()); return; }
      const chunks = [];
      const token = generation;
      recorder = new MediaRecorder(stream, { mimeType: format });
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        stream?.getTracks().forEach(track => track.stop());
        stream = null;
        if (!active || token !== generation) return;
        status.textContent = 'Sedang transkripsi...';
        try {
          const result = await fetch('/demo-ai-call-centre/transcribe', {
            method: 'POST', headers: { 'Content-Type': format },
            body: new Blob(chunks, { type: format })
          });
          const data = await result.json();
          if (!result.ok) throw new Error(data.error || 'Transkripsi gagal.');
          if (!active || token !== generation) return;
          if (!data.transcript?.trim()) throw new Error('Tiada suara dikesan. Sila taip soalan.');
          reply(data.transcript);
        } catch (error) {
          if (active && token === generation) status.textContent = error.message || 'Transkripsi gagal. Sila taip soalan.';
        } finally { mic.disabled = false; }
      };
      recorder.start();
      status.textContent = 'Sedang merakam (maksimum 6 saat)...';
      recordingTimer = setTimeout(() => { if (recorder?.state === 'recording') recorder.stop(); }, 6000);
    } catch {
      stream?.getTracks().forEach(track => track.stop());
      stream = null;
      mic.disabled = false;
      if (active) status.textContent = 'Mikrofon tidak dapat dimulakan. Sila taip soalan.';
    }
  });
  window.addEventListener('pagehide', () => {
    if (recorder?.state === 'recording') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  });
})();