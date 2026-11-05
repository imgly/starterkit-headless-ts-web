import type CreativeEngine from '@cesdk/engine';

export async function configureDesign(engine: CreativeEngine): Promise<void> {
  const source = document.querySelector<HTMLTextAreaElement>('#code')!.value;
  const run = new Function(
    'engine',
    `"use strict"; return (async () => {
${source}
await configureDesign(engine);
})();`
  ) as (engine: CreativeEngine) => Promise<void>;
  await run(engine);
}
