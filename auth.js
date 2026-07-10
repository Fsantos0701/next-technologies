window.AuthForm = {
  init({ formId, errorId, endpoint, onSuccess }) {
    const form = document.getElementById(formId);
    const errorEl = document.getElementById(errorId);
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';

      const data = Object.fromEntries(new FormData(form).entries());
      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'Enviando...';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const body = await res.json();

        if (!res.ok) {
          errorEl.textContent = body.error || 'Algo deu errado. Tente novamente.';
          return;
        }
        onSuccess(body);
      } catch (err) {
        errorEl.textContent = 'Não foi possível conectar ao servidor.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });
  },
};
