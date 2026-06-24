(() => {
  'use strict';

  const navbar =
    document.querySelector(
      '.site-unified-navbar'
    );

  if (navbar) {
    function updateNavbar() {
      navbar.classList.toggle(
        'scrolled',
        window.scrollY > 30
      );
    }

    updateNavbar();

    window.addEventListener(
      'scroll',
      updateNavbar,
      {
        passive: true
      }
    );

    const collapse =
      navbar.querySelector(
        '.navbar-collapse'
      );

    navbar
      .querySelectorAll(
        '.nav-link, .site-auth-button'
      )
      .forEach(
        (link) => {
          link.addEventListener(
            'click',
            () => {
              if (
                window.innerWidth >= 992 ||
                !collapse ||
                !collapse.classList.contains(
                  'show'
                )
              ) {
                return;
              }

              window.bootstrap?.Collapse
                ?.getOrCreateInstance(
                  collapse
                )
                ?.hide();
            }
          );
        }
      );
  }

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
    root
      .querySelectorAll(
        'input[type="password"]:not([data-password-toggle-ready])'
      )
      .forEach(
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
                String(shouldShow)
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
                preventScroll: true
              });

              try {
                const length =
                  input.value.length;

                input.setSelectionRange(
                  length,
                  length
                );
              } catch (error) {
                // Selection range nije podržan u svakom browseru.
              }
            }
          );

          shell.appendChild(button);
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

                initializePasswordToggles(
                  node.matches?.(
                    'input[type="password"]'
                  )
                    ? node.parentElement || document
                    : node
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

})();
