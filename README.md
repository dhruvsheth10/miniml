# miniml

website for miniml. its a hack club ysws about tinyml, which is basically machine learning that runs on a small microcontroller instead of a computer.

right now this is just the landing page. theres a little whiteboard where you draw a logo and it tries to guess which one it is.

## running it

you need node installed first. then from this folder:

```
npm install
npm run dev
```

open http://localhost:4817

if that doesnt work, check the terminal, next prints the url there.

## notes

the page itself is in src/app/page.tsx. the logo guessing code is in src/lib/logo-model.ts.

theres also scripts/build-logo-data.mjs. that rebuilds the logo outline file from simple-icons. you dont need to run it just to start the site.
