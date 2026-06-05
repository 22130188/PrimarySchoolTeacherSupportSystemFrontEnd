let puterLoadPromise = null;

export function loadPuter() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Browser environment is required'));
  }

  if (window.puter) {
    return Promise.resolve(window.puter);
  }

  if (puterLoadPromise) {
    return puterLoadPromise;
  }

  puterLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-puter-sdk="true"]');
    const script = existing || document.createElement('script');

    const handleLoad = () => {
      if (window.puter) {
        resolve(window.puter);
      } else {
        reject(new Error('Puter.js loaded without window.puter'));
      }
    };

    const handleError = () => {
      puterLoadPromise = null;
      reject(new Error('Failed to load Puter.js'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existing) {
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.dataset.puterSdk = 'true';
      document.body.appendChild(script);
    }
  });

  return puterLoadPromise;
}
