# Mappa del mondo 3D

Globo interattivo della Terra: ruota il pianeta, cerca un paese e vola verso la sua capitale.

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

## Build

```bash
npm run build
npm run preview
```

## Tecnologie

- [Vite](https://vite.dev/) e TypeScript
- [Three.js](https://threejs.org/) per il globo, l’atmosfera e i controlli
- Texture della Terra da [three-globe](https://github.com/vasturiano/three-globe) (immagini derivate da dati NASA di pubblico dominio)
- Bandiere da [flagcdn.com](https://flagcdn.com/)
