const navbar = document.getElementById('mainNavbar');
const progressLine = document.getElementById('scrollProgress');
const sections = document.querySelectorAll('.story-section');
const progressLinks = document.querySelectorAll('.story-progress a');
const petalsContainer = document.querySelector('.petals');

const CART_STORAGE_KEY = 'cinematicCart';
const PENDING_PACKAGE_KEY = 'pendingCartPackage';

const PACKAGE_CATALOG = {
  basic: {
    id: 'basic',
    name: 'Basic paket',
    packageName: 'Paket Basic',
    basePrice: 300,
    unitPrice: 300,
    price: 300,
    description: 'Profesionalan poslovni sajt sa osnovnim stranicama i kontaktnom formom.',
    page: 'package-basic.html',
    image: 'assets/package-basic-bg.png',
    options: []
  },
  pro: {
    id: 'pro',
    name: 'Pro paket',
    packageName: 'Paket Pro',
    basePrice: 500,
    unitPrice: 500,
    price: 500,
    description: 'Napredniji web nastup sa više stranica, animacijama i jačim vizuelnim identitetom.',
    page: 'package-pro.html',
    image: 'assets/package-pro-bg.png',
    options: []
  },
  premium: {
    id: 'premium',
    name: 'Premium paket',
    packageName: 'Paket Premium',
    basePrice: 800,
    unitPrice: 800,
    price: 800,
    description: 'Napredno web rešenje sa dizajnom po meri, integracijama i prilagođenim funkcionalnostima.',
    page: 'package-premium.html',
    image: 'assets/package-premium-bg.png',
    options: []
  }
};

sections.forEach((section) => {
  const bg = section.querySelector('.section-bg');
  if (bg && section.dataset.bg) bg.style.backgroundImage = `url('${section.dataset.bg}')`;
});

function updateScrollState() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (progressLine) progressLine.style.height = `${progress}%`;
  navbar?.classList.toggle('scrolled', scrollTop > 40);

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

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -80px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
}

function createPetals() {
  if (!petalsContainer || petalsContainer.childElementCount) return;

  for (let index = 0; index < 46; index += 1) {
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

function readStoredJson(storage, key) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    storage.removeItem(key);
    return null;
  }
}

function getCurrentUser() {
  return readStoredJson(sessionStorage, 'currentUser') || readStoredJson(localStorage, 'currentUser');
}

function resolvePackage(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('premium')) return PACKAGE_CATALOG.premium;
  if (normalized.includes('pro')) return PACKAGE_CATALOG.pro;
  if (normalized.includes('basic')) return PACKAGE_CATALOG.basic;
  return null;
}

function getCartItems() {
  const cart = readStoredJson(localStorage, CART_STORAGE_KEY);
  return Array.isArray(cart) ? cart : [];
}

function getCartQuantity(items = getCartItems()) {
  return items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);
}

function saveCartItems(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cinematic-cart-updated'));
}

function addPackageToCart(packageInfo) {
  if (!packageInfo?.id) return { added: false, reason: 'invalid' };

  const cart = getCartItems();
  const existingIndex = cart.findIndex((item) => item.id === packageInfo.id);

  if (existingIndex !== -1) {
    cart[existingIndex].quantity = Math.min(
      10,
      Math.max(1, Number(cart[existingIndex].quantity) || 1) + 1
    );
    saveCartItems(cart);
    return { added: true, reason: 'incremented', cart };
  }

  const nextCart = [
    ...cart,
    {
      ...packageInfo,
      quantity: 1,
      addedAt: new Date().toISOString()
    }
  ];

  saveCartItems(nextCart);
  return { added: true, reason: 'new', cart: nextCart };
}

function setPendingPackage(packageInfo) {
  localStorage.setItem(PENDING_PACKAGE_KEY, JSON.stringify({ ...packageInfo, quantity: 1 }));
  localStorage.setItem('selectedPackage', packageInfo.packageName);
}

function setOrderStatus(message, isError = false) {
  const orderStatus = document.getElementById('orderStatus');
  if (!orderStatus) return;
  orderStatus.classList.toggle('error', isError);
  orderStatus.textContent = message;
}

const contactForm = document.getElementById('contactForm');
const contactStatus = document.getElementById('contactStatus');

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  contactStatus?.classList.remove('error');
  if (contactStatus) contactStatus.textContent = 'Slanje poruke...';

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

    if (contactStatus) contactStatus.textContent = result.message;
    contactForm.reset();
  } catch (error) {
    contactStatus?.classList.add('error');
    if (contactStatus) contactStatus.textContent = error.message;
  }
});

