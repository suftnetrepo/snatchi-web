const compileEmailTemplate = async (mjmlString) => {
  const mjml2html = require('mjml');
  const { html, errors } = mjml2html(mjmlString, { validationLevel: 'strict' });
  if (errors.length) throw new Error(`Invalid email template: ${errors.map(({ message }) => message).join('; ')}`);
  return html;
};

export { compileEmailTemplate }
