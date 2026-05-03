#!/usr/bin/env node
/**
 * build.js — Convierte todos los .md en articles/ a HTML en posts/
 * y actualiza el índice en index.html
 *
 * Uso:
 *   node build.js              → convierte todos los artículos
 *   node build.js watch        → modo observador (re-compila al guardar)
 *
 * Requiere: npm install marked gray-matter
 */

const fs   = require('fs');
const path = require('path');

// ── Intenta cargar dependencias ────────────────────────────────
let marked, grayMatter;
try {
  marked     = require('marked').marked;
  grayMatter = require('gray-matter');
} catch {
  console.error('\n  ❌  Dependencias no instaladas. Ejecuta:\n');
  console.error('     npm install marked gray-matter\n');
  process.exit(1);
}

// ── Configuración ──────────────────────────────────────────────
const ARTICLES_DIR = path.join(__dirname, 'articles');
const POSTS_DIR    = path.join(__dirname, 'posts');
const TEMPLATE     = path.join(__dirname, 'posts', '_template.html');
const INDEX        = path.join(__dirname, 'index.html');

// ── Helpers ────────────────────────────────────────────────────
function readingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function slugify(name) {
  return path.basename(name, '.md');
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}

// ── Genera un slug limpio para IDs de heading ─────────────────
function headingSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ── Genera el HTML del índice a partir del contenido .md ───────
function buildTOC(content) {
  const headings = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2) headings.push({ level: 2, text: h2[1].trim() });
    else if (h3) headings.push({ level: 3, text: h3[1].trim() });
  }

  if (headings.length === 0) return '';

  const items = headings.map(h => {
    const id = headingSlug(h.text);
    const indent = h.level === 3 ? ' style="padding-left:1rem;color:var(--text-dim)"' : '';
    return `<li${indent}><a href="#${id}">${h.text}</a></li>`;
  }).join('\n      ');

  return `
<nav class="toc">
  <p class="toc-label">// índice</p>
  <ul>
      ${items}
  </ul>
</nav>`;
}

// ── Inyecta IDs en los headings del HTML generado ─────────────
function injectHeadingIds(html) {
  return html
    .replace(/<h2>(.*?)<\/h2>/g, (_, text) => {
      const id = headingSlug(text.replace(/<[^>]+>/g, ''));
      return `<h2 id="${id}">${text}</h2>`;
    })
    .replace(/<h3>(.*?)<\/h3>/g, (_, text) => {
      const id = headingSlug(text.replace(/<[^>]+>/g, ''));
      return `<h3 id="${id}">${text}</h3>`;
    });
}

// ── Compilar un archivo .md ────────────────────────────────────
function buildArticle(mdFile) {
  const src      = path.join(ARTICLES_DIR, mdFile);
  const slug     = slugify(mdFile);
  const destFile = slug + '.html';
  const dest     = path.join(POSTS_DIR, destFile);

  const raw      = fs.readFileSync(src, 'utf8');
  const { data, content } = grayMatter(raw);

  const title       = data.title       || slug;
  const date        = formatDate(data.date) || '';
  const tags        = (data.tags       || []).join(', ');
  const subtitle    = data.subtitle    || '';
  const description = data.description || subtitle;
  const minRead     = readingTime(content);
  const bodyHtml    = injectHeadingIds(marked(content));
  const tocHtml     = buildTOC(content);

  let tmpl = fs.readFileSync(TEMPLATE, 'utf8');

  tmpl = tmpl
    .replace(/SUBTITULO_ARTICULO/g,    subtitle)
    .replace(/DESCRIPCION_ARTICULO/g,  description)
    .replace(/TITULO_ARTICULO/g,       title)
    .replace(/FECHA_ARTICULO/g,        date)
    .replace(/TIEMPO_LECTURA/g,        minRead)
    .replace(/TAGS_ARTICULO/g,         tags)
    .replace('<!-- TOC_HTML -->',      tocHtml)
    .replace('<!-- CONTENIDO_HTML -->', bodyHtml);

  fs.writeFileSync(dest, tmpl, 'utf8');
  console.log(`  ✓  posts/${destFile}`);

  // ── FIX: se retorna description para que updateIndex lo use ──
  return { slug, title, date, tags: data.tags || [], description };
}

// ── Actualizar el índice con todos los artículos ───────────────
function updateIndex(articles) {
  let html = fs.readFileSync(INDEX, 'utf8');

  // Ordena por fecha (más reciente primero)
  articles.sort((a, b) => (b.date > a.date ? 1 : -1));

  const listHtml = articles.map(a => {
    const tagsHtml = a.tags
      .map(t => `<span class="tag">${t}</span>`)
      .join('\n            ');

    // ── FIX: se renderiza la descripción si existe ────────────
    const descHtml = a.description
      ? `\n          <p class="post-description">${a.description}</p>`
      : '';

    return `
        <li class="post-item">
          <span class="post-date">${a.date}</span>
          <a class="post-title-link" href="posts/${a.slug}.html">${a.title}</a>${descHtml}
          <div class="post-tags">
            ${tagsHtml}
          </div>
        </li>`;
  }).join('\n');

  // Reemplaza el contenido entre los comentarios marcados
  html = html.replace(
    /(<ul class="post-list"[^>]*>)([\s\S]*?)(<\/ul>)/,
    `$1\n${listHtml}\n      $3`
  );

  fs.writeFileSync(INDEX, html, 'utf8');
  console.log('  ✓  index.html actualizado');
}

// ── Build principal ────────────────────────────────────────────
function build() {
  console.log('\n🔨 Compilando artículos...\n');

  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

  const mdFiles = fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.md'));

  if (mdFiles.length === 0) {
    console.log('  (ningún artículo encontrado en articles/)');
    return;
  }

  const articles = mdFiles.map(buildArticle);
  updateIndex(articles);

  console.log(`\n✅ Listo — ${articles.length} artículo(s) compilado(s)\n`);
}

// ── Modo watch ─────────────────────────────────────────────────
function watch() {
  build();
  console.log('👁  Observando cambios en articles/ ...\n');
  fs.watch(ARTICLES_DIR, (event, filename) => {
    if (filename && filename.endsWith('.md')) {
      console.log(`↻  ${filename} cambió — recompilando...`);
      try { build(); } catch (e) { console.error(e.message); }
    }
  });
}

// ── Entry point ────────────────────────────────────────────────
if (process.argv[2] === 'watch') {
  watch();
} else {
  build();
}