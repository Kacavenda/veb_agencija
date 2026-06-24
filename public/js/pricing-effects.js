(() => {
  'use strict';

  const motionAllowed =
    !window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

  const hero =
    document.querySelector(
      '.pricing-hero'
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
          '--pricing-hero-x',
          `${x}%`
        );

        hero.style.setProperty(
          '--pricing-hero-y',
          `${y}%`
        );
      }
    );

    hero.addEventListener(
      'pointerleave',
      () => {
        hero.style.setProperty(
          '--pricing-hero-x',
          '73%'
        );

        hero.style.setProperty(
          '--pricing-hero-y',
          '38%'
        );
      }
    );
  }

  const tiltCards =
    document.querySelectorAll(
      [
        '.pricing-package-card',
        '.guidance-card'
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
