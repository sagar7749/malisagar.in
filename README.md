# Sagar Mali — portfolio

Personal portfolio site: <https://malisagar-in.vercel.app/>

A single static page (HTML, CSS and plain JavaScript, no build step) with a dark space theme:
an animated starfield, flip cards for services, alternating project panels, an experience
timeline and a contact form.

## Structure

```
index.html            all page content (edit text, projects and links here)
resume.html           the resume page; also the source of the PDF
Sagar-Mali-Resume.pdf A4 PDF printed from resume.html
css/site.css          styles; colours and fonts are variables at the top
css/resume.css        resume page and its print (PDF) layout
js/site.js            2D starfield, mobile menu, contact dialog, scroll effects
js/starfield-3d.js    desktop-only three.js starfield (replaces the 2D one when it can)
img/avatar.webp       hero portrait (illustration with a transparent background)
img/portrait.webp     photo used in the page's structured data for search engines
img/logo.svg          logo shown in the header
img/work/             project covers (16:10; 1440x900 works well)
img/og-image.jpg      social share preview (1200x630)
img/favicon.svg       site icon: the logo on a dark tile (favicon.png and apple-touch-icon.png are made from it)
robots.txt, sitemap.xml
siyaramoverseas/      a separate site, not part of the portfolio
```

## Preview locally

Serve the folder with any static server, for example:

```bash
npx serve .
```

## Editing

- **Projects:** each project is an `<article class="project">` in `index.html`. Add
  `project--right` to alternate the layout. To use a real screenshot instead of an
  illustration, put a 16:10 image in `img/work/` and change the `<img>` path.
- **Resume:** edit `resume.html`, then rebuild the PDF. Either open the page in Chrome,
  press Ctrl+P, choose "Save as PDF" with headers and footers turned off and save it as
  `Sagar-Mali-Resume.pdf`, or run Chrome headless against your local preview:

  ```bash
  chrome --headless=new --no-pdf-header-footer --print-to-pdf=Sagar-Mali-Resume.pdf http://localhost:3000/resume.html
  ```

  The print layout (A4, margins, font sizes) is at the bottom of `css/resume.css`.
- **Contact form:** it opens the visitor's email app with the message filled in (`mailto:`),
  so it works without a server. To receive messages directly, connect a form service such
  as Formspree or Web3Forms and point the form's `action` at it.
- **3D starfield:** on desktops with WebGL 2, `js/starfield-3d.js` loads three.js (pinned
  to 0.170.0 on jsDelivr, about 170 KB compressed) after the page has loaded, then fades
  from the 2D canvas to a 3D field that follows the mouse and moves as you scroll. Phones,
  tablets, Save-Data and "reduce motion" keep the 2D canvas and never download three.js.
  If the CDN is blocked or WebGL fails, the 2D canvas stays. To self-host three.js, save
  `three.module.min.js` into `js/vendor/` and change `THREE_URL` at the top of the file.
- **Motion:** the starfield, scroll effects and marquee switch off for visitors who have
  "reduce motion" turned on.

## Deploy

The site is static, so Vercel serves it as is: push to `main` and Vercel redeploys.
