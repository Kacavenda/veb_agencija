(() => {
  const LAST_PAYMENT_KEY = 'cinematicLastPayment';

  const paymentStatus =
    document.getElementById(
      'paymentStatus'
    );

  const paymentAmount =
    document.getElementById(
      'paymentAmount'
    );

  const paypalOrderId =
    document.getElementById(
      'paypalOrderId'
    );

  const paypalCaptureId =
    document.getElementById(
      'paypalCaptureId'
    );

  const projectCount =
    document.getElementById(
      'projectCount'
    );

  const copyOrderButton =
    document.getElementById(
      'copyOrderButton'
    );

  const successProjects =
    document.getElementById(
      'successProjects'
    );

  const successProjectsEmpty =
    document.getElementById(
      'successProjectsEmpty'
    );

  const successProjectsEmptyText =
    document.getElementById(
      'successProjectsEmptyText'
    );

  const successPageStatus =
    document.getElementById(
      'successPageStatus'
    );

  function readStoredJson(
    storage,
    key,
    fallback
  ) {
    try {
      const value =
        storage.getItem(key);

      return value
        ? JSON.parse(value)
        : fallback;
    } catch (error) {
      storage.removeItem(key);
      return fallback;
    }
  }

  function formatPrice(
    value,
    currency = 'EUR'
  ) {
    return new Intl.NumberFormat(
      'sr-RS',
      {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ).format(
      Number(value) || 0
    );
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll(
        "'",
        '&#039;'
      );
  }

  function statusLabel(status) {
    const labels = {
      new: 'Novi projekat',
      reviewing:
        'Pregled zahteva',
      'waiting-for-client':
        'Čekaju se materijali',
      accepted:
        'Prihvaćen',
      'in-progress':
        'Izrada u toku',
      testing:
        'Testiranje',
      completed:
        'Završen',
      cancelled:
        'Otkazan'
    };

    return (
      labels[status] ||
      status ||
      'Novi projekat'
    );
  }

  function setPageStatus(
    message,
    type = ''
  ) {
    if (!successPageStatus) {
      return;
    }

    successPageStatus.className =
      `success-page-status ${type}`.trim();

    successPageStatus.textContent =
      message;
  }

  function renderPayment(
    payment
  ) {
    if (paymentStatus) {
      paymentStatus.textContent =
        payment.status ||
        'COMPLETED';
    }

    if (paymentAmount) {
      paymentAmount.textContent =
        formatPrice(
          payment.amount,
          payment.currency ||
            'EUR'
        );
    }

    if (paypalOrderId) {
      paypalOrderId.textContent =
        payment.paypalOrderId ||
        '—';
    }

    if (paypalCaptureId) {
      paypalCaptureId.textContent =
        payment.paypalCaptureId ||
        '—';
    }
  }

  function renderProjects(
    projects,
    currency
  ) {
    const safeProjects =
      Array.isArray(projects)
        ? projects
        : [];

    if (projectCount) {
      projectCount.textContent =
        String(
          safeProjects.length
        );
    }

    if (!safeProjects.length) {
      if (successProjects) {
        successProjects.innerHTML =
          '';
      }

      if (
        successProjectsEmpty
      ) {
        successProjectsEmpty.hidden =
          false;
      }

      return;
    }

    if (
      successProjectsEmpty
    ) {
      successProjectsEmpty.hidden =
        true;
    }

    if (!successProjects) {
      return;
    }

    successProjects.innerHTML =
      safeProjects
        .map((project) => {
          const requirements =
            Array.isArray(
              project.requirements
            )
              ? project.requirements
              : [];

          const requiredCount =
            requirements.filter(
              (requirement) =>
                requirement.required
            ).length;

          return `
            <article class="success-project-card ${escapeHtml(
              project.packageId
            )}">
              <div class="success-project-top">
                <span>${escapeHtml(
                  project.packageName
                )}</span>

                <span class="success-project-status">
                  ${escapeHtml(
                    statusLabel(
                      project.status
                    )
                  )}
                </span>
              </div>

              <h3>
                ${escapeHtml(
                  project.packageName
                )}
                ${
                  Number(
                    project.totalUnitsInPurchase
                  ) > 1
                    ? `#${escapeHtml(
                        project.unitIndex
                      )}`
                    : ''
                }
              </h3>

              <p class="success-project-code">
                ${escapeHtml(
                  project.projectCode
                )}
              </p>

              <div class="success-project-price">
                ${formatPrice(
                  project.totalPrice,
                  project.currency ||
                    currency ||
                    'EUR'
                )}
              </div>

              <div class="success-project-requirements">
                ${requiredCount}
                obaveznih stavki za pripremu
              </div>
            </article>
          `;
        })
        .join('');
  }

  async function loadProjectsFromApi(
    paymentId
  ) {
    if (!paymentId) {
      return [];
    }

    const response = await fetch(
      `/api/projects/payment/${encodeURIComponent(
        paymentId
      )}`
    );

    const text =
      await response.text();

    let result = {};

    try {
      result = text
        ? JSON.parse(text)
        : {};
    } catch (error) {
      throw new Error(
        'Server nije vratio ispravan odgovor za projekte.'
      );
    }

    if (!response.ok) {
      throw new Error(
        result.message ||
          'Projekti nisu mogli da se učitaju.'
      );
    }

    return Array.isArray(
      result.projects
    )
      ? result.projects
      : [];
  }

  async function initializePage() {
    const storedPayment =
      readStoredJson(
        sessionStorage,
        LAST_PAYMENT_KEY,
        null
      ) ||
      readStoredJson(
        localStorage,
        LAST_PAYMENT_KEY,
        null
      );

    const searchParams =
      new URLSearchParams(
        window.location.search
      );

    const paymentIdFromUrl =
      searchParams.get(
        'paymentId'
      );

    if (!storedPayment) {
      if (
        successProjectsEmpty
      ) {
        successProjectsEmpty.hidden =
          false;
      }

      if (
        successProjectsEmptyText
      ) {
        successProjectsEmptyText.textContent =
          'Podaci o poslednjem plaćanju nisu pronađeni u ovom browseru.';
      }

      setPageStatus(
        'Potvrda plaćanja nije pronađena. Otvori istoriju kupovina kada dashboard bude dodat.',
        'error'
      );

      return;
    }

    renderPayment(
      storedPayment
    );

    let projects =
      Array.isArray(
        storedPayment.projects
      )
        ? storedPayment.projects
        : [];

    const paymentId =
      storedPayment.paymentId ||
      paymentIdFromUrl;

    if (
      projects.length === 0 &&
      paymentId
    ) {
      try {
        setPageStatus(
          'Učitavanje otvorenih projekata...'
        );

        projects =
          await loadProjectsFromApi(
            paymentId
          );

        storedPayment.projects =
          projects;

        sessionStorage.setItem(
          LAST_PAYMENT_KEY,
          JSON.stringify(
            storedPayment
          )
        );

        localStorage.setItem(
          LAST_PAYMENT_KEY,
          JSON.stringify(
            storedPayment
          )
        );
      } catch (error) {
        setPageStatus(
          error.message,
          'error'
        );
      }
    }

    renderProjects(
      projects,
      storedPayment.currency
    );

    if (
      storedPayment.projectWarning
    ) {
      setPageStatus(
        storedPayment.projectWarning,
        'error'
      );
    } else if (
      projects.length > 0
    ) {
      setPageStatus(
        'Plaćanje i projekti su uspešno sačuvani u MongoDB bazi.'
      );
    }
  }

  copyOrderButton?.addEventListener(
    'click',
    async () => {
      const value =
        paypalOrderId
          ?.textContent
          ?.trim();

      if (
        !value ||
        value === '—'
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          value
        );

        copyOrderButton.textContent =
          'Order ID je kopiran';

        window.setTimeout(() => {
          copyOrderButton.textContent =
            'Kopiraj PayPal Order ID';
        }, 1600);
      } catch (error) {
        setPageStatus(
          'Order ID nije mogao automatski da se kopira.',
          'error'
        );
      }
    }
  );

  initializePage();
})();
