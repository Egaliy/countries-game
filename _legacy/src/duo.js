import './duo.css';

const { COUNTRIES, REGIONS } = window.__COUNTRIES_GAME_DATA;

const app = document.querySelector('#app');
const storageKey = 'geo-streak-state-v1';
const populationStorageKey = 'countries-game-populations-v1';
const englishCapitalStorageKey = 'countries-game-english-capitals-v1';
const dailySeconds = 10 * 60;
const challengeLength = 18;
const skillOrder = ['flagCountry', 'countryCapital', 'capitalCountry', 'region', 'population', 'letterSprint'];
const skillMeta = {
  flagCountry: { title: 'Флаги', label: '1', action: 'practice-flags' },
  countryCapital: { title: 'Столицы', label: '2', action: 'practice-capitals' },
  capitalCountry: { title: 'Страна по столице', label: '3', action: 'practice-country' },
  region: { title: 'Регионы', label: '4', action: 'practice-region' },
  population: { title: 'Население', label: '5', action: 'practice-population' },
  letterSprint: { title: 'Спринт', label: '6', action: 'practice-sprint' }
};

const regionColor = {
  'Северная Америка': '#1cb0f6',
  'Южная Америка': '#58cc02',
  'Европа': '#ce82ff',
  'Азия': '#ff9600',
  'Африка': '#ffc800',
  'Океания': '#00cd9c'
};

const state = loadState();
let populationByCode = loadCache(populationStorageKey);
let englishCapitalByCode = loadCache(englishCapitalStorageKey);
let session = null;
let timerId = null;
let factsReady = hydrateFacts();

renderHome();

app.addEventListener('click', async (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  if (action === 'start-diagnostic') await startDiagnostic();
  if (action === 'start-daily') await startDaily();
  if (action === 'finish-now') finishSession();
  if (action === 'next') nextTask();
  if (action === 'skip') answerCurrent(false);
  if (action === 'home') renderHome();
  if (action === 'practice-flags') await startPractice('flagCountry');
  if (action === 'practice-capitals') await startPractice('countryCapital');
  if (action === 'practice-country') await startPractice('capitalCountry');
  if (action === 'practice-region') await startPractice('region');
  if (action === 'practice-population') await startPractice('population');
  if (action === 'practice-sprint') await startPractice('letterSprint');
});

app.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!session) return;

  const form = event.target;
  const input = form.querySelector('input[name="answer"]');
  const value = input?.value || '';
  handleTextAnswer(value);
});

app.addEventListener('input', (event) => {
  if (!session || event.target.id !== 'population-range') return;
  const value = populationFromSlider(event.target.value);
  const output = document.querySelector('#population-output');
  if (output) output.textContent = formatPopulationGuess(value);
});