document.querySelectorAll('.order-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const packageInfo = resolvePackage(button.dataset.package);

    if (!packageInfo) {
      setOrderStatus('Paket nije prepoznat. Osveži stranicu i pokušaj ponovo.', true);
      return;
    }

    localStorage.setItem('selectedPackage', packageInfo.packageName);
    window.location.href = packageInfo.page;
  });
});

function getUserInitials(name) {
  const parts = String(name || 'Korisnik').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'K';
}

function getPurchaseHistory() {
  const history =
    readStoredJson(localStorage, 'cinematicPurchaseHistory') ||
    readStoredJson(localStorage, 'purchaseHistory');

  return Array.isArray(history) ? history : [];
}

function getCurrentUserId(user = getCurrentUser()) {
  return String(user?.id || user?._id || '').trim();
}

async function readApiJson(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(
      'Server nije vratio ispravan JSON odgovor. Proveri da li je Node server pokrenut.'
    );
  }
}

async function loadAccountCounts(user) {
  const userId = getCurrentUserId(user);

  if (!userId) {
    return {
      projects: 0,
      purchases: getPurchaseHistory().length
    };
  }

  const email = encodeURIComponent(String(user.email || '').trim());
  const encodedUserId = encodeURIComponent(userId);

  const [projectsResult, paymentsResult] = await Promise.allSettled([
    fetch(`/api/projects/user/${encodedUserId}?email=${email}`).then(readApiJson),
    fetch(`/api/payments/user/${encodedUserId}?email=${email}`).then(readApiJson)
  ]);

  const projects =
    projectsResult.status === 'fulfilled' &&
    Array.isArray(projectsResult.value.projects)
      ? projectsResult.value.projects.length
      : 0;

  const purchases =
    paymentsResult.status === 'fulfilled' &&
    Array.isArray(paymentsResult.value.payments)
      ? paymentsResult.value.payments.length
      : getPurchaseHistory().length;

  return {
    projects,
    purchases
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function accountIcon(path) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}"></path></svg>`;
}

