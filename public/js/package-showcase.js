(() => {
  const CART_STORAGE_KEY = 'cinematicCart';
  const PENDING_PACKAGE_KEY = 'pendingCartPackage';
  const MAX_QUANTITY = 10;

  function readStoredJson(storage, key) {
    try {
      const value = storage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      storage.removeItem(key);
      return null;
    }
  }

  function getCurrentUser() {
    return (
      readStoredJson(sessionStorage, 'currentUser') ||
      readStoredJson(localStorage, 'currentUser')
    );
  }

  function getCartItems() {
    const cart = readStoredJson(localStorage, CART_STORAGE_KEY);
    return Array.isArray(cart) ? cart : [];
  }

  function saveCartItems(items) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cinematic-cart-updated'));
  }

  function formatPrice(value) {
    return `${new Intl.NumberFormat('sr-RS').format(Number(value) || 0)} €`;
  }

  function initSmoothPackageExperience() {
    const revealElements = document.querySelectorAll('[data-package-reveal]');
    const progressBar = document.querySelector('.package-scroll-progress span');
    const visual = document.querySelector('[data-package-visual]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if ('IntersectionObserver' in window && !reduceMotion) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.14, rootMargin: '0px 0px -70px 0px' }
      );

      revealElements.forEach((element) => observer.observe(element));
    } else {
      revealElements.forEach((element) => element.classList.add('is-visible'));
    }

    let frameRequested = false;

    function updateScrollEffects() {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollable) * 100)) : 0;

      if (progressBar) progressBar.style.width = `${progress}%`;

      if (visual && !reduceMotion && window.innerWidth > 991) {
        const rect = visual.getBoundingClientRect();
        const offset = Math.max(-18, Math.min(18, (window.innerHeight * 0.5 - rect.top) * 0.022));
        visual.style.transform = `translate3d(0, ${offset}px, 0)`;
      }

      frameRequested = false;
    }

    function requestScrollUpdate() {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(updateScrollEffects);
    }

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate);
    updateScrollEffects();
  }

  function initPackageConfigurator() {
    const body = document.body;
    const configurator = document.querySelector('[data-package-configurator]');
    if (!configurator) return;

    const packageInfo = {
      id: body.dataset.packageId,
      name: body.dataset.packageName,
      packageName: body.dataset.packageLabel,
      basePrice: Number(body.dataset.packageBasePrice) || 0,
      page: body.dataset.packagePage,
      image: body.dataset.packageImage,
      description: body.dataset.packageDescription,
      baseConfigText: body.dataset.baseConfigText || 'Trenutno koristiš osnovnu konfiguraciju.'
    };

    const optionRows = [...configurator.querySelectorAll('[data-package-option]')];
    const unitPriceElement = configurator.querySelector('[data-package-unit-price]');
    const changesPriceElement = configurator.querySelector('[data-package-changes-price]');
    const changesTextElement = configurator.querySelector('[data-package-changes-text]');
    const totalPriceElement = configurator.querySelector('[data-package-total-price]');
    const quantityValueElement = configurator.querySelector('[data-package-quantity-value]');
    const quantityDecreaseButton = configurator.querySelector('[data-package-quantity-decrease]');
    const quantityIncreaseButton = configurator.querySelector('[data-package-quantity-increase]');
    const addToCartButton = configurator.querySelector('[data-add-package]');
    const payNowButton = configurator.querySelector('[data-pay-package]');
    const cartStatus = configurator.querySelector('[data-package-cart-status]');

    const state = {
      quantity: 1,
      values: {}
    };

    optionRows.forEach((row) => {
      const key = row.dataset.optionKey;
      state.values[key] = Number(row.dataset.baseValue) || 0;
    });

    const existingItem = getCartItems().find((item) => item.id === packageInfo.id);
    if (existingItem) {
      state.quantity = Math.min(MAX_QUANTITY, Math.max(1, Number(existingItem.quantity) || 1));

      if (Array.isArray(existingItem.options)) {
        existingItem.options.forEach((option) => {
          if (Object.prototype.hasOwnProperty.call(state.values, option.key)) {
            state.values[option.key] = Number(option.value) || state.values[option.key];
          }
        });
      }
    }

    function buildOptions() {
      return optionRows.map((row) => {
        const key = row.dataset.optionKey;
        const label = row.dataset.optionLabel || key;
        const baseValue = Number(row.dataset.baseValue) || 0;
        const min = Number(row.dataset.min) || baseValue;
        const max = Number(row.dataset.max) || baseValue;
        const value = Math.min(max, Math.max(min, Number(state.values[key]) || baseValue));
        const unitPrice = Number(row.dataset.unitPrice) || 0;
        const extraQuantity = Math.max(0, value - baseValue);
        const extraTotal = extraQuantity * unitPrice;

        return {
          key,
          label,
          value,
          baseValue,
          included: baseValue,
          extraQuantity,
          unitPrice,
          extraTotal
        };
      });
    }

    function calculateConfiguration() {
      const options = buildOptions();
      const extrasTotal = options.reduce((sum, option) => sum + option.extraTotal, 0);
      const unitPrice = packageInfo.basePrice + extrasTotal;
      const total = unitPrice * state.quantity;
      return { options, extrasTotal, unitPrice, total };
    }

    function setStatus(message, type = '') {
      if (!cartStatus) return;
      cartStatus.className = `package-cart-status ${type}`.trim();
      cartStatus.textContent = message;
    }

    function render() {
      const calculation = calculateConfiguration();

      optionRows.forEach((row) => {
        const key = row.dataset.optionKey;
        const option = calculation.options.find((entry) => entry.key === key);
        const valueElement = row.querySelector('[data-option-value]');
        const priceElement = row.querySelector('[data-option-price]');
        const decreaseButton = row.querySelector('[data-option-decrease]');
        const increaseButton = row.querySelector('[data-option-increase]');
        const min = Number(row.dataset.min);
        const max = Number(row.dataset.max);

        if (valueElement) valueElement.textContent = String(option.value);
        if (priceElement) {
          priceElement.textContent = option.extraTotal
            ? `+ ${formatPrice(option.extraTotal)}`
            : 'Uključeno';
          priceElement.classList.toggle('has-extra', option.extraTotal > 0);
        }

        if (decreaseButton) decreaseButton.disabled = option.value <= min;
        if (increaseButton) increaseButton.disabled = option.value >= max;
      });

      if (unitPriceElement) unitPriceElement.textContent = formatPrice(calculation.unitPrice);
      if (changesPriceElement) changesPriceElement.textContent = formatPrice(calculation.extrasTotal);
      if (totalPriceElement) totalPriceElement.textContent = formatPrice(calculation.total);
      if (quantityValueElement) quantityValueElement.textContent = String(state.quantity);

      if (quantityDecreaseButton) quantityDecreaseButton.disabled = state.quantity <= 1;
      if (quantityIncreaseButton) quantityIncreaseButton.disabled = state.quantity >= MAX_QUANTITY;

      const changedOptions = calculation.options.filter((option) => option.extraQuantity > 0);
      if (changesTextElement) {
        changesTextElement.textContent = changedOptions.length
          ? changedOptions.map((option) => `${option.label}: +${option.extraQuantity}`).join(' · ')
          : packageInfo.baseConfigText;
      }

      setStatus('');
    }

    optionRows.forEach((row) => {
      const key = row.dataset.optionKey;
      const min = Number(row.dataset.min);
      const max = Number(row.dataset.max);

      row.querySelector('[data-option-decrease]')?.addEventListener('click', () => {
        state.values[key] = Math.max(min, Number(state.values[key]) - 1);
        render();
      });

      row.querySelector('[data-option-increase]')?.addEventListener('click', () => {
        state.values[key] = Math.min(max, Number(state.values[key]) + 1);
        render();
      });
    });

    quantityDecreaseButton?.addEventListener('click', () => {
      state.quantity = Math.max(1, state.quantity - 1);
      render();
    });

    quantityIncreaseButton?.addEventListener('click', () => {
      state.quantity = Math.min(MAX_QUANTITY, state.quantity + 1);
      render();
    });


    function buildConfiguredItem() {
      const calculation = calculateConfiguration();

      return {
        ...packageInfo,
        unitPrice: calculation.unitPrice,
        price: calculation.unitPrice,
        quantity: state.quantity,
        options: calculation.options,
        configurationUpdatedAt: new Date().toISOString()
      };
    }

    function saveConfiguredItemToCart(item) {
      const cart = getCartItems();
      const existingIndex = cart.findIndex((entry) => entry.id === item.id);

      if (existingIndex === -1) {
        cart.push({
          ...item,
          addedAt: new Date().toISOString()
        });
      } else {
        cart[existingIndex] = {
          ...cart[existingIndex],
          ...item,
          updatedAt: new Date().toISOString()
        };
      }

      saveCartItems(cart);
    }

    function handlePackageAction(checkoutImmediately) {
      const item = buildConfiguredItem();

      localStorage.setItem('selectedPackage', item.packageName);

      if (!getCurrentUser()) {
        localStorage.setItem(PENDING_PACKAGE_KEY, JSON.stringify(item));
        localStorage.setItem(
          'checkoutAfterAuth',
          checkoutImmediately ? '1' : '0'
        );

        setStatus(
          checkoutImmediately
            ? 'Prvo se prijavi. Posle prijave automatski otvaramo plaćanje.'
            : 'Prvo se prijavi da bismo sačuvali konfiguraciju.',
          'info'
        );

        window.setTimeout(() => {
          window.location.href = 'auth.html';
        }, 450);

        return;
      }

      saveConfiguredItemToCart(item);

      if (checkoutImmediately) {
        payNowButton.disabled = true;
        setStatus('Konfiguracija je sačuvana. Otvaranje PayPal plaćanja...', 'success');

        window.setTimeout(() => {
          window.location.href = 'cart.html?checkout=1';
        }, 350);

        return;
      }

      setStatus(`${packageInfo.name} konfiguracija je sačuvana u korpi.`, 'success');
      addToCartButton.classList.add('is-added');

      const label = addToCartButton.querySelector('span');
      if (label) label.textContent = 'Konfiguracija je u korpi';

      window.setTimeout(() => {
        window.location.href = 'cart.html';
      }, 500);
    }

    addToCartButton?.addEventListener('click', () => {
      handlePackageAction(false);
    });

    payNowButton?.addEventListener('click', () => {
      handlePackageAction(true);
    });

    render();
  }

  initSmoothPackageExperience();
  initPackageConfigurator();
})();
