async function fetchArrayBufferWithProgress(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const total = Number(res.headers.get("Content-Length")) || 0;

  if (!res.body) {
    const ab = await res.arrayBuffer();
    onProgress?.(ab.byteLength, ab.byteLength);
    return ab;
  }

  const reader = res.body.getReader();
  const chunks = [];
  let recvd = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    recvd += value.byteLength;
    onProgress?.(recvd, total);
  }

  const merged = new Uint8Array(recvd);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return merged.buffer;
}

export default class SamplerEngine {
  constructor(audioCtx, callbacks = {}) {
    this.audioCtx = audioCtx;
    this.callbacks = callbacks;
    this.samples = new Array(16).fill(null);
    this.names = new Array(16).fill("");
    this.buffers = new Array(16).fill(null);
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.audioCtx.destination);

    this.activeSources = new Set(); 

  }

  stopAll() {
    for (const s of this.activeSources) {
      try { s.stop(); } catch {}
    }
    this.activeSources.clear();
  }
  updateSamples(urls, names) {
    const N = 16;
    this.samples = new Array(N).fill(null);
    this.names = new Array(N).fill("");
    this.buffers = new Array(N).fill(null);

    for (let i = 0; i < Math.min(N, urls.length); i++) {
      this.samples[i] = urls[i];
      this.names[i] = (names && names[i]) ? names[i] : `Sound ${i + 1}`;
    }
  }

  getSlots() {
    return this.samples.map((url, i) => ({
      url,
      name: this.names[i] || "",
      empty: !url
    }));
  }

  async loadAllParallel() {
    const jobs = this.samples
      .map((url, i) => ({ url, i }))
      .filter(x => !!x.url)
      .map(x => this.loadSample(x.url, x.i));

    await Promise.all(jobs);
  }

  async loadSample(url, index) {
    try {
      this.callbacks.onStatus?.(index, { phase: "loading", message: "Chargement..." });

      const arrayBuffer = await fetchArrayBufferWithProgress(url, (recvd, total) => {
        this.callbacks.onProgress?.(index, recvd, total);
      });

      this.buffers[index] = await this.audioCtx.decodeAudioData(arrayBuffer);

      this.callbacks.onProgress?.(index, 1, 1);
      this.callbacks.onStatus?.(index, { phase: "ready", message: "Prêt" });
    } catch (err) {
      console.error(err);
      this.callbacks.onStatus?.(index, { phase: "error", message: err.message });
    }
  }

  async play(index) {
    const buffer = this.buffers[index];
    if (!buffer) return;

    if (this.audioCtx.state === "suspended") await this.audioCtx.resume();

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    console.log("[ENGINE] play() connect -> masterGain =", this.masterGain.gain.value);
    source.start();

    this.callbacks.onPlay?.(index);
  }

  async playSegment(index, startSec, endSec) {
    const buffer = this.buffers[index];
    if (!buffer) return;

    if (this.audioCtx.state === "suspended") await this.audioCtx.resume();

    const start = Math.max(0, startSec || 0);
    const end = Math.min(buffer.duration, endSec ?? buffer.duration);
    const dur = Math.max(0.001, end - start);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    console.log("[ENGINE] play() connect -> masterGain =", this.masterGain.gain.value);
    source.start(0, start, dur);
    this.activeSources.add(source);
    source.onended = () => this.activeSources.delete(source);

    this.callbacks.onPlay?.(index);
  }
}
