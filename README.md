# Cinematic Agency — Web aplikacija za veb agenciju

Projekat je napravljen prema dokumentaciji za web aplikaciju veb agencije.

Korišćen stack:

- HTML
- CSS
- Bootstrap CDN
- JavaScript
- Node.js
- Express.js
- MongoDB / Mongoose

## Struktura projekta

```txt
veb_agencija_stack/
├── server.js
├── package.json
├── .env.example
├── models/
│   ├── ContactMessage.js
│   └── Order.js
├── routes/
│   ├── contactRoutes.js
│   └── orderRoutes.js
└── public/
    ├── index.html
    ├── css/style.css
    ├── js/main.js
    └── assets/
        ├── hero-scene.png
        ├── value-scene.png
        ├── services-scene.png
        ├── showcase-scene.png
        └── contact-scene.png
```

## Pokretanje

1. Instaliraj dependencies:

```bash
npm install
```

2. Napravi `.env` fajl na osnovu `.env.example`:

```bash
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/veb_agencija
```

3. Pokreni MongoDB lokalno.

4. Pokreni projekat:

```bash
npm run dev
```

ili:

```bash
npm start
```

5. Otvori:

```txt
http://localhost:3000
```

## API rute

### Kontakt forma

```http
POST /api/contact
```

Body:

```json
{
  "name": "Aleksandar",
  "email": "aleksa@example.com",
  "websiteType": "Landing page",
  "message": "Želim moderan sajt."
}
```

### Izbor paketa

```http
POST /api/orders
```

Body:

```json
{
  "packageName": "Paket Pro",
  "clientName": "Aleksandar",
  "email": "aleksa@example.com"
}
```

## Napomena

Sajt koristi statički frontend iz `public` foldera, dok Node.js + Express obrađuju API zahteve i povezuju se sa MongoDB bazom.
