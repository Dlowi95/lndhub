import fs from 'node:fs';
import * as acorn from '../frontend/node_modules/acorn/dist/acorn.mjs';

const inputPath = process.argv[2] || 'tadhub-page.tmp';
const outputPath = process.argv[3] || '';
const source = fs.readFileSync(inputPath, 'utf8');
const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'script' });

function staticValue(node) {
  if (!node) return null;
  if (node.type === 'Literal') return node.value;
  if (node.type === 'ArrayExpression') return node.elements.map(staticValue);
  if (node.type === 'ObjectExpression') {
    return Object.fromEntries(node.properties.map((property) => {
      if (property.type !== 'Property' || property.kind !== 'init' || property.computed) throw new Error('Unsupported object property');
      const key = property.key.type === 'Identifier' ? property.key.name : String(property.key.value);
      return [key, staticValue(property.value)];
    }));
  }
  if (node.type === 'UnaryExpression') {
    const value = staticValue(node.argument);
    if (node.operator === '!') return !value;
    if (node.operator === '-') return -Number(value);
    if (node.operator === '+') return Number(value);
  }
  if (node.type === 'Identifier' && node.name === 'undefined') return undefined;
  throw new Error(`Unsupported static node: ${node.type}`);
}

const candidates = [];
const labels = new Set();
function visit(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'Literal' && typeof node.value === 'string' && node.value.length <= 120 && /ChatGPT|Gemini|Claude|Grok|YouTube|Netflix|VPN|Spotify|Adobe|Office|CapCut|Canva|Leonardo|Windows/i.test(node.value)) labels.add(node.value);
  if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.init?.type === 'ArrayExpression') {
    try {
      const value = staticValue(node.init);
      if (value.length && value.every((item) => item && typeof item === 'object' && !Array.isArray(item))) {
        candidates.push({ name: node.id.name, value });
      }
    } catch {}
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'start' || key === 'end') continue;
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') visit(value);
  }
}
visit(ast);

const products = candidates.find(({ value }) => value.length >= 20 && value.every((item) => 'categoryId' in item && 'name' in item && 'price' in item));
const categories = candidates.find(({ value }) => value.length >= 5 && value.length <= 30 && value.every((item) => 'id' in item && 'name' in item) && value.every((item) => !('categoryId' in item)));

if (!products) {
  console.error(JSON.stringify({ candidates: candidates.map(({ name, value }) => ({ name, length: value.length, keys: Object.keys(value[0] || {}) })) }, null, 2));
  throw new Error('Could not identify product catalog array');
}

const summary = {
  source: inputPath,
  extractedAt: new Date().toISOString(),
  productVariable: products.name,
  productCount: products.value.length,
  categoryVariable: categories?.name || null,
  categoryCount: categories?.value.length || 0,
  candidateArrays: candidates.map(({ name, value }) => ({ name, length: value.length, keys: Object.keys(value[0] || {}) })),
  labels: [...labels],
  categories: categories?.value || [],
  products: products.value,
};
const json = JSON.stringify(summary, null, 2);
if (outputPath) {
  fs.writeFileSync(outputPath, `${json}\n`, 'utf8');
  console.log(JSON.stringify({ outputPath, productCount: summary.productCount, categoryCount: summary.categoryCount }));
} else {
  console.log(json);
}
