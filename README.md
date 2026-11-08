# Felipe Furlan — CV site

Personal résumé and portfolio site, in Portuguese and English.

**Live:** [felipefurlan.com.br](https://felipefurlan.com.br) · English version at [`/en`](https://felipefurlan.com.br/en/)

## Stack

Static HTML, CSS and vanilla JavaScript — no build step. Hosted on Netlify.

## Running locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000

## Structure

- `index.html` — main page (Portuguese)
- `en/index.html` — English version
- `portfolio-sites.html` — portfolio of websites
- `assets/css/style.css` — styles
- `assets/js/script.js` — interactions and the photo modal
- `Fotos/` — gallery images
- `historia-rabiscada/` — landing, privacy and terms pages for the História Rabiscada YouTube channel

## Landing page (redesign, em andamento)

`site/` holds the new landing-page version of the portfolio (served at `/site/` until it replaces the root). Same content as the CV, with GSAP + ScrollTrigger, Lenis smooth scroll and a small three.js scene, all vendored in `site/vendor/` so there is still no build step. Optimized photos live in `site/img/`.

- `WORLD_URL` and `DCE_URL` at the top of `site/main.js` link the "Ver em 3D" portal and the DCE site card once those exist.
- The project panels in the showcase are CSS mockups; swap them for real screenshots when available.
