# Kako postaviti JobFAIR na Opalstack

Kreni od probne adrese `staging.jobfair.ba`. Kad tamo provjeriš cijeli tok, novu aplikaciju poveži s postojećom domenom `jobfair.ba`. U primjerima zamijeni velika imena poput `SSH_USER`, `OPAL_HOST` i `DB_USER` vrijednostima iz svog Opalstack računa.

JobFAIR na Opalstacku ima jedan Node.js proces za web i API, drugi proces za slanje emailova, PostgreSQL za podatke i privatni direktorij na disku za datoteke. Google je potreban za prijavu. Gemini i RapidAPI trebaju samo AI i Instagram funkcijama. GitHub služi za distribuciju koda. Produkcijska aplikacija ne koristi Lovable ili Supabase.

## 1. Pripremi pristupe i sačuvaj stanje postojeće stranice

- U Opalstacku provjeri da možeš otvoriti **Applications**, **Domains**, **PostgreSQL**, **Email** i **Shell Users**. Zapiši server, IP i postojeći naziv aplikacije koja služi rutu `/` za `jobfair.ba`.
- Zapiši postojeće rute, uključujući `www` i eventualne druge putanje. Sačuvaj postojeće DNS zapise i sigurnosnu kopiju stare web aplikacije, baze i datoteka.
- Provjeri ko upravlja DNS-om. Ako `jobfair.ba` već pokazuje na isti Opalstack server, za prelazak obično mijenjaš samo aplikaciju povezanu s rutom `/`. Ako prelaziš na drugi server, treba promijeniti i odgovarajuće web DNS zapise. MX i ostale email zapise mijenjaš samo ako seliš i email uslugu.
- Organizacija treba imati pristup Google Cloud projektu koji izdaje OAuth klijent, mailboxu za slanje i računima za Gemini i RapidAPI. Čuvaj tajne u upravitelju lozinki i serverovom `.env`.

