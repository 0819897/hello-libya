import '@testing-library/jest-dom/vitest';

if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = () => Promise.reject(new Error('no audio in test'));
  HTMLMediaElement.prototype.pause = () => {};
}
