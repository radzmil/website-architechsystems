(() => {
  const bank = {
    math: { title: { ms: 'Matematik · Darjah 4', en: 'Mathematics · Year 4' }, questions: [
      { text: { ms: 'Berapakah 8 + 7?', en: 'What is 8 + 7?' }, choices: ['14', '15', '16', '17'], answer: 1, hint: { ms: 'Tambah 8 + 2 dahulu, kemudian tambah 5.', en: 'Add 8 + 2 first, then add 5.' } },
      { text: { ms: 'Berapakah 6 × 3?', en: 'What is 6 × 3?' }, choices: ['18', '16', '21', '12'], answer: 0, hint: { ms: 'Tambah 6 sebanyak tiga kali.', en: 'Add 6 three times.' } },
      { text: { ms: 'Berapakah 20 − 9?', en: 'What is 20 − 9?' }, choices: ['10', '11', '12', '9'], answer: 1, hint: { ms: '20 − 10 = 10; tambah semula 1.', en: '20 − 10 = 10; add 1 back.' } },
      { text: { ms: 'Berapakah 5 × 5?', en: 'What is 5 × 5?' }, choices: ['20', '30', '25', '15'], answer: 2, hint: { ms: 'Kira 5 + 5 + 5 + 5 + 5.', en: 'Count 5 + 5 + 5 + 5 + 5.' } },
      { text: { ms: 'Berapakah 12 ÷ 4?', en: 'What is 12 ÷ 4?' }, choices: ['2', '4', '6', '3'], answer: 3, hint: { ms: 'Berapa kali 4 muat dalam 12?', en: 'How many times does 4 fit into 12?' } }
    ] },
    science: { title: { ms: 'Sains · Darjah 4', en: 'Science · Year 4' }, questions: [
      { text: { ms: 'Apakah yang diperlukan tumbuhan untuk fotosintesis?', en: 'What do plants need for photosynthesis?' }, choices: [{ ms: 'Cahaya matahari', en: 'Sunlight' }, { ms: 'Plastik', en: 'Plastic' }, { ms: 'Pasir sahaja', en: 'Sand only' }, { ms: 'Kaca', en: 'Glass' }], answer: 0, hint: { ms: 'Fikirkan sumber tenaga dari langit.', en: 'Think of the energy source in the sky.' } },
      { text: { ms: 'Bahan manakah boleh dikitar semula?', en: 'Which material can be recycled?' }, choices: [{ ms: 'Botol kaca', en: 'Glass bottle' }, { ms: 'Sisa makanan', en: 'Food waste' }, { ms: 'Tisu terpakai', en: 'Used tissue' }, { ms: 'Debu', en: 'Dust' }], answer: 0, hint: { ms: 'Bahan ini boleh dileburkan semula.', en: 'This material can be melted down again.' } },
      { text: { ms: 'Bagaimana kita menjimatkan air?', en: 'How can we save water?' }, choices: [{ ms: 'Biarkan paip terbuka', en: 'Leave taps running' }, { ms: 'Tutup paip selepas guna', en: 'Turn taps off after use' }, { ms: 'Basuh kereta setiap jam', en: 'Wash cars hourly' }, { ms: 'Buang air bersih', en: 'Discard clean water' }], answer: 1, hint: { ms: 'Elakkan air mengalir tanpa digunakan.', en: 'Avoid letting unused water run.' } },
      { text: { ms: 'Organ manakah mengepam darah?', en: 'Which organ pumps blood?' }, choices: [{ ms: 'Paru-paru', en: 'Lungs' }, { ms: 'Perut', en: 'Stomach' }, { ms: 'Jantung', en: 'Heart' }, { ms: 'Kulit', en: 'Skin' }], answer: 2, hint: { ms: 'Organ ini berdegup.', en: 'This organ beats.' } },
      { text: { ms: 'Apakah keadaan air apabila membeku?', en: 'What is water when it freezes?' }, choices: [{ ms: 'Wap', en: 'Vapour' }, { ms: 'Gas', en: 'Gas' }, { ms: 'Cecair', en: 'Liquid' }, { ms: 'Pepejal', en: 'Solid' }], answer: 3, hint: { ms: 'Ais boleh dipegang.', en: 'You can hold ice.' } }
    ] }
  };
  const words = {
    ms: { start: 'Pilih subjek dan mula kuiz.', ready: 'Kuiz bermula. Jawab satu soalan pada satu masa.', missing: 'Pilih satu jawapan dahulu.', checked: 'Jawapan disemak. Teruskan ke soalan berikutnya.', done: 'Latihan selesai! Lihat analisis prestasi.', reset: 'Pilih subjek untuk latihan seterusnya.', question: 'Soalan', of: 'daripada', tokens: '💡 Token Pembayang:', correct: 'Betul!', wrong: 'Kurang tepat. Jawapan:', noTokens: 'Token pembayang telah habis.', score: 'Markah', reward: 'Ganjaran simulasi: RM0.10 ditambah (5 jawapan betul).', noReward: 'Jawab 5 soalan betul untuk memperoleh ganjaran simulasi.', pending: 'Belum ada keputusan. Mulakan kuiz untuk melihat analisis.', hint: 'Pembayang:', next: 'Soalan seterusnya →', result: 'Lihat keputusan →' },
    en: { start: 'Choose a subject to start the quiz.', ready: 'Quiz started. Answer one question at a time.', missing: 'Choose an answer first.', checked: 'Answer checked. Continue to the next question.', done: 'Practice complete! View performance analysis.', reset: 'Choose a subject for your next practice.', question: 'Question', of: 'of', tokens: '💡 Hint tokens:', correct: 'Correct!', wrong: 'Not quite. Answer:', noTokens: 'No hint tokens left.', score: 'Score', reward: 'Simulated reward: RM0.10 added (5 correct answers).', noReward: 'Answer all 5 correctly to earn a simulated reward.', pending: 'No result yet. Start a quiz to see your analysis.', hint: 'Hint:', next: 'Next question →', result: 'View results →' }
  };
  const state = { subject: null, step: 'teacher', index: 0, answers: [], selected: null, tokens: 3, hints: [], wallet: 0, message: 'start' };
  const $ = (id) => document.getElementById(id);
  const lang = () => localStorage.getItem('architech_lang') === 'ms' ? 'ms' : 'en';
  const tr = (value) => typeof value === 'string' ? value : value[lang()];
  function render() {
    const w = words[lang()];
    document.querySelectorAll('.gg-demo [data-ms]').forEach((element) => { element.textContent = element.dataset[lang()]; });
    document.querySelectorAll('.gg-tabs button').forEach((button) => { button.classList.toggle('active', button.dataset.step === state.step); button.setAttribute('aria-current', button.dataset.step === state.step ? 'step' : 'false'); });
    ['teacher', 'student', 'report'].forEach((step) => { $('gg-' + step).hidden = step !== state.step; });
    $('gg-status').textContent = w[state.message];
    $('gg-wallet').textContent = 'RM' + state.wallet.toFixed(2);
    const results = $('gg-results'); results.replaceChildren();
    if (!state.subject || state.answers.length !== bank[state.subject].questions.length) results.textContent = w.pending;
    else {
      const questions = bank[state.subject].questions;
      const score = state.answers.filter((answer, i) => answer === questions[i].answer).length;
      const summary = document.createElement('p'); summary.textContent = w.score + ': ' + score + ' / ' + questions.length + ' · ' + tr(bank[state.subject].title); results.appendChild(summary);
      const reward = document.createElement('p'); reward.textContent = score === 5 ? w.reward : w.noReward; results.appendChild(reward);
      const list = document.createElement('ol');
      state.answers.forEach((answer, i) => { const li = document.createElement('li'); li.textContent = (i + 1) + '. ' + tr(questions[i].text) + ' — ' + (answer === questions[i].answer ? w.correct : w.wrong + ' ' + tr(questions[i].choices[questions[i].answer])); list.appendChild(li); });
      results.appendChild(list);
    }
    if (!state.subject) return;
    const questions = bank[state.subject].questions;
    const question = questions[state.index];
    $('gg-exercise').textContent = tr(bank[state.subject].title);
    $('gg-progress').textContent = w.question + ' ' + (state.index + 1) + ' ' + w.of + ' ' + questions.length;
    $('gg-hint-count').textContent = w.tokens + ' ' + state.tokens;
    $('gg-hint').disabled = state.selected !== null || state.tokens === 0 || state.hints.includes(state.index);
    $('gg-hint-text').textContent = state.hints.includes(state.index) ? w.hint + ' ' + tr(question.hint) : '';
    const choices = $('gg-questions'); choices.replaceChildren();
    const field = document.createElement('fieldset'); const legend = document.createElement('legend'); legend.textContent = tr(question.text); field.appendChild(legend);
    question.choices.forEach((choice, index) => {
      const label = document.createElement('label'); const input = document.createElement('input'); input.type = 'radio'; input.name = 'answer'; input.value = index;
      input.disabled = state.selected !== null; input.checked = state.selected === index;
      label.append(input, document.createTextNode(String.fromCharCode(65 + index) + ') ' + tr(choice))); field.appendChild(label);
    }); choices.appendChild(field);
    $('gg-quiz').hidden = state.selected !== null;
    $('gg-feedback').textContent = state.selected === null ? '' : state.selected === question.answer ? w.correct : w.wrong + ' ' + tr(question.choices[question.answer]);
    $('gg-next').hidden = state.selected === null;
    $('gg-next').textContent = state.index === questions.length - 1 ? w.result : w.next;
  }
  document.querySelectorAll('.gg-tabs button').forEach((button) => button.addEventListener('click', () => { state.step = button.dataset.step; render(); }));
  $('gg-assign').addEventListener('click', () => { state.subject = $('gg-subject').value; state.step = 'student'; state.index = 0; state.answers = []; state.selected = null; state.tokens = 3; state.hints = []; state.message = 'ready'; render(); });
  $('gg-hint').addEventListener('click', () => { if (state.tokens > 0 && !state.hints.includes(state.index) && state.selected === null) { state.tokens--; state.hints.push(state.index); render(); } });
  $('gg-quiz').addEventListener('submit', (event) => { event.preventDefault(); const checked = $('gg-questions').querySelector('input:checked'); if (!checked) { state.message = 'missing'; render(); return; } state.selected = Number(checked.value); state.answers.push(state.selected); state.message = 'checked'; render(); });
  $('gg-next').addEventListener('click', () => { if (state.selected === null) return; if (state.index === bank[state.subject].questions.length - 1) { if (state.answers.every((answer, i) => answer === bank[state.subject].questions[i].answer)) state.wallet += 0.10; state.step = 'report'; state.message = 'done'; } else { state.index++; state.selected = null; state.message = 'ready'; } render(); });
  $('gg-reset').addEventListener('click', () => { state.subject = null; state.answers = []; state.selected = null; state.step = 'teacher'; state.message = 'reset'; render(); });
  window.addEventListener('architech:languagechange', render);
  render();
})();