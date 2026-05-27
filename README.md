# Cinematic Agency — Web aplikacija za veb agenciju

Projekat je napravljen prema projektnoj dokumentaciji za web aplikaciju veb agencije.

Aplikacija predstavlja modernu web platformu za prezentaciju usluga, projekata, paketa i procesa rada jedne veb agencije. Fokus projekta je na cinematic scrollytelling dizajnu, responzivnom frontend sloju i pripremi za backend integraciju.

## Korišćen stack

- HTML
- CSS
- Bootstrap CDN
- JavaScript
- Node.js
- Express.js
- MongoDB / Mongoose

## Implementirane funkcionalnosti

U okviru frontend sloja implementirano je više povezanih stranica:

- Početna strana
- Usluge
- Projekti
- Paketi
- Kako radimo
- Login / Register strana

Implementirane su i sledeće funkcionalnosti:

- Responzivan dizajn
- Navigacija između svih stranica
- Cinematic scrollytelling vizuelni stil
- Scroll animacije
- Reveal animacije elemenata
- Parallax efekat pozadinskih slika
- Glassmorphism kartice i paneli
- Kontakt forma
- Izbor paketa
- Login / Register forma sa animacijom prelaza
- Priprema za backend API rute

## Backend funkcionalnosti

Backend deo je pripremljen pomoću Node.js i Express.js tehnologija.

Trenutno su pripremljene osnovne rute za:

- Slanje kontakt poruka
- Izbor paketa
- Čuvanje podataka u MongoDB bazu

Planirano je dalje proširenje backend-a za:

- Login i registraciju korisnika
- Korisnički dashboard
- Upload dokumentacije
- AI procenu zahteva
- Queue sistem za projekte
- Administratorsko upravljanje sadržajem

## Struktura projekta

```txt
veb_agencija/
├── server.js
├── package.json
├── package-lock.json
├── .env.example
├── README.md
├── models/
│   ├── ContactMessage.js
│   └── Order.js
├── routes/
│   ├── contactRoutes.js
│   └── orderRoutes.js
└── public/
    ├── index.html
    ├── services.html
    ├── projects.html
    ├── pricing.html
    ├── process.html
    ├── auth.html
    ├── css/
    │   ├── style.css
    │   ├── services-style.css
    │   ├── projects-style.css
    │   ├── pricing-style.css
    │   ├── process-style.css
    │   └── auth-style.css
    ├── js/
    │   └── main.js
    └── assets/
        ├── hero-scene.png
        ├── value-scene.png
        ├── services-scene.png
        ├── showcase-scene.png
        ├── contact-scene.png
        ├── projects-hero.png
        ├── projects-list.png
        ├── projects-detail.png
        ├── projects-cta.png
        ├── projects-footer.png
        └── auth-scene.png