function createAccountMenu() {
  const currentUser = getCurrentUser();
  const startProjectButton = document.querySelector(
    '.cinematic-navbar a.btn-cinematic[href="auth.html"]'
  );

  if (!currentUser || !startProjectButton) return;

  const localPurchaseHistory = getPurchaseHistory();
  const wrapper = document.createElement('div');
  wrapper.className = 'account-menu-wrapper';

  wrapper.innerHTML = `
    <button
      class="account-avatar-button"
      type="button"
      aria-label="Otvori korisnički meni"
      aria-haspopup="true"
      aria-expanded="false"
    >
      <span class="account-avatar-initials">
        ${escapeHtml(getUserInitials(currentUser.name))}
      </span>
      <span class="account-online-dot" aria-hidden="true"></span>
    </button>

    <div class="account-dropdown" role="menu" aria-hidden="true">
      <div class="account-dropdown-user">
        <span class="account-dropdown-avatar">
          ${escapeHtml(getUserInitials(currentUser.name))}
        </span>

        <div>
          <strong>${escapeHtml(currentUser.name || 'Korisnik')}</strong>
          <small>${escapeHtml(currentUser.email || '')}</small>
        </div>
      </div>

      <div class="account-menu-divider"></div>


      <button
        class="account-menu-item"
        type="button"
        data-account-profile
        role="menuitem"
      >
        <span class="account-menu-icon">
          ${accountIcon(
            'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 9a7 7 0 0 0-14 0'
          )}
        </span>

        <span class="account-menu-copy">
          <strong>Profil</strong>
          <small>Lični podaci i lozinka</small>
        </span>
      </button>

      ${
        currentUser.role !== 'admin'
          ? `
      <button
        class="account-menu-item"
        type="button"
        data-account-cart
        role="menuitem"
      >
        <span class="account-menu-icon">
          ${accountIcon(
            'M3 4h2l2.2 9.2a2 2 0 0 0 2 1.5h7.9a2 2 0 0 0 2-1.6L20.5 7H6.1M10 19a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm8 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z'
          )}
        </span>

        <span class="account-menu-copy">
          <strong>Korpa</strong>
          <small data-account-cart-copy>Korpa je prazna</small>
        </span>

        <span class="account-menu-badge" data-account-cart-badge>0</span>
      </button>

      <button
        class="account-menu-item"
        type="button"
        data-account-projects
        role="menuitem"
      >
        <span class="account-menu-icon">
          ${accountIcon(
            'M4 5a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm3 4h10M7 13h7M7 17h5'
          )}
        </span>

        <span class="account-menu-copy">
          <strong>Moji projekti</strong>
          <small data-account-projects-copy>Učitavanje projekata...</small>
        </span>

        <span class="account-menu-badge" data-account-projects-badge>0</span>
      </button>

      <button
        class="account-menu-item"
        type="button"
        data-account-history
        role="menuitem"
      >
        <span class="account-menu-icon">
          ${accountIcon(
            'M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5M12 7v5l3 2'
          )}
        </span>

        <span class="account-menu-copy">
          <strong>Istorija kupovina</strong>
          <small data-account-history-copy>
            ${
              localPurchaseHistory.length
                ? `${localPurchaseHistory.length} kupovina`
                : 'Učitavanje kupovina...'
            }
          </small>
        </span>

        <span class="account-menu-badge" data-account-history-badge>
          ${localPurchaseHistory.length}
        </span>
      </button>
          `
          : ''
      }


      ${
        currentUser.role === 'admin'
          ? `
            <button
              class="account-menu-item account-menu-admin"
              type="button"
              data-account-admin
              role="menuitem"
            >
              <span class="account-menu-icon">
                ${accountIcon(
                  'M12 3l8 4v5c0 4.5-3.1 7.7-8 9-4.9-1.3-8-4.5-8-9V7l8-4Zm0 5v4m0 4h.01'
                )}
              </span>

              <span class="account-menu-copy">
                <strong>Admin panel</strong>
                <small>Upravljanje aplikacijom</small>
              </span>
            </button>

            <div class="account-menu-divider"></div>
          `
          : '<div class="account-menu-divider"></div>'
      }

      <button
        class="account-menu-item account-menu-logout"
        type="button"
        data-account-logout
        role="menuitem"
      >
        <span class="account-menu-icon">
          ${accountIcon(
            'M10 17l5-5-5-5M15 12H3m9-9h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6'
          )}
        </span>

        <span class="account-menu-copy">
          <strong>Odjava</strong>
          <small>Završi trenutnu sesiju</small>
        </span>
      </button>
    </div>
  `;

  startProjectButton.replaceWith(wrapper);

  const avatarButton = wrapper.querySelector('.account-avatar-button');
  const dropdown = wrapper.querySelector('.account-dropdown');
  const profileButton = wrapper.querySelector('[data-account-profile]');
  const cartButton = wrapper.querySelector('[data-account-cart]');
  const cartCopy = wrapper.querySelector('[data-account-cart-copy]');
  const cartBadge = wrapper.querySelector('[data-account-cart-badge]');
  const projectsButton = wrapper.querySelector('[data-account-projects]');
  const projectsCopy = wrapper.querySelector('[data-account-projects-copy]');
  const projectsBadge = wrapper.querySelector('[data-account-projects-badge]');
  const historyButton = wrapper.querySelector('[data-account-history]');
  const historyCopy = wrapper.querySelector('[data-account-history-copy]');
  const historyBadge = wrapper.querySelector('[data-account-history-badge]');
  const adminButton = wrapper.querySelector('[data-account-admin]');
  const logoutButton = wrapper.querySelector('[data-account-logout]');

  function updateCartSummary() {
    if (
      !cartBadge ||
      !cartCopy
    ) {
      return;
    }

    const count = getCartQuantity();

    cartBadge.textContent = String(count);
    cartCopy.textContent = count
      ? `${count} ${count === 1 ? 'paket' : 'paketa'} u korpi`
      : 'Korpa je prazna';
  }

  function updateAccountCounts() {
    if (
      !projectsBadge ||
      !projectsCopy ||
      !historyBadge ||
      !historyCopy
    ) {
      return;
    }

    loadAccountCounts(currentUser)
      .then(({ projects, purchases }) => {
        projectsBadge.textContent = String(projects);
        projectsCopy.textContent = projects
          ? `${projects} ${projects === 1 ? 'projekat' : 'projekta'}`
          : 'Još nema projekata';

        historyBadge.textContent = String(purchases);
        historyCopy.textContent = purchases
          ? `${purchases} ${purchases === 1 ? 'kupovina' : 'kupovina'}`
          : 'Još nema kupovina';
      })
      .catch(() => {
        projectsCopy.textContent = 'Otvori pregled projekata';
        historyCopy.textContent = localPurchaseHistory.length
          ? `${localPurchaseHistory.length} kupovina`
          : 'Otvori istoriju kupovina';
      });
  }

  function setMenuOpen(open) {
    wrapper.classList.toggle('open', open);
    avatarButton.setAttribute('aria-expanded', String(open));
    dropdown.setAttribute('aria-hidden', String(!open));
  }

  if (
    currentUser.role !== 'admin'
  ) {
    updateCartSummary();
    updateAccountCounts();

    window.addEventListener(
      'cinematic-cart-updated',
      updateCartSummary
    );

    window.addEventListener(
      'storage',
      () => {
        updateCartSummary();
        updateAccountCounts();
      }
    );
  }

  avatarButton.addEventListener('click', (event) => {
    event.stopPropagation();
    setMenuOpen(!wrapper.classList.contains('open'));
  });

  dropdown.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  profileButton.addEventListener('click', () => {
    setMenuOpen(false);
    window.location.href = 'profile.html';
  });

  cartButton?.addEventListener('click', () => {
    setMenuOpen(false);
    window.location.href = 'cart.html';
  });

  projectsButton?.addEventListener('click', () => {
    setMenuOpen(false);
    window.location.href = 'my-projects.html';
  });

  historyButton?.addEventListener('click', () => {
    setMenuOpen(false);
    window.location.href = 'purchase-history.html';
  });

  adminButton?.addEventListener('click', () => {
    setMenuOpen(false);
    window.location.href = 'admin.html';
  });

  logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
    setMenuOpen(false);
    window.location.href = 'auth.html';
  });

  document.addEventListener('click', () => {
    setMenuOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      avatarButton.focus();
    }
  });
}

