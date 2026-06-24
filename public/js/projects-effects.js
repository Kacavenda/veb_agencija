(() => {
  'use strict';

  const motionAllowed =
    !window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

  const hero =
    document.querySelector(
      '.projects-hero'
    );

  if (
    hero &&
    motionAllowed
  ) {
    hero.addEventListener(
      'pointermove',
      (event) => {
        const bounds =
          hero.getBoundingClientRect();

        const x =
          ((event.clientX -
            bounds.left) /
            bounds.width) *
          100;

        const y =
          ((event.clientY -
            bounds.top) /
            bounds.height) *
          100;

        hero.style.setProperty(
          '--projects-hero-x',
          `${x}%`
        );

        hero.style.setProperty(
          '--projects-hero-y',
          `${y}%`
        );
      }
    );

    hero.addEventListener(
      'pointerleave',
      () => {
        hero.style.setProperty(
          '--projects-hero-x',
          '73%'
        );

        hero.style.setProperty(
          '--projects-hero-y',
          '38%'
        );
      }
    );
  }

  const tiltCards =
    document.querySelectorAll(
      [
        '.portfolio-card',
        '.principle-card'
      ].join(',')
    );

  if (motionAllowed) {
    tiltCards.forEach(
      (card) => {
        card.addEventListener(
          'pointermove',
          (event) => {
            const bounds =
              card.getBoundingClientRect();

            const x =
              (event.clientX -
                bounds.left) /
              bounds.width;

            const y =
              (event.clientY -
                bounds.top) /
              bounds.height;

            const rotateY =
              (x - 0.5) * 4.5;

            const rotateX =
              (0.5 - y) * 4.5;

            card.style.transform =
              `perspective(950px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
          }
        );

        card.addEventListener(
          'pointerleave',
          () => {
            card.style.transform =
              '';
          }
        );
      }
    );
  }

  const filterButtons =
    document.querySelectorAll(
      '[data-project-filter]'
    );

  const projectCards =
    document.querySelectorAll(
      '[data-project-card]'
    );

  filterButtons.forEach(
    (button) => {
      button.addEventListener(
        'click',
        () => {
          const selectedFilter =
            button.dataset.projectFilter;

          filterButtons.forEach(
            (item) => {
              item.classList.toggle(
                'active',
                item === button
              );
            }
          );

          projectCards.forEach(
            (card) => {
              const categories =
                String(
                  card.dataset.category ||
                  ''
                ).split(/\s+/);

              const shouldShow =
                selectedFilter ===
                  'all' ||
                categories.includes(
                  selectedFilter
                );

              card.classList.toggle(
                'is-filtered-out',
                !shouldShow
              );
            }
          );
        }
      );
    }
  );

  const lightbox =
    document.getElementById(
      'projectLightbox'
    );

  const lightboxImage =
    document.getElementById(
      'lightboxImage'
    );

  const lightboxTitle =
    document.getElementById(
      'lightboxTitle'
    );

  function closeLightbox() {
    if (!lightbox) {
      return;
    }

    lightbox.classList.remove(
      'is-open'
    );

    lightbox.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.classList.remove(
      'lightbox-open'
    );

    if (lightboxImage) {
      lightboxImage.src = '';
    }
  }

  document
    .querySelectorAll(
      '[data-project-preview]'
    )
    .forEach(
      (button) => {
        button.addEventListener(
          'click',
          () => {
            if (
              !lightbox ||
              !lightboxImage ||
              !lightboxTitle
            ) {
              return;
            }

            const imageSource =
              button.dataset.projectPreview;

            const projectTitle =
              button.dataset.projectTitle ||
              'Pregled projekta';

            lightboxImage.src =
              imageSource;

            lightboxImage.alt =
              projectTitle;

            lightboxTitle.textContent =
              projectTitle;

            lightbox.classList.add(
              'is-open'
            );

            lightbox.setAttribute(
              'aria-hidden',
              'false'
            );

            document.body.classList.add(
              'lightbox-open'
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      '[data-lightbox-close]'
    )
    .forEach(
      (button) => {
        button.addEventListener(
          'click',
          closeLightbox
        );
      }
    );

  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key ===
        'Escape'
      ) {
        closeLightbox();
      }
    }
  );

  document
    .querySelectorAll(
      'a[href^="#"]'
    )
    .forEach(
      (link) => {
        link.addEventListener(
          'click',
          (event) => {
            const targetId =
              link.getAttribute(
                'href'
              );

            if (
              !targetId ||
              targetId === '#'
            ) {
              return;
            }

            const target =
              document.querySelector(
                targetId
              );

            if (!target) {
              return;
            }

            event.preventDefault();

            target.scrollIntoView({
              behavior:
                motionAllowed
                  ? 'smooth'
                  : 'auto',

              block: 'start'
            });
          }
        );
      }
    );
})();
