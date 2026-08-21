# Mappa del mondo 3D

Globo interattivo della Terra: ruota il pianeta, cerca un paese e vola verso la sua capitale.

**Usala subito:** [https://olly-2014.github.io/Mappa-del-mondo/](https://olly-2014.github.io/Mappa-del-mondo/)

## Cosa puoi fare

- Esplorare la Terra in 3D con texture satellitari, nuvole e terminatore giorno/notte
- Cercare un paese o una capitale
- Filtrare i segnalini per continente
- Toccare un punto luminoso per aprire la scheda del paese
- Attivare o disattivare rotazione automatica, nuvole e luci notturne

L’interfaccia è in italiano e funziona anche da telefono.

## Avvio in locale

```bash
npm install
npm run dev
```

Poi apri l’indirizzo mostrato da Vite (di solito `http://localhost:5173`).

## Build e pubblicazione su GitHub Pages

```bash
npm run publish:pages
```

Il comando genera il sito statico e lo copia nella root del repository, che è la cartella servita da GitHub Pages.

## Tecnologie

- [Vite](https://vite.dev/) e TypeScript
- [Three.js](https://threejs.org/) per il globo, l’atmosfera e i controlli
- Texture della Terra da [three-globe](https://github.com/vasturiano/three-globe) (immagini derivate da dati NASA di pubblico dominio)
- Bandiere da [flagcdn.com](https://flagcdn.com/)
