# CLAUDE.md — itba.az

## Missiya
`reference/prototype.html` içindəki UI və layihə məntiqini bu real layihəyə tətbiq et.
Həqiqət mənbəyi: **`docs/ITBA-SPEC.md`**. Onu hər işə başlamazdan əvvəl oxu.

## Fayllar
- `docs/ITBA-SPEC.md` — **source of truth** (arxitektura, rollar, flaglar, ekranlar, proseslər, qaydalar).
- `reference/prototype.html` — UI və məntiq referansı (demo). Hərfi kopyalanmır.
- Ziddiyyət olarsa: **SPEC > prototype > təxmin.**

## Sərt qaydalar (pozma)
1. **Silib-yenidən qurma yoxdur.** İş axını: oxu → mövcud kodu xəritələ → fərqi çıxar → plan ver → **təsdiq gözlə** → yalnız sonra dəyiş.
2. **Cədvəl/sxem/DDL/miqrasiya YAZMA.** Verilənlər bazasını layihə sahibi qurur. Sənə data lazımdırsa — məndən istə, özün cədvəl yaratma.
3. **Auth-ı prototipdən götürmə.** `USERS` massivi və açıq şifrələr DEMO-dur. Real auth = Supabase Auth. Şifrələr client tərəfdə saxlanmır.
4. **`caps()` məntiqi backend-də də tətbiq olunmalıdır** — yalnız client yoxlaması kifayət deyil. Flag dəyişikliyi (verify, mentor_enabled) yalnız staff/admin.
5. **Dizayn tokenlərini qoru** (SPEC §14: rəng dəyişənləri, IBM Plex şriftləri).
6. **Dil: Azərbaycan dili** (bütün UI mətnləri).

## İş üslubu
- Həmişə **branch**-da işlə, `main`-də yox.
- **Vertikal dilimlər**: kiçik, uçdan-uca işləyən hissələr. "Hər şeyi birdən dəyiş" yox.
- **Bir commit = bir mövzu.** Dağıdıcı dəyişiklikdən əvvəl diff planını göstər.
- Hər dilimdən sonra tətbiqin işlədiyini yoxla.

## Əsas prinsip (SPEC §2)
Kimlik roldan, imkanlar flagdan gəlir. Panel rola görə seçilmir — bloklar flaglara görə yığılır.