function renderHome() {
  stopTimer();
  session = null;
  const today = todayKey();
  const doneToday = Boolean(state.completed[today]);
  const week = lastDays(7);
  const completedSkills = learnedSkills();
  const diagnosticDone = Boolean(state.diagnosticCompleted);
  const dailyReady = diagnosticDone && completedSkills.length > 0;

  app.innerHTML = `
    <main class="duo-shell">
      <nav class="duo-top">
        <a class="duo-brand" href="./duo.html" aria-label="Geo Streak">
          <span class="brand-mark">G</span>
          <span>Geo Streak</span>
        </a>
        <a class="classic-link" href="./index.html">Классика</a>
      </nav>

      <section class="hero-panel">
        <div class="hero-copy">
          <h1>${diagnosticDone ? 'Ежедневная география' : 'Сначала диагностика'}</h1>
          <p>${diagnosticDone
            ? `Сегодня в испытании будут задания из того, что уже открыто: ${completedSkills.map(skillName).join(', ') || 'флаги'}.`
            : 'Короткая диагностика поймет, что ты уже знаешь, и откроет первые уроки. После этого ежедневное испытание станет легче и честнее.'}</p>
          <button class="primary-cta" data-action="${diagnosticDone ? 'start-daily' : 'start-diagnostic'}">${diagnosticDone ? (doneToday ? 'Пройти еще раз' : 'Начать испытание') : 'Пройти диагностику'}</button>
        </div>
        <div class="status-stack" aria-label="Прогресс">
          <div class="streak-orb">
            <span>${state.streak}</span>
            <small>дней подряд</small>
          </div>
          <div class="xp-card">
            <strong>${state.totalXp}</strong>
            <span>XP всего</span>
          </div>
        </div>
      </section>

      <section class="week-strip" aria-label="Неделя">
        ${week.map((day) => `
          <div class="day-chip ${state.completed[day.key] ? 'is-done' : ''} ${day.key === today ? 'is-today' : ''}">
            <span>${day.label}</span>
            <strong>${state.completed[day.key] ? '✓' : day.day}</strong>
          </div>
        `).join('')}
      </section>

      <section class="dashboard-grid">
        <article class="daily-card ${doneToday ? 'is-complete' : ''} ${!dailyReady ? 'is-muted' : ''}">
          <div>
            <h2>${!diagnosticDone ? 'Испытание откроется после диагностики' : doneToday ? 'Сегодня закрыто' : 'Испытание дня'}</h2>
            <p>${!diagnosticDone ? 'Сначала игра подберет стартовый уровень.' : doneToday ? 'Галочка уже стоит. Можно пройти заново ради XP.' : 'Набери 70%. Внутри будут только открытые навыки, без внезапной жести.'}</p>
          </div>
          <div class="daily-meter">
            <span>${!diagnosticDone ? '?' : doneToday ? '✓' : '10:00'}</span>
            <small>${!diagnosticDone ? 'уровень' : doneToday ? 'день засчитан' : 'таймер'}</small>
          </div>
        </article>

        <article class="path-card">
          <h2>${diagnosticDone ? 'Уроки' : 'Уроки после диагностики'}</h2>
          ${diagnosticDone ? `<p class="path-note">Чем выше уровень навыка, тем чаще он попадает в ежедневное испытание.</p>` : `<p class="path-note">Сначала пройди диагностику, потом откроется тропа уроков.</p>`}
          <div class="lesson-path">
            ${lessonNodes().map((node) => `
              <button class="lesson-node ${node.locked ? 'is-locked' : ''}" data-action="${node.action}" ${node.locked ? 'disabled' : ''}>
                <span>${node.label}</span>
                <small>${node.title}</small>
                <em>${node.locked ? 'закрыто' : `ур. ${node.level}`}</em>
              </button>
            `).join('')}
          </div>
        </article>

        <article class="stat-card">
          <h2>Профиль</h2>
          <div class="stat-list">
            <span><strong>${diagnosticDone ? '✓' : '—'}</strong> диагностика</span>
            <span><strong>${state.bestPercent}%</strong> лучший день</span>
            <span><strong>${state.bestCombo}</strong> серия ответов</span>
            <span><strong>${Object.keys(state.completed).length}</strong> дней закрыто</span>
          </div>
        </article>
      </section>
    </main>
  `;
}

async function startDiagnostic() {
  await factsReady;
  startSession('diagnostic', makeDiagnosticTasks(), 0);
}

async function startDaily() {
  await factsReady;
  if (!state.diagnosticCompleted) {
    startDiagnostic();
    return;
  }
  startSession('daily', makeDailyTasks(), dailySeconds);
}

async function startPractice(type) {
  await factsReady;
  if (!state.diagnosticCompleted || !(state.skills?.[type] || 0)) {
    startDiagnostic();
    return;
  }
  startSession(type, makeTasks(type, 12), 0);
}

function startSession(kind, tasks, seconds) {
  session = {
    kind,
    tasks,
    index: 0,
    correct: 0,
    wrong: 0,
    combo: 0,
    bestCombo: 0,
    xp: 0,
    secondsLeft: seconds,
    answered: false,
    result: null,
    skillResults: {},
    letterAnswers: new Set()
  };
  startTimer();
  renderTask();
}

