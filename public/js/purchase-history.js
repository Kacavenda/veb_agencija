(() => {
  const historyList = document.getElementById('purchaseHistoryList');
  const emptyState = document.getElementById('purchaseHistoryEmpty');
  const pageStatus = document.getElementById('purchaseHistoryStatus');

  const totalElement = document.getElementById('purchasesTotal');
  const spentElement = document.getElementById('purchasesSpent');
  const packagesElement = document.getElementById('purchasesPackages');

  function readStoredJson(storage, key, fallback = null) {
    try {
      const value = storage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      storage.removeItem(key);
      return fallback;
    }
  }

  function getCurrentUser() {
    return (
      readStoredJson(sessionStorage, 'currentUser') ||
      readStoredJson(localStorage, 'currentUser')
    );
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatPrice(value, currency = 'EUR') {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return '—';

    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  function setStatus(message, type = '') {
    pageStatus.className = `account-page-status ${type}`.trim();
    pageStatus.textContent = message;
  }

  function renderOptions(item, currency) {
    const options = Array.isArray(item.options) ? item.options : [];

    if (!options.length) {
      return '<span>Standardna konfiguracija</span>';
    }

    return options
      .map((option) => {
        const extraTotal = Number(option.extraTotal) || 0;

        return `
          <span>
            ${escapeHtml(option.label)}: ${escapeHtml(option.value)}
            ${
              extraTotal > 0
                ? ` · +${formatPrice(extraTotal, currency)}`
                : ''
            }
          </span>
        `;
      })
      .join('');
  }

  function renderPayments(payments) {
    historyList.innerHTML = payments
      .map(
        (payment) => `
          <article class="purchase-record">
            <div class="purchase-record-header">
              <div>
                <span class="purchase-record-kicker">PayPal kupovina</span>

                <h2>
                  Kupovina od ${escapeHtml(formatDate(payment.createdAt))}
                </h2>

                <p class="purchase-order-id">
                  Order ID: ${escapeHtml(payment.paypalOrderId || '—')}
                </p>

                <div class="purchase-record-meta">
                  <span>
                    Capture ID: ${escapeHtml(payment.paypalCaptureId || '—')}
                  </span>

                  <span>
                    Kupac: ${escapeHtml(
                      payment.applicationUser?.name ||
                        payment.payer?.fullName ||
                        'Korisnik'
                    )}
                  </span>

                  <span>
                    Status:
                    <b>${escapeHtml(payment.status || '—')}</b>
                  </span>
                </div>
              </div>

              <div class="purchase-total">
                <span>Ukupno</span>
                <strong>
                  ${formatPrice(payment.amount, payment.currency)}
                </strong>

                <span class="payment-status-badge completed">
                  ${escapeHtml(payment.status || 'COMPLETED')}
                </span>
              </div>
            </div>

            <div class="purchase-packages">
              ${(Array.isArray(payment.items) ? payment.items : [])
                .map(
                  (item) => `
                    <div class="purchase-package-row ${escapeHtml(
                      item.packageId
                    )}">
                      <div class="purchase-package-info">
                        <small>Paket izrade sajta</small>
                        <h3>${escapeHtml(item.packageName)}</h3>

                        <div class="purchase-options">
                          ${renderOptions(item, payment.currency)}
                        </div>
                      </div>

                      <div class="purchase-package-column">
                        <span>Jedinična cena</span>
                        <strong>
                          ${formatPrice(item.unitPrice, payment.currency)}
                        </strong>
                      </div>

                      <div class="purchase-package-column">
                        <span>Količina</span>
                        <strong>${escapeHtml(item.quantity)}</strong>
                      </div>

                      <div class="purchase-package-column">
                        <span>Ukupno</span>
                        <strong>
                          ${formatPrice(item.subtotal, payment.currency)}
                        </strong>
                      </div>
                    </div>
                  `
                )
                .join('')}
            </div>
          </article>
        `
      )
      .join('');

    emptyState.hidden = payments.length !== 0;
  }

  function updateSummary(payments) {
    const totalSpent = payments.reduce(
      (sum, payment) => sum + (Number(payment.amount) || 0),
      0
    );

    const packageCount = payments.reduce(
      (sum, payment) =>
        sum +
        (Array.isArray(payment.items)
          ? payment.items.reduce(
              (itemSum, item) =>
                itemSum + (Number(item.quantity) || 1),
              0
            )
          : 0),
      0
    );

    totalElement.textContent = String(payments.length);
    spentElement.textContent = formatPrice(
      totalSpent,
      payments[0]?.currency || 'EUR'
    );
    packagesElement.textContent = String(packageCount);
  }

  async function loadPurchaseHistory() {
    const user = getCurrentUser();

    if (!user) {
      window.location.replace('auth.html');
      return;
    }

    const userId = String(user.id || user._id || '').trim();

    try {
      const response = await fetch(
        `/api/payments/user/${encodeURIComponent(
          userId || 'unknown'
        )}?email=${encodeURIComponent(user.email || '')}`
      );

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(
          result.message || 'Istorija kupovina nije mogla da se učita.'
        );
      }

      const payments = Array.isArray(result.payments)
        ? result.payments
        : [];

      updateSummary(payments);
      renderPayments(payments);

      setStatus(
        payments.length
          ? `Učitano kupovina: ${payments.length}.`
          : 'Još nema završenih kupovina.'
      );
    } catch (error) {
      console.error(error);
      emptyState.hidden = false;
      setStatus(error.message, 'error');
    }
  }

  loadPurchaseHistory();
})();
