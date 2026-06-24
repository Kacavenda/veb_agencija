(() => {
  'use strict';

  const motionAllowed =
    !window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

  const hero =
    document.querySelector(
      '.process-hero'
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
          '--process-hero-x',
          `${x}%`
        );

        hero.style.setProperty(
          '--process-hero-y',
          `${y}%`
        );
      }
    );

    hero.addEventListener(
      'pointerleave',
      () => {
        hero.style.setProperty(
          '--process-hero-x',
          '73%'
        );

        hero.style.setProperty(
          '--process-hero-y',
          '38%'
        );
      }
    );
  }

  const tiltCards =
    document.querySelectorAll(
      [
        '.discovery-card',
        '.approval-card'
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

  const sideProgress =
    document.getElementById(
      'processScrollProgress'
    );

  const sideLinks =
    Array.from(
      document.querySelectorAll(
        '.process-side-nav a'
      )
    );

  const trackedSections =
    Array.from(
      document.querySelectorAll(
        '[data-process-section]'
      )
    );

  function updatePageProgress() {
    const documentHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const progress =
      documentHeight > 0
        ? Math.min(
            1,
            Math.max(
              0,
              window.scrollY /
              documentHeight
            )
          )
        : 0;

    if (sideProgress) {
      sideProgress.style.height =
        `${progress * 100}%`;
    }

    const viewportReference =
      window.scrollY +
      window.innerHeight * 0.42;

    let currentSection =
      trackedSections[0];

    trackedSections.forEach(
      (section) => {
        if (
          section.offsetTop <=
          viewportReference
        ) {
          currentSection =
            section;
        }
      }
    );

    sideLinks.forEach(
      (link) => {
        const targetId =
          link
            .getAttribute('href')
            ?.replace('#', '');

        link.classList.toggle(
          'active',
          currentSection?.id ===
            targetId
        );
      }
    );
  }

  updatePageProgress();

  window.addEventListener(
    'scroll',
    updatePageProgress,
    {
      passive: true
    }
  );

  window.addEventListener(
    'resize',
    updatePageProgress
  );

  const roadmap =
    document.querySelector(
      '.roadmap-shell'
    );

  const roadmapProgress =
    document.getElementById(
      'roadmapProgress'
    );

  const roadmapSteps =
    Array.from(
      document.querySelectorAll(
        '[data-roadmap-step]'
      )
    );

  function updateRoadmapProgress() {
    if (
      !roadmap ||
      !roadmapProgress
    ) {
      return;
    }

    const bounds =
      roadmap.getBoundingClientRect();

    const viewportPoint =
      window.innerHeight * 0.55;

    const totalDistance =
      bounds.height +
      window.innerHeight * 0.1;

    const travelled =
      viewportPoint -
      bounds.top;

    const progress =
      Math.min(
        1,
        Math.max(
          0,
          travelled /
          totalDistance
        )
      );

    roadmapProgress.style.height =
      `${progress * 100}%`;

    roadmapSteps.forEach(
      (step) => {
        const stepBounds =
          step.getBoundingClientRect();

        step.classList.toggle(
          'is-active',
          stepBounds.top <
            window.innerHeight *
            0.72 &&
          stepBounds.bottom >
            window.innerHeight *
            0.22
        );
      }
    );
  }

  updateRoadmapProgress();

  window.addEventListener(
    'scroll',
    updateRoadmapProgress,
    {
      passive: true
    }
  );

  window.addEventListener(
    'resize',
    updateRoadmapProgress
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