function renderTask() {
  const task = currentTask();
  if (!task) {
    finishSession();
    return;
  }

  const progress = Math.round((session.index / session.tasks.length) * 100);
  app.innerHTML = `
    <main class="lesson-shell">
      <header class="lesson-top">
        <button class="ghost-button" data-action="home">Выйти</button>
        <div class="progress-track"><span style="width: ${progress}%"></span></div>
        <div class="lesson-timer">${session.secondsLeft ? formatTime(session.secondsLeft) : '∞'}</div>
      </header>
      <section class="lesson-card">
        <div class="lesson-meta">
          <span>${session.index + 1}/${session.tasks.length}</span>
          <span>${task.label}</span>
        </div>
        ${renderQuestion(task)}
      </section>
      <footer class="lesson-footer">
        <div>
          <strong>${session.correct}</strong> правильно
          <strong>${session.wrong}</strong> ошибок
          <strong>${session.xp}</strong> XP
        </div>
        <button class="secondary-button" data-action="skip">Пропустить</button>
      </footer>
    </main>
  `;

  document.querySelector('input[name="answer"]')?.focus();
}

function renderQuestion(task) {
  if (task.type === 'population') {
    const current = populationFromSlider(650);
    return `
      <div class="question-block">
        <div class="flag-stage">${task.country.flag}</div>
        <h1>${task.country.name}</h1>
        <p>Оцени население страны</p>
        <form class="answer-form">
          <input id="population-range" name="answer" type="range" min="0" max="1000" step="1" value="650" />
          <div class="range-output">Выбрано: <strong id="population-output">${formatPopulationGuess(current)}</strong></div>
          <button class="primary-cta" type="submit">Проверить</button>
        </form>
      </div>
    `;
  }

  if (task.type === 'letterSprint') {
    return `
      <div class="question-block">
        <div class="letter-badge">${task.letter}</div>
        <h1>Назови 10 стран на букву ${task.letter}</h1>
        <p>${session.letterAnswers.size}/10 найдено. Подойдут страны на русском.</p>
        <form class="answer-form">
          <input name="answer" type="text" autocomplete="off" placeholder="Страна на ${task.letter}" />
          <button class="primary-cta" type="submit">Добавить</button>
        </form>
        <div class="pill-row">${[...session.letterAnswers].map((name) => `<span>${name}</span>`).join('')}</div>
      </div>
    `;
  }

  return `
    <div class="question-block">
      ${task.type === 'flagCountry' ? `<div class="flag-stage">${task.country.flag}</div>` : ''}
      ${task.type !== 'flagCountry' ? `<div class="prompt-chip">${task.prompt}</div>` : ''}
      <h1>${task.question}</h1>
      <p>${task.hint}</p>
      <form class="answer-form">
        <input name="answer" type="text" autocomplete="off" placeholder="${task.placeholder}" />
        <button class="primary-cta" type="submit">Ответить</button>
      </form>
    </div>
  `;
}

function handleTextAnswer(value) {
  const task = currentTask();
  if (!task) return;

  if (task.type === 'population') {
    const guess = populationFromSlider(value);
    const exact = populationValue(task.country);
    const score = populationScoreFor(guess, exact);
    answerCurrent(score.points > 0, `Точно: ${formatPopulation(exact)}. Твой ответ: ${formatPopulationGuess(guess)}.`);
    return;
  }

  if (task.type === 'letterSprint') {
    const country = findCountry(value);
    if (!country || country.name[0].toUpperCase() !== task.letter || session.letterAnswers.has(country.name)) {
      answerCurrent(false, 'Эта страна не подходит или уже была.');
      return;
    }
    session.letterAnswers.add(country.name);
    if (session.letterAnswers.size >= 10) {
      answerCurrent(true, '10 стран на букву собрано.');
    } else {
      renderTask();
    }
    return;
  }

  answerCurrent(task.answers.map(normalize).includes(normalize(value)), `Ответ: ${task.answerText}`);
}

function answerCurrent(isCorrect, detail = '') {
  if (!session) return;
  const task = currentTask();
  const skill = task?.type;

  if (isCorrect) {
    session.correct += 1;
    session.combo += 1;
    session.bestCombo = Math.max(session.bestCombo, session.combo);
    session.xp += 10 + Math.min(10, session.combo);
  } else {
    session.wrong += 1;
    session.combo = 0;
  }

  if (skill) {
    const result = session.skillResults[skill] || { correct: 0, total: 0 };
    result.correct += isCorrect ? 1 : 0;
    result.total += 1;
    session.skillResults[skill] = result;
  }

  session.result = { isCorrect, detail };
  renderResult();
}

