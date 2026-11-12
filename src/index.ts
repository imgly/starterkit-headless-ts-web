import { mountDemo } from './demo';
import './style.css';

const cleanup = mountDemo(document.querySelector('main')!);
window.addEventListener('pagehide', (event) => {
  if (!event.persisted) {
    cleanup();
  }
});
