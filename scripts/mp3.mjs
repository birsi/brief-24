// Shared by record.mjs and morse.mjs: mp3 encoding with lamejs (no ffmpeg needed).
// The lamejs package entry is broken in Node ("MPEGMode is not defined"); its all-in-one bundle works when run as a script.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const ctx = vm.createContext({});
vm.runInContext(readFileSync(new URL('../node_modules/lamejs/lame.all.js', import.meta.url), 'utf8') + ';this.lamejs = lamejs;', ctx);
const { Mp3Encoder } = ctx.lamejs;

/** Float samples (-1…1, mono) → mp3 Buffer. */
export function encodeMp3(samples, sampleRate, kbps = 96) {
  const pcm = Int16Array.from(samples, (v) => Math.max(-32768, Math.min(32767, Math.round(v * 32767))));
  const enc = new Mp3Encoder(1, sampleRate, kbps);
  const chunks = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const out = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (out.length) chunks.push(Buffer.from(out));
  }
  chunks.push(Buffer.from(enc.flush()));
  return Buffer.concat(chunks);
}
