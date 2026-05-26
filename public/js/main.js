const navbar = document.getElementById('mainNavbar');
const progressLine = document.getElementById('scrollProgress');
const sections = document.querySelectorAll('.story-section');
const progressLinks = document.querySelectorAll('.story-progress a');
const petalsContainer = document.querySelector('.petals');

sections.forEach((section) => {
  const bg = section.querySelector('.section-bg');
  if (bg) bg.style.backgroundImage = `url('${section.dataset.bg}')`;
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
    bg.style.transform = `scale(1.03) translateY(${offset}px)`;
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
  for (let i = 0; i < 30; i += 1) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.animationDuration = `${9 + Math.random() * 10}s`;
    petal.style.animationDelay = `${Math.random() * 9}s`;
    petal.style.setProperty('--drift', `${-70 + Math.random() * 140}px`);
    petal.style.opacity = `${0.2 + Math.random() * 0.7}`;
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
