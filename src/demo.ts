import { highlightCode } from './highlight-code';
import { runDesign } from './imgly/run-design';
import { presets, exportDesignCode } from './presets';

/** Mount the playground and keep its exported preview in sync with the source. */
export function mountDemo(root: HTMLElement) {
  const config = { license: 'YOUR_LICENSE_KEY' };
  let demoExportCode = exportDesignCode;
  root.innerHTML = `
    <div class="headless-demo">
      <section class="workspace" aria-label="Headless Design Engine playground">
        <aside class="applications" aria-label="Applications">
          <div class="panel-heading"><span class="step">01</span><h2>Choose an application</h2></div>
          <div class="preset-list"></div>
        </aside>
        <section class="code-panel" aria-label="JavaScript configuration">
          <div class="panel-heading"><span class="step">02</span><h2>Make it yours</h2><button class="text-button" id="reset" type="button">Reset code</button></div>
          <div class="code-toolbar"><span>exportDesign.js</span><span class="language">JavaScript</span></div>
          <div class="code-editor">
            <pre id="code-highlight" aria-hidden="true"></pre>
            <label class="sr-only" for="code">JavaScript configuration</label>
            <textarea id="code" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off"></textarea>
          </div>
          <div class="code-footer"><span class="runtime-dot" aria-hidden="true"></span>Runs in your browser · Preview updates automatically</div>
        </section>
        <section class="result-panel" aria-label="Exported result">
          <div class="panel-heading"><span class="step">03</span><h2>See the result</h2><span class="format-label">PNG</span></div>
          <div class="result-stage">
            <div id="placeholder"><span aria-hidden="true">↗</span><h3>Creating your preview</h3><p>Your code runs automatically.<br />The exported design will appear here.</p></div>
            <img id="result" alt="Exported design" hidden />
          </div>
          <p class="sr-only" id="status" role="status" aria-live="polite">Ready when you are. Choose an application or edit the code.</p>
          <div class="error-panel" data-error="false" data-expanded="false">
            <pre id="error-message" role="alert" hidden></pre>
            <button id="error-toggle" type="button" aria-label="Expand error" aria-controls="error-message" aria-expanded="false" hidden><span aria-hidden="true">⌃</span></button>
          </div>
        </section>
      </section>
    </div>`;

  const highlighted = root.querySelector<HTMLPreElement>('#code-highlight')!;
  const code = root.querySelector<HTMLTextAreaElement>('#code')!;
  const reset = root.querySelector<HTMLButtonElement>('#reset')!;
  const result = root.querySelector<HTMLImageElement>('#result')!;
  const placeholder = root.querySelector<HTMLElement>('#placeholder')!;
  const status = root.querySelector<HTMLElement>('#status')!;
  const message = root.querySelector<HTMLElement>('#error-message')!;
  const errorPanel = root.querySelector<HTMLElement>('.error-panel')!;
  const errorToggle = root.querySelector<HTMLButtonElement>('#error-toggle')!;
  const list = root.querySelector<HTMLElement>('.preset-list')!;
  let selected = 0;
  let outputUrl: string | undefined;
  let busy = false;
  let disposed = false;
  let revision = 0;
  let pending = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let errorExpanded = false;
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const choices = presets.map((preset, index) => {
    const choice = document.createElement('button');
    choice.type = 'button';
    choice.className = 'preset';
    // Preset markup is authored here; editable source is assigned through .value.
    choice.innerHTML = `<span class="preset-top"><span class="preset-number">0${index + 1}</span><span class="preset-tag">${preset.tag}</span></span><strong>${preset.title}</strong><span class="preset-description">${preset.description}</span>`;
    choice.addEventListener('click', () => select(index), options);
    list.append(choice);
    return choice;
  });

  function syncHighlight() {
    highlighted.scrollTop = code.scrollTop;
    highlighted.scrollLeft = code.scrollLeft;
  }

  function markChanged(delay = 400) {
    highlighted.innerHTML = highlightCode(code.value) + '\n';
    syncHighlight();
    requestExport(delay);
  }

  function select(index: number) {
    selected = index;
    code.value = demoExportCode + '\n\n' + presets[index].code;
    choices.forEach((choice, choiceIndex) => {
      choice.setAttribute('aria-pressed', String(choiceIndex === selected));
    });
    markChanged(0);
  }

  function releasePreview() {
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      outputUrl = undefined;
    }
    result.removeAttribute('src');
    result.hidden = true;
    placeholder.hidden = false;
  }

  function setErrorExpanded(expanded: boolean) {
    errorExpanded = expanded;
    errorPanel.setAttribute('data-expanded', String(expanded));
    errorToggle.setAttribute('aria-expanded', String(expanded));
    errorToggle.setAttribute(
      'aria-label',
      expanded ? 'Collapse error' : 'Expand error'
    );
  }

  function showError(text = '') {
    setErrorExpanded(false);
    message.textContent = text;
    message.hidden = text.length === 0;
    errorPanel.setAttribute('data-error', String(!message.hidden));
    errorToggle.hidden =
      message.hidden ||
      (!/[\r\n]/.test(text) && message.scrollWidth <= message.clientWidth);
  }

  function requestExport(delay = 0) {
    revision++;
    pending = true;
    clearTimeout(timer);
    timer = undefined;
    showError();
    status.textContent = 'Updating the preview…';
    if (delay > 0) {
      timer = setTimeout(() => {
        timer = undefined;
        void onExport();
      }, delay);
    } else {
      void onExport();
    }
  }

  async function onExport() {
    if (busy) {
      return;
    }
    pending = false;
    busy = true;
    const exportingRevision = revision;
    status.textContent =
      'Loading the design, running your code, and exporting…';
    try {
      window.headlessExport = runDesign(code.value, config.license);
      const png = await window.headlessExport;
      if (disposed || exportingRevision !== revision) {
        return;
      }
      releasePreview();
      outputUrl = URL.createObjectURL(png);
      result.src = outputUrl;
      result.hidden = false;
      placeholder.hidden = true;
      status.textContent = 'Export complete. Your preview is up to date.';
    } catch (error) {
      if (!disposed && exportingRevision === revision) {
        showError(error instanceof Error ? error.message : String(error));
        placeholder.hidden = true;
        status.textContent = 'Export failed. Edit your code and try again.';
      }
    } finally {
      busy = false;
      if (!disposed) {
        // Await the active run's cleanup before starting the newest pending source.
        if (pending && timer === undefined) {
          void onExport();
        }
      }
    }
  }

  select(0);
  reset.addEventListener('click', () => select(selected), options);
  code.addEventListener('input', () => markChanged(), options);
  code.addEventListener('scroll', syncHighlight, options);
  errorToggle.addEventListener(
    'click',
    () => setErrorExpanded(!errorExpanded),
    options
  );
  return () => {
    disposed = true;
    clearTimeout(timer);
    listeners.abort();
    showError();
    releasePreview();
  };
}

declare global {
  interface Window {
    headlessExport?: Promise<Blob>;
  }
}
