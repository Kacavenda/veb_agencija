(() => {
  const CART_STORAGE_KEY = 'cinematicCart';
  const PURCHASE_HISTORY_KEY = 'cinematicPurchaseHistory';
  const MAX_QUANTITY = 10;

  const cartItemsElement = document.getElementById('cartItems');
  const cartEmptyElement = document.getElementById('cartEmpty');
  const cartCountLabel = document.getElementById('cartCountLabel');
  const clearCartButton = document.getElementById('clearCartButton');
  const summaryCount = document.getElementById('summaryCount');
  const summaryBase = document.getElementById('summaryBase');
  const summaryExtras = document.getElementById('summaryExtras');
  const summaryTotal = document.getElementById('summaryTotal');
  const checkoutButton = document.getElementById('checkoutButton');
  const cartStatus = document.getElementById('cartStatus');
  const paypalCheckoutPanel = document.getElementById('paypalCheckoutPanel');
  const paypalButtonContainer = document.getElementById('paypalButtonContainer');
  const paypalCloseButton = document.getElementById('paypalCloseButton');

  let paypalSdkPromise = null;
  let paypalButtonsInstance = null;
  let paymentPanelOpen = false;
  let lastRenderedCartSignature = '';

  function readStoredJson(storage, key, fallback) {
    try {
      const value = storage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      storage.removeItem(key);
      return fallback;
    }
  }

  function readCart() {
    const value = readStoredJson(localStorage, CART_STORAGE_KEY, []);
    return Array.isArray(value) ? value : [];
  }

  function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cinematic-cart-updated'));
  }

  function getCurrentUser() {
    return (
      readStoredJson(sessionStorage, 'currentUser', null) ||
      readStoredJson(localStorage, 'currentUser', null)
    );
  }

  function savePurchaseHistory(entry) {
    const history = readStoredJson(localStorage, PURCHASE_HISTORY_KEY, []);
    const nextHistory = Array.isArray(history) ? history : [];
    nextHistory.unshift(entry);
    localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(nextHistory.slice(0, 30)));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatPrice(value) {
    return `${new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(value) || 0)} €`;
  }

  function getUnitPrice(item) {
    return Number(item.unitPrice ?? item.price ?? item.basePrice ?? 0);
  }

  function getBasePrice(item) {
    return Number(item.basePrice ?? item.price ?? 0);
  }

  function getQuantity(item) {
    return Math.min(MAX_QUANTITY, Math.max(1, Number(item.quantity) || 1));
  }

  function getOptions(item) {
    return Array.isArray(item.options) ? item.options : [];
  }

  function setStatus(message, type = '') {
    if (!cartStatus) return;
    cartStatus.className = `cart-status ${type}`.trim();
    cartStatus.textContent = message;
  }

  function renderOptions(item) {
    const options = getOptions(item);

    if (!options.length) {
      return '<div class="cart-default-config">Osnovna konfiguracija paketa</div>';
    }

    return `
      <div class="cart-item-options">
        ${options
          .map((option) => {
            const extra = Number(option.extraTotal) || 0;
            return `
              <span class="cart-option-pill ${extra ? 'changed' : ''}">
                <b>${escapeHtml(option.label)}</b>
                <span>${escapeHtml(option.value)}</span>
                ${extra ? `<small>+ ${formatPrice(extra)}</small>` : '<small>uključeno</small>'}
              </span>
            `;
          })
          .join('')}
      </div>
    `;
  }

  function cartSignature(cart) {
    return JSON.stringify(
      cart.map((item) => ({
        id: item.id,
        quantity: getQuantity(item),
        options: getOptions(item).map((option) => ({
          key: option.key,
          value: Number(option.value)
        }))
      }))
    );
  }

  function getTotals(cart) {
    const totalQuantity = cart.reduce((sum, item) => sum + getQuantity(item), 0);
    const baseTotal = cart.reduce(
      (sum, item) => sum + getBasePrice(item) * getQuantity(item),
      0
    );
    const extrasTotal = cart.reduce(
      (sum, item) =>
        sum +
        Math.max(0, getUnitPrice(item) - getBasePrice(item)) * getQuantity(item),
      0
    );

    return {
      totalQuantity,
      baseTotal,
      extrasTotal,
      total: baseTotal + extrasTotal
    };
  }

  function renderCart() {
    const cart = readCart();
    const uniqueCount = cart.length;
    const totals = getTotals(cart);
    const signature = cartSignature(cart);

    if (cartItemsElement) {
      cartItemsElement.innerHTML = cart
        .map((item) => {
          const quantity = getQuantity(item);
          const unitPrice = getUnitPrice(item);
          const subtotal = unitPrice * quantity;
          const itemKey = escapeHtml(item.id);

          return `
            <article class="cart-item" data-cart-item="${itemKey}">
              <div class="cart-item-product">
                <div
                  class="cart-item-image"
                  style="background-image: url('${escapeHtml(item.image)}')"
                  aria-hidden="true"
                ></div>

                <div class="cart-item-copy">
                  <small>Paket izrade sajta</small>
                  <h3>${escapeHtml(item.name)}</h3>
                  <p>${escapeHtml(item.description)}</p>
                  ${renderOptions(item)}
                  <a href="${escapeHtml(item.page)}">
                    ${getOptions(item).length ? 'Izmeni konfiguraciju paketa' : 'Pogledaj detalje paketa'} →
                  </a>
                </div>
              </div>

              <div class="cart-item-price">${formatPrice(unitPrice)}</div>

              <div class="cart-item-quantity">
                <div class="cart-quantity-control" aria-label="Količina paketa">
                  <button
                    type="button"
                    data-cart-decrease="${itemKey}"
                    aria-label="Smanji količinu"
                    ${quantity <= 1 ? 'disabled' : ''}
                  >−</button>
                  <output>${quantity}</output>
                  <button
                    type="button"
                    data-cart-increase="${itemKey}"
                    aria-label="Povećaj količinu"
                    ${quantity >= MAX_QUANTITY ? 'disabled' : ''}
                  >+</button>
                </div>
              </div>

              <div class="cart-item-subtotal">${formatPrice(subtotal)}</div>

              <button
                class="cart-remove-button"
                type="button"
                data-remove-package="${itemKey}"
                aria-label="Ukloni ${escapeHtml(item.name)} iz korpe"
              >×</button>
            </article>
          `;
        })
        .join('');
    }

    if (cartEmptyElement) cartEmptyElement.hidden = uniqueCount !== 0;
    if (cartItemsElement) cartItemsElement.hidden = uniqueCount === 0;

    if (cartCountLabel) {
      cartCountLabel.textContent = `${totals.totalQuantity} ${
        totals.totalQuantity === 1 ? 'paket' : 'paketa'
      }`;
    }

    if (summaryCount) summaryCount.textContent = String(totals.totalQuantity);
    if (summaryBase) summaryBase.textContent = formatPrice(totals.baseTotal);
    if (summaryExtras) summaryExtras.textContent = formatPrice(totals.extrasTotal);
    if (summaryTotal) summaryTotal.textContent = formatPrice(totals.total);
    if (clearCartButton) clearCartButton.hidden = uniqueCount === 0;
    if (checkoutButton) checkoutButton.disabled = uniqueCount === 0;

    if (uniqueCount === 0) {
      closePayPalPanel();
    } else if (paymentPanelOpen && signature !== lastRenderedCartSignature) {
      renderPayPalButtons();
    }

    lastRenderedCartSignature = signature;
  }

  function changeQuantity(packageId, delta) {
    const cart = readCart();
    const index = cart.findIndex((item) => item.id === packageId);

    if (index === -1) return;

    const currentQuantity = getQuantity(cart[index]);
    cart[index].quantity = Math.min(
      MAX_QUANTITY,
      Math.max(1, currentQuantity + delta)
    );
    cart[index].updatedAt = new Date().toISOString();

    saveCart(cart);
    renderCart();
    setStatus('Količina je promenjena. PayPal iznos je osvežen.', 'info');
  }

  async function readJsonResponse(response) {
    const responseText = await response.text();

    try {
      return responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      throw new Error(
        'Server nije vratio ispravan JSON odgovor. Proveri da li je Node server pokrenut na portu 3000.'
      );
    }
  }

  async function fetchPayPalConfig() {
    const response = await fetch('/api/paypal/config');
    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(result.message || 'PayPal konfiguracija nije dostupna.');
    }

    return result;
  }

  function loadPayPalSdk(clientId, currency) {
    if (window.paypal) return Promise.resolve(window.paypal);
    if (paypalSdkPromise) return paypalSdkPromise;

    paypalSdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const params = new URLSearchParams({
        'client-id': clientId,
        currency,
        intent: 'capture',
        components: 'buttons'
      });

      script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
      script.async = true;
      script.onload = () => resolve(window.paypal);
      script.onerror = () => reject(new Error('PayPal SDK nije mogao da se učita.'));
      document.head.appendChild(script);
    });

    return paypalSdkPromise;
  }

  async function createPayPalOrder() {
    const cart = readCart();

    if (!cart.length) {
      throw new Error('Korpa je prazna.');
    }

    const response = await fetch('/api/paypal/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cart })
    });

    const result = await readJsonResponse(response);

    if (!response.ok || !result.id) {
      throw new Error(result.message || 'PayPal porudžbina nije kreirana.');
    }

    return result.id;
  }

  async function capturePayPalOrder(orderId) {
    const cart = readCart();
    const currentUser = getCurrentUser();

    const response = await fetch(`/api/paypal/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cart,
        user: currentUser
          ? {
              id: currentUser.id || currentUser._id || null,
              name: currentUser.name || '',
              email: currentUser.email || ''
            }
          : null
      })
    });

    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(result.message || 'PayPal plaćanje nije završeno.');
    }

    return result;
  }

  async function renderPayPalButtons() {
    const cart = readCart();

    if (!cart.length || !paypalButtonContainer) return;

    try {
      setStatus('Učitavanje PayPal Sandbox opcija...', 'info');

      if (paypalButtonsInstance?.close) {
        try {
          await paypalButtonsInstance.close();
        } catch (error) {
          // Stara instanca je možda već uklonjena.
        }
      }

      paypalButtonContainer.innerHTML = '';

      const config = await fetchPayPalConfig();
      const paypal = await loadPayPalSdk(config.clientId, config.currency);

      paypalButtonsInstance = paypal.Buttons({
        style: {
          layout: 'vertical',
          shape: 'pill',
          label: 'paypal',
          height: 48
        },

        createOrder: async () => {
          setStatus('Kreiranje PayPal Sandbox porudžbine...', 'info');
          return createPayPalOrder();
        },

        onApprove: async (data) => {
          setStatus('Potvrđivanje PayPal plaćanja...', 'info');

          const result = await capturePayPalOrder(data.orderID);
          const completedCart = readCart();
          const completedAt = new Date().toISOString();

          const paymentSummary = {
            paypalOrderId: data.orderID,
            paypalCaptureId: result.paypalCaptureId || null,
            paymentId: result.paymentId || null,
            amount: result.amount,
            currency: result.currency,
            status: result.status,
            items: completedCart,
            projects: Array.isArray(result.projects)
              ? result.projects
              : [],
            projectWarning: result.projectWarning || '',
            createdAt: completedAt
          };

          savePurchaseHistory(paymentSummary);

          sessionStorage.setItem(
            'cinematicLastPayment',
            JSON.stringify(paymentSummary)
          );

          localStorage.setItem(
            'cinematicLastPayment',
            JSON.stringify(paymentSummary)
          );

          saveCart([]);

          setStatus(
            'Plaćanje je uspešno. Otvaranje potvrde kupovine...',
            'success'
          );

          window.setTimeout(() => {
            const paymentId = encodeURIComponent(
              String(result.paymentId || '')
            );

            window.location.href =
              `payment-success.html?paymentId=${paymentId}`;
          }, 600);
        },

        onCancel: () => {
          setStatus('PayPal plaćanje je otkazano. Korpa je sačuvana.', 'info');
        },

        onError: (error) => {
          console.error('PayPal greška:', error);
          setStatus(
            error?.message || 'Došlo je do greške tokom PayPal plaćanja.',
            'error'
          );
        }
      });

      if (!paypalButtonsInstance.isEligible()) {
        throw new Error('PayPal dugme trenutno nije dostupno za ovaj preglednik.');
      }

      await paypalButtonsInstance.render('#paypalButtonContainer');
      setStatus('PayPal Sandbox je spreman za testiranje.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(error.message, 'error');
    }
  }

  function openPayPalPanel() {
    const cart = readCart();

    if (!cart.length) {
      setStatus('Korpa je prazna.', 'error');
      return;
    }

    paymentPanelOpen = true
  }

  function closePayPalPanel() {
    paymentPanelOpen = false;

    if (paypalCheckoutPanel) {
      paypalCheckoutPanel.hidden = true;
    }

    if (paypalButtonContainer) {
      paypalButtonContainer.innerHTML = '';
    }
  }

  cartItemsElement?.addEventListener('click', (event) => {
    const decreaseButton = event.target.closest('[data-cart-decrease]');

    if (decreaseButton) {
      changeQuantity(decreaseButton.dataset.cartDecrease, -1);
      return;
    }

    const increaseButton = event.target.closest('[data-cart-increase]');

    if (increaseButton) {
      changeQuantity(increaseButton.dataset.cartIncrease, 1);
      return;
    }

    const removeButton = event.target.closest('[data-remove-package]');

    if (!removeButton) return;

    const packageId = removeButton.dataset.removePackage;
    const nextCart = readCart().filter((item) => item.id !== packageId);

    saveCart(nextCart);
    renderCart();
    setStatus('Paket je uklonjen iz korpe.', 'info');
  });

  clearCartButton?.addEventListener('click', () => {
    const cart = readCart();

    if (!cart.length) return;

    const confirmed = window.confirm('Da li želiš da ukloniš sve pakete iz korpe?');

    if (!confirmed) return;

    saveCart([]);
    renderCart();
    setStatus('Korpa je ispražnjena.', 'info');
  });

  checkoutButton?.addEventListener('click', async () => {
    const cart = readCart();

    if (!cart.length) {
      setStatus('Korpa je prazna.', 'error');
      return;
    }

    paymentPanelOpen = true;

    if (paypalCheckoutPanel) {
      paypalCheckoutPanel.hidden = false;
      paypalCheckoutPanel.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }

    await renderPayPalButtons();
  });

  paypalCloseButton?.addEventListener('click', () => {
    closePayPalPanel();
    setStatus('PayPal opcije su zatvorene. Korpa je sačuvana.', 'info');
  });

  window.addEventListener('storage', renderCart);
  renderCart();

  async function openRequestedCheckout() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('checkout') !== '1') {
      return;
    }

    params.delete('checkout');

    const nextQuery = params.toString();
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`
    );

    if (!getCurrentUser()) {
      localStorage.setItem('checkoutAfterAuth', '1');
      window.location.href = 'auth.html';
      return;
    }

    if (!readCart().length) {
      setStatus('Korpa je prazna.', 'error');
      return;
    }

    window.setTimeout(() => {
      checkoutButton?.click();
    }, 180);
  }

  openRequestedCheckout();
})();
