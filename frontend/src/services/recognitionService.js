/**
 * SignBridge Recognition Service
 *
 * Provides a clean interface for video frame extraction and API inference communication.
 * Connects the browser camera feed with the planned Flask computer vision pipeline.
 */

export const DEFAULT_API_URL =
  import.meta.env?.VITE_RECOGNITION_API_URL || 'http://localhost:5000/api/recognize';

export const HEALTH_API_URL =
  import.meta.env?.VITE_HEALTH_API_URL || 'http://localhost:5000/api/health';

/**
 * Capture a frame from an HTMLVideoElement as a base64 or Blob JPEG
 * @param {HTMLVideoElement} videoElement
 * @param {number} quality JPEG quality between 0 and 1
 * @returns {Promise<Blob>}
 */
export async function captureVideoFrameBlob(videoElement, quality = 0.85) {
  if (!videoElement || videoElement.videoWidth === 0) {
    throw new Error('Video stream is not ready for frame capture');
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Unable to create 2D canvas context for frame capture');
  }

  // Draw current frame
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode video frame to blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Sends a captured video frame blob to the Flask backend recognition endpoint.
 *
 * Expected backend contract:
 * POST /api/recognize
 * Multipart FormData: { frame: Blob }
 *
 * Response schema:
 * {
 *   "success": true,
 *   "recognized_text": "Hello",
 *   "confidence": 0.94
 * }
 *
 * @param {Blob} frameBlob
 * @param {string} apiUrl
 * @param {AbortSignal} signal
 * @returns {Promise<{success: boolean, recognized_text?: string, confidence?: number, error?: string}>}
 */
export async function sendFrameForRecognition(frameBlob, apiUrl = DEFAULT_API_URL, signal = null) {
  const formData = new FormData();
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

    // Validate response schema
    if (typeof data !== 'object' || data === null) {
      return {
        success: false,
        error: 'Invalid response format: expected JSON object',
      };
    }

    if (data.success && typeof data.recognized_text === 'string') {
      return {
        success: true,
        recognized_text: data.recognized_text.trim(),
        confidence: typeof data.confidence === 'number' ? data.confidence : 1.0,
      };
    }

    return {
      success: false,
      error: data.error || 'Recognition model was unable to classify gestures in frame',
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Recognition request cancelled' };
    }

    return {
      success: false,
      error: `Recognition model not connected. Backend API at ${apiUrl} is unavailable.`,
    };
  }
}

/**
 * Health check verification for backend Flask service
 * @param {string} healthUrl
 * @returns {Promise<{available: boolean, message: string}>}
 */
export async function checkBackendConnection(healthUrl = HEALTH_API_URL) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return { available: true, message: 'Recognition backend connected' };
    }
    return { available: false, message: `Backend responded with HTTP ${res.status}` };
  } catch {
    return {
      available: false,
      message: 'Recognition model not connected (Backend server offline)',
    };
  }
}