createAccountMenu();


/* =====================================================================
   GLOBAL PASSWORD VISIBILITY
   Automatically adds an eye button to every password input on pages
   that load main.js, including profile.html and future forms.
   ===================================================================== */

function passwordVisibilityIcon(
  visible
) {
  if (visible) {
    return `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3 3l18 18"></path>
        <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7"></path>
        <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c5.5 0 9 5.3 9 5.3a15.5 15.5 0 0 1-2.1 2.7"></path>
        <path d="M6.6 6.6C4.3 8.1 3 10.1 3 10.1S6.5 16 12 16a9.7 9.7 0 0 0 3-.5"></path>
      </svg>
    `;
  }

  return `
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"></path>
      <circle cx="12" cy="12" r="2.5"></circle>
    </svg>
  `;
}

function initializePasswordToggles(
  root = document
) {
  const passwordInputs =
    root.querySelectorAll(
      'input[type="password"]:not([data-password-toggle-ready])'
    );

  passwordInputs.forEach(
    (input) => {
      input.dataset.passwordToggleReady =
        'true';

      const shell =
        document.createElement(
          'div'
        );

      shell.className =
        'password-input-shell';

      input.parentNode.insertBefore(
        shell,
        input
      );

      shell.appendChild(input);

      const button =
        document.createElement(
          'button'
        );

      button.type =
        'button';

      button.className =
        'password-visibility-toggle';

      button.setAttribute(
        'aria-label',
        'Prikaži lozinku'
      );

      button.setAttribute(
        'aria-pressed',
        'false'
      );

      button.innerHTML =
        passwordVisibilityIcon(
          false
        );

      button.addEventListener(
        'click',
        () => {
          const shouldShow =
            input.type ===
            'password';

          input.type =
            shouldShow
              ? 'text'
              : 'password';

          button.classList.toggle(
            'is-visible',
            shouldShow
          );

          button.setAttribute(
            'aria-pressed',
            String(
              shouldShow
            )
          );

          button.setAttribute(
            'aria-label',
            shouldShow
              ? 'Sakrij lozinku'
              : 'Prikaži lozinku'
          );

          button.innerHTML =
            passwordVisibilityIcon(
              shouldShow
            );

          input.focus({
            preventScroll:
              true
          });

          const valueLength =
            input.value.length;

          try {
            input.setSelectionRange(
              valueLength,
              valueLength
            );
          } catch (error) {
            // Neki browseri ne podržavaju selection range za svaki input tip.
          }
        }
      );

      shell.appendChild(
        button
      );
    }
  );
}

initializePasswordToggles();

const passwordToggleObserver =
  new MutationObserver(
    (mutations) => {
      mutations.forEach(
        (mutation) => {
          mutation.addedNodes.forEach(
            (node) => {
              if (
                node.nodeType !==
                Node.ELEMENT_NODE
              ) {
                return;
              }

              if (
                node.matches?.(
                  'input[type="password"]'
                )
              ) {
                initializePasswordToggles(
                  node.parentElement ||
                  document
                );

                return;
              }

              initializePasswordToggles(
                node
              );
            }
          );
        }
      );
    }
  );

passwordToggleObserver.observe(
  document.body,
  {
    childList: true,
    subtree: true
  }
);
