const handlebars = require('handlebars');
const mjml2html = require('mjml');
const fs = require('fs');
const path = require('path');

exports.compileEmailTemplate = async ({ fileName, data }) => {
  const mjMail = await fs.promises.readFile(
    path.join('pages/api/templates', fileName),
    'utf8',
  );
  const template = mjml2html(mjMail).html;
  return handlebars.compile(template)(data).toString();
};
