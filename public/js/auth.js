const authCard = document.getElementById('authCard');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authFooterText = document.getElementById('authFooterText');
const loginStatus = document.getElementById('loginStatus');
const registerStatus = document.getElementById('registerStatus');
const loginSubmit = document.getElementById('loginSubmit');
const registerSubmit = document.getElementById('registerSubmit');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

const CART_STORAGE_KEY = 'cinematicCart';
const PENDING_PACKAGE_KEY = 'pendingCartPackage';
const CHECKOUT_AFTER_AUTH_KEY = 'checkoutAfterAuth';

function setStatus(element, message, type = '') {
  if (!element) return;

  element.className = `auth-status ${type}`.trim();
  element.textContent = message;
}

function setButtonLoading(button, loading, defaultText) {
  if (!button) return;

  button.disabled = loading;
  button.textContent = loading ? 'Sačekaj...' : defaultText;
}

function switchAuthMode(mode) {
  const isRegister = mode === 'register';

  if (!authCard || !loginTab || !registerTab || !loginForm || !registerForm) {
    return;
  }

  authCard.classList.toggle('register-mode', isRegister);
  loginTab.classList.toggle('active', !isRegister);
  registerTab.classList.toggle('active', isRegister);

  loginForm.classList.remove('active');
  registerForm.classList.remove('active');

  setStatus(loginStatus, '');
  setStatus(registerStatus, '');

  window.setTimeout(() => {
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

async function sendRequest(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let result = {};

  try {
    result = await response.json();
  } catch (error) {
    result = {};
  }

  if (!response.ok) {
    throw new Error(result.message || 'Došlo je do greške.');
  }

  return result;
}

function saveCurrentUser(user, rememberMe) {
  sessionStorage.removeItem('currentUser');
  localStorage.removeItem('currentUser');

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('currentUser', JSON.stringify(user));
}

function readStoredJson(storage, key) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    storage.removeItem(key);
    return null;
  }
}

function movePendingPackageToCart() {
  const pendingPackage = readStoredJson(localStorage, PENDING_PACKAGE_KEY);

  if (!pendingPackage || !pendingPackage.id) {
    return false;
  }

  const currentCart = readStoredJson(localStorage, CART_STORAGE_KEY);
  const cart = Array.isArray(currentCart) ? currentCart : [];
  const existingIndex = cart.findIndex((item) => item.id === pendingPackage.id);
  const pendingQuantity = Math.max(1, Number(pendingPackage.quantity) || 1);

  if (existingIndex === -1) {
    cart.push({
      ...pendingPackage,
      quantity: pendingQuantity,
      addedAt: new Date().toISOString()
    });
  } else {
    const existing = cart[existingIndex];

    cart[existingIndex] = {
      ...existing,
      ...pendingPackage,
      quantity: pendingQuantity,
      updatedAt: new Date().toISOString()
    };
  }

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  localStorage.setItem('selectedPackage', pendingPackage.packageName || pendingPackage.name || '');
  localStorage.removeItem(PENDING_PACKAGE_KEY);
  return true;
}

function redirectAfterAuthentication() {
  const addedPendingPackage = movePendingPackageToCart();
  const checkoutRequested =
    localStorage.getItem(CHECKOUT_AFTER_AUTH_KEY) === '1';

  localStorage.removeItem(CHECKOUT_AFTER_AUTH_KEY);

  if (addedPendingPackage) {
    window.location.href = checkoutRequested
      ? 'cart.html?checkout=1'
      : 'cart.html';
    return;
  }

  window.location.href = checkoutRequested
    ? 'cart.html?checkout=1'
    : 'index.html';
}

loginTab?.addEventListener('click', () => switchAuthMode('login'));
registerTab?.addEventListener('click', () => switchAuthMode('register'));

document.addEventListener('click', (event) => {
  const switchButton = event.target.closest('[data-auth-switch]');

  if (!switchButton) return;

  switchAuthMode(switchButton.dataset.authSwitch);
});

forgotPasswordLink?.addEventListener('click', (event) => {
  event.preventDefault();
  setStatus(
    loginStatus,
    'Resetovanje lozinke još nije implementirano. Obrati se administratoru.',
    'info'
  );
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value || '';
  const rememberMe = Boolean(document.getElementById('loginRemember')?.checked);

  if (!email || !password) {
    setStatus(loginStatus, 'Unesi email i lozinku.', 'error');
    return;
  }

  setButtonLoading(loginSubmit, true, 'Prijavi se');
  setStatus(loginStatus, 'Prijavljivanje...', 'loading');

  try {
    const result = await sendRequest('/api/auth/login', {
      email,
      password
    });

    saveCurrentUser(result.user, rememberMe);
    setStatus(loginStatus, result.message, 'success');

    window.setTimeout(() => {
      redirectAfterAuthentication();
    }, 600);
  } catch (error) {
    setStatus(loginStatus, error.message, 'error');
  } finally {
    setButtonLoading(loginSubmit, false, 'Prijavi se');
  }
});

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('registerName')?.value.trim();
  const email = document.getElementById('registerEmail')?.value.trim();
  const password = document.getElementById('registerPassword')?.value || '';
  const confirmPassword =
    document.getElementById('registerConfirmPassword')?.value || '';
  const acceptedTerms = Boolean(document.getElementById('registerTerms')?.checked);

  if (!name || !email || !password || !confirmPassword) {
    setStatus(registerStatus, 'Popuni sva obavezna polja.', 'error');
    return;
  }

  if (!acceptedTerms) {
    setStatus(registerStatus, 'Moraš prihvatiti uslove korišćenja.', 'error');
    return;
  }

  if (password !== confirmPassword) {
    setStatus(registerStatus, 'Lozinke se ne poklapaju.', 'error');
    return;
  }

  const hasLetter = /[A-Za-zČĆŽŠĐčćžšđ]/.test(password);
  const hasNumber = /\d/.test(password);

  if (password.length < 8 || !hasLetter || !hasNumber) {
    setStatus(
      registerStatus,
      'Lozinka mora imati najmanje 8 karaktera, jedno slovo i jedan broj.',
      'error'
    );
    return;
  }

  setButtonLoading(registerSubmit, true, 'Kreiraj nalog');
  setStatus(registerStatus, 'Kreiranje naloga...', 'loading');

  try {
    const result = await sendRequest('/api/auth/register', {
      name,
      email,
      password,
      confirmPassword
    });

    saveCurrentUser(result.user, false);
    setStatus(registerStatus, result.message, 'success');

    window.setTimeout(() => {
      redirectAfterAuthentication();
    }, 600);
  } catch (error) {
    setStatus(registerStatus, error.message, 'error');
  } finally {
    setButtonLoading(registerSubmit, false, 'Kreiraj nalog');
  }
});
