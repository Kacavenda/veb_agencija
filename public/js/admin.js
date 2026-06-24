(() => {
  const SECTION_TITLES = {
    overview: 'Admin pregled',
    projects: 'Upravljanje projektima',
    payments: 'Istorija kupovina',
    users: 'Upravljanje korisnicima',
    messages: 'Sve poruke'
  };

  const PROJECT_STATUS_LABELS = {
    new: 'Novi projekat',
    reviewing: 'Pregled zahteva',
    'waiting-for-client': 'Čekaju se materijali',
    accepted: 'Prihvaćen',
    'in-progress': 'Izrada u toku',
    testing: 'Testiranje',
    completed: 'Završen',
    cancelled: 'Otkazan'
  };

  const MESSAGE_STATUS_LABELS = {
    new: 'Nova',
    read: 'Pročitana',
    answered: 'Odgovoreno'
  };

  const adminSidebar = document.getElementById('adminSidebar');
  const menuToggle = document.getElementById('adminMenuToggle');
  const navButtons = document.querySelectorAll('[data-admin-section]');
  const panels = document.querySelectorAll('[data-admin-panel]');
  const pageTitle = document.getElementById('adminPageTitle');
  const refreshButton = document.getElementById('adminRefreshButton');
  const logoutButton = document.getElementById('adminLogoutButton');
  const globalStatus = document.getElementById('adminGlobalStatus');

  const projectSearch = document.getElementById('adminProjectSearch');
  const projectStatusFilter = document.getElementById(
    'adminProjectStatusFilter'
  );
  const projectPackageFilter = document.getElementById(
    'adminProjectPackageFilter'
  );

  let currentSection = 'overview';
  const openAdminProjectIds =
    new Set();


  const adminProjectDrafts =
    new Map();

  function readAdminProjectDraft(
    card
  ) {
    const requirements =
      Array.from(
        card.querySelectorAll(
          '[data-requirement-key]'
        )
      ).map(
        (row) => ({
          key:
            row.dataset.requirementKey ||
            '',
          provided:
            Boolean(
              row.querySelector(
                '[data-requirement-provided]'
              )?.checked
            ),
          value:
            row.querySelector(
              '[data-requirement-value]'
            )?.value ||
            ''
        })
      );

    return {
      status:
        card.querySelector(
          '[data-project-status]'
        )?.value ||
        '',
      adminNote:
        card.querySelector(
          '[data-project-note]'
        )?.value ||
        '',
      message:
        card.querySelector(
          '[data-admin-project-message-input]'
        )?.value ||
        '',
      requirements
    };
  }

  function saveAdminProjectDraft(
    card
  ) {
    const projectId =
      String(
        card?.dataset.adminProject ||
        ''
      );

    if (!projectId) {
      return;
    }

    adminProjectDrafts.set(
      projectId,
      readAdminProjectDraft(card)
    );
  }

  function restoreAdminProjectDrafts() {
    adminProjectDrafts.forEach(
      (draft, projectId) => {
        const card =
          document.querySelector(
            `[data-admin-project="${CSS.escape(
              projectId
            )}"]`
          );

        if (!card) {
          return;
        }

        const status =
          card.querySelector(
            '[data-project-status]'
          );

        const adminNote =
          card.querySelector(
            '[data-project-note]'
          );

        const message =
          card.querySelector(
            '[data-admin-project-message-input]'
          );

        if (
          status &&
          draft.status
        ) {
          status.value =
            draft.status;
        }

        if (adminNote) {
          adminNote.value =
            draft.adminNote ||
            '';
        }

        if (message) {
          message.value =
            draft.message ||
            '';
        }

        const requirementMap =
          new Map(
            (
              Array.isArray(
                draft.requirements
              )
                ? draft.requirements
                : []
            ).map(
              (requirement) => [
                String(
                  requirement.key ||
                  ''
                ),
                requirement
              ]
            )
          );

        card
          .querySelectorAll(
            '[data-requirement-key]'
          )
          .forEach(
            (row) => {
              const requirement =
                requirementMap.get(
                  String(
                    row.dataset.requirementKey ||
                    ''
                  )
                );

              if (!requirement) {
                return;
              }

              const checkbox =
                row.querySelector(
                  '[data-requirement-provided]'
                );

              const valueInput =
                row.querySelector(
                  '[data-requirement-value]'
                );

              if (checkbox) {
                checkbox.checked =
                  Boolean(
                    requirement.provided
                  );
              }

              if (valueInput) {
                valueInput.value =
                  requirement.value ||
                  '';
              }
            }
          );
      }
    );
  }

  function isAdminProjectEditorActive() {
    const activeElement =
      document.activeElement;

    return Boolean(
      activeElement?.closest?.(
        '#adminProjectList textarea, #adminProjectList input, #adminProjectList select'
      )
    );
  }

  let state = {
    overview: null,
    projects: [],
    payments: [],
    users: [],
    messages: []
  };

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

  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.replace('auth.html');
    return;
  }

  if (currentUser.role !== 'admin') {
    window.location.replace('index.html');
    return;
  }

  function getInitials(name) {
    return String(name || 'Administrator')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
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
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }


  function formatFileSize(bytes) {
    const value = Number(bytes) || 0;

    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(value / 1024).toFixed(1)} KB`;
    }

    return `${(
      value /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function adminFileCanPreview(file) {
    const mimeType =
      String(file?.mimeType || '');

    return (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf' ||
      mimeType === 'text/plain'
    );
  }

  function setStatus(message, type = '') {
    globalStatus.className = `admin-global-status ${type}`.trim();
    globalStatus.textContent = message;
  }

  function adminHeaders(extraHeaders = {}) {
    return {
      'x-admin-user-id': String(currentUser.id || currentUser._id || ''),
      'x-admin-email': String(currentUser.email || ''),
      ...extraHeaders
    };
  }

  async function readResponse(response) {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch (error) {
      throw new Error(
        'Server nije vratio ispravan JSON odgovor.'
      );
    }
  }

  async function adminRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: adminHeaders(options.headers || {})
    });

    const result = await readResponse(response);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          result.message || 'Admin pristup nije dozvoljen.'
        );
      }

      throw new Error(
        result.message || 'Došlo je do greške.'
      );
    }

    return result;
  }

  function switchSection(sectionName) {
    currentSection = sectionName;

    navButtons.forEach((button) => {
      button.classList.toggle(
        'active',
        button.dataset.adminSection === sectionName
      );
    });

    panels.forEach((panel) => {
      panel.classList.toggle(
        'active',
        panel.dataset.adminPanel === sectionName
      );
    });

    pageTitle.textContent =
      SECTION_TITLES[sectionName] || 'Admin panel';

    adminSidebar.classList.remove('open');

    loadSection(sectionName);
  }

  function renderOverview() {
    const overview = state.overview;

    if (!overview) return;

    const { stats } = overview;
    const revenueEntries = Object.entries(stats.revenue || {});
    const revenueText = revenueEntries.length
      ? revenueEntries
          .map(([currency, value]) => formatPrice(value, currency))
          .join(' + ')
      : '0 €';

    document.getElementById('overviewUsers').textContent =
      String(stats.usersCount || 0);

    document.getElementById('overviewProjects').textContent =
      String(stats.projectsCount || 0);

    document.getElementById('overviewActiveProjects').textContent =
      `${stats.activeProjectsCount || 0} aktivnih`;

    document.getElementById('overviewPayments').textContent =
      String(stats.paymentsCount || 0);

    document.getElementById('overviewRevenue').textContent =
      revenueText;

    document.getElementById('overviewWaiting').textContent =
      String(stats.waitingProjectsCount || 0);

    document.getElementById('overviewMessages').textContent =
      String(stats.unreadMessagesCount || 0);

    document.getElementById('sidebarUsersCount').textContent =
      String(stats.usersCount || 0);

    document.getElementById('sidebarProjectsCount').textContent =
      String(stats.projectsCount || 0);

    document.getElementById('sidebarPaymentsCount').textContent =
      String(stats.paymentsCount || 0);

    document.getElementById('sidebarMessagesCount').textContent =
      String(stats.unreadMessagesCount || 0);

    document.getElementById('adminOverviewTimestamp').textContent =
      `Osveženo: ${formatDate(new Date())}`;

    const recentProjects = document.getElementById(
      'overviewRecentProjects'
    );

    recentProjects.innerHTML = overview.recentProjects.length
      ? overview.recentProjects
          .map(
            (project) => `
              <div class="admin-compact-row">
                <div>
                  <strong>${escapeHtml(project.projectCode)}</strong>
                  <small>
                    ${escapeHtml(project.userName || project.userEmail || 'Nepoznat korisnik')}
                    · ${escapeHtml(project.packageName)}
                  </small>
                </div>

                <span>
                  ${escapeHtml(PROJECT_STATUS_LABELS[project.status] || project.status)}
                </span>
              </div>
            `
          )
          .join('')
      : '<div class="admin-empty-state">Još nema projekata.</div>';

    const recentPayments = document.getElementById(
      'overviewRecentPayments'
    );

    recentPayments.innerHTML = overview.recentPayments.length
      ? overview.recentPayments
          .map(
            (payment) => `
              <div class="admin-compact-row">
                <div>
                  <strong>
                    ${escapeHtml(
                      payment.applicationUser?.name ||
                        payment.payer?.fullName ||
                        'PayPal kupac'
                    )}
                  </strong>
                  <small>
                    ${escapeHtml(payment.paypalOrderId)}
                    · ${formatDate(payment.createdAt)}
                  </small>
                </div>

                <span>
                  ${formatPrice(payment.amount, payment.currency)}
                </span>
              </div>
            `
          )
          .join('')
      : '<div class="admin-empty-state">Još nema kupovina.</div>';
  }

  function configurationHtml(project) {
    const configuration = Array.isArray(project.configuration)
      ? project.configuration
      : [];

    if (!configuration.length) {
      return '<span class="admin-configuration-chip">Standardna konfiguracija</span>';
    }

    return configuration
      .map(
        (option) => `
          <span class="admin-configuration-chip">
            ${escapeHtml(option.label)}:
            <b>${escapeHtml(option.value)}</b>
            ${
              Number(option.extraTotal) > 0
                ? ` · +${formatPrice(option.extraTotal, project.currency)}`
                : ''
            }
          </span>
        `
      )
      .join('');
  }

  function requirementsHtml(project) {
    const requirements = Array.isArray(project.requirements)
      ? project.requirements
      : [];

    return requirements
      .map(
        (requirement) => `
          <div
            class="admin-requirement-row"
            data-requirement-key="${escapeHtml(requirement.key)}"
          >
            <input
              type="checkbox"
              data-requirement-provided
              ${requirement.provided ? 'checked' : ''}
            />

            <label>
              ${escapeHtml(requirement.label)}
              ${requirement.required ? '' : ' (opciono)'}
            </label>

            <input
              class="admin-requirement-value"
              type="text"
              data-requirement-value
              value="${escapeHtml(requirement.value || '')}"
              placeholder="Napomena ili link..."
            />
          </div>
        `
      )
      .join('');
  }

  function filesHtml(project) {
    const files =
      Array.isArray(project.files)
        ? project.files
        : [];

    if (!files.length) {
      return `
        <div class="admin-project-files-empty">
          Korisnik još nije poslao fajlove.
        </div>
      `;
    }

    return `
      <div class="admin-project-files-list">
        ${files
          .map(
            (file) => `
              <article class="admin-project-file-row">
                <div>
                  <strong>
                    ${escapeHtml(file.originalName)}
                  </strong>

                  <small>
                    ${formatFileSize(file.size)}
                    · ${formatDate(file.uploadedAt)}
                  </small>
                </div>

                <div class="admin-project-file-actions">
                  ${
                    adminFileCanPreview(file)
                      ? `
                        <button
                          type="button"
                          data-admin-file-open="preview"
                          data-admin-file-id="${escapeHtml(file.id)}"
                          data-admin-file-name="${escapeHtml(file.originalName)}"
                        >
                          Pregled
                        </button>
                      `
                      : ''
                  }

                  <button
                    type="button"
                    data-admin-file-open="download"
                    data-admin-file-id="${escapeHtml(file.id)}"
                    data-admin-file-name="${escapeHtml(file.originalName)}"
                  >
                    Preuzmi
                  </button>

                  <button
                    class="danger"
                    type="button"
                    data-admin-file-delete
                    data-admin-file-id="${escapeHtml(file.id)}"
                  >
                    Obriši
                  </button>
                </div>
              </article>
            `
          )
          .join('')}
      </div>
    `;
  }

  function adminProjectMessagesHtml(
    project
  ) {
    const messages =
      Array.isArray(
        project.messages
      )
        ? project.messages
        : [];

    if (!messages.length) {
      return `
        <div class="admin-project-conversation-empty">
          Još nema poruka za ovaj projekat.
        </div>
      `;
    }

    return messages
      .map(
        (message) => `
          <article
            class="admin-project-message ${escapeHtml(
              message.senderRole
            )}"
          >
            <div class="admin-project-message-meta">
              <strong>
                ${escapeHtml(
                  message.senderName ||
                  (
                    message.senderRole ===
                    'admin'
                      ? 'Administrator'
                      : 'Korisnik'
                  )
                )}
              </strong>

              <span>
                ${escapeHtml(
                  message.senderRole ===
                    'admin'
                    ? 'Admin'
                    : 'Klijent'
                )}
              </span>

              <time>
                ${formatDate(
                  message.createdAt
                )}
              </time>
            </div>

            <p>
              ${escapeHtml(
                message.message
              )}
            </p>
          </article>
        `
      )
      .join('');
  }

  function adminProjectConversationHtml(
    project
  ) {
    return `
      <section class="admin-project-detail-panel admin-project-conversation-panel">
        <div class="admin-project-conversation-heading">
          <div>
            <h4>
              Komunikacija sa klijentom
            </h4>

            <p>
              Poruke su vezane isključivo za ovaj projekat.
            </p>
          </div>

          <button
            type="button"
            data-admin-message-refresh
          >
            Osveži poruke
          </button>
        </div>

        <div
          class="admin-project-conversation-list"
          data-admin-project-message-list
        >
          ${adminProjectMessagesHtml(
            project
          )}
        </div>

        <div class="admin-project-conversation-composer">
          <textarea
            data-admin-project-message-input
            maxlength="2000"
            placeholder="Napiši odgovor korisniku..."
          ></textarea>

          <div>
            <small>
              Najviše 2000 karaktera.
            </small>

            <button
              type="button"
              data-admin-message-send
            >
              Pošalji odgovor
            </button>
          </div>
        </div>
      </section>
    `;
  }

  function renderProjects() {
    const container = document.getElementById('adminProjectList');
    const empty = document.getElementById('adminProjectsEmpty');

    container.innerHTML = state.projects
      .map(
        (project) => `
          <article
            class="admin-project-card ${escapeHtml(project.packageId)} ${
              openAdminProjectIds.has(String(project.id))
                ? 'open'
                : ''
            }"
            data-admin-project="${escapeHtml(project.id)}"
          >
            <div class="admin-project-summary">
              <div class="admin-project-client">
                <small>${escapeHtml(project.projectCode)}</small>
                <h3>${escapeHtml(project.userName || 'Nepoznat korisnik')}</h3>
                <p>${escapeHtml(project.userEmail || 'Email nije sačuvan')}</p>
              </div>

              <div class="admin-project-meta">
                <span>Paket</span>
                <strong>${escapeHtml(project.packageName)}</strong>
              </div>

              <div class="admin-project-meta">
                <span>Status</span>
                <strong>
                  ${escapeHtml(
                    PROJECT_STATUS_LABELS[project.status] || project.status
                  )}
                </strong>
              </div>

              <div class="admin-project-price">
                ${formatPrice(project.totalPrice, project.currency)}
              </div>

              <button
                class="admin-project-toggle"
                type="button"
                data-project-toggle
              >
                ${
                  openAdminProjectIds.has(String(project.id))
                    ? 'Zatvori'
                    : 'Detalji'
                }
              </button>
            </div>

            <div class="admin-project-details">
              <section class="admin-project-detail-panel">
                <h4>Konfiguracija paketa</h4>

                <div class="admin-configuration-list">
                  ${configurationHtml(project)}
                </div>
              </section>

              <section class="admin-project-detail-panel">
                <h4>Materijali klijenta</h4>

                <div class="admin-requirements-list">
                  ${requirementsHtml(project)}
                </div>
              </section>

              <section class="admin-project-detail-panel admin-project-files-panel">
                <h4>Fajlovi projekta</h4>

                ${filesHtml(project)}
              </section>

              <section class="admin-project-detail-panel admin-project-client-note-panel">
                <h4>Napomena korisnika</h4>

                <p>
                  ${
                    project.clientNote
                      ? escapeHtml(project.clientNote)
                      : 'Korisnik nije ostavio dodatnu napomenu.'
                  }
                </p>

                ${
                  project.materialsSubmittedAt
                    ? `
                      <small>
                        Poslednje slanje:
                        ${formatDate(project.materialsSubmittedAt)}
                        · revizija
                        ${escapeHtml(project.materialsRevision || 0)}
                      </small>
                    `
                    : ''
                }
              </section>

              ${adminProjectConversationHtml(
                project
              )}

              <div class="admin-project-controls">
                <select class="admin-project-select" data-project-status>
                  ${Object.entries(PROJECT_STATUS_LABELS)
                    .map(
                      ([value, label]) => `
                        <option
                          value="${value}"
                          ${project.status === value ? 'selected' : ''}
                        >
                          ${escapeHtml(label)}
                        </option>
                      `
                    )
                    .join('')}
                </select>

                <textarea
                  class="admin-project-note"
                  data-project-note
                  placeholder="Napomena koja će biti prikazana korisniku..."
                >${escapeHtml(project.adminNote || '')}</textarea>

                <button
                  class="admin-save-button"
                  type="button"
                  data-project-save
                >
                  Sačuvaj projekat
                </button>
              </div>
            </div>
          </article>
        `
      )
      .join('');

    container
      .querySelectorAll(
        '[data-admin-project-message-list]'
      )
      .forEach((list) => {
        list.scrollTop =
          list.scrollHeight;
      });

    restoreAdminProjectDrafts();

    empty.hidden = state.projects.length !== 0;
  }

  function renderPayments() {
    const container = document.getElementById('adminPaymentList');
    const empty = document.getElementById('adminPaymentsEmpty');

    container.innerHTML = state.payments
      .map(
        (payment) => `
          <article class="admin-payment-card">
            <div class="admin-payment-head">
              <div>
                <span class="admin-payment-meta">
                  PayPal kupovina · ${escapeHtml(payment.status)}
                </span>

                <h3>
                  ${escapeHtml(
                    payment.applicationUser?.name ||
                      payment.payer?.fullName ||
                      'Nepoznat kupac'
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    payment.applicationUser?.email ||
                      payment.payer?.email ||
                      'Email nije sačuvan'
                  )}
                </p>

                <p>
                  Order ID: ${escapeHtml(payment.paypalOrderId)}
                  · ${formatDate(payment.createdAt)}
                </p>
              </div>

              <div class="admin-payment-total">
                ${formatPrice(payment.amount, payment.currency)}
              </div>
            </div>

            <div class="admin-payment-items">
              ${(Array.isArray(payment.items) ? payment.items : [])
                .map(
                  (item) => `
                    <div class="admin-payment-item">
                      <div>
                        <strong>${escapeHtml(item.packageName)}</strong>
                        <small>
                          Jedinična cena:
                          ${formatPrice(item.unitPrice, payment.currency)}
                        </small>
                      </div>

                      <span>Količina: ${escapeHtml(item.quantity)}</span>

                      <span>
                        ${formatPrice(item.subtotal, payment.currency)}
                      </span>
                    </div>
                  `
                )
                .join('')}
            </div>
          </article>
        `
      )
      .join('');

    empty.hidden = state.payments.length !== 0;
  }

  function renderUsers() {
    const body = document.getElementById('adminUsersTableBody');
    const empty = document.getElementById('adminUsersEmpty');

    body.innerHTML = state.users
      .map(
        (user) => `
          <tr data-admin-user="${escapeHtml(user.id)}">
            <td class="admin-user-cell">
              <strong>${escapeHtml(user.name)}</strong>
              <small>${escapeHtml(user.email)}</small>
            </td>

            <td>
              <select class="admin-role-select" data-user-role>
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>
                  User
                </option>

                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>
                  Admin
                </option>
              </select>
            </td>

            <td>${escapeHtml(user.projectsCount)}</td>
            <td>${escapeHtml(user.purchasesCount)}</td>
            <td>${formatPrice(user.totalSpent, 'EUR')}</td>
            <td>${formatDate(user.createdAt)}</td>

            <td>
              <button class="admin-role-save" type="button" data-user-role-save>
                Sačuvaj
              </button>
            </td>
          </tr>
        `
      )
      .join('');

    empty.hidden = state.users.length !== 0;
  }

  function renderMessages() {
    const container =
      document.getElementById(
        'adminMessageList'
      );

    const empty =
      document.getElementById(
        'adminMessagesEmpty'
      );

    const visibleMessages =
      state.messages.filter(
        (message) =>
          message.status !==
          'answered'
      );

    container.innerHTML = visibleMessages
      .map(
        (message) => {
          const isProjectMessage =
            message.source ===
            'project';

          const messageStatus =
            message.status ||
            'new';

          const statusLabel =
            MESSAGE_STATUS_LABELS[
              messageStatus
            ] ||
            'Nova';

          const senderName =
            message.name ||
            'Nepoznat korisnik';

          return `
            <article
              class="admin-message-card ${
                isProjectMessage
                  ? 'project-message'
                  : 'contact-message'
              } status-${escapeHtml(
                messageStatus
              )}"
              data-admin-message="${escapeHtml(
                message.id
              )}"
            >
              <header class="admin-message-card-top">
                <div class="admin-message-identity">
                  <span class="admin-message-avatar">
                    ${escapeHtml(
                      getInitials(
                        senderName
                      )
                    )}
                  </span>

                  <div class="admin-message-person">
                    <div class="admin-message-eyebrow-row">
                      <span class="admin-message-source-badge">
                        ${
                          isProjectMessage
                            ? 'Komunikacija projekta'
                            : 'Kontakt forma'
                        }
                      </span>

                      <span
                        class="admin-message-status-badge status-${escapeHtml(
                          messageStatus
                        )}"
                      >
                        ${escapeHtml(
                          statusLabel
                        )}
                      </span>
                    </div>

                    <strong>
                      ${escapeHtml(
                        senderName
                      )}
                    </strong>

                    <small>
                      ${escapeHtml(
                        message.email ||
                        'Email nije sačuvan'
                      )}
                    </small>
                  </div>
                </div>

                <time datetime="${escapeHtml(
                  message.createdAt ||
                  ''
                )}">
                  ${formatDate(
                    message.createdAt
                  )}
                </time>
              </header>

              <div class="admin-message-context-bar">
                <span>
                  ${
                    isProjectMessage
                      ? 'Projekat / paket'
                      : 'Vrsta zahteva'
                  }
                </span>

                <strong>
                  ${
                    isProjectMessage
                      ? `${escapeHtml(
                          message.packageName ||
                          'Paket'
                        )} · ${escapeHtml(
                          message.projectCode ||
                          'Projekat'
                        )}`
                      : escapeHtml(
                          message.websiteType ||
                          'Nije navedeno'
                        )
                  }
                </strong>
              </div>

              <div class="admin-message-body">
                <span class="admin-message-quote-mark">“</span>

                <p class="admin-message-text">
                  ${escapeHtml(
                    message.message
                  )}
                </p>
              </div>

              <footer class="admin-message-actions">
                <label class="admin-message-status-control">
                  <span>Status poruke</span>

                  <select
                    class="admin-message-select"
                    data-message-status
                  >
                    ${Object.entries(
                      MESSAGE_STATUS_LABELS
                    )
                      .map(
                        ([value, label]) => `
                          <option
                            value="${value}"
                            ${
                              messageStatus === value
                                ? 'selected'
                                : ''
                            }
                          >
                            ${escapeHtml(label)}
                          </option>
                        `
                      )
                      .join('')}
                  </select>
                </label>

                <button
                  class="admin-message-save"
                  type="button"
                  data-message-save
                >
                  Sačuvaj status
                </button>
              </footer>
            </article>
          `;
        }
      )
      .join('');

    empty.hidden =
      visibleMessages.length !== 0;
  }

  async function loadOverview() {
    const result = await adminRequest('/api/admin/overview');
    state.overview = result;
    renderOverview();
  }

  async function loadProjects() {
    const params = new URLSearchParams();

    if (projectSearch.value.trim()) {
      params.set('search', projectSearch.value.trim());
    }

    if (projectStatusFilter.value) {
      params.set('status', projectStatusFilter.value);
    }

    if (projectPackageFilter.value) {
      params.set('packageId', projectPackageFilter.value);
    }

    const query = params.toString();
    const result = await adminRequest(
      `/api/admin/projects${query ? `?${query}` : ''}`
    );

    state.projects = Array.isArray(result.projects)
      ? result.projects
      : [];

    renderProjects();
  }

  async function loadPayments() {
    const result = await adminRequest('/api/admin/payments');

    state.payments = Array.isArray(result.payments)
      ? result.payments
      : [];

    renderPayments();
  }

  async function loadUsers() {
    const result = await adminRequest('/api/admin/users');

    state.users = Array.isArray(result.users)
      ? result.users
      : [];

    renderUsers();
  }

  async function loadMessages() {
    const result = await adminRequest('/api/admin/messages');

    state.messages = Array.isArray(result.messages)
      ? result.messages
      : [];

    renderMessages();
  }

  async function loadSection(sectionName, showStatus = true) {
    try {
      if (showStatus) {
        setStatus('Učitavanje podataka...');
      }

      if (sectionName === 'overview') {
        await loadOverview();
      } else if (sectionName === 'projects') {
        await loadProjects();
      } else if (sectionName === 'payments') {
        await loadPayments();
      } else if (sectionName === 'users') {
        await loadUsers();
      } else if (sectionName === 'messages') {
        await loadMessages();
      }

      if (showStatus) {
        setStatus('Podaci su uspešno učitani.', 'success');
      }
    } catch (error) {
      console.error(error);
      setStatus(error.message, 'error');
    }
  }

  function keepAdminProjectOpen(
    projectId
  ) {
    const card =
      document.querySelector(
        `[data-admin-project="${CSS.escape(
          projectId
        )}"]`
      );

    if (!card) {
      return;
    }

    openAdminProjectIds.add(
      String(projectId)
    );

    card.classList.add(
      'open'
    );

    const toggle =
      card.querySelector(
        '[data-project-toggle]'
      );

    if (toggle) {
      toggle.textContent =
        'Zatvori';
    }

    const messageList =
      card.querySelector(
        '[data-admin-project-message-list]'
      );

    if (messageList) {
      messageList.scrollTop =
        messageList.scrollHeight;
    }
  }

  async function refreshAdminProjectMessages(
    projectId,
    button = null
  ) {
    if (button) {
      button.disabled =
        true;
      button.textContent =
        'Osvežavanje...';
    }

    try {
      const result =
        await adminRequest(
          `/api/projects/${encodeURIComponent(
            projectId
          )}/messages`
        );

      const project =
        state.projects.find(
          (item) =>
            String(item.id) ===
            String(projectId)
        );

      if (project) {
        project.messages =
          Array.isArray(
            result.messages
          )
            ? result.messages
            : [];
      }

      renderProjects();
      keepAdminProjectOpen(
        projectId
      );

      setStatus(
        'Poruke su osvežene.',
        'success'
      );
    } catch (error) {
      if (button) {
        button.disabled =
          false;
        button.textContent =
          'Osveži poruke';
      }

      throw error;
    }
  }

  async function sendAdminProjectMessage(
    card,
    button
  ) {
    const projectId =
      card.dataset.adminProject;

    const input =
      card.querySelector(
        '[data-admin-project-message-input]'
      );

    const message =
      String(
        input?.value ||
        ''
      ).trim();

    if (!message) {
      input?.focus();

      throw new Error(
        'Napiši poruku pre slanja.'
      );
    }

    button.disabled =
      true;
    button.textContent =
      'Slanje...';

    try {
      const result =
        await adminRequest(
          `/api/projects/${encodeURIComponent(
            projectId
          )}/messages`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                message
              })
          }
        );

      const projectIndex =
        state.projects.findIndex(
          (project) =>
            String(project.id) ===
            String(projectId)
        );

      if (
        projectIndex !== -1
      ) {
        state.projects[
          projectIndex
        ] = result.project;
      }

      const currentDraft =
        adminProjectDrafts.get(
          String(projectId)
        );

      if (currentDraft) {
        currentDraft.message =
          '';

        adminProjectDrafts.set(
          String(projectId),
          currentDraft
        );
      }

      renderProjects();
      keepAdminProjectOpen(
        projectId
      );

      setStatus(
        result.message,
        'success'
      );
    } catch (error) {
      button.disabled =
        false;
      button.textContent =
        'Pošalji odgovor';

      throw error;
    }
  }

  async function readAdminErrorResponse(
    response
  ) {
    const text =
      await response.text();

    try {
      return text
        ? JSON.parse(text)
        : {};
    } catch (error) {
      return {};
    }
  }

  async function openAdminProjectFile(
    projectId,
    fileId,
    fileName,
    mode
  ) {
    const previewWindow =
      mode === 'preview'
        ? window.open('', '_blank')
        : null;

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}/content?inline=${
          mode === 'preview'
        }`,
        {
          headers: adminHeaders()
        }
      );

      if (!response.ok) {
        const result =
          await readAdminErrorResponse(response);

        throw new Error(
          result.message ||
          'Fajl nije mogao da se otvori.'
        );
      }

      const blob =
        await response.blob();

      const objectUrl =
        URL.createObjectURL(blob);

      if (mode === 'preview') {
        if (previewWindow) {
          previewWindow.location.href =
            objectUrl;
        }

        window.setTimeout(
          () => URL.revokeObjectURL(objectUrl),
          60000
        );

        return;
      }

      const link =
        document.createElement('a');

      link.href = objectUrl;
      link.download =
        fileName || 'download';

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(
        () => URL.revokeObjectURL(objectUrl),
        1000
      );
    } catch (error) {
      previewWindow?.close();
      setStatus(error.message, 'error');
    }
  }

  async function deleteAdminProjectFile(
    projectId,
    fileId
  ) {
    if (
      !window.confirm(
        'Da li sigurno želiš da obrišeš ovaj fajl sa projekta?'
      )
    ) {
      return;
    }

    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`,
      {
        method: 'DELETE',
        headers: adminHeaders()
      }
    );

    const result =
      await readAdminErrorResponse(response);

    if (!response.ok) {
      throw new Error(
        result.message ||
        'Fajl nije mogao da se obriše.'
      );
    }

    const index =
      state.projects.findIndex(
        (project) =>
          String(project.id) ===
          String(projectId)
      );

    if (index !== -1) {
      state.projects[index] =
        result.project;
    }

    renderProjects();
    setStatus(result.message, 'success');
  }

  function readRequirementsFromCard(card) {
    return Array.from(
      card.querySelectorAll('[data-requirement-key]')
    ).map((row) => ({
      key: row.dataset.requirementKey,
      provided: Boolean(
        row.querySelector('[data-requirement-provided]')?.checked
      ),
      value:
        row.querySelector('[data-requirement-value]')?.value.trim() || ''
    }));
  }

  const adminProjectListElement =
    document.getElementById(
      'adminProjectList'
    );

  function trackAdminProjectDraft(
    event
  ) {
    const editable =
      event.target.closest(
        [
          '[data-admin-project-message-input]',
          '[data-project-note]',
          '[data-project-status]',
          '[data-requirement-value]',
          '[data-requirement-provided]'
        ].join(',')
      );

    if (!editable) {
      return;
    }

    const card =
      editable.closest(
        '[data-admin-project]'
      );

    if (card) {
      saveAdminProjectDraft(card);
    }
  }

  adminProjectListElement.addEventListener(
    'input',
    trackAdminProjectDraft
  );

  adminProjectListElement.addEventListener(
    'change',
    trackAdminProjectDraft
  );

  document
    .getElementById('adminProjectList')
    .addEventListener('keydown', async (event) => {
      const input =
        event.target.closest(
          '[data-admin-project-message-input]'
        );

      if (
        !input ||
        !event.ctrlKey ||
        event.key !== 'Enter'
      ) {
        return;
      }

      event.preventDefault();

      const card =
        input.closest(
          '[data-admin-project]'
        );

      const button =
        card?.querySelector(
          '[data-admin-message-send]'
        );

      if (
        !card ||
        !button ||
        button.disabled
      ) {
        return;
      }

      try {
        await sendAdminProjectMessage(
          card,
          button
        );
      } catch (error) {
        setStatus(
          error.message,
          'error'
        );
      }
    });

  document
    .getElementById('adminProjectList')
    .addEventListener('click', async (event) => {
      const card = event.target.closest('[data-admin-project]');

      if (!card) return;

      if (event.target.closest('[data-project-toggle]')) {
        card.classList.toggle('open');

        const projectId =
          String(
            card.dataset.adminProject ||
            ''
          );

        if (card.classList.contains('open')) {
          openAdminProjectIds.add(
            projectId
          );
        } else {
          openAdminProjectIds.delete(
            projectId
          );
        }

        const button = card.querySelector('[data-project-toggle]');
        button.textContent = card.classList.contains('open')
          ? 'Zatvori'
          : 'Detalji';

        return;
      }

      const messageSendButton =
        event.target.closest(
          '[data-admin-message-send]'
        );

      if (messageSendButton) {
        try {
          await sendAdminProjectMessage(
            card,
            messageSendButton
          );
        } catch (error) {
          setStatus(
            error.message,
            'error'
          );
        }

        return;
      }

      const messageRefreshButton =
        event.target.closest(
          '[data-admin-message-refresh]'
        );

      if (messageRefreshButton) {
        try {
          await refreshAdminProjectMessages(
            card.dataset.adminProject,
            messageRefreshButton
          );
        } catch (error) {
          setStatus(
            error.message,
            'error'
          );
        }

        return;
      }

      const fileOpenButton =
        event.target.closest('[data-admin-file-open]');

      if (fileOpenButton) {
        openAdminProjectFile(
          card.dataset.adminProject,
          fileOpenButton.dataset.adminFileId,
          fileOpenButton.dataset.adminFileName,
          fileOpenButton.dataset.adminFileOpen
        );

        return;
      }

      const fileDeleteButton =
        event.target.closest('[data-admin-file-delete]');

      if (fileDeleteButton) {
        try {
          await deleteAdminProjectFile(
            card.dataset.adminProject,
            fileDeleteButton.dataset.adminFileId
          );
        } catch (error) {
          setStatus(error.message, 'error');
        }

        return;
      }

      const saveButton = event.target.closest('[data-project-save]');

      if (!saveButton) return;

      const projectId = card.dataset.adminProject;

      saveButton.disabled = true;
      saveButton.textContent = 'Čuvanje...';

      try {
        const result = await adminRequest(
          `/api/admin/projects/${encodeURIComponent(projectId)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: card.querySelector('[data-project-status]').value,
              adminNote: card.querySelector('[data-project-note]').value,
              requirements: readRequirementsFromCard(card)
            })
          }
        );

        const index = state.projects.findIndex(
          (project) => project.id === projectId
        );

        if (index !== -1) {
          state.projects[index] = result.project;
        }

        adminProjectDrafts.delete(
          String(projectId)
        );

        renderProjects();
        setStatus(result.message, 'success');
        await loadOverview();
      } catch (error) {
        setStatus(error.message, 'error');
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Sačuvaj projekat';
      }
    });

  document
    .getElementById('adminUsersTableBody')
    .addEventListener('click', async (event) => {
      const saveButton = event.target.closest('[data-user-role-save]');

      if (!saveButton) return;

      const row = saveButton.closest('[data-admin-user]');
      const userId = row.dataset.adminUser;
      const role = row.querySelector('[data-user-role]').value;

      saveButton.disabled = true;
      saveButton.textContent = 'Čuvanje...';

      try {
        const result = await adminRequest(
          `/api/admin/users/${encodeURIComponent(userId)}/role`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              role
            })
          }
        );

        const index = state.users.findIndex((user) => user.id === userId);

        if (index !== -1) {
          state.users[index] = {
            ...state.users[index],
            ...result.user
          };
        }

        renderUsers();
        setStatus(result.message, 'success');
      } catch (error) {
        setStatus(error.message, 'error');
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Sačuvaj';
      }
    });

  document
    .getElementById('adminMessageList')
    .addEventListener('click', async (event) => {
      const saveButton = event.target.closest('[data-message-save]');

      if (!saveButton) return;

      const card = saveButton.closest('[data-admin-message]');
      const messageId = card.dataset.adminMessage;
      const status = card.querySelector('[data-message-status]').value;

      saveButton.disabled = true;
      saveButton.textContent = 'Čuvanje...';

      try {
        const result = await adminRequest(
          `/api/admin/messages/${encodeURIComponent(messageId)}/status`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status
            })
          }
        );

        if (status === 'answered') {
          card.classList.add(
            'is-removing'
          );

          await new Promise(
            (resolve) =>
              window.setTimeout(
                resolve,
                260
              )
          );

          state.messages =
            state.messages.filter(
              (message) =>
                message.id !==
                messageId
            );
        } else {
          const index =
            state.messages.findIndex(
              (message) =>
                message.id ===
                messageId
            );

          if (index !== -1) {
            state.messages[index] =
              result.data;
          }
        }

        renderMessages();
        setStatus(
          status === 'answered'
            ? 'Poruka je označena kao odgovorena i uklonjena iz aktivnog pregleda.'
            : result.message,
          'success'
        );
        await loadOverview();
      } catch (error) {
        setStatus(error.message, 'error');
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Sačuvaj status';
      }
    });

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      switchSection(button.dataset.adminSection);
    });
  });

  document.querySelectorAll('[data-open-admin-section]').forEach((button) => {
    button.addEventListener('click', () => {
      switchSection(button.dataset.openAdminSection);
    });
  });

  let projectSearchTimer = null;

  projectSearch.addEventListener('input', () => {
    window.clearTimeout(projectSearchTimer);

    projectSearchTimer = window.setTimeout(() => {
      loadProjects().catch((error) => {
        setStatus(error.message, 'error');
      });
    }, 350);
  });

  projectStatusFilter.addEventListener('change', () => {
    loadProjects().catch((error) => {
      setStatus(error.message, 'error');
    });
  });

  projectPackageFilter.addEventListener('change', () => {
    loadProjects().catch((error) => {
      setStatus(error.message, 'error');
    });
  });

  refreshButton.addEventListener('click', async () => {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Osvežavanje...';

    try {
      await Promise.all([
        loadOverview(),
        currentSection === 'overview'
          ? Promise.resolve()
          : loadSection(currentSection, false)
      ]);

      setStatus('Podaci su osveženi.', 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = 'Osveži podatke';
    }
  });

  menuToggle.addEventListener('click', () => {
    adminSidebar.classList.toggle('open');
  });

  logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
    window.location.replace('auth.html');
  });

  document.getElementById('adminSidebarInitials').textContent =
    getInitials(currentUser.name);

  document.getElementById('adminSidebarName').textContent =
    currentUser.name || 'Administrator';

  document.getElementById('adminSidebarEmail').textContent =
    currentUser.email || '';

  const liveAdminRefresh =
    window.setInterval(
      async () => {
        if (document.hidden) {
          return;
        }

        try {
          if (
            currentSection ===
            'projects'
          ) {
            if (
              !isAdminProjectEditorActive()
            ) {
              await loadProjects();
            }
          } else if (
            currentSection ===
            'messages'
          ) {
            await loadMessages();
          }

          await loadOverview();
        } catch (error) {
          console.error(
            'Automatsko osvežavanje admin panela nije uspelo:',
            error
          );
        }
      },
      5000
    );

  window.addEventListener(
    'beforeunload',
    () => {
      window.clearInterval(
        liveAdminRefresh
      );
    }
  );

  loadSection('overview');
})();
