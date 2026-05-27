const navbar = document.getElementById('mainNavbar');
const progressLine = document.getElementById('scrollProgress');
const sections = document.querySelectorAll('.story-section');
const progressLinks = document.querySelectorAll('.story-progress a');
const petalsContainer = document.querySelector('.petals');

sections.forEach((section) => {
  const bg = section.querySelector('.section-bg');
  if (bg && section.dataset.bg) bg.style.backgroundImage = `url('${section.dataset.bg}')`;
});

function updateScrollState() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (progressLine) progressLine.style.height = `${progress}%`;
  navbar.classList.toggle('scrolled', scrollTop > 40);

  sections.forEach((section) => {
    const bg = section.querySelector('.section-bg');
    if (!bg) return;
    const rect = section.getBoundingClientRect();
    const offset = rect.top * -0.06;
    bg.style.transform = `scale(1.06) translateY(${offset}px)`;
  });

  let activeId = 'hero';
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.45) {
      activeId = section.id;
    }
  });

  progressLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  },
  { threshold: 0.18, rootMargin: '0px 0px -80px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

function createPetals() {
  if (!petalsContainer) return;
  for (let i = 0; i < 26; i += 1) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.animationDuration = `${9 + Math.random() * 10}s`;
    petal.style.animationDelay = `${Math.random() * 9}s`;
    petal.style.setProperty('--drift', `${-70 + Math.random() * 140}px`);
    petal.style.opacity = `${0.2 + Math.random() * 0.6}`;
    petalsContainer.appendChild(petal);
  }
}

createPetals();
window.addEventListener('scroll', updateScrollState, { passive: true });
window.addEventListener('resize', updateScrollState);
updateScrollState();

const contactForm = document.getElementById('contactForm');
const contactStatus = document.getElementById('contactStatus');

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  contactStatus.classList.remove('error');
  contactStatus.textContent = 'Slanje poruke...';

  const formData = new FormData(contactForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Greška pri slanju poruke.');

    contactStatus.textContent = result.message;
    contactForm.reset();
  } catch (error) {
    contactStatus.classList.add('error');
    contactStatus.textContent = error.message;
  }
});

const orderStatus = document.getElementById('orderStatus');
document.querySelectorAll('.order-btn').forEach((button) => {
  button.addEventListener('click', async () => {
    const packageName = button.dataset.package;
    const clientName = prompt('Unesi ime klijenta:');
    const email = prompt('Unesi email klijenta:');

    if (!clientName || !email) return;
    orderStatus.classList.remove('error');
    orderStatus.textContent = 'Čuvanje izbora paketa...';

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName, clientName, email })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Greška pri izboru paketa.');
      orderStatus.textContent = result.message;
    } catch (error) {
      orderStatus.classList.add('error');
      orderStatus.textContent = error.message;
    }
  });
});
/* =========================================================
   AUTH PAGE LOGIN / REGISTER ANIMATION
   ========================================================= */

const authCard = document.getElementById('authCard');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authFooterText = document.getElementById('authFooterText');

function switchAuthMode(mode) {
  const isRegister = mode === 'register';

  if (!authCard || !loginTab || !registerTab || !loginForm || !registerForm) return;

  authCard.classList.toggle('register-mode', isRegister);

  loginTab.classList.toggle('active', !isRegister);
  registerTab.classList.toggle('active', isRegister);

  loginForm.classList.remove('active');
  registerForm.classList.remove('active');

  setTimeout(() => {
    if (isRegister) {
      registerForm.classList.add('active');

      if (authTitle) {
        authTitle.innerHTML = 'Kreiraj nalog za <em>novi početak.</em>';
      }

      if (authSubtitle) {
        authSubtitle.textContent =
          'Registruj se i otvori pristup svom dashboard-u, projektima i komunikaciji.';
      }

      if (authFooterText) {
        authFooterText.innerHTML =
          'Već imaš nalog? <button type="button" class="text-switch" data-auth-switch="login">Prijavi se</button>';
      }
    } else {
      loginForm.classList.add('active');

      if (authTitle) {
        authTitle.innerHTML = 'Dobrodošao nazad u <em>svoj prostor.</em>';
      }

      if (authSubtitle) {
        authSubtitle.textContent =
          'Prijavi se da nastaviš pregled projekta, dokumenata i daljih koraka.';
      }

      if (authFooterText) {
        authFooterText.innerHTML =
          'Nemaš nalog? <button type="button" class="text-switch" data-auth-switch="register">Registruj se</button>';
      }
    }
  }, 160);
}

loginTab?.addEventListener('click', () => switchAuthMode('login'));
registerTab?.addEventListener('click', () => switchAuthMode('register'));

document.addEventListener('click', (event) => {
  const switchButton = event.target.closest('[data-auth-switch]');
  if (!switchButton) return;

  switchAuthMode(switchButton.dataset.authSwitch);
});

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  console.log('Login forma spremna za backend.');
});

registerForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  console.log('Register forma spremna za backend.');
});