const pdf = require('pdf-parse/lib/pdf-parse.js');
const fs = require('fs');

const buf = fs.readFileSync('C:/LAB/contratofacil/docs/EasyLaw CDC v2.0 PRO.pdf');
pdf(buf).then(function(data) {
    console.log('=== PAGES:', data.numpages, '===');
    console.log(data.text);
}).catch(function(err) {
    console.error('ERROR:', err.message);
});
