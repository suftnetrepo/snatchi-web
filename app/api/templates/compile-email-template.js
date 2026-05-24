const compileEmailTemplate = async (mjmlString) => {
  const mjml2html = require('mjml');
  const { html } = mjml2html(mjmlString);
  return html;
};

export { compileEmailTemplate }
