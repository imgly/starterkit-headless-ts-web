import CreativeEngine from '@cesdk/engine';

export async function runDesign(
  source: string,
  license: string
): Promise<Blob> {
  const run = new Function(
    'CreativeEngine',
    'license',
    `"use strict";
${source}
return exportDesign(license);`
  ) as (engineClass: typeof CreativeEngine, license: string) => Promise<Blob>;
  return await run(CreativeEngine, license);
}
