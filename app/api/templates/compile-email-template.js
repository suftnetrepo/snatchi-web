import mjml2html from 'mjml'

const compileEmailTemplate = async (mjmlString) => {
  const { html } = mjml2html(mjmlString);
  return html;
};

export { compileEmailTemplate }
