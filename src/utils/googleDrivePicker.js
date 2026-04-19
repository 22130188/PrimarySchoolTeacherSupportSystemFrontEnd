const GOOGLE_API_SCRIPT = 'https://apis.google.com/js/api.js';
const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';

let scriptLoadPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Cannot load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true },
    );
    script.addEventListener('error', () => reject(new Error(`Cannot load ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

async function ensureGooglePickerReady() {
  if (!scriptLoadPromise) {
    scriptLoadPromise = Promise.all([loadScript(GOOGLE_API_SCRIPT), loadScript(GOOGLE_IDENTITY_SCRIPT)])
      .then(
        () =>
          new Promise((resolve) => {
            window.gapi.load('picker', { callback: resolve });
          }),
      );
  }

  return scriptLoadPromise;
}

function mapPickerDoc(doc) {
  const picker = window.google.picker;

  const driveFileId = doc[picker.Document.ID];
  const name = doc[picker.Document.NAME];
  const mimeType = doc[picker.Document.MIME_TYPE];
  const webViewLink = doc[picker.Document.URL];
  const iconLink = doc[picker.Document.ICON_URL];
  const thumbnailLink = doc[picker.Document.THUMBNAILS]?.[0]?.url || '';
  const sizeBytes = doc[picker.Document.SIZE_BYTES] || null;

  return {
    driveFileId,
    driveUrl: webViewLink,
    webViewLink,
    name,
    mimeType,
    iconLink,
    thumbnailLink,
    sizeBytes,
  };
}

function createPicker(accessToken, apiKey, appId, onPicked, onCancel) {
  const picker = window.google.picker;

  const recentView = new picker.DocsView(picker.ViewId.RECENTLY_PICKED)
    .setLabel('Gần đây')
    .setIncludeFolders(true);

  const uploadView = new picker.DocsUploadView().setIncludeFolders(true);

  const myDriveView = new picker.DocsView(picker.ViewId.DOCS)
    .setLabel('Drive của tôi')
    .setIncludeFolders(true)
    .setOwnedByMe(true);

  const starredView = new picker.DocsView(picker.ViewId.STARRED)
    .setLabel('Được gắn dấu sao')
    .setIncludeFolders(true);

  const sharedView = new picker.DocsView(picker.ViewId.SHARED_WITH_ME)
    .setLabel('Được chia sẻ với tôi')
    .setIncludeFolders(true);

  const builder = new picker.PickerBuilder()
    .setLocale('vi')
    .setDeveloperKey(apiKey)
    .setOAuthToken(accessToken)
    .setTitle('Chèn tệp bằng cách sử dụng Google Drive')
    .addView(recentView)
    .addView(uploadView)
    .addView(myDriveView)
    .addView(starredView)
    .addView(sharedView)
    .setCallback((data) => {
      if (data.action === picker.Action.PICKED) {
        const docs = (data.docs || []).map(mapPickerDoc).filter((item) => item.driveUrl);
        onPicked(docs);
        return;
      }

      if (data.action === picker.Action.CANCEL) {
        onCancel?.();
      }
    });

  if (appId) {
    builder.setAppId(appId);
  }

  builder.build().setVisible(true);
}

export async function openGoogleDrivePicker({ apiKey, clientId, appId, onPicked, loginHint }) {
  if (!apiKey) {
    throw new Error('Thiếu VITE_GOOGLE_API_KEY cho Google Picker.');
  }

  if (!clientId) {
    throw new Error('Thiếu VITE_GOOGLE_CLIENT_ID cho Google Picker.');
  }

  await ensureGooglePickerReady();

  return new Promise((resolve, reject) => {
    const normalizedLoginHint = typeof loginHint === 'string' ? loginHint.trim() : '';

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
      ...(normalizedLoginHint ? { hint: normalizedLoginHint } : {}),
      callback: (response) => {
        if (!response?.access_token) {
          reject(new Error('Không lấy được access token từ Google.'));
          return;
        }

        createPicker(
          response.access_token,
          apiKey,
          appId,
          (docs) => {
            onPicked(docs);
            resolve(docs);
          },
          () => {
            resolve([]);
          },
        );
      },
      error_callback: () => reject(new Error('Google OAuth bị từ chối hoặc lỗi.')),
    });

    tokenClient.requestAccessToken({
      prompt: '',
      ...(normalizedLoginHint ? { hint: normalizedLoginHint } : {}),
    });
  });
}