function renderResult() {
  const task = currentTask();
  app.innerHTML = `
    <main class="lesson-shell">
      <section class="feedback-card ${session.result.isCorrect ? 'is-correct' : 'is-wrong'}">
        <div class="feedback-mark">${session.result.isCorrect ? '✓' : '!'}</div>
        <h1>${session.result.isCorrect ? 'Отлично' : 'Почти'}</h1>
        <p>${session.result.detail || task.answerText || 'Продолжаем тренировку.'}</p>
        <button class="primary-cta" data-action="next">Дальше</button>
      </section>
    </main>
  `;
}

function nextTask() {
  session.index += 1;
  session.letterAnswers = new Set();
  renderTask();
}

function finishSession() {
  if (!session) return;
  stopTimer();
  const percent = Math.round((session.correct / session.tasks.length) * 100);
  const passed = session.kind === 'daily' && percent >= 70;
  const diagnostic = session.kind === 'diagnostic';

  state.totalXp += session.xp;
  state.bestPercent = Math.max(state.bestPercent, percent);
  state.bestCombo = Math.max(state.bestCombo, session.bestCombo);

  if (diagnostic) applyDiagnosticResults(session.skillResults);
  if (!diagnostic && session.kind !== 'daily') applyLessonResult(session.kind, percent);
  if (passed) completeToday();
  saveState();

  app.innerHTML = `
    <main class="duo-shell result-shell">
      <section class="complete-panel ${passed || diagnostic ? 'is-passed' : ''}">
        <div class="finish-ring">${passed || diagnostic ? '✓' : `${percent}%`}</div>
        <h1>${diagnostic ? 'Диагностика готова' : passed ? 'День закрыт' : 'Тренировка завершена'}</h1>
        <p>${diagnostic ? diagnosticSummary() : passed ? 'Галочка поставлена, стрик обновлен.' : 'Для ежедневной галочки нужно 70%. Можно попробовать еще раз.'}</p>
        ${diagnostic ? renderSkillSummary() : ''}
        <div class="reward-grid">
          <span><strong>${session.correct}</strong> правильно</span>
          <span><strong>${session.wrong}</strong> ошибок</span>
          <span><strong>${session.xp}</strong> XP</span>
          <span><strong>${session.bestCombo}</strong> серия</span>
        </div>
        <button class="primary-cta" data-action="home">На главную</button>
      </section>
    </main>
  `;
  session = null;
}

function makeDailyTasks() {
  const skills = learnedSkills();
  const pool = skills.length ? skills : ['flagCountry'];
  const tasks = [];

  while (tasks.length < challengeLength) {
    pool.forEach((skill) => {
      if (tasks.length >= challengeLength) return;
      if (skill === 'letterSprint') {
        tasks.push(makeLetterSprint());
      } else {
        tasks.push(...makeTasks(skill, 1));
      }
    });
  }

  return shuffle(tasks).slice(0, challengeLength);
}

function makeDiagnosticTasks() {
  return shuffle([
    ...makeTasks('flagCountry', 3),
    ...makeTasks('countryCapital', 3),
    ...makeTasks('capitalCountry', 2),
    ...makeTasks('region', 2),
    ...makeTasks('population', 2)
  ]).slice(0, 12);
}

function makeTasks(type, count) {
  const source = type === 'population'
    ? COUNTRIES.filter((country) => populationValue(country))
    : COUNTRIES;
  return shuffle(source).slice(0, count).map((country) => makeTask(type, country));
}

