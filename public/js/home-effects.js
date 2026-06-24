(() => {
  'use strict';

  const hero =
    document.querySelector(
      '.home-hero'
    );

  const motionAllowed =
    !window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

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
          '--hero-x',
          `${x}%`
        );

        hero.style.setProperty(
          '--hero-y',
          `${y}%`
        );
      }
    );

    hero.addEventListener(
      'pointerleave',
      () => {
        hero.style.setProperty(
          '--hero-x',
          '72%'
        );

        hero.style.setProperty(
          '--hero-y',
          '38%'
        );
      }
    );
  }

  const tiltCards =
    document.querySelectorAll(
      '.home-service-card, .project-preview-card, .benefit-card'
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
              (x - 0.5) * 5;

            const rotateX =
              (0.5 - y) * 5;

            card.style.transform =
              `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
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

  const sections =
    document.querySelectorAll(
      '.home-section'
    );

  const sectionObserver =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (
              entry.isIntersecting
            ) {
              entry.target.classList.add(
                'is-visible'
              );
            }
          }
        );
      },
      {
        threshold: 0.08
      }
    );

  sections.forEach(
    (section) => {
      sectionObserver.observe(
        section
      );
    }
  );
})();
