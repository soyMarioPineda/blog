# Mi Blog

Blog personal — dark mode, monospace, HTML/CSS puro.
Escribes en Markdown, el script genera el HTML.

---

## Estructura

```
blog/
├── articles/          ← aquí escribes tus .md en VS Code
│   └── primer-articulo.md
├── posts/             ← aquí se generan los HTML (no editar)
│   └── _template.html
├── css/
│   └── style.css
├── index.html         ← página principal (se actualiza sola)
├── about.html         ← edita esto con tu información
├── build.js           ← el compilador
└── package.json
```

---

## Setup inicial (una sola vez)

```bash
# 1. Instala las dependencias
npm install

# 2. Compila los artículos
node build.js
```

---

## Flujo de trabajo diario

### 1. Crea un artículo nuevo

Crea un archivo `.md` en la carpeta `articles/`:

```markdown
---
title: El título de tu artículo
date: 2025-03-16
tags: [economía, matemáticas]
subtitle: Una frase corta que describe el artículo
---

Tu contenido aquí en Markdown normal...
```

### 2. Compila

```bash
node build.js
```

O activa el modo observador para que recompile automáticamente al guardar:

```bash
node build.js watch
```

### 3. Preview local

```bash
npm run dev
```

Abre `http://localhost:8080` en tu navegador.

---

## Despliegue en GitHub Pages

### Primera vez

1. Crea un repo en GitHub (ej. `tu-usuario.github.io` o cualquier nombre)
2. Sube el proyecto:
   ```bash
   git init
   git add .
   git commit -m "init blog"
   git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Source → GitHub Actions**

Cada vez que hagas `git push`, el workflow compila y despliega solo.

### Pushes siguientes

```bash
git add .
git commit -m "nuevo artículo: título"
git push
```

---

## Personalización

| Qué cambiar | Dónde |
|---|---|
| Tu nombre en el header | `index.html`, `about.html`, `posts/_template.html` |
| Tu descripción | `index.html` sección `.home-intro` |
| Sobre ti | `about.html` |
| Email y GitHub | footer de todos los HTML y `_template.html` |
| Colores | `css/style.css` sección `:root` |

---

## Formato de los artículos (.md)

```markdown
---
title: Título del artículo          ← obligatorio
date: 2025-03-16                    ← obligatorio (YYYY-MM-DD)
tags: [tag1, tag2]                  ← opcional
subtitle: Descripción breve         ← opcional
---

## Sección

Párrafo normal con **negrita** e *itálica*.

> Una cita destacada

`código inline` y bloques:

```python
x = 1 + 1
```

- Lista
- de items
```

---

## Dependencias

- `marked` — convierte Markdown a HTML
- `gray-matter` — lee el frontmatter (los `---` al inicio)
- `live-server` — servidor local para preview (opcional)
