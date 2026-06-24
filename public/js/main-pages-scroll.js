(() => {
  'use strict';

  const sideNav =
    document.querySelector(
      '.main-page-side-nav'
    );

  if (!sideNav) {
    return;
  }

  const links =
    Array.from(
      sideNav.querySelectorAll(
        'a[href^="#"]'
      )
    );

  const progressLine =
    sideNav.querySelector(
      '.main-page-side-progress span'
    );

  const sections =
    links
      .map((link) => {
        const selector =
          link.getAttribute('href');

        return {
          link,
          section:
            selector &&
            selector !== '#'
              ? document.querySelector(
                  selector
                )
              : null
        };
      })
      .filter(
        (item) =>
          Boolean(item.section)
      );

  const motionAllowed =
    !window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

  function updateSideNavigation() {
    const scrollableHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const progress =
      scrollableHeight > 0
        ? Math.min(
            1,
            Math.max(
              0,
              window.scrollY /
              scrollableHeight
            )
          )
        : 0;

    if (progressLine) {
      progressLine.style.height =
        `${progress * 100}%`;
    }

    const referencePoint =
      window.scrollY +
      window.innerHeight * 0.38;

    let activeItem =
      sections[0];

    sections.forEach(
      (item) => {
        if (
          item.section.offsetTop <=
          referencePoint
        ) {
          activeItem =
            item;
        }
      }
    );

    sections.forEach(
      (item) => {
        item.link.classList.toggle(
          'active',
          item === activeItem
        );
      }
    );
  }

  links.forEach(
    (link) => {
      link.addEventListener(
        'click',
        (event) => {
          const selector =
            link.getAttribute(
              'href'
            );

          const target =
            selector &&
            selector !== '#'
              ? document.querySelector(
                  selector
                )
              : null;

          if (!target) {
            return;
          }

          event.preventDefault();

          target.scrollIntoView({
            behavior:
              motionAllowed
                ? 'smooth'
                : 'auto',

            block:
              'start'
          });
        }
      );
    }
  );

  updateSideNavigation();

  window.addEventListener(
    'scroll',
    updateSideNavigation,
    {
      passive: true
    }
  );

  window.addEventListener(
    'resize',
    updateSideNavigation
  );
})();
