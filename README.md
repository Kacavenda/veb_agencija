# Web Design Agency — Full-stack web aplikacija

Web Design Agency je full-stack web aplikacija namenjena predstavljanju usluga web agencije, izboru i konfigurisanju paketa, elektronskom plaćanju, upravljanju projektima i komunikaciji između klijenta i administratora.

Aplikacija omogućava korisniku da se upozna sa ponudom agencije, registruje nalog, izabere paket, prilagodi njegovu konfiguraciju, izvrši testno plaćanje i nakon kupovine dobije pristup korisničkom portalu za praćenje projekta.

Administrator kroz poseban panel upravlja korisnicima, projektima, kupovinama, materijalima, fajlovima, porukama i statusima realizacije.

---

## Tehnološki stack

### Frontend

* HTML5
* CSS3
* Bootstrap 5 CDN
* JavaScript
* Responsive design
* Glassmorphism UI
* Scroll i reveal animacije

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* bcryptjs
* Multer
* dotenv
* CORS

### Integracije

* PayPal Sandbox
* MongoDB Atlas
* Google Fonts
* Bootstrap CDN

---

## Korisničke uloge

Aplikacija podržava dve osnovne korisničke uloge:

### Klijent

Klijent može da:

* registruje nalog
* prijavi se u aplikaciju
* uređuje profil
* promeni lozinku
* pregleda usluge i projekte
* izabere paket
* prilagodi konfiguraciju paketa
* doda paket u korpu
* izvrši PayPal Sandbox plaćanje
* pregleda istoriju kupovina
* prati svoje projekte
* dostavi informacije i materijale
* otpremi projektne fajlove
* komunicira sa administratorom

### Administrator

Administrator može da:

* pristupi administratorskom panelu
* pregleda registrovane korisnike
* pregleda projekte
* pregleda kupovine i plaćanja
* menja statuse projekata
* pregleda konfiguracije paketa
* pregleda materijale klijenata
* pregleda, preuzima i briše projektne fajlove
* komunicira sa klijentima
* pregleda kontakt upite
* pregleda projektne poruke
* označi poruke kao odgovorene

---

## Javne stranice

Aplikacija sadrži sledeće glavne javne stranice:

* Početna
* Usluge
* Projekti
* Paketi
* Kako radimo
* Login / Register

Sve stranice koriste jedinstven vizuelni identitet Web Design Agency platforme.

Dizajn uključuje:

* tamnu japansku temu
* sakura motive
* noćne pejzaže
* pagode, portale i kristalne elemente
* glassmorphism kartice
* animirane latice
* scroll animacije
* reveal efekte
* interaktivne pozadine
* responzivan prikaz

Navbar je zajednički za sve javne i korisničke stranice. Na vrhu stranice je providan, dok nakon skrolovanja dobija zatamnjenu glass pozadinu.

---

## Usluge

Na stranici Usluge predstavljene su glavne usluge agencije:

* izrada poslovnih web sajtova
* izrada landing stranica
* redizajn postojećih sajtova
* razvoj web funkcionalnosti
* izrada korisničkih i administratorskih panela
* održavanje i podrška

---

## Projekti

Portfolio stranica prikazuje različite primere projekata:

* Restoran Toscana
* Advocenta Novi Sad
* FitClub
* Marketing Max

Stranica sadrži:

* portfolio kartice
* kategorije projekata
* istaknuti projekat
* case study prikaz
* standarde rada
* proces saradnje
* lightbox pregled

---

## Paketi

Aplikacija sadrži tri osnovna paketa.

### Basic paket

Namenjen je manjim firmama, preduzetnicima i jednostavnijim poslovnim prezentacijama.

Basic paket koristi tamno-ljubičastu temu.

### Pro paket

Namenjen je firmama kojima je potreban veći broj stranica, napredniji vizuelni sistem, animacije i detaljnije predstavljanje usluga.

Pro paket koristi plavo-ljubičastu temu.

### Premium paket

Namenjen je složenijim web sistemima, portalima, korisničkim nalozima, administratorskim panelima, integracijama i automatizaciji.

Premium paket koristi roze-ljubičastu temu.

---

## Konfiguracija paketa

Svaki paket ima posebnu konfiguracionu stranicu.

U zavisnosti od paketa korisnik može da menja:

* broj stranica
* broj kontakt formi
* broj animiranih sekcija
* broj krugova revizije
* broj naprednih funkcionalnosti
* broj integracija
* količinu paketa

Cena se automatski preračunava nakon svake izmene.

Konfiguracija može da se:

