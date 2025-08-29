 (function () {
      const qs = s => document.querySelector(s);
      const qsa = s => Array.from(document.querySelectorAll(s));

      /* ---------- Auth ---------- */
      const loginWrap = qs('#login');
      const app = qs('#app');
      const loginForm = qs('#login-form');
      const emailInput = qs('#email');
      const passInput = qs('#password');
      const emailErr = qs('#email-err');
      const passErr = qs('#pass-err');

      function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
      function currentUser() { return localStorage.getItem('currentUser'); }
      function setUser(email) { localStorage.setItem('currentUser', email); }
      function clearUser() { localStorage.removeItem('currentUser'); }

      function showApp() {
        loginWrap.style.display = 'none';
        app.style.display = 'block';
      }
      function showLogin() {
        app.style.display = 'none';
        loginWrap.style.display = 'flex';
      }

      loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = emailInput.value.trim().toLowerCase();
        const pass = passInput.value;

        let ok = true;
        if (!isEmail(email)) { emailErr.style.display = 'block'; ok = false; } else emailErr.style.display = 'none';
        if (pass.length < 6) { passErr.style.display = 'block'; ok = false; } else passErr.style.display = 'none';
        if (!ok) return;

        setUser(email);
        showApp();
        loadTasks(); renderTasks();
      });

      /* ---------- Theme ---------- */
      const themeToggle = qs('#theme-toggle');
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) { document.documentElement.setAttribute('data-theme', savedTheme); themeToggle.checked = savedTheme === 'dark'; }
      else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark'); themeToggle.checked = true;
      }
      themeToggle.addEventListener('change', () => {
        const t = themeToggle.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('theme', t);
      });

      /* ---------- Sidebar / Sections ---------- */
      const sidebar = qs('#sidebar');
      const menuToggle = qs('.menu-toggle');
      menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

      const links = qsa('.menu a[data-target]');
      const sections = qsa('.section');
      links.forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          const id = a.dataset.target;
          links.forEach(x => x.classList.remove('active'));
          a.classList.add('active');
          sections.forEach(s => s.classList.remove('active'));
          const sec = qs('#' + id); if (sec) sec.classList.add('active');
        });
      });

      qs('#logout').addEventListener('click', e => {
        e.preventDefault();
        clearUser();
        showLogin();
        loginForm.reset();
      });

      /* ---------- ToDo (per user) ---------- */
      let tasks = [];
      const containers = () => qsa('.task-container');
      const tasksKey = () => 'tasks_' + (currentUser() || 'guest');

      function loadTasks() { tasks = JSON.parse(localStorage.getItem(tasksKey()) || '[]'); }
      function saveTasks() { localStorage.setItem(tasksKey(), JSON.stringify(tasks)); }

      function renderTasks() {
        containers().forEach(c => c.innerHTML = '');
        tasks.forEach(t => {
          const li = document.createElement('li');
          li.className = 'task' + (t.completed ? ' completed' : '');
          li.draggable = true;
          li.dataset.id = t.id;

          const cb = document.createElement('input');
          cb.type = 'checkbox'; cb.checked = t.completed;
          cb.addEventListener('change', () => toggleTask(t.id));

          const p = document.createElement('p');
          p.textContent = t.text;

          li.appendChild(cb); li.appendChild(p);
          const bucket = document.querySelector(`.task-container[data-category="${t.category}"]`);
          (bucket || document.querySelector('.task-container[data-category="DESIGN"]')).appendChild(li);

          li.addEventListener('dragstart', () => li.classList.add('dragging'));
          li.addEventListener('dragend', () => li.classList.remove('dragging'));
        });

        // DnD targets
        containers().forEach(c => {
          c.ondragover = e => e.preventDefault();
          c.ondrop = () => {
            const dragging = document.querySelector('.dragging');
            if (!dragging) return;
            const id = Number(dragging.dataset.id);
            const task = tasks.find(x => x.id === id);
            if (!task) return;
            task.category = c.dataset.category;
            saveTasks(); renderTasks();
          };
        });
      }

      function addTask() {
        const input = qs('#task-input');
        const catSel = qs('#task-cat');
        const text = (input.value || '').trim();
        if (!text) return alert('Введіть задачу');
        const task = { id: Date.now(), text, completed: false, category: catSel.value || 'DESIGN' };
        tasks.push(task); saveTasks(); input.value = ''; renderTasks();
      }
      function toggleTask(id) {
        const t = tasks.find(x => x.id === id); if (!t) return;
        t.completed = !t.completed; saveTasks(); renderTasks();
      }
      qs('#add-task').addEventListener('click', addTask);

      /* ---------- Boot ---------- */
      if (currentUser()) { showApp(); loadTasks(); renderTasks(); }
      else { showLogin(); }
    })();

    async function showPeople() {
      const content = document.getElementById('content');
      content.innerHTML = "<h2>Завантаження...</h2>";

      try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");
        const users = await response.json();

        content.innerHTML = "<h2>People</h2>";

        users.forEach(user => {
          const card = document.createElement('div');
          card.classList.add('card');
          card.innerHTML = `
            <h3>${user.name}</h3>
            <p><b>Email:</b> ${user.email}</p>
            <p><b>Phone:</b> ${user.phone}</p>
            <p><b>Company:</b> ${user.company.name}</p>
          `;
          content.appendChild(card);
        });
      } catch (error) {
        content.innerHTML = "<p style='color:red;'>Помилка завантаження даних</p>";
      }
    }