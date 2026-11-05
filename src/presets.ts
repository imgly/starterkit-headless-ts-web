// The editable JavaScript mirrors the documented TypeScript workflow.
export const exportDesignCode = String.raw`async function exportDesign(license) {
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
}`;

/** Editable examples run against the bundled Design Editor marketing template. */
export const presets = [
  {
    title: 'Personalize a campaign',
    description:
      'Turn a template into a personal invitation with text variables.',
    tag: 'Variables',
    code: String.raw`
function configureDesign(engine) {
  const title = engine.block.findByType('text')
    .find(id => engine.block.getString(id, 'text/text')
      .includes('education'));

  engine.block.replaceText(title,
    '{{name}}, let us plan\nyour next\neducation event');
  engine.variable.setString('name', 'Alex');
}
`
      .replace(/\/\/ highlight-headless-configure\n/g, '')
      .trim()
  },
  {
    title: 'Create a photo treatment',
    description: 'Give every image an editorial, black-and-white finish.',
    tag: 'Effects',
    code: String.raw`function configureDesign(engine) {
  const images = engine.block.findByType('graphic')
    .filter(id => engine.block.getType(engine.block.getFill(id))
      .endsWith('/image'));

  for (const image of images) {
    const effect = engine.block.createEffect('adjustments');
    engine.block.setFloat(effect,
      'effect/adjustments/saturation', -1);
    engine.block.appendEffect(image, effect);
  }
}`
  },
  {
    title: 'Add a message',
    description: 'Append a text block to announce an offer or a launch.',
    tag: 'Composition',
    code: String.raw`function configureDesign(engine) {
  const [page] = engine.block.findByType('page');
  const message = engine.block.create('text');
  engine.block.replaceText(message, 'MAKE SOMETHING GREAT.');
  engine.block.setTextFontSize(message, 32);
  engine.block.setTextColor(message,
    { r: 0.12, g: 0.12, b: 0.12, a: 1 });
  engine.block.setWidth(message, 900);
  engine.block.setHeightMode(message, 'Auto');
  engine.block.setPositionX(message, 45);
  engine.block.setPositionY(message, 1160);
  engine.block.appendChild(page, message);
}`
  },
  {
    title: 'Make it your brand',
    description: 'Recolor the graphic fills and outlines with teal accents.',
    tag: 'Brand colors',
    code: String.raw`function configureDesign(engine) {
  const teal = { r: 0.05, g: 0.68, b: 0.58, a: 1 };

  for (const graphic of engine.block.findByType('graphic')) {
    const fill = engine.block.getFill(graphic);
    const type = engine.block.getType(fill);

    if (type.endsWith('/color') && engine.block.isFillEnabled(graphic)) {
      engine.block.setColor(fill, 'fill/color/value', teal);
    }
    if (engine.block.isStrokeEnabled(graphic)) {
      engine.block.setStrokeColor(graphic, teal);
    }
  }
}`
  },
  {
    title: 'Fully custom',
    description:
      'Start with an empty configuration and make the design your own.',
    tag: 'Custom',
    code: String.raw`function configureDesign(engine) {

}`
  }
];
