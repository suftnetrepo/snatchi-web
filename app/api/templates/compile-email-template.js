const compileEmailTemplate = async (mjmlString) => {
  const mjml2html = require('mjml');
  const { html } = await mjml2html(mjmlString);
  return html;
};

export { compileEmailTemplate }
