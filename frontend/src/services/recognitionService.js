
/**
 * SignBridge Recognition Service
 *
 * Captures webcam frames and communicates with the Flask recognition API.
 * Passes recognized words, confidence, and hand landmarks to the frontend.
 */

export const DEFAULT_API_URL =
  import.meta.env?.VITE_RECOGNITION_API_URL ||
  'http://localhost:5000/api/recognize';

export const HEALTH_API_URL =
  import.meta.env?.VITE_HEALTH_API_URL ||
  'http://localhost:5000/api/health';

/**
 * Capture a video frame as a JPEG Blob.
 *
 * @param {HTMLVideoElement} videoElement
 * @param {number} quality
 * @returns {Promise<Blob>}
 */
export async function captureVideoFrameBlob(
  videoElement,
  quality = 0.85
) {
  if (!videoElement || videoElement.videoWidth === 0) {
    throw new Error('Video stream is not ready for frame capture');
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Unable to create 2D canvas context');
  }

  ctx.drawImage(
    videoElement,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode webcam frame'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Send one webcam frame to the Flask recognition API.
 *
 * Expected response:
 * {
 *   success: true,
 *   recognized_text: "hello",
 *   confidence: 0.85,
 *   ready: true,
 *   frames_collected: 64,
 *   frames_required: 64,
 *   landmarks: [
 *     [[0.5, 0.4], [0.52, 0.42]]
 *   ]
 * }
 *
 * Landmark coordinates should be normalized between 0 and 1.
 *
 * @param {Blob} frameBlob
 * @param {string} apiUrl
 * @param {AbortSignal|null} signal
 * @returns {Promise<object>}
 */
export async function sendFrameForRecognition(
  frameBlob,
  apiUrl = DEFAULT_API_URL,
  signal = null
) {
  const formData = new FormData();
  formData.append('session_id', 'default');
  formData.append('frame', frameBlob, 'frame.jpg');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      signal: signal || undefined,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Server returned HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      return {
        success: false,
        error: 'Invalid response format: expected JSON object',
      };
    }

    if (
      data.success &&
      typeof data.recognized_text === 'string'
    ) {
      return {
        success: true,
        recognized_text: data.recognized_text.trim(),

        confidence:
          typeof data.confidence === 'number'
            ? data.confidence
            : 0,

        landmarks: Array.isArray(data.landmarks) ? data.landmarks : [],

        ready: data.ready !== false,

        frames_collected:
          data.frames_collected ?? 0,

        frames_required:
          data.frames_required ?? 64,
      };
    }

    return {
      success: false,
      error:
        data.error ||
        'Recognition model was unable to classify gestures',
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'Recognition request cancelled',
      };
    }

    return {
      success: false,
      error: `Recognition backend is unavailable at ${apiUrl}.`,
    };
  }
}

/**
 * Check whether the Flask backend is available.
 *
 * @param {string} healthUrl
 * @returns {Promise<{available: boolean, message: string}>}
 */
export async function checkBackendConnection(
  healthUrl = HEALTH_API_URL
) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    2000
  );

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    if (response.ok) {
      return {
        available: true,
        message: 'Recognition backend connected',
      };
    }

    return {
      available: false,
      message: `Backend responded with HTTP ${response.status}`,
    };
  } catch {
    return {
      available: false,
      message: 'Recognition backend is offline',
    };
  } finally {
    clearTimeout(timeout);
  }
}
export async function resetRecognitionSession(
  apiUrl = DEFAULT_API_URL,
  signal = null
) {
  const resetUrl = apiUrl.replace(/\/recognize\/?$/, '/reset');

  const formData = new FormData();
  formData.append('session_id', 'default');

  const response = await fetch(resetUrl, {
    method: 'POST',
    body: formData,
    signal: signal || undefined,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to reset recognition: HTTP ${response.status}`);
  }

  return response.json();
}
