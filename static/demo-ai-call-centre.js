(() => {
  const status = document.getElementById('call-status');
  const answer = document.getElementById('call-answer');
  const start = document.getElementById('call-start');
  const mic = document.getElementById('call-mic');
  const micLabel = document.getElementById('call-mic-label');
  const end = document.getElementById('call-end');
  const clock = document.getElementById('call-clock');
  const updateClock = () => { clock.textContent = new Intl.DateTimeFormat('en-MY', { hour: 'numeric', minute: '2-digit', hour12: false }).format(new Date()); };
  updateClock();
  const clockTimer = setInterval(updateClock, 15000);
  let active = false;
  let muted = false;
  let token = 0;
  let stream = null;
  let recorder = null;
  let sound = null;
  let voice = null;
  let context = null;
  let toneTimer = null;
  let timer = null;
  let abort = null;
  let format = null;
  let history = [];

  function stopTone() {
    clearInterval(toneTimer);
    toneTimer = null;
    if (context) { context.close().catch(() => {}); context = null; }
  }

  function ring() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      context = new AudioContextClass();
      const pulse = () => {
        if (!context || context.state === 'closed') return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 440;
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.9);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.9);
      };
      pulse();
      toneTimer = setInterval(pulse, 2200);
    } catch { stopTone(); }
  }

  function stopPlayback() {
    if (sound) {
      sound.pause();
      URL.revokeObjectURL(sound.src);
      sound = null;
    }
    if (voice && 'speechSynthesis' in window) speechSynthesis.cancel();
    voice = null;
  }

  function listen(id) {
    if (!active || muted || id !== token || !stream?.active) return;
    const chunks = [];
    try {
      recorder = new MediaRecorder(stream, { mimeType: format });
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        clearTimeout(timer);
        if (!active || muted || id !== token) return;
        if (!chunks.length) { listen(id); return; }
        status.textContent = 'Mendengar...';
        try {
          abort = new AbortController();
          const response = await fetch('/demo-ai-call-centre/transcribe', {
            method: 'POST', headers: { 'Content-Type': format },
            body: new Blob(chunks, { type: format }), signal: abort.signal
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Transkripsi gagal.');
          if (!active || muted || id !== token) return;
          if (data.transcript?.trim()) await reply(data.transcript.trim(), id);
          else listen(id);
        } catch (error) {
          if (active && !muted && id === token) {
            status.textContent = error.message || 'Transkripsi gagal.';
            timer = setTimeout(() => listen(id), 1200);
          }
        }
      };
      recorder.start();
      status.textContent = 'Bersambung · Mendengar suara anda';
      timer = setTimeout(() => { if (recorder?.state === 'recording') recorder.stop(); }, 4000);
    } catch {
      status.textContent = 'Rakaman tidak tersedia. Tamatkan panggilan dan cuba lagi.';
    }
  }

  async function speak(text, id) {
    if (!active || id !== token) return;
    status.textContent = 'Leea Bot sedang bercakap...';
    const fallback = () => new Promise(resolve => {
      if (!active || id !== token || !('speechSynthesis' in window)) { resolve(); return; }
      voice = new SpeechSynthesisUtterance(text);
      voice.lang = 'ms-MY';
      voice.rate = 0.95;
      voice.onend = resolve;
      voice.onerror = resolve;
      speechSynthesis.speak(voice);
    });
    try {
      abort = new AbortController();
      const response = await fetch('/demo-ai-call-centre/tts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }), signal: abort.signal
      });
      if (!response.ok) throw new Error('Cartesia tidak tersedia');
      const blob = await response.blob();
      if (!active || id !== token) return;
      sound = new Audio(URL.createObjectURL(blob));
      await new Promise((resolve, reject) => {
        sound.onended = resolve;
        sound.onerror = reject;
        sound.play().catch(reject);
      });
    } catch {
      if (active && id === token) await fallback();
    } finally {
      stopPlayback();
      if (active && id === token && !muted) listen(id);
      else if (active && id === token) status.textContent = 'Mikrofon disenyapkan';
    }
  }

  async function reply(question, id) {
    status.textContent = 'Leea Bot sedang berfikir...';
    try {
      abort = new AbortController();
      const response = await fetch('/demo-ai-call-centre/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history: history.slice(-8) }), signal: abort.signal
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'API chat tidak tersedia.');
      if (!active || muted || id !== token) return;
      history.push({ role: 'user', content: question }, { role: 'assistant', content: data.reply });
      history = history.slice(-8);
      answer.textContent = `Saya dengar: “${question}”\n\nLeea: ${data.reply}`;
      await speak(data.reply, id);
    } catch (error) {
      if (active && !muted && id === token) {
        answer.textContent = error.message || 'Leea Bot tidak dapat menjawab sekarang.';
        status.textContent = answer.textContent;
        timer = setTimeout(() => listen(id), 1500);
      }
    }
  }

  function hangup() {
    active = false;
    token++;
    clearTimeout(timer);
    stopTone();
    abort?.abort();
    if (recorder?.state === 'recording') recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    stopPlayback();
    start.hidden = false;
    end.hidden = true;
    mic.disabled = true;
    mic.setAttribute('aria-pressed', 'false');
    mic.setAttribute('aria-label', 'Mute');
    micLabel.textContent = 'Mute';
    status.textContent = 'Panggilan tamat · Tekan Panggil untuk cuba lagi.';
  }

  start.addEventListener('click', async () => {
    if (active) return;
    active = true;
    muted = false;
    history = [];
    const id = ++token;
    start.hidden = true;
    end.hidden = false;
    mic.disabled = true;
    status.textContent = 'Memanggil Leea Bot...';
    ring();
    // Request mic during the user gesture, but wait for the greeting before recording.
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Browser tidak menyokong mikrofon.');
      format = ['audio/webm', 'audio/mp4', 'audio/ogg'].find(type => MediaRecorder.isTypeSupported(type));
      if (!format) throw new Error('Format mikrofon tidak disokong.');
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!active || id !== token) { stream.getTracks().forEach(track => track.stop()); return; }
      await new Promise(resolve => { timer = setTimeout(resolve, 3000); });
      if (!active || id !== token) return;
      stopTone();
      mic.disabled = false;
      micLabel.textContent = 'Mute';
      mic.setAttribute('aria-label', 'Mute');
      mic.setAttribute('aria-pressed', 'false');
      answer.textContent = 'Helo, saya Leea! Apa khabar?';
      await speak(answer.textContent, id);
    } catch (error) {
      if (active && id === token) {
        stopTone();
        status.textContent = error.message || 'Mikrofon tidak dapat dimulakan.';
        answer.textContent = 'Benarkan akses mikrofon dan cuba panggil semula.';
        hangup();
        status.textContent = error.message || 'Mikrofon tidak dapat dimulakan. Cuba lagi.';
      }
    }
  });

  mic.addEventListener('click', () => {
    if (!active) return;
    muted = !muted;
    mic.setAttribute('aria-pressed', String(muted));
    micLabel.textContent = muted ? 'Unmute' : 'Mute';
    mic.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    if (muted) {
      clearTimeout(timer);
      if (recorder?.state === 'recording') recorder.stop();
      status.textContent = 'Mikrofon disenyapkan';
    } else if (recorder?.state !== 'recording' && !sound && !voice) listen(token);
  });
  end.addEventListener('click', hangup);
  window.addEventListener('pagehide', () => { clearInterval(clockTimer); hangup(); });
})();