(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const modal = $('#project-modal');
  const modalBody = $('#modal-body');
  const modalTitle = $('#modal-title');
  const modalKicker = $('#modal-kicker');
  const modalClose = $('.modal-close', modal);
  const toast = $('#toast');
  let lastFocused = null;
  let modalCleanup = [];
  let toastTimer = null;

  const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);

  const showToast = (message) => {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  };

  const runCleanup = () => {
    modalCleanup.forEach((cleanup) => cleanup());
    modalCleanup = [];
  };

  const openModal = (title, kicker, contentBuilder) => {
    runCleanup();
    lastFocused = document.activeElement;
    modalTitle.textContent = title;
    modalKicker.textContent = kicker;
    modalBody.innerHTML = '';
    contentBuilder(modalBody);
    modal.hidden = false;
    document.body.classList.add('modal-open');
    $('.modal-panel', modal).scrollTop = 0;
    requestAnimationFrame(() => modalClose.focus());
  };

  const closeModal = () => {
    if (modal.hidden) return;
    runCleanup();
    modal.hidden = true;
    modalBody.innerHTML = '';
    document.body.classList.remove('modal-open');
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-modal]')) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (modal.hidden) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Tab') {
      const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal)
        .filter((element) => !element.disabled && !element.hidden && element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const header = $('.site-header');
  const menuToggle = $('.menu-toggle');
  const navLinks = $('#nav-links');
  const navAnchors = $$('.nav-links a[href^="#"]');
  const trackedSections = navAnchors
    .map((link) => $(link.getAttribute('href')))
    .filter(Boolean);

  const closeMenu = () => {
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    navLinks.classList.toggle('open', !isOpen);
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
  });

  navAnchors.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav') && navLinks.classList.contains('open')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
  });

  let scrollTicking = false;
  const updateScrollState = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
    const position = window.scrollY + 150;
    let current = trackedSections[0]?.id || 'home';
    trackedSections.forEach((section) => {
      if (section.offsetTop <= position) current = section.id;
    });
    navAnchors.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(updateScrollState);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollState();

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal').forEach((element) => revealObserver.observe(element));
  } else {
    $$('.reveal').forEach((element) => element.classList.add('visible'));
  }
  $('#year').textContent = new Date().getFullYear();

  $('#contact-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();
    const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
    const body = encodeURIComponent(`Hi Hina,\n\n${message}\n\nFrom: ${name}\nEmail: ${email}`);
    $('#contact-status').textContent = 'Your email app should open with the message ready to send.';
    window.location.href = `mailto:hinaayoub97@gmail.com?subject=${subject}&body=${body}`;
  });

  const codeSamples = {
    weather: `const response = await fetch(
  \`https://geocoding-api.open-meteo.com/v1/search?name=\${city}&count=1&language=en&format=json\`
);

const { results } = await response.json();
const place = results[0];

const weatherResponse = await fetch(
  \`https://api.open-meteo.com/v1/forecast?latitude=\${place.latitude}&longitude=\${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code\`
);

const { current } = await weatherResponse.json();
console.log(current);`,
    uploader: `const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
const maxSize = 2 * 1024 * 1024;

if (!allowedTypes.includes(file.type)) {
  throw new Error('Please choose a JPG, PNG, or GIF image.');
}

if (file.size > maxSize) {
  throw new Error('Please choose an image smaller than 2 MB.');
}

const reader = new FileReader();

reader.onprogress = (event) => {
  const progress = (event.loaded / event.total) * 100;
  progressBar.style.width = \`\${progress}%\`;
};

reader.onload = () => {
  preview.src = reader.result;
  localStorage.setItem('hina-upload', JSON.stringify({
    name: file.name,
    type: file.type,
    size: file.size,
    data: reader.result
  }));
};

reader.readAsDataURL(file);`,
    form: `const state = {
  step: 1,
  name: '',
  email: '',
  focus: '',
  experience: ''
};

const saveDraft = () => {
  localStorage.setItem('hina-form-draft', JSON.stringify(state));
};

const validateEmail = (email) =>
  /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);

const nextStep = () => {
  if (state.step === 1 &&
      (state.name.trim().length < 2 || !validateEmail(state.email))) {
    showErrors();
    return;
  }

  if (state.step === 2 && !state.focus) {
    showErrors();
    return;
  }

  state.step += 1;
  saveDraft();
  renderStep();
};`,
    chat: `const conversations = JSON.parse(
  localStorage.getItem('hina-chat-history') || '{}'
);

function sendMessage(text) {
  const chat = conversations[activeChat] || [];
  chat.push({ from: 'sent', text });
  conversations[activeChat] = chat;
  localStorage.setItem('hina-chat-history', JSON.stringify(conversations));
  renderMessages();

  setTimeout(() => {
    chat.push({ from: 'received', text: createSimulatedReply(text) });
    localStorage.setItem('hina-chat-history', JSON.stringify(conversations));
    renderMessages();
  }, 800);
}

function renderMessages() {
  messages.replaceChildren();

  conversations[activeChat]?.forEach((message) => {
    const bubble = document.createElement('div');
    bubble.className = 'chat-message-bubble';
    bubble.textContent = message.text;
    messages.append(bubble);
  });
}`
  };

  const showCode = (project) => {
    openModal(`${project === 'weather' ? 'Weather App' : project === 'uploader' ? 'Drag & Drop Uploader' : project === 'form' ? 'Multi-Step Form' : 'Ripple Chat App'} — code`, 'Code preview', (root) => {
      const intro = document.createElement('p');
      intro.className = 'demo-intro';
      intro.textContent = 'A focused excerpt showing the main logic. The live demo above uses the complete implementation with validation and error handling.';
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.textContent = codeSamples[project];
      pre.append(code);
      root.append(intro, pre);
    });
  };

  const initWeatherDemo = (root) => {
    root.innerHTML = `
      <p class="demo-intro">Search for a city to get current temperature, humidity, conditions, and wind speed. Weather data is provided by Open-Meteo.</p>
      <form id="weather-form" novalidate>
        <label class="demo-label" for="weather-city">City name</label>
        <div class="weather-search">
          <input class="demo-input" id="weather-city" type="search" placeholder="Try Rawalakot, London, or Tokyo" value="Rawalakot" autocomplete="off" required>
          <button class="button" type="submit">Search</button>
        </div>
      </form>
      <p class="demo-error" id="weather-error" role="alert" hidden></p>
      <div class="weather-result" id="weather-result" aria-live="polite"></div>
    `;

    const form = $('#weather-form', root);
    const input = $('#weather-city', root);
    const button = $('button[type="submit"]', form);
    const error = $('#weather-error', root);
    const result = $('#weather-result', root);
    let controller = new AbortController();
    let timeout = null;
    modalCleanup.push(() => {
      controller.abort();
      clearTimeout(timeout);
    });

    const conditions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Light rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Light snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Light rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Light snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const city = input.value.trim();
      error.hidden = true;
      result.classList.remove('visible');
      if (!city) {
        error.textContent = 'Please enter a city name.';
        error.hidden = false;
        input.focus();
        return;
      }

      button.disabled = true;
      button.textContent = 'Searching…';
      clearTimeout(timeout);
      controller.abort();
      controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 12000);

      try {
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`, { signal: controller.signal });
        if (!geoResponse.ok) throw new Error('The city search service is unavailable right now.');
        const geoData = await geoResponse.json();
        const place = geoData.results?.[0];
        if (!place) throw new Error(`I couldn’t find “${city}”. Try a nearby city or check the spelling.`);

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl, { signal: controller.signal });
        if (!weatherResponse.ok) throw new Error('Weather data is unavailable right now. Please try again.');
        const weatherData = await weatherResponse.json();
        const current = weatherData.current;
        const location = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
        const condition = conditions[current.weather_code] || 'Current conditions';

        result.innerHTML = `
          <div class="weather-result-top">
            <div><h3>${escapeHTML(location)}</h3><p class="condition">${escapeHTML(condition)}</p></div>
            <div class="weather-temperature">${Math.round(current.temperature_2m)}°</div>
          </div>
          <div class="weather-metrics">
            <div class="weather-metric"><span>Humidity</span><strong>${current.relative_humidity_2m}%</strong></div>
            <div class="weather-metric"><span>Feels like</span><strong>${Math.round(current.apparent_temperature)}°C</strong></div>
            <div class="weather-metric"><span>Wind</span><strong>${Math.round(current.wind_speed_10m)} km/h</strong></div>
          </div>
        `;
        result.classList.add('visible');
      } catch (caught) {
        error.textContent = caught.name === 'AbortError'
          ? 'The request took too long. Please check your connection and try again.'
          : caught.message;
        error.hidden = false;
      } finally {
        clearTimeout(timeout);
        button.disabled = false;
        button.textContent = 'Search';
      }
    });
  };

  const initUploaderDemo = (root) => {
    root.innerHTML = `
      <p class="demo-intro">Choose or drop one JPG, PNG, or GIF image up to 2 MB. The preview is saved in this browser using localStorage.</p>
      <input id="uploader-input" type="file" accept="image/jpeg,image/png,image/gif" hidden>
      <button class="uploader-dropzone" id="uploader-dropzone" type="button">
        <span class="upload-symbol" aria-hidden="true">↑</span>
        <strong>Drop your image here or click to browse</strong>
        <span>JPG, PNG or GIF · Maximum 2 MB</span>
      </button>
      <p class="demo-error" id="uploader-error" role="alert" hidden></p>
      <div class="uploader-progress" id="uploader-progress">
        <div class="progress-label"><span id="uploader-file-name">Reading image…</span><span id="uploader-percent">0%</span></div>
        <div class="progress-track"><div class="progress-bar" id="uploader-bar"></div></div>
      </div>
      <div class="uploaded-preview" id="uploaded-preview">
        <img id="uploaded-image" alt="Uploaded image preview">
        <div><strong id="uploaded-name"></strong><span id="uploaded-size"></span></div>
        <button class="remove-upload" id="remove-upload" type="button">Remove</button>
      </div>
      <p class="demo-success" id="uploader-success" hidden></p>
    `;

    const input = $('#uploader-input', root);
    const dropzone = $('#uploader-dropzone', root);
    const error = $('#uploader-error', root);
    const progress = $('#uploader-progress', root);
    const bar = $('#uploader-bar', root);
    const percent = $('#uploader-percent', root);
    const fileName = $('#uploader-file-name', root);
    const preview = $('#uploaded-preview', root);
    const image = $('#uploaded-image', root);
    const nameLabel = $('#uploaded-name', root);
    const sizeLabel = $('#uploaded-size', root);
    const success = $('#uploader-success', root);
    const storageKey = 'hina-uploaded-image';
    let activeReader = null;

    modalCleanup.push(() => activeReader?.abort());

    const showError = (message) => {
      error.textContent = message;
      error.hidden = false;
      success.hidden = true;
    };

    const showPreview = (record) => {
      image.src = record.data;
      image.alt = `Preview of ${record.name}`;
      nameLabel.textContent = record.name;
      sizeLabel.textContent = `${(record.size / 1024).toFixed(1)} KB · Saved in this browser`;
      preview.classList.add('visible');
      progress.classList.remove('visible');
      error.hidden = true;
      success.textContent = 'Image preview saved locally. It will still be here when you reopen this demo.';
      success.hidden = false;
    };

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved.data === 'string' && /^data:image\/(jpeg|png|gif);base64,/.test(saved.data)) {
        showPreview(saved);
      }
    } catch {
      localStorage.removeItem(storageKey);
    }

    const processFile = (file) => {
      if (!file) return;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showError('That file type is not supported. Please choose a JPG, PNG, or GIF image.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showError('That image is larger than 2 MB. Please choose a smaller file.');
        return;
      }

      activeReader?.abort();
      const reader = new FileReader();
      activeReader = reader;
      error.hidden = true;
      success.hidden = true;
      preview.classList.remove('visible');
      progress.classList.add('visible');
      bar.style.width = '0%';
      percent.textContent = '0%';
      fileName.textContent = file.name;

      reader.onprogress = (event) => {
        const value = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
        bar.style.width = `${value}%`;
        percent.textContent = `${value}%`;
      };

      reader.onload = () => {
        const record = { name: file.name, type: file.type, size: file.size, data: reader.result };
        try {
          localStorage.setItem(storageKey, JSON.stringify(record));
          showPreview(record);
        } catch {
          showPreview(record);
          sizeLabel.textContent = `${(record.size / 1024).toFixed(1)} KB · Preview only; browser storage is full`;
          success.textContent = 'The preview is ready, but this image could not be saved because browser storage is full.';
        }
      };

      reader.onerror = () => showError('The image could not be read. Please try another file.');
      reader.readAsDataURL(file);
    };

    dropzone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => processFile(input.files?.[0]));
    ['dragenter', 'dragover'].forEach((type) => dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    }));
    ['dragleave', 'drop'].forEach((type) => dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
    }));
    dropzone.addEventListener('drop', (event) => processFile(event.dataTransfer.files?.[0]));
    $('#remove-upload', root).addEventListener('click', () => {
      localStorage.removeItem(storageKey);
      input.value = '';
      image.removeAttribute('src');
      preview.classList.remove('visible');
      progress.classList.remove('visible');
      success.hidden = true;
      showToast('Saved image removed.');
    });
  };

  const initFormDemo = (root) => {
    const storageKey = 'hina-multistep-draft';
    const defaultState = { step: 1, name: '', email: '', focus: '', experience: '' };
    let state = { ...defaultState };

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && Number.isInteger(saved.step) && saved.step >= 1 && saved.step <= 3) {
        state = { ...defaultState, ...saved };
      }
    } catch {
      localStorage.removeItem(storageKey);
    }

    root.innerHTML = `
      <p class="demo-intro">A three-step registration demo with validation, a review screen, and an autosaved draft. Nothing is sent to a server.</p>
      <div class="demo-progress" aria-label="Form progress">
        <div class="demo-progress-step" data-step="1">1 · Your details</div>
        <div class="demo-progress-step" data-step="2">2 · Your goals</div>
        <div class="demo-progress-step" data-step="3">3 · Review</div>
      </div>
      <form id="demo-registration" novalidate>
        <section class="demo-form-step" data-step="1">
          <h3>Let’s start with you</h3>
          <p>Tell me a little about yourself.</p>
          <div class="field"><label for="demo-name">Full name</label><input class="demo-input" id="demo-name" name="name" type="text" autocomplete="name" placeholder="Hina Ayoub"><p class="field-error" id="name-error">Please enter at least 2 characters.</p></div>
          <div class="field"><label for="demo-email">Email address</label><input class="demo-input" id="demo-email" name="email" type="email" autocomplete="email" placeholder="you@example.com"><p class="field-error" id="email-error">Please enter a valid email address.</p></div>
          <div class="form-step-actions"><span></span><button class="demo-button" type="button" data-next>Continue →</button></div>
        </section>
        <section class="demo-form-step" data-step="2" hidden>
          <h3>What are you working on?</h3>
          <p>This helps personalize the final summary.</p>
          <div class="field"><label for="demo-focus">Main focus</label><select class="demo-select" id="demo-focus" name="focus"><option value="">Choose a focus</option><option value="Web development">Web development</option><option value="Graphic design">Graphic design</option><option value="Software engineering">Software engineering</option><option value="E-commerce">E-commerce</option></select><p class="field-error" id="focus-error">Please choose a main focus.</p></div>
          <div class="field"><label for="demo-experience">Experience or goals <span style="color:var(--faint);font-weight:400">(optional)</span></label><textarea class="demo-textarea" id="demo-experience" name="experience" placeholder="A little about your experience or what you want to learn..."></textarea></div>
          <div class="form-step-actions"><button class="demo-button secondary" type="button" data-back>← Back</button><button class="demo-button" type="button" data-next>Review →</button></div>
        </section>
        <section class="demo-form-step" data-step="3" hidden>
          <h3>Review your details</h3>
          <p>You can go back to edit anything before finishing.</p>
          <div class="form-summary" id="form-summary"></div>
          <div class="form-step-actions"><button class="demo-button secondary" type="button" data-back>← Back</button><button class="demo-button" type="submit">Finish demo</button></div>
        </section>
      </form>
      <p class="autosave-note" id="autosave-note"><i></i><span>Draft autosaves in this browser.</span></p>
      <p class="demo-error" id="form-error" role="alert" hidden></p>
    `;

    const form = $('#demo-registration', root);
    const steps = $$('.demo-form-step', root);
    const progressSteps = $$('.demo-progress-step', root);
    const nameInput = $('#demo-name', root);
    const emailInput = $('#demo-email', root);
    const focusInput = $('#demo-focus', root);
    const experienceInput = $('#demo-experience', root);
    const summary = $('#form-summary', root);
    const note = $('#autosave-note span', root);
    const formError = $('#form-error', root);

    nameInput.value = state.name;
    emailInput.value = state.email;
    focusInput.value = state.focus;
    experienceInput.value = state.experience;

    const saveDraft = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
        note.textContent = 'Draft autosaved in this browser.';
      } catch {
        note.textContent = 'Autosave is unavailable in this browser.';
      }
    };

    const setError = (id, visible) => $(`#${id}`, root).classList.toggle('visible', visible);

    const updateSummary = () => {
      summary.innerHTML = `
        <div class="summary-row"><span>Name</span><strong>${escapeHTML(state.name)}</strong></div>
        <div class="summary-row"><span>Email</span><strong>${escapeHTML(state.email)}</strong></div>
        <div class="summary-row"><span>Focus</span><strong>${escapeHTML(state.focus)}</strong></div>
        <div class="summary-row"><span>Goals</span><strong>${escapeHTML(state.experience || 'Not provided')}</strong></div>
      `;
    };

    const renderStep = () => {
      steps.forEach((step) => { step.hidden = Number(step.dataset.step) !== state.step; });
      progressSteps.forEach((step) => {
        const number = Number(step.dataset.step);
        step.classList.toggle('active', number === state.step);
        step.classList.toggle('complete', number < state.step);
      });
      formError.hidden = true;
      if (state.step === 3) updateSummary();
      saveDraft();
      const firstInput = $('input, select, textarea', steps.find((step) => !step.hidden));
      requestAnimationFrame(() => firstInput?.focus());
    };

    const validateStep = () => {
      if (state.step === 1) {
        const validName = state.name.trim().length >= 2;
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim());
        setError('name-error', !validName);
        setError('email-error', !validEmail);
        if (!validName) nameInput.focus();
        else if (!validEmail) emailInput.focus();
        return validName && validEmail;
      }
      if (state.step === 2) {
        const validFocus = Boolean(state.focus);
        setError('focus-error', !validFocus);
        if (!validFocus) focusInput.focus();
        return validFocus;
      }
      return true;
    };

    const bindInput = (input, key) => input.addEventListener('input', () => {
      state[key] = input.value;
      if (key === 'name') setError('name-error', false);
      if (key === 'email') setError('email-error', false);
      if (key === 'focus') setError('focus-error', false);
      saveDraft();
    });

    bindInput(nameInput, 'name');
    bindInput(emailInput, 'email');
    bindInput(focusInput, 'focus');
    bindInput(experienceInput, 'experience');

    $$('[data-next]', root).forEach((button) => button.addEventListener('click', () => {
      if (!validateStep()) return;
      state.step = Math.min(3, state.step + 1);
      renderStep();
    }));

    $$('[data-back]', root).forEach((button) => button.addEventListener('click', () => {
      state.step = Math.max(1, state.step - 1);
      renderStep();
    }));

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validateStep()) return;
      localStorage.removeItem(storageKey);
      form.hidden = true;
      $('.demo-progress', root).hidden = true;
      note.hidden = true;
      const success = document.createElement('div');
      success.className = 'demo-success';
      success.innerHTML = '<strong>Demo complete.</strong><br>Your details passed every validation step. This demo did not send or store your final submission.';
      const restart = document.createElement('button');
      restart.type = 'button';
      restart.className = 'demo-button';
      restart.style.marginTop = '18px';
      restart.textContent = 'Start again';
      restart.addEventListener('click', () => initFormDemo(root));
      success.append(document.createElement('br'), restart);
      root.append(success);
    });

    renderStep();
  };

  const initChatDemo = (root) => {
    const storageKey = 'hina-ripple-chat-history';
    const contacts = [
      { id: 'hina', name: 'Hina', initials: 'HA', preview: 'Your portfolio collaborator' },
      { id: 'design', name: 'Design Studio', initials: 'DS', preview: 'Creative project chat' },
      { id: 'code', name: 'Code Buddy', initials: 'CB', preview: 'Programming help' }
    ];
    const defaults = {
      hina: [{ from: 'received', text: 'Hi! Thanks for checking out my chat demo. Send me a message and I’ll reply.' }],
      design: [{ from: 'received', text: 'Welcome to the design studio! What kind of project are you imagining?' }],
      code: [{ from: 'received', text: 'Hey coder! Need help thinking through a project? I’m all ears.' }]
    };
    let conversations = defaults;
    let activeChat = 'hina';
    const timers = new Set();
    const pendingChats = new Set();

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved === 'object') {
        contacts.forEach((contact) => {
          if (Array.isArray(saved[contact.id])) {
            conversations[contact.id] = saved[contact.id].filter((message) =>
              message && ['sent', 'received'].includes(message.from) && typeof message.text === 'string'
            ).slice(-100);
          }
        });
      }
    } catch {
      localStorage.removeItem(storageKey);
    }

    modalCleanup.push(() => {
      timers.forEach(clearTimeout);
      pendingChats.clear();
    });

    root.innerHTML = `
      <p class="demo-intro">A frontend-only chat demo with three conversations, simulated replies, and history saved in localStorage.</p>
      <div class="chat-demo">
        <aside class="chat-sidebar" aria-label="Conversations"><p class="chat-sidebar-title">Conversations</p><div id="chat-contacts"></div></aside>
        <div class="chat-main">
          <div class="chat-main-header"><div><strong id="chat-active-name"></strong><span>● Simulated online</span></div><button class="chat-clear" id="chat-clear" type="button">Clear chat</button></div>
          <div class="chat-messages" id="chat-messages" aria-live="polite"></div>
          <p class="chat-typing" id="chat-typing">Typing a simulated reply…</p>
          <form class="chat-compose" id="chat-compose"><label for="chat-input" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">Message</label><input class="demo-input" id="chat-input" type="text" placeholder="Write a message..." autocomplete="off" maxlength="500" required><button class="demo-button" type="submit">Send ↑</button></form>
        </div>
      </div>
    `;

    const contactsRoot = $('#chat-contacts', root);
    const messagesRoot = $('#chat-messages', root);
    const activeName = $('#chat-active-name', root);
    const typing = $('#chat-typing', root);
    const compose = $('#chat-compose', root);
    const input = $('#chat-input', root);
    const clearButton = $('#chat-clear', root);

    const save = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(conversations));
      } catch {
        showToast('Chat history could not be saved because browser storage is full.');
      }
    };

    const renderContacts = () => {
      contactsRoot.innerHTML = '';
      contacts.forEach((contact) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `chat-contact${contact.id === activeChat ? ' active' : ''}`;
        button.dataset.chat = contact.id;
        const messages = conversations[contact.id] || [];
        const lastMessage = messages[messages.length - 1]?.text || contact.preview;
        button.innerHTML = `<span class="chat-contact-avatar">${contact.initials}</span><span><strong>${contact.name}</strong><small>${escapeHTML(lastMessage)}</small></span>`;
        button.addEventListener('click', () => {
          activeChat = contact.id;
          typing.classList.toggle('visible', pendingChats.has(activeChat));
          renderContacts();
          renderMessages();
          input.focus();
        });
        contactsRoot.append(button);
      });
    };

    const renderMessages = () => {
      const contact = contacts.find((item) => item.id === activeChat);
      activeName.textContent = contact.name;
      messagesRoot.innerHTML = '';
      (conversations[activeChat] || []).forEach((message) => {
        const row = document.createElement('div');
        row.className = `chat-message ${message.from}`;
        const bubble = document.createElement('div');
        bubble.className = 'chat-message-bubble';
        bubble.textContent = message.text;
        row.append(bubble);
        messagesRoot.append(row);
      });
      messagesRoot.scrollTop = messagesRoot.scrollHeight;
    };

    const createReply = (text) => {
      const lower = text.toLowerCase();
      if (/\b(hi|hello|hey)\b/.test(lower)) return 'Hello! It’s great to meet you. What would you like to build?';
      if (lower.includes('project')) return 'That sounds interesting! Start with the goal, the audience, and the one feature that matters most.';
      if (lower.includes('website') || lower.includes('portfolio')) return 'For a website, I’d focus on clear navigation, responsive layouts, and a strong first impression.';
      if (lower.includes('help') || lower.includes('code')) return 'I can help you think it through. Break the problem into smaller steps and tackle one at a time.';
      if (lower.includes('thank')) return 'You’re very welcome! Happy to help.';
      return 'Thanks for the message! This is a simulated reply, but it shows how the chat state and saved history work.';
    };

    compose.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const chatId = activeChat;
      conversations[chatId].push({ from: 'sent', text });
      input.value = '';
      save();
      renderMessages();
      renderContacts();
      pendingChats.add(chatId);
      typing.classList.add('visible');
      const timer = setTimeout(() => {
        timers.delete(timer);
        pendingChats.delete(chatId);
        conversations[chatId].push({ from: 'received', text: createReply(text) });
        save();
        if (!modal.hidden) {
          typing.classList.toggle('visible', pendingChats.has(activeChat));
          renderMessages();
          renderContacts();
        }
      }, 850);
      timers.add(timer);
    });

    clearButton.addEventListener('click', () => {
      if (!window.confirm('Clear this conversation from your browser?')) return;
      conversations[activeChat] = [];
      save();
      renderMessages();
      renderContacts();
      showToast('Conversation cleared.');
    });

    renderContacts();
    renderMessages();
  };

  const demos = {
    weather: { title: 'Weather App', init: initWeatherDemo },
    uploader: { title: 'Drag & Drop Uploader', init: initUploaderDemo },
    form: { title: 'Multi-Step Form', init: initFormDemo },
    chat: { title: 'Ripple Chat App', init: initChatDemo }
  };

  $$('[data-demo]').forEach((button) => button.addEventListener('click', () => {
    const demo = demos[button.dataset.demo];
    if (!demo) return;
    openModal(demo.title, 'Live demo', demo.init);
  }));

  $$('[data-code]').forEach((button) => button.addEventListener('click', () => showCode(button.dataset.code)));
})();
