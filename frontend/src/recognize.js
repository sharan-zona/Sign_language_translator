// Plug your model / backend in here.
// Called ~every 1.8s while translating. Return { text, confidence } or null.
const DEMO_SIGNS = ["Hello","Thank you","Please","Yes","No","Help","Sorry","Good morning","I love you","Water","Friend","Welcome"];

export async function recognizeFrame(video, mode) {
  if (mode === "demo") {
    return { text: DEMO_SIGNS[Math.floor(Math.random() * DEMO_SIGNS.length)], confidence: 0.6 + Math.random() * 0.39 };
  }
  // LIVE MODE: capture a frame and send it to your model/API, e.g.
  // const c = document.createElement("canvas"); c.width = video.videoWidth; c.height = video.videoHeight;
  // c.getContext("2d").drawImage(video, 0, 0);
  // const blob = await new Promise(r => c.toBlob(r, "image/jpeg"));
  // const res = await fetch("http://localhost:5000/predict", { method: "POST", body: blob });
  // return await res.json();   // { text, confidence }
  return null;
}