function makeTask(type, country) {
  if (type === 'flagCountry') {
    return {
      type,
      country,
      label: 'Флаг',
      question: 'Какая это страна?',
      hint: 'Введи название страны',
      placeholder: 'Например: Аргентина',
      answers: [country.name, ...country.aliases],
      answerText: country.name
    };
  }

  if (type === 'countryCapital') {
    return {
      type,
      country,
      label: 'Столица',
      prompt: `${country.flag} ${country.name}`,
      question: 'Назови столицу',
      hint: 'Можно без дефисов',
      placeholder: 'Столица',
      answers: country.capitals,
      answerText: country.capitals[0] || '—'
    };
  }

  if (type === 'capitalCountry') {
    return {
      type,
      country,
      label: 'Страна',
      prompt: country.capitals[0] || country.name,
      question: 'Какая страна у этой столицы?',
      hint: 'Введи страну',
      placeholder: 'Страна',
      answers: [country.name, ...country.aliases],
      answerText: country.name
    };
  }

  if (type === 'region') {
    return {
      type,
      country,
      label: 'Регион',
      prompt: `${country.flag} ${country.name}`,
      question: 'В какой части света страна?',
      hint: REGIONS.join(' · '),
      placeholder: 'Часть света',
      answers: [country.region],
      answerText: country.region
    };
  }

  return {
    type: 'population',
    country,
    label: 'Население',
    answerText: formatPopulation(populationValue(country))
  };
}

function makeLetterSprint() {
  const letters = [...new Set(COUNTRIES.map((country) => country.name[0].toUpperCase()))]
    .filter((letter) => COUNTRIES.filter((country) => country.name[0].toUpperCase() === letter).length >= 10);
  return {
    type: 'letterSprint',
    letter: letters[Math.floor(Math.random() * letters.length)] || 'С',
    label: 'Спринт'
  };
}

function currentTask() {
  return session?.tasks[session.index];
}

function startTimer() {
  stopTimer();
  if (!session?.secondsLeft) return;
  timerId = window.setInterval(() => {
    session.secondsLeft -= 1;
    if (session.secondsLeft <= 0) {
      finishSession();
    } else {
      const timer = document.querySelector('.lesson-timer');
      if (timer) timer.textContent = formatTime(session.secondsLeft);
    }
  }, 1000);
}

function stopTimer() {
  window.clearInterval(timerId);
  timerId = null;
}

function completeToday() {
  const today = todayKey();
  const yesterday = dateKey(addDays(new Date(), -1));
  if (!state.completed[today]) {
    state.streak = state.completed[yesterday] ? state.streak + 1 : 1;
  }
  state.completed[today] = true;
}

function applyDiagnosticResults(results) {
  state.diagnosticCompleted = true;
  state.skills = state.skills || {};

  skillOrder.forEach((skill) => {
    if (skill === 'letterSprint') return;
    const result = results[skill] || { correct: 0, total: 0 };
    const percent = result.total ? result.correct / result.total : 0;
    if (percent >= 0.67) {
      state.skills[skill] = Math.max(state.skills[skill] || 0, 2);
    } else if (percent > 0 || skill === 'flagCountry') {
      state.skills[skill] = Math.max(state.skills[skill] || 0, 1);
    } else {
      state.skills[skill] = state.skills[skill] || 0;
    }
  });

  const opened = learnedSkills().length;
  if (opened >= 2) {
    state.skills.letterSprint = Math.max(state.skills.letterSprint || 0, 1);
  }
}

function applyLessonResult(skill, percent) {
  if (!skillOrder.includes(skill)) return;
  state.skills = state.skills || {};
  const current = state.skills[skill] || 0;
  const gain = percent >= 80 ? 2 : percent >= 60 ? 1 : 0;
  state.skills[skill] = Math.max(current, current + gain, 1);

  if (learnedSkills().length >= 2) {
    state.skills.letterSprint = Math.max(state.skills.letterSprint || 0, 1);
  }
}

function learnedSkills() {
  return skillOrder.filter((skill) => (state.skills?.[skill] || 0) > 0);
}

function skillName(skill) {
  return skillMeta[skill]?.title || skill;
}

function diagnosticSummary() {
  const learned = learnedSkills();
  if (!learned.length) {
    return 'Открыт стартовый урок по флагам. Остальные навыки будут добавляться постепенно.';
  }

  return `Открылись уроки: ${learned.map(skillName).join(', ')}. Ежедневное испытание теперь будет брать задания только отсюда.`;
}

