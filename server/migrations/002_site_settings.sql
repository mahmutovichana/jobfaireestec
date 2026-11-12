INSERT INTO identity.settings(key,value) VALUES ('public_site', '{
 "name":"JobFAIR",
 "year":2026,
 "eventDate":"03. i 04. novembar 2026.",
 "timezone":"Europe/Sarajevo",
 "siteUrl":"https://jobfair.ba",
 "socials":{"instagram":"https://www.instagram.com/jobfair.sarajevo/","linkedin":"https://www.linkedin.com/company/jobfair-iskoristi-svoju-sansu","facebook":"https://www.facebook.com/JobfairIskoristiSvojuSansu"},
 "stats":[{"value":"5000+","label":"Posjetitelja godišnje"},{"value":"3000+","label":"Unosa u CV bazu"},{"value":"100+","label":"Kompanija učesnica"},{"value":"50+","label":"Medijskih partnera"}]
}'::jsonb) ON CONFLICT(key) DO NOTHING;
