(() => {
  const CLOSED_PROJECT_STATUSES = [
    'completed',
    'cancelled'
  ];

  const REQUIREMENT_HELP = {
    'business-information': {
      placeholder:
        'Naziv firme, delatnost, ciljna grupa, grad i kratko objašnjenje poslovanja...',
      helper:
        'Napiši osnovne informacije koje treba da razumemo pre početka izrade.'
    },

    logo: {
      placeholder:
        'Nalepi Google Drive/Dropbox link ili napiši da će logo biti poslat naknadno...',
      helper:
        'Za sada možeš uneti link do logo fajla ili kratku napomenu.'
    },

    'page-content': {
      placeholder:
        'Nalepi tekstove, link ka dokumentu ili opiši koje stranice tek treba napisati...',
      helper:
        'Možeš koristiti Google Docs link ili uneti sadržaj direktno.'
    },

    photos: {
      placeholder:
        'Nalepi link ka fotografijama ili napiši kakve fotografije ćeš dostaviti...',
      helper:
        'Više linkova možeš odvojiti novim redom.'
    },

    'contact-information': {
      placeholder:
        'Telefon, email, adresa, radno vreme i linkovi društvenih mreža...',
      helper:
        'Unesi podatke koji treba da se pojave na sajtu.'
    },

    'brand-colors': {
      placeholder:
        'Na primer: tamnoplava, bela i srebrna; #071426, #FFFFFF...',
      helper:
        'Možeš uneti nazive boja, HEX kodove ili link do brend smernica.'
    },

    references: {
      placeholder:
        'Nalepi linkove sajtova koji ti se sviđaju i napiši šta želiš da preuzmemo kao inspiraciju...',
      helper:
        'Ovo je opciono, ali nam pomaže da razumemo željeni pravac.'
    }
  };

  const projectsList =
    document.getElementById(
      'projectsAccountList'
    );

  const emptyState =
    document.getElementById(
      'projectsEmptyState'
    );

  const pageStatus =
    document.getElementById(
      'projectsPageStatus'
    );

  const totalElement =
    document.getElementById(
      'projectsTotal'
    );

  const activeElement =
    document.getElementById(
      'projectsActive'
    );

  const waitingElement =
    document.getElementById(
      'projectsWaiting'
    );

  const completedElement =
    document.getElementById(
      'projectsCompleted'
    );

  const filterButtons =
    document.querySelectorAll(
      '[data-project-filter]'
    );

  let allProjects = [];
  let activeFilter = 'all';

  const openMaterialEditors =
    new Set();

  const materialAutosaveTimers =
    new Map();

  function readStoredJson(
    storage,
    key,
    fallback = null
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

  function getCurrentUser() {
    return (
      readStoredJson(
        sessionStorage,
        'currentUser'
      ) ||
      readStoredJson(
        localStorage,
        'currentUser'
      )
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

  function formatDate(value) {
    if (!value) {
      return '—';
    }

    return new Intl.DateTimeFormat(
      'sr-RS',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(
      new Date(value)
    );
  }


  function formatFileSize(bytes) {
    const value = Number(bytes) || 0;

    if (value < 1024) {
      return `${value} B`;
    }

    if (value < 1024 * 1024) {
      return `${(
        value /
        1024
      ).toFixed(1)} KB`;
    }

    return `${(
      value /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function fileCanPreview(file) {
    const mimeType =
      String(
        file?.mimeType ||
        ''
      );

    return (
      mimeType.startsWith(
        'image/'
      ) ||
      mimeType ===
        'application/pdf' ||
      mimeType ===
        'text/plain'
    );
  }

  function fileIcon(file) {
    const mimeType =
      String(
        file?.mimeType ||
        ''
      );

    if (
      mimeType.startsWith(
        'image/'
      )
    ) {
      return 'IMG';
    }

    if (
      mimeType ===
      'application/pdf'
    ) {
      return 'PDF';
    }

    if (
      mimeType.includes(
        'word'
      )
    ) {
      return 'DOC';
    }

    if (
      mimeType.includes(
        'zip'
      )
    ) {
      return 'ZIP';
    }

    return 'FILE';
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

  function setStatus(
    message,
    type = ''
  ) {
    pageStatus.className =
      `account-page-status ${type}`.trim();

    pageStatus.textContent =
      message;
  }

  function getFilteredProjects() {
    if (
      activeFilter === 'active'
    ) {
      return allProjects.filter(
        (project) =>
          [
            'new',
            'reviewing',
            'accepted',
            'in-progress',
            'testing'
          ].includes(
            project.status
          )
      );
    }

    if (
      activeFilter === 'waiting'
    ) {
      return allProjects.filter(
        (project) =>
          project.status ===
          'waiting-for-client'
      );
    }

    if (
      activeFilter === 'completed'
    ) {
      return allProjects.filter(
        (project) =>
          project.status ===
          'completed'
      );
    }

    return allProjects;
  }

  function renderConfiguration(
    project
  ) {
    const configuration =
      Array.isArray(
        project.configuration
      )
        ? project.configuration
        : [];

    if (
      !configuration.length
    ) {
      return `
        <p class="project-note">
          Standardna konfiguracija paketa.
        </p>
      `;
    }

    return `
      <div class="project-option-list">
        ${configuration
          .map(
            (option) => `
              <div class="project-option">
                <b>
                  ${escapeHtml(
                    option.label
                  )}
                </b>

                <span>
                  ${escapeHtml(
                    option.value
                  )}

                  ${
                    Number(
                      option.extraTotal
                    ) > 0
                      ? ` · +${formatPrice(
                          option.extraTotal,
                          project.currency
                        )}`
                      : ' · uključeno'
                  }
                </span>
              </div>
            `
          )
          .join('')}
      </div>
    `;
  }

  function getRequirementsProgress(
    project
  ) {
    const requirements =
      Array.isArray(
        project.requirements
      )
        ? project.requirements
        : [];

    const requiredRequirements =
      requirements.filter(
        (requirement) =>
          requirement.required
      );

    const providedCount =
      requiredRequirements.filter(
        (requirement) =>
          requirement.provided
      ).length;

    const totalCount =
      requiredRequirements.length;

    const progress =
      totalCount > 0
        ? Math.round(
            (
              providedCount /
              totalCount
            ) * 100
          )
        : 100;

    return {
      requirements,
      providedCount,
      totalCount,
      progress
    };
  }

  function renderRequirementsSummary(
    project
  ) {
    const {
      requirements,
      providedCount,
      totalCount,
      progress
    } = getRequirementsProgress(
      project
    );

    return `
      <div class="requirements-progress-head">
        <span>
          Pripremljeni materijali
        </span>

        <strong>
          ${providedCount}/${totalCount}
        </strong>
      </div>

      <div
        class="requirements-progress"
        aria-label="${progress}% završeno"
      >
        <span
          style="width: ${progress}%"
        ></span>
      </div>

      <div class="requirements-list">
        ${requirements
          .map(
            (requirement) => `
              <div class="requirement-item ${
                requirement.provided
                  ? 'provided'
                  : ''
              }">
                <span class="requirement-check">
                  ${
                    requirement.provided
                      ? '✓'
                      : '·'
                  }
                </span>

                <span>
                  ${escapeHtml(
                    requirement.label
                  )}

                  ${
                    requirement.required
                      ? ''
                      : ' (opciono)'
                  }
                </span>
              </div>
            `
          )
          .join('')}
      </div>
    `;
  }

  function renderProjectFiles(
    project,
    allowDelete = false
  ) {
    const files =
      Array.isArray(
        project.files
      )
        ? project.files
        : [];

    if (!files.length) {
      return `
        <p class="project-files-empty">
          Još nema poslatih fajlova.
        </p>
      `;
    }

    return `
      <div class="project-file-list">
        ${files
          .map(
            (file) => `
              <article class="project-file-row">
                <span class="project-file-icon">
                  ${fileIcon(file)}
                </span>

                <div class="project-file-copy">
                  <strong>
                    ${escapeHtml(
                      file.originalName
                    )}
                  </strong>

                  <small>
                    ${formatFileSize(
                      file.size
                    )}
                    ·
                    ${formatDate(
                      file.uploadedAt
                    )}
                  </small>
                </div>

                <div class="project-file-actions">
                  ${
                    fileCanPreview(
                      file
                    )
                      ? `
                        <button
                          type="button"
                          data-file-open="preview"
                          data-file-id="${escapeHtml(
                            file.id
                          )}"
                          data-file-name="${escapeHtml(
                            file.originalName
                          )}"
                        >
                          Pregled
                        </button>
                      `
                      : ''
                  }

                  <button
                    type="button"
                    data-file-open="download"
                    data-file-id="${escapeHtml(
                      file.id
                    )}"
                    data-file-name="${escapeHtml(
                      file.originalName
                    )}"
                  >
                    Preuzmi
                  </button>

                  ${
                    allowDelete
                      ? `
                        <button
                          class="danger"
                          type="button"
                          data-file-delete
                          data-file-id="${escapeHtml(
                            file.id
                          )}"
                        >
                          Obriši
                        </button>
                      `
                      : ''
                  }
                </div>
              </article>
            `
          )
          .join('')}
      </div>
    `;
  }

  function renderFileUploadPanel(
    project
  ) {
    return `
      <section class="project-file-uploader">
        <div class="project-file-uploader-heading">
          <div>
            <span>
              Direktan upload
            </span>

            <h4>
              Logo, fotografije i dokumenti
            </h4>

            <p>
              Do 10 fajlova odjednom,
              najviše 15 MB po fajlu.
            </p>
          </div>

          <label class="project-file-picker">
            <input
              type="file"
              multiple
              data-file-input
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.txt,.zip"
            />

            <span>
              Izaberi fajlove
            </span>
          </label>
        </div>

        <div class="project-file-selection">
          <span data-file-selection-text>
            Nijedan novi fajl nije izabran.
          </span>

          <button
            class="btn btn-cinematic rounded-pill px-4"
            type="button"
            data-file-upload
            disabled
          >
            Pošalji izabrane fajlove
          </button>
        </div>

        <div class="project-existing-files">
          <h5>
            Već poslati fajlovi
          </h5>

          ${renderProjectFiles(
            project,
            true
          )}
        </div>
      </section>
    `;
  }

  function renderProjectMessages(
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
        <div class="project-conversation-empty">
          Još nema poruka za ovaj projekat.
          Ovde možeš direktno da razgovaraš sa administratorom.
        </div>
      `;
    }

    return messages
      .map(
        (message) => `
          <article
            class="project-message-bubble ${escapeHtml(
              message.senderRole
            )}"
          >
            <div class="project-message-meta">
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
                    ? 'Administracija'
                    : 'Ti'
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

  function renderProjectConversation(
    project
  ) {
    return `
      <section class="project-conversation">
        <div class="project-conversation-heading">
          <div>
            <span>
              Poruke projekta
            </span>

            <h3>
              Komunikacija sa administratorom
            </h3>

            <p>
              Pitanja, izmene i dogovori ostaju vezani za ovaj projekat.
            </p>
          </div>

          <button
            class="project-conversation-refresh"
            type="button"
            data-message-refresh
          >
            Osveži poruke
          </button>
        </div>

        <div
          class="project-message-list"
          data-project-message-list
        >
          ${renderProjectMessages(
            project
          )}
        </div>

        <div class="project-message-composer">
          <textarea
            data-project-message-input
            maxlength="2000"
            placeholder="Napiši poruku administratoru..."
          ></textarea>

          <div>
            <small>
              Najviše 2000 karaktera.
            </small>

            <button
              class="btn btn-cinematic rounded-pill px-4"
              type="button"
              data-message-send
            >
              Pošalji poruku
            </button>
          </div>
        </div>
      </section>
    `;
  }

  function renderMaterialEditor(
    project
  ) {
    const requirements =
      Array.isArray(
        project.requirements
      )
        ? project.requirements
        : [];

    const isClosed =
      CLOSED_PROJECT_STATUSES.includes(
        project.status
      );

    const editorOpen =
      openMaterialEditors.has(
        project.id
      );

    return `
      <section
        class="project-material-editor ${
          editorOpen
            ? 'open'
            : ''
        }"
        data-material-editor
        ${editorOpen ? '' : 'hidden'}
      >
        <div class="material-editor-heading">
          <div>
            <span>
              Materijali klijenta
            </span>

            <h3>
              Dodaj ili izmeni podatke
            </h3>

            <p>
              Unesi tekst, opis ili link
              i označi stavku kada je spremna.
            </p>
          </div>

          ${
            project.materialsSubmittedAt
              ? `
                <div class="material-editor-revision">
                  <small>
                    Poslednje slanje
                  </small>

                  <strong>
                    ${formatDate(
                      project.materialsSubmittedAt
                    )}
                  </strong>

                  <span>
                    Revizija
                    ${Number(
                      project.materialsRevision ||
                        0
                    )}
                  </span>
                </div>
              `
              : ''
          }
        </div>

        ${
          isClosed
            ? `
              <div class="material-editor-locked">
                Projekat je
                ${escapeHtml(
                  statusLabel(
                    project.status
                  )
                ).toLowerCase()}
                i materijali više ne mogu da se menjaju.
              </div>
            `
            : `
              <div class="material-fields-grid">
                ${requirements
                  .map(
                    (requirement) => {
                      const help =
                        REQUIREMENT_HELP[
                          requirement.key
                        ] || {
                          placeholder:
                            'Unesi tekst, napomenu ili link...',
                          helper:
                            'Dodaj sve informacije koje su potrebne za ovu stavku.'
                        };

                      return `
                        <article
                          class="material-field-card ${
                            requirement.provided
                              ? 'provided'
                              : ''
                          }"
                          data-material-key="${escapeHtml(
                            requirement.key
                          )}"
                        >
                          <div class="material-field-top">
                            <div>
                              <span>
                                ${
                                  requirement.required
                                    ? 'Obavezno'
                                    : 'Opciono'
                                }
                              </span>

                              <h4>
                                ${escapeHtml(
                                  requirement.label
                                )}
                              </h4>
                            </div>

                            <label class="material-ready-toggle">
                              <input
                                type="checkbox"
                                data-material-provided
                                ${
                                  requirement.provided
                                    ? 'checked'
                                    : ''
                                }
                              />

                              <span>
                                Spremno
                              </span>
                            </label>
                          </div>

                          <textarea
                            data-material-value
                            maxlength="3000"
                            placeholder="${escapeHtml(
                              help.placeholder
                            )}"
                          >${escapeHtml(
                            requirement.value ||
                              ''
                          )}</textarea>

                          <small>
                            ${escapeHtml(
                              help.helper
                            )}
                          </small>
                        </article>
                      `;
                    }
                  )
                  .join('')}
              </div>

              ${renderFileUploadPanel(
                project
              )}

              <label class="client-note-field">
                <span>
                  Dodatna napomena za administratora
                </span>

                <textarea
                  data-client-note
                  maxlength="3000"
                  placeholder="Napiši dodatne zahteve, rokove ili informacije koje nisu obuhvaćene stavkama iznad..."
                >${escapeHtml(
                  project.clientNote ||
                    ''
                )}</textarea>
              </label>

              <div class="material-editor-actions">
                <button
                  class="btn btn-ghost rounded-pill px-4"
                  type="button"
                  data-material-cancel
                >
                  Zatvori
                </button>

                <button
                  class="btn btn-cinematic rounded-pill px-4"
                  type="button"
                  data-material-save
                >
                  Sačuvaj i pošalji na pregled
                </button>
              </div>

              <p class="material-editor-note" data-material-autosave-status>
                Tekst i checkbox polja se automatski čuvaju.
                Dugme „Sačuvaj i pošalji na pregled“ potvrđuje kompletne materijale.
              </p>
            `
        }
      </section>
    `;
  }

  function renderProjects() {
    const projects =
      getFilteredProjects();

    projectsList.innerHTML =
      projects
        .map(
          (project) => {
            const isClosed =
              CLOSED_PROJECT_STATUSES.includes(
                project.status
              );

            return `
              <article
                class="project-detail-card ${escapeHtml(
                  project.packageId
                )}"
                data-project-card="${escapeHtml(
                  project.id
                )}"
              >
                <div class="project-detail-main">
                  <div class="project-detail-identity">
                    <div class="project-detail-top">
                      <div>
                        <span class="project-package-label">
                          ${escapeHtml(
                            project.packageName
                          )}
                        </span>

                        <h2>
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
                        </h2>

                        <p class="project-code">
                          ${escapeHtml(
                            project.projectCode
                          )}
                        </p>
                      </div>

                      <span
                        class="project-status-badge ${escapeHtml(
                          project.status
                        )}"
                      >
                        ${escapeHtml(
                          statusLabel(
                            project.status
                          )
                        )}
                      </span>
                    </div>

                    <div class="project-meta-grid">
                      <div>
                        <span>Kreiran</span>

                        <strong>
                          ${formatDate(
                            project.createdAt
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Plaćanje</span>

                        <strong>
                          ${escapeHtml(
                            project.paymentStatus ||
                              '—'
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          PayPal Order ID
                        </span>

                        <strong>
                          ${escapeHtml(
                            project.paypalOrderId ||
                              '—'
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Poslednja izmena
                        </span>

                        <strong>
                          ${formatDate(
                            project.updatedAt
                          )}
                        </strong>
                      </div>
                    </div>

                    <div class="project-price">
                      ${formatPrice(
                        project.totalPrice,
                        project.currency
                      )}
                    </div>

                    <button
                      class="project-material-toggle ${
                        openMaterialEditors.has(
                          project.id
                        )
                          ? 'active'
                          : ''
                      }"
                      type="button"
                      data-material-toggle
                      ${
                        isClosed
                          ? 'disabled'
                          : ''
                      }
                    >
                      ${
                        isClosed
                          ? 'Materijali zaključani'
                          : openMaterialEditors.has(
                              project.id
                            )
                            ? 'Zatvori editor materijala'
                            : project.materialsSubmittedAt
                              ? 'Izmeni poslate materijale'
                              : 'Dodaj materijale'
                      }
                    </button>
                  </div>

                  <div class="project-detail-content">
                    <section class="project-content-section">
                      <h3>
                        Konfiguracija paketa
                      </h3>

                      ${renderConfiguration(
                        project
                      )}
                    </section>

                    <section class="project-content-section">
                      <h3>
                        Potrebni materijali
                      </h3>

                      ${renderRequirementsSummary(
                        project
                      )}
                    </section>

                    <section class="project-content-section">
                      <h3>
                        Poslati fajlovi
                      </h3>

                      ${renderProjectFiles(
                        project
                      )}
                    </section>

                    <section class="project-content-section">
                      <h3>
                        Napomena administratora
                      </h3>

                      <p class="project-note">
                        ${
                          project.adminNote
                            ? escapeHtml(
                                project.adminNote
                              )
                            : 'Administrator još nije dodao napomenu za ovaj projekat.'
                        }
                      </p>
                    </section>
                  </div>
                </div>

                ${renderProjectConversation(
                  project
                )}

                ${renderMaterialEditor(
                  project
                )}
              </article>
            `;
          }
        )
        .join('');

    projectsList
      .querySelectorAll(
        '[data-project-message-list]'
      )
      .forEach((list) => {
        list.scrollTop =
          list.scrollHeight;
      });

    emptyState.hidden =
      projects.length !== 0;

    if (
      !projects.length &&
      allProjects.length
    ) {
      emptyState
        .querySelector('h2')
        .textContent =
          'Nema projekata u izabranom filteru.';

      emptyState
        .querySelector('p')
        .textContent =
          'Izaberi drugi status da bi video ostale projekte.';
    }
  }

  function updateStats() {
    const activeCount =
      allProjects.filter(
        (project) =>
          [
            'new',
            'reviewing',
            'accepted',
            'in-progress',
            'testing'
          ].includes(
            project.status
          )
      ).length;

    const waitingCount =
      allProjects.filter(
        (project) =>
          project.status ===
          'waiting-for-client'
      ).length;

    const completedCount =
      allProjects.filter(
        (project) =>
          project.status ===
          'completed'
      ).length;

    totalElement.textContent =
      String(
        allProjects.length
      );

    activeElement.textContent =
      String(activeCount);

    waitingElement.textContent =
      String(waitingCount);

    completedElement.textContent =
      String(completedCount);
  }

  function getProjectById(
    projectId
  ) {
    return allProjects.find(
      (project) =>
        String(project.id) ===
        String(projectId)
    );
  }

  function collectMaterials(
    card
  ) {
    const requirements =
      Array.from(
        card.querySelectorAll(
          '[data-material-key]'
        )
      ).map((field) => ({
        key:
          field.dataset.materialKey,

        provided:
          Boolean(
            field.querySelector(
              '[data-material-provided]'
            )?.checked
          ),

        value:
          field.querySelector(
            '[data-material-value]'
          )?.value.trim() || ''
      }));

    return {
      requirements,

      clientNote:
        card.querySelector(
          '[data-client-note]'
        )?.value.trim() || ''
    };
  }

  function updateMaterialCardState(
    field
  ) {
    const checkbox =
      field.querySelector(
        '[data-material-provided]'
      );

    field.classList.toggle(
      'provided',
      Boolean(
        checkbox?.checked
      )
    );
  }

  async function saveMaterials(
    card,
    saveButton = null,
    options = {}
  ) {
    const autosave =
      Boolean(options.autosave);

    const currentUser =
      getCurrentUser();

    const projectId =
      card.dataset.projectCard;

    if (
      !currentUser ||
      !projectId
    ) {
      if (!autosave) {
        setStatus(
          'Korisnički podaci nisu dostupni. Prijavi se ponovo.',
          'error'
        );
      }

      return;
    }

    const pendingTimer =
      materialAutosaveTimers.get(
        projectId
      );

    if (pendingTimer) {
      window.clearTimeout(
        pendingTimer
      );
      materialAutosaveTimers.delete(
        projectId
      );
    }

    const materials =
      collectMaterials(card);

    const autosaveStatus =
      card.querySelector(
        '[data-material-autosave-status]'
      );

    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent =
        'Čuvanje materijala...';
    }

    if (
      autosave &&
      autosaveStatus
    ) {
      autosaveStatus.textContent =
        'Automatsko čuvanje...';
    }

    try {
      const response =
        await fetch(
          `/api/projects/${encodeURIComponent(
            projectId
          )}/materials`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              'x-user-id': String(
                currentUser.id ||
                  currentUser._id ||
                  ''
              ),

              'x-user-email': String(
                currentUser.email ||
                  ''
              )
            },

            body: JSON.stringify({
              ...materials,
              autosave
            })
          }
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
          'Server nije vratio ispravan odgovor.'
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Materijali nisu mogli da se sačuvaju.'
        );
      }

      const projectIndex =
        allProjects.findIndex(
          (project) =>
            String(project.id) ===
            String(projectId)
        );

      if (
        projectIndex !== -1
      ) {
        allProjects[
          projectIndex
        ] = result.project;
      }

      if (autosave) {
        if (autosaveStatus) {
          autosaveStatus.textContent =
            'Izmene su automatski sačuvane i odmah dostupne administratoru.';
        }

        return;
      }

      openMaterialEditors.delete(
        projectId
      );

      updateStats();
      renderProjects();

      setStatus(
        result.message,
        'success'
      );

      const updatedCard =
        projectsList.querySelector(
          `[data-project-card="${CSS.escape(
            projectId
          )}"]`
        );

      updatedCard?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      window.dispatchEvent(
        new CustomEvent(
          'cinematic-project-updated'
        )
      );
    } catch (error) {
      console.error(error);

      if (autosave) {
        if (autosaveStatus) {
          autosaveStatus.textContent =
            'Automatsko čuvanje nije uspelo. Pritisni „Sačuvaj i pošalji na pregled“.';
        }
      } else {
        setStatus(
          error.message,
          'error'
        );
      }
    } finally {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent =
          'Sačuvaj i pošalji na pregled';
      }
    }
  }

  function scheduleMaterialAutosave(
    card
  ) {
    const projectId =
      card?.dataset.projectCard;

    if (!projectId) {
      return;
    }

    const currentTimer =
      materialAutosaveTimers.get(
        projectId
      );

    if (currentTimer) {
      window.clearTimeout(
        currentTimer
      );
    }

    const nextTimer =
      window.setTimeout(
        () => {
          materialAutosaveTimers.delete(
            projectId
          );

          saveMaterials(
            card,
            null,
            {
              autosave: true
            }
          );
        },
        700
      );

    materialAutosaveTimers.set(
      projectId,
      nextTimer
    );
  }

  function userHeaders() {
    const currentUser =
      getCurrentUser();

    return {
      'x-user-id': String(
        currentUser?.id ||
        currentUser?._id ||
        ''
      ),

      'x-user-email': String(
        currentUser?.email ||
        ''
      )
    };
  }

  async function readJsonResponse(
    response
  ) {
    const text =
      await response.text();

    try {
      return text
        ? JSON.parse(text)
        : {};
    } catch (error) {
      throw new Error(
        'Server nije vratio ispravan odgovor.'
      );
    }
  }

  function updateProjectInState(
    updatedProject
  ) {
    const projectIndex =
      allProjects.findIndex(
        (project) =>
          String(project.id) ===
          String(
            updatedProject.id
          )
      );

    if (
      projectIndex !== -1
    ) {
      allProjects[
        projectIndex
      ] = updatedProject;
    }
  }

  async function uploadProjectFiles(
    card,
    uploadButton
  ) {
    const projectId =
      card.dataset.projectCard;

    const input =
      card.querySelector(
        '[data-file-input]'
      );

    const selectedFiles =
      Array.from(
        input?.files ||
        []
      );

    if (!selectedFiles.length) {
      setStatus(
        'Izaberi bar jedan fajl.',
        'error'
      );

      return;
    }

    const formData =
      new FormData();

    selectedFiles.forEach(
      (file) => {
        formData.append(
          'files',
          file
        );
      }
    );

    uploadButton.disabled =
      true;

    uploadButton.textContent =
      'Slanje fajlova...';

    try {
      const response =
        await fetch(
          `/api/projects/${encodeURIComponent(
            projectId
          )}/files`,
          {
            method: 'POST',
            headers:
              userHeaders(),
            body:
              formData
          }
        );

      const result =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Fajlovi nisu mogli da se pošalju.'
        );
      }

      updateProjectInState(
        result.project
      );

      openMaterialEditors.add(
        projectId
      );

      updateStats();
      renderProjects();

      setStatus(
        result.message,
        'success'
      );
    } catch (error) {
      console.error(error);

      setStatus(
        error.message,
        'error'
      );

      uploadButton.disabled =
        false;

      uploadButton.textContent =
        'Pošalji izabrane fajlove';
    }
  }

  async function openProjectFile(
    projectId,
    fileId,
    fileName,
    mode
  ) {
    const previewWindow =
      mode === 'preview'
        ? window.open(
            '',
            '_blank'
          )
        : null;

    try {
      const response =
        await fetch(
          `/api/projects/${encodeURIComponent(
            projectId
          )}/files/${encodeURIComponent(
            fileId
          )}/content?inline=${
            mode === 'preview'
          }`,
          {
            headers:
              userHeaders()
          }
        );

      if (!response.ok) {
        const result =
          await readJsonResponse(
            response
          );

        throw new Error(
          result.message ||
          'Fajl nije mogao da se otvori.'
        );
      }

      const blob =
        await response.blob();

      const objectUrl =
        URL.createObjectURL(
          blob
        );

      if (
        mode === 'preview'
      ) {
        if (previewWindow) {
          previewWindow.location.href =
            objectUrl;
        }

        window.setTimeout(
          () => {
            URL.revokeObjectURL(
              objectUrl
            );
          },
          60000
        );

        return;
      }

      const link =
        document.createElement(
          'a'
        );

      link.href =
        objectUrl;

      link.download =
        fileName ||
        'download';

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            objectUrl
          );
        },
        1000
      );
    } catch (error) {
      previewWindow?.close();

      console.error(error);

      setStatus(
        error.message,
        'error'
      );
    }
  }

  async function deleteProjectFile(
    projectId,
    fileId
  ) {
    if (
      !window.confirm(
        'Da li sigurno želiš da obrišeš ovaj fajl?'
      )
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `/api/projects/${encodeURIComponent(
            projectId
          )}/files/${encodeURIComponent(
            fileId
          )}`,
          {
            method:
              'DELETE',

            headers:
              userHeaders()
          }
        );

      const result =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Fajl nije mogao da se obriše.'
        );
      }

      updateProjectInState(
        result.project
      );

      openMaterialEditors.add(
        projectId
      );

      updateStats();
      renderProjects();

      setStatus(
        result.message,
        'success'
      );
    } catch (error) {
      console.error(error);

      setStatus(
        error.message,
        'error'
      );
    }
  }

  async function refreshProjectMessages(
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
      const response =
        await fetch(
          `/api/projects/${encodeURIComponent(
            projectId
          )}/messages`,
          {
            headers:
              userHeaders()
          }
        );

      const result =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Poruke nisu mogle da se učitaju.'
        );
      }

      const project =
        allProjects.find(
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

      setStatus(
        'Poruke su osvežene.',
        'success'
      );
    } catch (error) {
      console.error(error);

      setStatus(
        error.message,
        'error'
      );

      if (button) {
        button.disabled =
          false;
        button.textContent =
          'Osveži poruke';
      }
    }
  }

  async function sendProjectMessage(
    card,
    sendButton
  ) {
    const projectId =
      card.dataset.projectCard;

    const input =
      card.querySelector(
        '[data-project-message-input]'
      );

    const message =
      String(
        input?.value ||
        ''
      ).trim();

    if (!message) {
      setStatus(
        'Napiši poruku pre slanja.',
        'error'
      );

      input?.focus();
      return;
    }

    sendButton.disabled =
      true;
    sendButton.textContent =
      'Slanje...';

    try {
      const response =
        await fetch(
          `/api/projects/${encodeURIComponent(
            projectId
          )}/messages`,
          {
            method:
              'POST',

            headers: {
              ...userHeaders(),
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                message
              })
          }
        );

      const result =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Poruka nije mogla da se pošalje.'
        );
      }

      updateProjectInState(
        result.project
      );

      renderProjects();

      setStatus(
        result.message,
        'success'
      );
    } catch (error) {
      console.error(error);

      setStatus(
        error.message,
        'error'
      );

      sendButton.disabled =
        false;
      sendButton.textContent =
        'Pošalji poruku';
    }
  }

  async function loadProjects() {
    const user =
      getCurrentUser();

    if (!user) {
      window.location.replace(
        'auth.html'
      );

      return;
    }

    const userId = String(
      user.id ||
        user._id ||
        ''
    ).trim();

    if (
      !userId &&
      !user.email
    ) {
      setStatus(
        'Korisnički podaci nisu potpuni. Prijavi se ponovo.',
        'error'
      );

      return;
    }

    try {
      const response =
        await fetch(
          `/api/projects/user/${encodeURIComponent(
            userId ||
              'unknown'
          )}?email=${encodeURIComponent(
            user.email ||
              ''
          )}`
        );

      const text =
        await response.text();

      const result =
        text
          ? JSON.parse(text)
          : {};

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Projekti nisu mogli da se učitaju.'
        );
      }

      allProjects =
        Array.isArray(
          result.projects
        )
          ? result.projects
          : [];

      updateStats();
      renderProjects();

      setStatus(
        allProjects.length
          ? `Učitano projekata: ${allProjects.length}.`
          : 'Još nema projekata.'
      );
    } catch (error) {
      console.error(error);

      emptyState.hidden =
        false;

      setStatus(
        error.message,
        'error'
      );
    }
  }

  projectsList.addEventListener(
    'click',
    (event) => {
      const card =
        event.target.closest(
          '[data-project-card]'
        );

      if (!card) {
        return;
      }

      const projectId =
        card.dataset.projectCard;

      const toggleButton =
        event.target.closest(
          '[data-material-toggle]'
        );

      if (toggleButton) {
        if (
          toggleButton.disabled
        ) {
          return;
        }

        if (
          openMaterialEditors.has(
            projectId
          )
        ) {
          openMaterialEditors.delete(
            projectId
          );
        } else {
          openMaterialEditors.add(
            projectId
          );
        }

        renderProjects();

        const updatedCard =
          projectsList.querySelector(
            `[data-project-card="${CSS.escape(
              projectId
            )}"]`
          );

        updatedCard?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        return;
      }

      const messageSendButton =
        event.target.closest(
          '[data-message-send]'
        );

      if (messageSendButton) {
        sendProjectMessage(
          card,
          messageSendButton
        );

        return;
      }

      const messageRefreshButton =
        event.target.closest(
          '[data-message-refresh]'
        );

      if (messageRefreshButton) {
        refreshProjectMessages(
          projectId,
          messageRefreshButton
        );

        return;
      }

      const fileOpenButton =
        event.target.closest(
          '[data-file-open]'
        );

      if (fileOpenButton) {
        openProjectFile(
          projectId,
          fileOpenButton.dataset.fileId,
          fileOpenButton.dataset.fileName,
          fileOpenButton.dataset.fileOpen
        );

        return;
      }

      const fileDeleteButton =
        event.target.closest(
          '[data-file-delete]'
        );

      if (fileDeleteButton) {
        deleteProjectFile(
          projectId,
          fileDeleteButton.dataset.fileId
        );

        return;
      }

      const fileUploadButton =
        event.target.closest(
          '[data-file-upload]'
        );

      if (fileUploadButton) {
        uploadProjectFiles(
          card,
          fileUploadButton
        );

        return;
      }

      const cancelButton =
        event.target.closest(
          '[data-material-cancel]'
        );

      if (cancelButton) {
        openMaterialEditors.delete(
          projectId
        );

        renderProjects();
        setStatus(
          'Editor je zatvoren. Unete izmene su automatski sačuvane.'
        );

        return;
      }

      const saveButton =
        event.target.closest(
          '[data-material-save]'
        );

      if (saveButton) {
        saveMaterials(
          card,
          saveButton
        );
      }
    }
  );

  projectsList.addEventListener(
    'change',
    (event) => {
      const fileInput =
        event.target.closest(
          '[data-file-input]'
        );

      if (fileInput) {
        const card =
          fileInput.closest(
            '[data-project-card]'
          );

        const selectionText =
          card?.querySelector(
            '[data-file-selection-text]'
          );

        const uploadButton =
          card?.querySelector(
            '[data-file-upload]'
          );

        const count =
          fileInput.files?.length ||
          0;

        if (selectionText) {
          selectionText.textContent =
            count
              ? `${count} ${
                  count === 1
                    ? 'fajl je izabran'
                    : 'fajlova je izabrano'
                }.`
              : 'Nijedan novi fajl nije izabran.';
        }

        if (uploadButton) {
          uploadButton.disabled =
            count === 0;
        }

        return;
      }

      const checkbox =
        event.target.closest(
          '[data-material-provided]'
        );

      if (!checkbox) {
        return;
      }

      const field =
        checkbox.closest(
          '[data-material-key]'
        );

      if (field) {
        updateMaterialCardState(
          field
        );

        const card =
          field.closest(
            '[data-project-card]'
          );

        scheduleMaterialAutosave(
          card
        );
      }
    }
  );

  projectsList.addEventListener(
    'keydown',
    (event) => {
      const input =
        event.target.closest(
          '[data-project-message-input]'
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
          '[data-project-card]'
        );

      const sendButton =
        card?.querySelector(
          '[data-message-send]'
        );

      if (
        card &&
        sendButton &&
        !sendButton.disabled
      ) {
        sendProjectMessage(
          card,
          sendButton
        );
      }
    }
  );

  projectsList.addEventListener(
    'input',
    (event) => {
      const materialInput =
        event.target.closest(
          '[data-material-value], [data-client-note]'
        );

      if (!materialInput) {
        return;
      }

      const field =
        materialInput.closest(
          '[data-material-key]'
        );

      if (field) {
        const checkbox =
          field.querySelector(
            '[data-material-provided]'
          );

        if (
          checkbox &&
          materialInput.value.trim()
        ) {
          checkbox.checked = true;

          updateMaterialCardState(
            field
          );
        }
      }

      const card =
        materialInput.closest(
          '[data-project-card]'
        );

      scheduleMaterialAutosave(
        card
      );
    }
  );

  filterButtons.forEach(
    (button) => {
      button.addEventListener(
        'click',
        () => {
          activeFilter =
            button.dataset.projectFilter;

          filterButtons.forEach(
            (currentButton) => {
              currentButton.classList.toggle(
                'active',
                currentButton ===
                  button
              );
            }
          );

          renderProjects();
        }
      );
    }
  );

  loadProjects();
})();