function renderSkillSummary() {
  return `
    <div class="skill-summary">
      ${skillOrder.map((skill) => {
        const level = state.skills[skill] || 0;
        return `<span class="${level ? 'is-open' : ''}"><strong>${skillName(skill)}</strong> ${level ? `ур. ${level}` : 'позже'}</span>`;
      }).join('')}
    </div>
  `;
}

function lessonNodes() {
  return skillOrder.map((skill) => {
    const meta = skillMeta[skill];
    const level = state.skills[skill] || 0;
    return {
      ...meta,
      level,
      locked: !state.diagnosticCompleted || level <= 0
    };
  });
}

function findCountry(value) {
  const key = normalize(value);
  return COUNTRIES.find((country) => [country.name, ...country.aliases].map(normalize).includes(key));
}

async function hydrateFacts() {
  const codes = new Set(COUNTRIES.map((country) => flagToCountryCode(country.flag)));
  const hasAll = [...codes].every((code) => populationByCode[code] && englishCapitalByCode[code]);
  if (hasAll) return;

  try {
    const response = await fetch('https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json');
    const data = await response.json();
    data.forEach((country) => {
      if (country.iso2 && Number.isFinite(country.population)) populationByCode[country.iso2] = country.population;
      if (country.iso2 && country.capital) englishCapitalByCode[country.iso2] = country.capital;
    });
    localStorage.setItem(populationStorageKey, JSON.stringify(populationByCode));
    localStorage.setItem(englishCapitalStorageKey, JSON.stringify(englishCapitalByCode));
  } catch {
    // Facts already embedded in the classic game are enough for non-population tasks.
  }
}

function populationValue(country) {
  return populationByCode[flagToCountryCode(country.flag)] || 0;
}

function populationFromSlider(value) {
  const position = clamp(Math.round(Number(value) || 0), 0, 1000);
  if (position === 0) return 0;
  if (position <= 100) return Math.round((10_000 + (position / 100) * 90_000) / 10_000) * 10_000;
  if (position <= 650) return Math.round((100_000 + ((position - 100) / 550) * 9_900_000) / 100_000) * 100_000;
  if (position <= 850) return Math.round((10_000_000 + ((position - 650) / 200) * 90_000_000) / 1_000_000) * 1_000_000;
  return Math.round((100_000_000 + ((position - 850) / 150) * 1_400_000_000) / 10_000_000) * 10_000_000;
}

function populationScoreFor(guess, exact) {
  if (!exact) return { points: 0 };
  if (guess === 0) return { points: exact < 10_000 ? 100 : 0 };
  if (exact < 100_000 && guess < 100_000) return { points: 100 };
  const error = Math.abs(guess - exact);
  if (error <= Math.max(exact * 0.1, 25_000)) return { points: 100 };
  if (error <= Math.max(exact * 0.2, 100_000)) return { points: 50 };
  return { points: 0 };
}

function loadState() {
  try {
    return {
      streak: 0,
      totalXp: 0,
      bestPercent: 0,
      bestCombo: 0,
      diagnosticCompleted: false,
      skills: {},
      completed: {},
      ...JSON.parse(localStorage.getItem(storageKey) || '{}')
    };
  } catch {
    localStorage.removeItem(storageKey);
    return { streak: 0, totalXp: 0, bestPercent: 0, bestCombo: 0, diagnosticCompleted: false, skills: {}, completed: {} };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') || {};
  } catch {
    return {};
  }
}

function lastDays(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(new Date(), index - count + 1);
    return {
      key: dateKey(date),
      day: date.getDate(),
      label: new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date)
    };
  });
}

function todayKey() {
  return dateKey(new Date());
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function flagToCountryCode(flag) {
  return [...flag].map((char) => String.fromCharCode(char.codePointAt(0) - 127397)).join('');
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .replaceAll('ё', 'е')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-zа-я0-9]/g, '');
}

function formatTime(seconds) {
  const minutes = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
  const rest = (Math.max(0, seconds) % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

function formatPopulation(value) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function formatPopulationGuess(value) {
  return value === 0 ? 'меньше 10 000' : formatPopulation(value);
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