[Opalstack vodič za domene i DNS](https://docs.opalstack.com/user-guide/domains/)

## 2. Napravi probnu aplikaciju, bazu i adresu

1. U **Shell Users** napravi zasebnog korisnika za novu aplikaciju, na odabranom serveru. Zapiši SSH korisničko ime i hostname, npr. `opalN.opalstack.com`. Ako možete, postavite SSH ključ organizacije.
2. U **Applications → Add Application** napravi aplikaciju tipa **Custom Proxy**. Nazovi je npr. `jobfairstage`. Odaberi tog korisnika i server. Zapiši port koji dodijeli Opalstack. Node će slušati taj port na `127.0.0.1`; posjetioci koriste HTTPS na domeni.
3. U **PostgreSQL → Add PostgreSQL User** napravi korisnika baze na istom serveru. Opciju **external networks** ostavi isključenu. Početnu lozinku preuzmi iz Opalstack **Notice Log**.
4. U **PostgreSQL → Add PostgreSQL** napravi novu bazu, npr. `jobfair_stage`, s kodiranjem **UTF-8**. Dodijeli joj prethodno kreiranog korisnika baze. Opalstack daje stvarna imena baze i korisnika u panelu. Zapiši ih.
5. U **Domains → Add Your Domain** dodaj `staging.jobfair.ba`. Ako DNS vodi drugi servis, tamo dodaj `A` zapis `staging` na IP Opalstack servera. Ako koristiš i IPv6, provjeri da odgovarajući `AAAA` pokazuje na pravi server.
6. U **Domains → Add Site** odaberi server i IP, dodaj domenu `staging.jobfair.ba` i poveži `jobfairstage` s putanjom `/`. Uključi **Automatic Let’s Encrypt Certificate**. Nakon izdavanja certifikata uključi **Encrypt all traffic**. Opalstack javlja rezultat izdavanja u **Notice Log**. Ruta `/` već pokriva web, API i datoteke. Nemoj dodavati zasebnu statičku aplikaciju za `/api` ili za storage.

[Opalstack aplikacije](https://docs.opalstack.com/user-guide/applications/) · [Site i rute](https://docs.opalstack.com/user-guide/sites/) · [PostgreSQL](https://docs.opalstack.com/user-guide/postgresql-databases/) · [HTTPS](https://docs.opalstack.com/user-guide/ssl-certificates/)

## 3. Prijavi se na server i prenesi ispravan kod

Na Windowsu otvori **PowerShell**. SSH komanda otvara terminal na serveru. Sve komande označene kao Bash izvršavaš tamo.

```powershell
ssh SSH_USER@OPAL_HOST
```

Na serveru provjeri Node. Koristi Node **22.12 ili noviji u grani 22**. Ako je postojeći Node stariji ili ga nema, instaliraj NVM po službenom vodiču, ponovo se prijavi pa izvrši `nvm install 22` i `nvm use 22`.

```bash
node --version
npm --version
umask 077
mkdir -p "$HOME/jobfair/stage/release" "$HOME/jobfair/stage/storage" "$HOME/jobfair/stage/import" "$HOME/jobfair/stage/outbox"
```

**Verzija koda.** Koristi provjereni commit sa grane `migration/opalstack-independent`. Primjer ispod arhivira zadnji commit iz tvoje radne kopije.

```powershell
git log -1 --oneline
git archive --format=tar.gz --output=jobfair-release.tar.gz HEAD
scp .\jobfair-release.tar.gz SSH_USER@OPAL_HOST:jobfair/stage/
```

`git archive` prenosi samo datoteke iz commita. Na serveru:

```bash
tar -xzf "$HOME/jobfair/stage/jobfair-release.tar.gz" -C "$HOME/jobfair/stage/release"
cd "$HOME/jobfair/stage/release"
test -f server/src/server.mjs && test -f deploy/build.sh
```

[GitHub grana za Opalstack](https://github.com/mahmutovichana/jobfaireestec/tree/migration/opalstack-independent) · [NVM upute](https://github.com/nvm-sh/nvm#installing-and-updating)

## 4. Podesi Google prijavu

1. U Google Cloudu otvori projekt koji pripada organizaciji. U **Google Auth Platform → Branding** upiši naziv JobFAIR, adresu podrške i kontakt. Dodaj domenu `jobfair.ba` i popuni web i privacy URL-ove koje Google traži. Koristi stvarnu javnu stranicu s informacijama o obradi podataka, posebno jer JobFAIR prima CV dokumente.
2. U **Audience** koristi **External** ako se trebaju prijavljivati i Google računi izvan vaše organizacije. JobFAIR traži samo `openid`, `email`, `profile`. Google za te osnovne scopeove dokumentuje izuzetak od uobičajenog ograničenja na testne korisnike. Provjeri status objave i upute za verifikaciju koje panel prikaže za vaš projekt.
3. U **Clients → Create client** izaberi **Web application**. Možeš napraviti zasebne klijente za probu i produkciju. Pod **Authorized redirect URIs** za staging dodaj tačno `https://staging.jobfair.ba/api/v1/auth/google/callback`. Za produkciju dodaj tačno `https://jobfair.ba/api/v1/auth/google/callback`. Lokalni klijent može zadržati `http://localhost:8081/api/v1/auth/google/callback`. Adrese moraju odgovarati protokolu, domeni, portu i putanji koje backend koristi.
4. Prepiši Client ID i Client Secret odgovarajućeg klijenta u serverov `.env`. Ovaj tok je serverski, pa je ključna postavka **Authorized redirect URIs**. Tajni ključ ne ide u `VITE_*` postavke.
5. Google potvrđuje identitet. JobFAIR i dalje određuje ovlasti preko postojeće baze korisnika, odobrenih zahtjeva, uloga i postavki odbora. Provjeri postojeći administratorski račun prije prebacivanja. Ako treba dodati novog administratora, zatraži od osobe koja održava bazu da doda tačnu potvrđenu adresu u `identity.settings.admin_emails` ili dodijeli ulogu postojećem korisniku. Izbjegni dodjelu admin pristupa cijeloj domeni.

[Google OAuth za web server](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred) · [Google Auth Platform Audience](https://support.google.com/cloud/answer/15549945)

## 5. Podesi SMTP, AI i Instagram

**Email.** U Opalstacku otvori **Email → Add Mailbox**, napravi mailbox i postavi lozinku. Pod **Add Email Address** poveži adresu pošiljaoca, npr. `noreply@jobfair.ba`, s mailboxom. Za SMTP koristi naziv mailboxa kao korisničko ime. Host je `smtp.de.opalstack.com` za njemačku regiju ili `smtp.us.opalstack.com` za američku. Port `587` koristi STARTTLS, a `465` TLS od početka. Provjeri SPF, DKIM i DMARC kod aktivnog DNS pružaoca. Ako domena već ima SPF zapis, dopuni postojeći zapis umjesto pravljenja drugog. Prije produkcije pošalji stvarnu testnu potvrdu na račun koji kontrolišeš i u primljenom emailu provjeri autentikaciju i link za odjavu. Uskladi dnevni i mjesečni limit s računom, posebno ako druge aplikacije dijele pošiljaoca.

Neisporučene poruke prati u mailboxu za povrate ili poveži pouzdan adapter na `POST /api/v1/mail/events`. Opalstack SMTP sam ne poziva ovu rutu. Adapter mora poslati JSON s `id`, `email` i `type` (`bounce`, `complaint` ili `unsubscribe`), Unix vrijeme u milisekundama u `x-jobfair-timestamp` i HMAC-SHA256 u malim heksadecimalnim slovima u `x-jobfair-signature`. Potpisuje se `timestamp + "." + originalni JSON body` ključem `MAIL_WEBHOOK_SECRET`. Taj ključ postavi samo kad imaš adapter, a valjan zahtjev treba stići unutar pet minuta.

**AI.** U Google AI Studio napravi Gemini API ključ na računu organizacije. Stavi ga u `GEMINI_API_KEY`. `GEMINI_MODEL` je model za poboljšavanje opisa. Primjer u kodu je `gemini-2.5-flash`. Ako više nije dostupan za vaš projekt, odaberi podržani model i provjeri funkciju u JobFAIR-u.

**Instagram.** Trenutni kod zove RapidAPI proizvod s hostom `instagram120.p.rapidapi.com` i endpointom `POST /api/instagram/posts`. U svom RapidAPI računu provjeri da imaš pristup baš toj usluzi i njenim limitima. Postavi `RAPIDAPI_KEY` i `INSTAGRAM_USERNAME=jobfair.sarajevo`. Probaj sinhronizaciju preko administratorskog panela. Drugi Instagram API zahtijeva prilagodbu koda.

[Opalstack SMTP i mailbox](https://docs.opalstack.com/user-guide/email/) · [Gemini API ključevi](https://ai.google.dev/gemini-api/docs/api-key)

## 6. Uredi privatne postavke na serveru

Sa servera, unutar `$HOME/jobfair/stage/release`:

```bash
umask 077
cp -n .env.example .env
cp -n server/.env.example server/.env
chmod 600 server/.env
openssl rand -hex 32
nano server/.env
```

Kopiraj nasumični niz u `SESSION_SECRET` i zamijeni primjere stvarnim vrijednostima. Za produkciju generiši drugi ključ. U nano editoru snimi s **Ctrl+O**, **Enter**, izađi s **Ctrl+X**. URL baze koristi stvarne podatke iz PostgreSQL panela. Ako lozinka sadrži znakove kao `@`, `:`, `#`, `/` ili `%`, kodiraj ih u URL obliku. Ne lijepi lozinku u online konverter ili shell historiju.

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=OPALSTACK_DODIJELJENI_PORT
APP_ORIGIN=https://staging.jobfair.ba
DATABASE_URL=postgresql://DB_USER:URL_KODIRANA_LOZINKA@127.0.0.1:5432/DB_NAME
SESSION_SECRET=GENERISANI_KLJUC
STORAGE_ROOT=/home/SSH_USER/jobfair/stage/storage
OUTBOX_ROOT=/home/SSH_USER/jobfair/stage/outbox
GOOGLE_CLIENT_ID=ID_STAGING_KLIJENTA
GOOGLE_CLIENT_SECRET=TAJNA_STAGING_KLIJENTA
GOOGLE_CALLBACK_URL=https://staging.jobfair.ba/api/v1/auth/google/callback
MAIL_TRANSPORT=smtp
MAIL_FROM="JobFAIR <noreply@jobfair.ba>"
SMTP_HOST=smtp.de.opalstack.com
SMTP_PORT=587
SMTP_USER=NAZIV_MAILBOXA
SMTP_PASSWORD="LOZINKA_MAILBOXA"
MAIL_DAILY_LIMIT=700
MAIL_MONTHLY_LIMIT=9500
GEMINI_API_KEY=VAS_GEMINI_KLJUC
GEMINI_MODEL=gemini-2.5-flash
RAPIDAPI_KEY=VAS_RAPIDAPI_KLJUC
INSTAGRAM_USERNAME=jobfair.sarajevo
TRUST_PROXY_HOPS=1
```

Putanju provjeri komandom `echo "$HOME"`. `TRUST_PROXY_HOPS=1` je primjer za jedan Opalstack proxy ispred Nodea. Ako imaš dodatni proxy, potvrdi stvarnu topologiju i provjeri da limit zahtjeva koristi klijentski IP. Ove vrijednosti postavljaš samo na serveru. U korijenskom `.env` ostavi `VITE_API_URL=/api/v1` i `VITE_SITE_URL=https://jobfair.ba`. Naziv, datum, društvene mreže i javni URL dodatno postoje u `identity.settings.public_site`. Provjeri sadržaj kroz `/api/v1/settings/site` nakon uvoza. Za produkciju URL treba biti `https://jobfair.ba`.

## 7. Prenesi bazu i datoteke

**Šta su buckets?** To su ovdje poddirektoriji pod `STORAGE_ROOT`. Uvoz i upload ih stvaraju sami. Javni su `event-assets`, `news-images`, `partner-logos`, `team-photos` i `gallery`. Javni URL počinje sa `/api/v1/storage/public/<bucket>/`. `cv-uploads` je privatan, a API izdaje kratkotrajne potpisane linkove ovlaštenim korisnicima. Folder `storage` drži van `dist` i van Opalstack statičkih ruta.

1. Iz `%USERPROFILE%\Desktop\JobFAIR\backup` pripremi kopiju koja sadrži `database/`, `storage/` i `storage-manifest.json`. `database` mora uključivati podatke iz `public/` i `metadata/auth.json` te `metadata/identities.json`. Izvozi sadrže privatne podatke. Prenesi ih kroz SFTP ili SCP direktno na server u `jobfair/stage/import`, uz privatne dozvole.
2. Trenutni izvoz ima **5.222 zapisa**, pet korisnika i **457 datoteka**, a četiri privatna CV dokumenta nedostaju. Za završni uvoz pribavi originale s autorizovanim pristupom, zadrži putanje iz manifesta i osvježi manifest stvarnim statusom i veličinom svakog fajla. Ako pristup izvornim CV dokumentima još nemaš, možeš postaviti probnu verziju, ali puna migracija podataka nije završena.
3. Prvo izgradi aplikaciju i kreiraj tabele. PostgreSQL 16 je verzija provjerena u CI-u. Ako Opalstack server nudi drugu verziju, provjeri je s `SHOW server_version;` i potvrdi migraciju na probnoj bazi. Kod greške s dozvolom za kreiranje sheme ili tabela, provjeri da je korisnik dodijeljen novoj bazi i kontaktiraj Opalstack podršku ako mu nedostaju dozvole u toj bazi.

Primjer prenosa iz PowerShella na laptopu:

```powershell
Set-Location -LiteralPath (Join-Path $env:USERPROFILE 'Desktop\JobFAIR\backup')
scp -r database storage storage-manifest.json SSH_USER@OPAL_HOST:jobfair/stage/import/
```

Ako želiš provjeriti vezu prije uvoza, na serveru pokreni `psql -W -h 127.0.0.1 -U DB_USER -d DB_NAME -c 'SHOW server_version;'`. U sljedećem bloku `umask 077` daje privatne dozvole novim datotekama.

```bash
umask 077
cd "$HOME/jobfair/stage/release"
bash deploy/build.sh
cd server
npm run import -- "$HOME/jobfair/stage/import"
npm run verify -- "$HOME/jobfair/stage/import"
```

`import` pokreći na novoj, praznoj JobFAIR bazi poslije migracija. Isti izvoz se prepoznaje kao već uvezen. Svjež ili ispravljen izvoz uvozi u novu praznu bazu i novi storage direktorij. `standalone-postgres.dump` je posebna sigurnosna kopija lokalne baze, dok ove komande koriste izvoz izvornog formata. Koristi jedan put uvoza po ciljnoj bazi.

## 8. Pokreni web i slanje emailova

```bash
cd "$HOME/jobfair/stage/release"
bash deploy/start.sh
curl -fsS https://staging.jobfair.ba/api/v1/health
curl -fsS https://staging.jobfair.ba/api/v1/auth/config
tail -n 30 var/log/web.log var/log/worker.log
```

Očekuj `{"status":"ok"}` i `"google":true`. Prva provjera potvrđuje vezu s bazom. Druga potvrđuje da su Google postavke učitane. Prava prijava se provjerava u pregledniku.

Za automatski oporavak dogovori s Opalstackom mehanizam za dugotrajne procese ili postavi korisnički cron koji redovno pokreće `deploy/start.sh` za aktivnu verziju. Skripta provjerava PID prije pokretanja. Ako koristiš NVM, zapiši apsolutnu putanju iz `command -v node` i postavi je kao `NODE_BIN` u cron komandi. Primjer za produkciju, uz zamjenu putanja i nakon provjere `command -v flock`:

```cron
*/2 * * * * /usr/bin/flock -n /home/SSH_USER/jobfair/prod/start.lock /usr/bin/env NODE_BIN=/STVARNA/PUTANJA/DO/node /bin/bash /home/SSH_USER/jobfair/prod/release/deploy/start.sh >> /home/SSH_USER/jobfair/prod/watchdog.log 2>&1
```

Dodaj liniju putem `crontab -e` i potvrdi s `crontab -l`. Privremeno isključi taj red tokom planiranog zaustavljanja, inače će cron ponovo pokrenuti procese. Za normalno ponovno učitavanje `.env` koristi `bash deploy/stop.sh` pa `bash deploy/start.sh`. Povremeno pregledaj i rotiraj logove.

## 9. Prođi probnu listu prije objave

- Otvori početnu i direktno otvori `/partneri`, `/novosti`, `/ostavi-cv` i `/auth`. Provjeri slike i fontove.
- Google prijava i odjava rade. Provjeri admin račun, odobrenu kompaniju i račun bez dozvole. Provjeri da se finansije i CV baza ponašaju po ulogama.
- Učitaj bezopasan probni PDF. Provjeri pregled i preuzimanje kao ovlašteni korisnik te odbijanje direktnog javnog CV URL-a.
- Kreiraj probni događaj i prijavu. Provjeri ograničenje kapaciteta, izvoz, QR/check-in ako ga koristite, upit kompanije i email potvrde. Testiraj s adresama koje kontrolišeš.
- Provjeri uređivanje vijesti, oglasa i partnera, audit log, email odjavu, red poruka, Instagram i Gemini. Pregledaj radnički log ako email ne stiže.
- U pregledniku otvori **Developer Tools → Network** i osvježi stranice. Provjeri da aktivni zahtjevi ne idu na `*.lovable.app` ili `*.supabase.co`. Pokreni i `npm run check:independence` u korijenu izdanja. Provjeri postojeće linkove u sadržaju koji su dodani ručno, posebno slike i priloge u vijestima. Vanjski linkovi za društvene mreže su zasebni od rada aplikacije.
- Provjeri vrijeme učitavanja na telefonu i računaru, s čistim cacheom i nakon ponovnog otvaranja. Uporedi iste stranice prije i poslije. Posebno obrati pažnju na početnu, listu partnera i CV pregled.
- Provjeri `/robots.txt` i `/sitemap.xml` na produkcijskoj adresi. Ako postoje važne stare putanje, pripremi njihove 301 preusmjeravanja. Ako probna adresa mora biti javno dostupna, dogovori `noindex` ili ograničenje pristupa prije dijeljenja probne adrese.

## 10. Prebaci jobfair.ba

1. Napravi novu Custom Proxy aplikaciju, produkcijsku PostgreSQL bazu, korisnika i odvojene direktorije pod `$HOME/jobfair/prod`. Koristi dodijeljeni produkcijski port, novi `SESSION_SECRET`, `APP_ORIGIN=https://jobfair.ba`, produkcijski Google klijent i `GOOGLE_CALLBACK_URL=https://jobfair.ba/api/v1/auth/google/callback`. Prilagodi storage putanje na `prod`. Za `www.jobfair.ba` podesi preusmjerenje na `jobfair.ba` tako da prijava uvijek počinje na kanonskoj adresi.
2. Dogovori kratku pauzu za upise na izvornom JobFAIR sistemu. Uzmi svjež, potpun izvoz korisnika, baze i datoteka. Prebaci ga u novu produkcijsku bazu. Provjeri upoređivanje zapisa i fajlova **prije probnih upisa u produkcijsku bazu**.

```bash
cd "$HOME/jobfair/prod/release"
bash deploy/build.sh
cd server
npm run import -- "$HOME/jobfair/prod/import"
npm run verify -- "$HOME/jobfair/prod/import" --cutover
node scripts/readiness.mjs
diff -qr "$HOME/jobfair/prod/import/storage" "$HOME/jobfair/prod/storage"
cd ..
bash deploy/start.sh
```

3. `--cutover` prijavljuje nedostajuće datoteke u izvještaju o uvozu. `readiness` provjerava konfiguraciju i dostupnost baze. Uz rezultate tih skripti zadrži dokaze stvarne prijave, slanja emaila i pristupa dokumentima sa staginga.
4. U **Domains** nađi postojeći **Site** za `jobfair.ba`, klikni **Edit** i na ruti `/` zamijeni staru aplikaciju novom Custom Proxy aplikacijom. Sačuvaj ostale rute koje vam trebaju. Ako IP ostaje isti, DNS obično ostaje isti. Ako se IP mijenja, ažuriraj web DNS zapise gdje se stvarno održavaju. Provjeri certifikat i preusmjeravanje s HTTP-a i `www`.
5. Odmah provjeri `https://jobfair.ba/api/v1/health`, početnu, Google prijavu, jednu kontrolisanu email potvrdu i pristup PDF-u. Počni pratiti web i worker log. Aktiviraj produkcijski cron nakon uspješnog testa.

**Povratak na staru verziju.** Ako kritična provjera padne, zaustavi nove upise i vrati prethodnu aplikaciju na rutu `/` prema zabilježenoj konfiguraciji. Ako je nova verzija već primila prijave, upite ili CV dokumente, prvo sačuvaj te nove podatke i uskladi ih prije ponovnog otvaranja starih obrazaca. Zadrži staru verziju i backup dok se nova ne potvrdi.

## 11. Održavanje poslije objave

- Redovno kopiraj **i bazu i storage**. Izvoz baze sam ne uključuje PDF-ove i slike. Za usklađenu kopiju koristi termin bez upisa ili snapshot koji obuhvata oboje. Drži šifriranu kopiju i van servera i povremeno probaj povrat u zasebnu bazu.
- Za ručni backup koristi `pg_dump -W -h 127.0.0.1 -U DB_USER -Fc DB_NAME -f /PRIVATNA/PUTANJA/jobfair.dump`. `-W` pita lozinku bez stavljanja u komandu. Storage arhiviraj u privatnu datoteku i čuvaj uz odgovarajući dump. Za zakazani backup koristi Opalstack upute za `.pgpass` s dozvolom `600`.
- Prati disk, HTTPS, email kvote, čekanje i greške u redu poruka te dostupnost Google/Gemini/Instagram integracija. Za svaku novu verziju provjeri build i migracije na stagingu, pa pripremi backup i povratak prije produkcijskog ažuriranja.
- Kad nezavisna verzija radi i potvrdiš potpun prenos, provjeri da nema ručno spremljenih cloud adresa ni starih cron poziva. Nakon toga možeš planirati gašenje starog cloud sistema po politici čuvanja podataka organizacije.

[Opalstack upute za PostgreSQL kopije](https://docs.opalstack.com/user-guide/postgresql-databases/#scheduled-backups-for-postgresql-databases)

## Ako nešto zapne

| Šta vidiš | Šta prvo provjeriti |
|---|---|
| `502 Bad Gateway` | Dodijeljeni port, `HOST=127.0.0.1` i `var/log/web.log`. Probaj health na `http://127.0.0.1:DODIJELJENI_PORT/api/v1/health` iz SSH terminala. |
| `redirect_uri_mismatch` | Usporedi `GOOGLE_CALLBACK_URL` znak po znak s **Authorized redirect URIs** na OAuth klijentu koji backend koristi. |
| Google se otvori, ali povratak javlja grešku | Provjeri web log, odlazni HTTPS prema Googleu, odgovarajući ID i Secret te da cijeli tok koristi istu domenu i HTTPS. Pokreni novu prijavu poslije restarta. |
| Login radi, ali korisnik nema pristup | Provjeri je li korisnik koristio baš odobrenu adresu i jesu li uvezene uloge i zahtjevi. Provjeri i datum odobrenja za pristup CV bazi. |
| `EACCES` ili upload ne prolazi | Provjeri da web i storage pripadaju korisniku aplikacije, da postoji slobodan disk i da upload odgovara dozvoljenom tipu i veličini. Kod HTTP 413 provjeri i limit Opalstack proxyja. |
| Mail ostaje na čekanju | Provjeri da worker radi, SMTP host i port, naziv mailboxa, lozinku i kvote. Pregledaj `var/log/worker.log`. |
| Let’s Encrypt certifikat nije spreman | Provjeri DNS za svaku domenu u tom Siteu i poruku u Opalstack **Notice Log**. |