* sačuva
* doda u korpu
* naknadno izmeni
* direktno plati

---

## Korpa

Korpa omogućava:

* pregled izabranog paketa
* pregled dodatnih opcija
* promenu količine
* uklanjanje stavki
* pregled ukupne cene
* nastavak ka PayPal plaćanju

Izabrane konfiguracije čuvaju se u browseru dok korisnik ne završi kupovinu ili ih ukloni.

---

## PayPal Sandbox plaćanje

Za testiranje elektronskog plaćanja integrisan je PayPal Sandbox.

Proces plaćanja uključuje:

1. kreiranje PayPal naloga za plaćanje
2. potvrdu plaćanja od strane korisnika
3. PayPal capture transakcije
4. čuvanje podataka o plaćanju
5. automatsko kreiranje projekta
6. povezivanje projekta sa korisnikom
7. preusmeravanje na stranicu uspešnog plaćanja

Podaci o transakcijama čuvaju se u MongoDB bazi.

---

## Autentifikacija

Sistem podržava:

* registraciju
* prijavu
* odjavu
* proveru tokena
* kontrolu korisničkih uloga
* zaštićene API rute
* bezbedno heširanje lozinki
* validaciju korisničkih podataka

Na svim poljima za unos lozinke dostupan je prikaz i sakrivanje lozinke pomoću dugmeta sa ikonicom oka.

---

## Korisnički profil

Na stranici Profil korisnik može da:

* pregleda podatke naloga
* izmeni ime i email adresu
* promeni lozinku
* pregleda svoju korisničku ulogu

---

## Istorija kupovina

Korisnik može da pregleda:

* kupljeni paket
* konfiguraciju paketa
* datum kupovine
* ukupnu cenu
* status plaćanja
* identifikator transakcije

---

## Projekti korisnika

Nakon uspešnog plaćanja automatski se kreira projekat.

Projekat sadrži:

* jedinstveni kod projekta
* korisnika kome pripada
* izabrani paket
* konfiguraciju paketa
* ukupnu cenu
* referencu plaćanja
* trenutni status
* materijale klijenta
* projektne fajlove
* komunikaciju sa administratorom

---

## Materijali klijenta

Klijent kroz svoj projekat može da dostavi:

* osnovne informacije o firmi
* logo i naziv brenda
* tekstove za stranice
* fotografije i vizuelne materijale
* kontakt podatke i društvene mreže
* boje i vizuelni pravac
* primere i reference sajtova

Obavezna i opciona polja su jasno označena.

Podaci se automatski čuvaju tokom unosa, pa ih administrator može odmah pregledati.

---

## Upload projektnih fajlova

Klijent može da otpremi više fajlova koji se povezuju sa konkretnim projektom.

Podržano je:

* dodavanje fajlova
* pregled slika
* pregled PDF dokumenata
* preuzimanje fajlova
* prikaz naziva fajla
* prikaz veličine
* prikaz vremena otpremanja
* brisanje fajlova

Fajlovi se čuvaju u folderu `uploads/projects`.

---

## Komunikacija u okviru projekta

Svaki projekat ima poseban razgovor između klijenta i administratora.

Sistem omogućava:

* slanje poruka
* prikaz prethodnih poruka
* prikaz pošiljaoca
* prikaz korisničke uloge
* prikaz datuma i vremena
* automatsko osvežavanje razgovora
* čuvanje poruka u MongoDB bazi

Poruke administratora i klijenta vizuelno su odvojene.

---

## Administratorski panel

Administratorski panel omogućava centralno upravljanje aplikacijom.

Administrator može da pregleda:

* korisnike
* projekte
* kupovine
* plaćanja
* kontakt poruke
* projektne poruke
* konfiguracije paketa
* materijale klijenata
* projektne fajlove

Administrator može i da:

* promeni status projekta
* sačuva napomenu
* pošalje poruku klijentu
* preuzme ili obriše fajl
* označi poruku kao odgovorenu

Kada je poruka označena kao odgovorena, uklanja se iz aktivnog inboxa.

---

## Statusi projekata

Projekat može imati jedan od sledećih statusa:

* pregled zahteva
* čeka materijale
* dizajn u izradi
* dizajn na odobrenju
* razvoj
* testiranje
* završen projekat

Promenu statusa vrši administrator, a novi status se prikazuje korisniku.

---

## MongoDB baza

Aplikacija koristi MongoDB bazu:

```text
veb_agencija
```

Glavne kolekcije su:

* `users`
* `projects`
* `payments`
* `orders`
* `contactmessages`

