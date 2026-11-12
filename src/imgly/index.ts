import CreativeEngine from '@cesdk/engine';
import { configureDesign } from './configure-design';


export async function exportDesign(license: string): Promise<Blob> {
  const config = {
    license: license,
    baseURL: '/assets'
  };
  const engine = await CreativeEngine.init(config);
  try {
    await engine.scene.loadFromArchiveURL(
      new URL('designs/marketing-design.imgly', document.baseURI).href
    );
    await configureDesign(engine);
    const [page] = engine.scene.getPages();
    return await engine.block.export(page, { mimeType: 'image/png' });
  } finally {
    engine.dispose();
  }
}
