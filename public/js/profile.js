(() => {
  'use strict';

  const profileForm =
    document.getElementById(
      'profileForm'
    );

  const passwordForm =
    document.getElementById(
      'passwordForm'
    );

  const profileStatus =
    document.getElementById(
      'profileStatus'
    );

  const passwordStatus =
    document.getElementById(
      'passwordStatus'
    );

  const profileSaveButton =
    document.getElementById(
      'profileSaveButton'
    );

  const passwordSaveButton =
    document.getElementById(
      'passwordSaveButton'
    );

  let currentUser =
    getStoredUser();

  function readStoredJson(
    storage,
    key
  ) {
    try {
      const value =
        storage.getItem(key);

      return value
        ? JSON.parse(value)
        : null;
    } catch (error) {
      storage.removeItem(key);
      return null;
    }
  }

  function getStoredUser() {
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

  function saveStoredUser(user) {
    const sessionUser =
      sessionStorage.getItem(
        'currentUser'
      );

    const localUser =
      localStorage.getItem(
        'currentUser'
      );

    if (sessionUser) {
      sessionStorage.setItem(
        'currentUser',
        JSON.stringify(user)
      );
    }

    if (localUser) {
      localStorage.setItem(
        'currentUser',
        JSON.stringify(user)
      );
    }

    if (
      !sessionUser &&
      !localUser
    ) {
      sessionStorage.setItem(
        'currentUser',
        JSON.stringify(user)
      );
    }
  }

  function getInitials(name) {
    return String(
      name ||
      'Korisnik'
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part
            .charAt(0)
            .toUpperCase()
      )
      .join('') || 'K';
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
        year: 'numeric'
      }
    ).format(
      new Date(value)
    );
  }

  function setStatus(
    element,
    message,
    type = ''
  ) {
    element.classList.remove(
      'success',
      'error'
    );

    if (type) {
      element.classList.add(type);
    }

    element.textContent =
      message;
  }

  async function readJson(
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

  function requestIdentity() {
    return {
      userId:
        currentUser?.id ||
        currentUser?._id ||
        '',

      currentEmail:
        currentUser?.email ||
        ''
    };
  }

  function renderUser(user) {
    currentUser = user;

    document.getElementById(
      'profileAvatar'
    ).textContent =
      getInitials(user.name);

    document.getElementById(
      'profileRole'
    ).textContent =
      user.role === 'admin'
        ? 'Administrator'
        : 'Korisnik';

    document.getElementById(
      'profileDisplayName'
    ).textContent =
      user.name ||
      'Korisnik';

    document.getElementById(
      'profileDisplayEmail'
    ).textContent =
      user.email ||
      '—';

    document.getElementById(
      'profileCreatedAt'
    ).textContent =
      formatDate(
        user.createdAt
      );

    document.getElementById(
      'profileName'
    ).value =
      user.name ||
      '';

    document.getElementById(
      'profileEmail'
    ).value =
      user.email ||
      '';

    document.getElementById(
      'profileCompany'
    ).value =
      user.companyName ||
      '';

    document.getElementById(
      'profilePhone'
    ).value =
      user.phone ||
      '';
  }

  async function loadProfile() {
    if (!currentUser) {
      window.location.href =
        'auth.html';

      return;
    }

    renderUser(currentUser);

    setStatus(
      profileStatus,
      'Učitavanje profila...'
    );

    try {
      const query =
        new URLSearchParams({
          userId:
            currentUser.id ||
            currentUser._id ||
            '',

          email:
            currentUser.email ||
            ''
        });

      const response =
        await fetch(
          `/api/auth/profile?${query.toString()}`
        );

      const result =
        await readJson(
          response
        );

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Profil nije mogao da se učita.'
        );
      }

      renderUser(
        result.user
      );

      saveStoredUser(
        result.user
      );

      setStatus(
        profileStatus,
        ''
      );
    } catch (error) {
      setStatus(
        profileStatus,
        error.message,
        'error'
      );
    }
  }

  profileForm?.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      const payload = {
        ...requestIdentity(),

        name:
          document.getElementById(
            'profileName'
          ).value,

        email:
          document.getElementById(
            'profileEmail'
          ).value,

        companyName:
          document.getElementById(
            'profileCompany'
          ).value,

        phone:
          document.getElementById(
            'profilePhone'
          ).value
      };

      profileSaveButton.disabled =
        true;

      profileSaveButton.textContent =
        'Čuvanje...';

      setStatus(
        profileStatus,
        'Čuvanje profila...'
      );

      try {
        const response =
          await fetch(
            '/api/auth/profile',
            {
              method: 'PATCH',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        const result =
          await readJson(
            response
          );

        if (!response.ok) {
          throw new Error(
            result.message ||
            'Profil nije mogao da se sačuva.'
          );
        }

        renderUser(
          result.user
        );

        saveStoredUser(
          result.user
        );

        setStatus(
          profileStatus,
          result.message,
          'success'
        );
      } catch (error) {
        setStatus(
          profileStatus,
          error.message,
          'error'
        );
      } finally {
        profileSaveButton.disabled =
          false;

        profileSaveButton.textContent =
          'Sačuvaj profil';
      }
    }
  );

  passwordForm?.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      const payload = {
        ...requestIdentity(),

        currentPassword:
          document.getElementById(
            'currentPassword'
          ).value,

        newPassword:
          document.getElementById(
            'newPassword'
          ).value,

        confirmPassword:
          document.getElementById(
            'confirmPassword'
          ).value
      };

      passwordSaveButton.disabled =
        true;

      passwordSaveButton.textContent =
        'Promena...';

      setStatus(
        passwordStatus,
        'Promena lozinke...'
      );

      try {
        const response =
          await fetch(
            '/api/auth/password',
            {
              method: 'PATCH',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );

        const result =
          await readJson(
            response
          );

        if (!response.ok) {
          throw new Error(
            result.message ||
            'Lozinka nije mogla da se promeni.'
          );
        }

        passwordForm.reset();

        setStatus(
          passwordStatus,
          result.message,
          'success'
        );
      } catch (error) {
        setStatus(
          passwordStatus,
          error.message,
          'error'
        );
      } finally {
        passwordSaveButton.disabled =
          false;

        passwordSaveButton.textContent =
          'Promeni lozinku';
      }
    }
  );

  loadProfile();
})();