Baza čuva:

* korisničke naloge
* projekte
* konfiguracije paketa
* materijale klijenata
* projektne poruke
* metapodatke fajlova
* kontakt upite
* podatke o plaćanju

---

## Struktura projekta

```text
veb_agencija/
├── controllers/
│   └── authController.js
│
├── models/
│   ├── ContactMessage.js
│   ├── Order.js
│   ├── Payment.js
│   ├── Project.js
│   └── User.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── contactRoutes.js
│   ├── orderRoutes.js
│   ├── paypalRoutes.js
│   ├── paymentRoutes.js
│   └── projectRoutes.js
│
├── public/
│   ├── assets/
│   │
│   ├── css/
│   │   ├── account-pages.css
│   │   ├── admin-style.css
│   │   ├── auth-style.css
│   │   ├── cart-style.css
│   │   ├── home-redesign.css
│   │   ├── main-pages-scroll.css
│   │   ├── package-showcase.css
│   │   ├── payment-success.css
│   │   ├── pricing-redesign.css
│   │   ├── pricing-style.css
│   │   ├── process-redesign.css
│   │   ├── process-style.css
│   │   ├── profile-style.css
│   │   ├── projects_style.css
│   │   ├── projects-redesign.css
│   │   ├── projects-style.css
│   │   ├── services-redesign.css
│   │   ├── services-style.css
│   │   ├── site-responsive.css
│   │   ├── style.css
│   │   └── unified-navbar.css
│   │
│   ├── js/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── home-effects.js
│   │   ├── main-pages-scroll.js
│   │   ├── main.js
│   │   ├── my-projects.js
│   │   ├── package-showcase.js
│   │   ├── payment-success.js
│   │   ├── pricing-effects.js
│   │   ├── process-effects.js
│   │   ├── profile.js
│   │   ├── projects-effects.js
│   │   ├── purchase-history.js
│   │   ├── services-effects.js
│   │   └── unified-navbar.js
│   │
│   ├── admin.html
│   ├── auth.html
│   ├── cart.html
│   ├── index.html
│   ├── my-projects.html
│   ├── package-basic.html
│   ├── package-premium.html
│   ├── package-pro.html
│   ├── payment-success.html
│   ├── pricing.html
│   ├── process.html
│   ├── profile.html
│   ├── projects.html
│   ├── purchase-history.html
│   └── services.html
│
├── uploads/
│
├── node_modules/
│
├── .env
├── .env.example
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── server.js
```

---

## Pokretanje projekta

### 1. Kloniranje repozitorijuma

```bash
git clone https://github.com/Kacavenda/veb_agencija.git
```

### 2. Ulazak u projekat

```bash
cd veb_agencija
```

### 3. Instalacija paketa

```bash
npm install
```

### 4. Kreiranje `.env` fajla

U korenu projekta potrebno je napraviti `.env` fajl.

Primer:

```env
PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb+srv://DATABASE_USER:DATABASE_PASSWORD@CLUSTER.mongodb.net/veb_agencija
MONGODB_DB_NAME=veb_agencija

PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=PAYPAL_SANDBOX_CLIENT_ID
PAYPAL_CLIENT_SECRET=PAYPAL_SANDBOX_CLIENT_SECRET
```

Prave pristupne podatke nije dozvoljeno čuvati u Git repozitorijumu.

### 5. Pokretanje aplikacije

Razvojno pokretanje:

```bash
npm run dev
```

Standardno pokretanje:

```bash
npm start
```

Aplikacija je dostupna na adresi:

```text
http://localhost:3000
```

---

## Git zaštita podataka

Fajl `.env` mora biti dodat u `.gitignore`.

U repozitorijum se postavlja samo:

```text
.env.example
```

Folder `node_modules` se ne postavlja na GitHub.

Projektni fajlovi iz `uploads` foldera takođe ne treba da se postavljaju, osim `.gitkeep` fajla potrebnog za čuvanje strukture foldera.

---

## Status projekta

Aplikacija trenutno sadrži kompletan osnovni tok rada:

1. pregled ponude agencije
2. izbor i konfiguracija paketa
3. registracija ili prijava
4. dodavanje paketa u korpu
5. PayPal Sandbox plaćanje
6. automatsko kreiranje projekta
7. dostavljanje materijala i fajlova
8. komunikacija sa administratorom
9. praćenje statusa projekta
10. administratorsko upravljanje aplikacijom

---

## Autor

**Aleksandar Kačavenda**
**IT42/2024**
Fakultet tehničkih nauka — Novi Sad
