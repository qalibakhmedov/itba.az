# MİQRASİYA PLANI — itba.az → `docs/ITBA-SPEC.md`

> Bu sənəd `GAP-ANALYSIS.md` əsasında hazırlanıb. **Kod yazılmayıb, heç bir fayl dəyişdirilməyib.**
> Cədvəl/sxem/DDL heç bir fazada TƏKLİF OLUNMUR — hər faza öz data ehtiyacını qeyd edir,
> konkret sxemi layihə sahibi qurur. Hər fazaya başlamazdan əvvəl ayrıca təsdiq gözlənilir —
> bu sənədin təsdiqi bütün fazaların avtomatik icrası demək deyil.

## İş prinsipi (bütün fazalar üçün ortaq)
- Hər faza **bir branch, bir mövzu, uçdan-uca işlək** bir dilim təqdim edir (`CLAUDE.md` iş üslubu).
- Fazalar aşağıda **asılılıq ardıcıllığı** ilə düzülüb — əvvəlki faza tamamlanmadan sonrakına başlanmır, çünki hər faza özündən əvvəlkinin üzərində qurulur (məs. flag-driven dashboard `caps()` adapteri olmadan mümkün deyil).
- Yeni data strukturu tələb edən fazalarda dəqiq şəkildə qeyd olunur: *"Bu faza üçün [X] data dəstəyi lazımdır — sxem TƏKLİF OLUNMUR, detallar sizinlə razılaşdırılacaq."*
- Hər fazanın sonunda mövcud funksionallığın **pozulmadığı** əl ilə yoxlanılır (regression check), sonra yeni funksionallıq test edilir.

## Faza xülasəsi

| # | Faza | Növ |
|---|---|---|
| 0 | Açıq qərarların bağlanması | Qərar (kodsuz) |
| 1 | `identity()`/`caps()` adapter qatı | Refaktor (davranış dəyişmir) |
| 2 | Dizayn token əsası | UI infrastruktur |
| 3 | Flag-driven dashboard kompozisiyası | Refaktor + genişlənmə |
| 3.1–3.3 | Community tema köçürməsi (login → my-articles → write-article) | UI miqrasiya |
| 4 | Qeydiyyat formalarının SPEC sahələrinə uyğunlaşdırılması | Genişlənmə |
| 5 | Moderasiya növbəsinin generic-ləşdirilməsi + `trusted_author` cığırı | Genişlənmə |
| 6 | Özünüqiymətləndirmə (self-assessment) | Yeni modul |
| 7 | Q&A modulu | Yeni modul |
| 8 | Resurs kitabxanası | Yeni modul |
| 9 | Mentor kataloqu + reputasiya | Yeni modul |
| 10 | Roadmap | Yeni modul |
| 11 | Classroom / dəvət / qeydiyyat | Yeni modul |
| 12 | İş elanları aqreqatoru + bildiriş konfiquratoru | Yeni modul |
| 13 | Bildiriş (Notification) sistemi | Yeni modul |

---

## Faza 0 — Açıq qərarların bağlanması

**Məqsəd:** `GAP-ANALYSIS.md`-də (c)/(d) bölmələrində qeyd olunan, kodla həll olunmayan qərarları bağlamaq. Bunlar həll olunmadan sonrakı fazalar səhv təməl üzərində qurula bilər.

**Qərar tələb edən məsələlər:**
1. `junior_ba`, `teacher`, `enrolled_student` rolları SPEC-in 4-rol+5-flag modelinə necə uyğunlaşdırılır? (Hər biri üçün ayrıca qərar: hansı rola düşür, hansı flag(-lər) əlavə olunur.)
2. Hansı dizayn token sistemi canonical olacaq — SPEC §14 (tünd/kəhraba/IBM Plex), yoxsa mövcud iki sistemdən biri? Köhnə səhifələr migrasiya olunacaqmı, yoxsa yeni modullar ayrıca vizual dildə qalacaq?
3. Dil siyasəti: yeni SPEC-modulları yalnız AZ-da tikilir, mövcud trilingual (AZ/EN/RU) infrastruktur toxunulmaz qalırmı? Yoxsa uzunmüddətli plan dəyişir?
4. Mövcud 25-sual karyera testi ilə SPEC-in 5-sual self-assessment-i: paralel saxlanılır, yoxsa biri digərini əvəz edir?
5. `reference/prototype.html` → faktiki fayl adı `reference/itba.html`-dır; sənədlərdə (`CLAUDE.md`, SPEC) bu adın düzəldilməsi.

**Toxunulan fayllar:** heç biri (bu faza yalnız qərar toplama və yazılı təsdiqdir). Qərarlar razılaşdırıldıqdan sonra, kiçik bir sənəd-düzəlişi commit-i ilə (`CLAUDE.md`, `docs/ITBA-SPEC.md` — yalnız fayl adı qeydi, məzmun deyil) qeydə alına bilər — ayrıca təsdiqlə.

**Gözlənilən nəticə:** hər 5 sualın yazılı cavabı (bu sənədə əlavə edilə və ya ayrıca `DECISIONS.md`-də saxlanıla bilər).

**Necə yoxlanacaq:** kod yoxdur — yoxlama sizin təsdiqinizdir. Faza 1 yalnız bu qərarlar bağlandıqdan sonra başlayır.

---

## Faza 1 — `identity()`/`caps()` adapter qatı

**Məqsəd:** SPEC-in hesablanan icazə modelini **mövcud 6 rol adı üzərində**, davranışı dəyişmədən tətbiq etmək. Yəni bu faza yeni rol/flag əlavə etmir — sadəcə "rola görə hardcoded panel" məntiqini "rol+mövcud `verified` sütunundan hesablanan `caps()`" məntiqinə keçirir. Bu, sonrakı bütün fazaların üzərində quracağı əsasdır.

**Toxunulan fayllar:**
- `js/community-common.js` — `identity()`/`caps()` funksiyalarının əlavəsi (mövcud `requireSession()` yanında).
- `community/dashboard.html`, `community/write-article.html`, `community/my-articles.html` — birbaşa rol yoxlamalarının `caps()` çağırışına keçirilməsi (görünüş dəyişmir).
- `admin.html` — `is_admin()`-in `caps()` ilə paralel işləməsi (admin panelinin görünüşü dəyişmir).

**Gözlənilən nəticə:** istifadəçi təcrübəsi 1:1 eynidir; fərq yalnız kodun daxili strukturundadır (rol-üzrə if-else əvəzinə hesablanan `caps()`).

**Necə yoxlanacaq:** hər 6 mövcud rol üçün (admin, ba_professional, potential_ba, junior_ba, teacher, enrolled_student) ayrıca giriş edib dashboard/panel görünüşünün faza əvvəlki vəziyyətlə **eyni** olduğunu əl ilə təsdiqləmək (before/after screenshot müqayisəsi tövsiyə olunur).

---

## Faza 2 — Dizayn token əsası

**Məqsəd:** Faza 0-da seçilmiş dizayn sistemini CSS dəyişənləri (custom properties) kimi əlavə etmək — mövcud səhifələrin görünüşünü pozmadan, yeni modullar üçün əsas hazırlamaq.

**Toxunulan fayllar:**
- `css/site.css`, `css/community.css` — yeni token dəsti `:root`-a əlavə olunur (mövcud dəyişənlər silinmir/dəyişmir).
- Şrift əlavəsi (IBM Plex Serif/Sans/Mono, əgər Faza 0-da seçilibsə) — `<link>` və ya lokal font-face.

**Gözlənilən nəticə:** mövcud səhifələrin görünüşü **dəyişməz** qalır (yeni tokenlər hələ heç yerdə istifadə olunmur, sadəcə mövcuddur). Yeni modullar Faza 6-dan etibarən bu tokenlərdən istifadə edəcək.

**Necə yoxlanacaq:** mövcud bütün səhifələr (ev, akademiya, kurslar, məqalələr, community, admin, exam) vizual olaraq faza əvvəli ilə eyni görünür — diff-based screenshot müqayisəsi.

---

## Faza 3 — Flag-driven dashboard kompozisiyası

**Məqsəd:** `community/dashboard.html`-i SPEC §9-dakı blok-kompozisiya modelinə (`BLOCKS`/`dashMeta()` pattern-i, `reference/itba.html`-dəki kimi) keçirmək — Faza 1-də qurulan `caps()` əsasında.

**Toxunulan fayllar:**
- `community/dashboard.html` — panel-per-rol strukturundan blok-kompozisiya strukturuna keçid.
- `js/community-common.js` — `dashMeta()`/blok reyestri əlavəsi.

**Gözlənilən nəticə:** mövcud dashboard funksionallığı (məqalələr, test nəticələri və s.) itmir, sadəcə "flag-lərə görə yığılan bloklar" arxitekturasında təqdim olunur. Hələ yeni flag (`mentor_enabled`, `trusted_author` və s.) əlavə olunmur — bu, gələcək fazalarda həmin flag-lər real data ilə gələndə görünəcək.

**Necə yoxlanacaq:** hər 6 mövcud rol üçün dashboard-un məzmunca eyni qaldığını yoxlamaq (Faza 1-dəki test matrisinin təkrarı).

---

## Faza 3.x — Community tema köçürməsi

**Məqsəd:** Faza 3-də `dashboard.html` tam `--spec-` temasına keçdi (`css/community.css`-dən ayrılıb). Bu, `community/*.html` daxilində iki paralel tema yaratdı: dashboard `--spec-` (açıq/indiqo), qalanlar köhnə `css/community.css` (tünd/narıncı). Bu keçid dövrünü qısaltmaq üçün qalan community səhifələri ardıcıl, kiçik fazalarda eyni sistemə keçirilir. **Marketing səhifələrinə (index, academy, courses, articles) TOXUNULMUR** — onlar ayrı qalır, bu miqrasiyanın hədəfi deyil.

Hər alt-faza ayrıca təsdiq və commit tələb edir — bu bölmənin təsdiqi üçün 3-nün də avtomatik icrası demək deyil.

### Faza 3.1 — `login.html`
**Toxunulan:** `community/login.html`. Ən sadə səhifə (yalnız form) — ən aşağı risklə pattern təsdiqlənir, sonrakı alt-fazalar üçün əsas olur.
**Necə yoxlanacaq:** giriş axını (uğurlu/səhv email-şifrə, "next" parametri ilə yönləndirmə) faza-əvvəli ilə eyni işləyir.

### Faza 3.2 — `my-articles.html`
**Toxunulan:** `community/my-articles.html`. Mövcud `.pill-status`/`.article-row` pattern-i `--spec-` `.st`/`.row` ekvivalentlərinə keçir (dashboard-dakı `myArticles` blokunun status-pill məntiqi ilə uzlaşdırılır).
**Necə yoxlanacaq:** məqalə siyahısı, status göstəriciləri, "Edit" linki faza-əvvəli ilə eyni davranır.

### Faza 3.3 — `write-article.html`
**Toxunulan:** `community/write-article.html`. Trix editor toolbar-ının açıq temada oxunaqlı qalması yoxlanılır — əvvəlki dizayn auditində Trix ikonlarının **tünd** fonda görünməz olması problemi tapılıb düzəldilmişdi (`filter:invert(1)`); açıq fona keçiddə bu invert-in yenidən lazım olub-olmadığı yoxlanmalıdır.
**Necə yoxlanacaq:** draft yaratma/redaktə/submit axını + Trix toolbar-ın bütün ikonlarının görünürlüyü.

**Qeyd:** `register-*.html`, `auth-callback.html`, `test.html`, `test-results.html` bu 3 alt-fazaya daxil deyil — `register-*.html` Faza 4-ün (qeydiyyat formaları) əhatəsindədir, qalanların köçürülməsi Faza 3.3 bitəndən sonra ayrıca razılaşdırılacaq.

---

## Faza 4 — Qeydiyyat formalarının SPEC sahələrinə uyğunlaşdırılması

**Məqsəd:** `community/register-potential-ba.html`, `register-junior-ba.html`, `register-ba-professional.html` formalarını SPEC §8-in tələb etdiyi sahə dəstlərinə (Potential BA: 3 məcburi+5 könüllü; Professional BA: 8 məcburi+5 könüllü) uyğunlaşdırmaq — Faza 0-dakı rol-xəritələmə qərarına əsasən.

**Toxunulan fayllar:**
- `community/register-potential-ba.html`, `community/register-ba-professional.html` — sahə dəstlərinin yenilənməsi.
- `community/register-junior-ba.html` — Faza 0 qərarına görə ya saxlanılır, ya `register-potential-ba.html`-ə birləşdirilir.
- **Data qeydi:** əgər yeni sahələr üçün mövcud `potential_ba_profiles`/`ba_professional_profiles` cədvəllərində sütun çatışmazlığı olarsa, bu, TƏKLİF OLUNMUR — sizdən soruşulacaq.

**Gözlənilən nəticə:** qeydiyyat formaları SPEC-in sahə tələblərinə uyğun, mövcud istifadəçilərin qeydiyyat axını qırılmır.

**Necə yoxlanacaq:** hər forma üzrə uçdan-uca qeydiyyat testi (yeni istifadəçi yaratmaq, profil sətrinin düzgün yazıldığını yoxlamaq).

---

## Faza 5 — Moderasiya növbəsinin generic-ləşdirilməsi + `trusted_author` cığırı

**Məqsəd:** `admin.html`-in mövcud "Moderasiya" tabını (hazırda yalnız məqalələr) SPEC-in tələb etdiyi `trusted_author` sürətli-cığırı (birbaşa nəşr + sonradan nəzarət) və reputasiya bağlantısı (+20/+50) ilə genişləndirmək.

**Toxunulan fayllar:**
- `admin.html` — Moderasiya tabına `trusted_author` filtri/görünüşü.
- `community/write-article.html` — `caps()`-dən gələn `'direct'` vs `'review'` nəşr rejiminin tətbiqi (Faza 1-in `caps()` çıxışından istifadə).
- **Data qeydi:** `trusted_author` flag-ı və reputasiya sayğacı üçün sütun/cədvəl TƏKLİF OLUNMUR — sizdən soruşulacaq.

**Gözlənilən nəticə:** `trusted_author` işarələnmiş istifadəçilər birbaşa nəşr edə bilir, qalanları üçün mövcud review axını dəyişmədən qalır.

**Necə yoxlanacaq:** bir test istifadəçisini `trusted_author` edib birbaşa nəşrin işlədiyini, digər istifadəçilər üçün review axınının pozulmadığını yoxlamaq.

---

## Faza 6 — Özünüqiymətləndirmə (self-assessment)

**Məqsəd:** SPEC §13-ün 5-sual/15-bal diaqnostik modelini tikmək — Faza 0-dakı qərara görə (mövcud 25-sual testi ilə paralel, yoxsa əvəzedici).

**Toxunulan fayllar:**
- Yeni səhifə/bölmə (Faza 0 qərarına görə ya ev səhifəsinə inteqrasiya, ya ayrıca route) + müvafiq JS.
- **Data qeydi:** qeydiyyatsız işləməli olduğu üçün (SPEC-ə görə) minimal/heç data saxlanması lazım olmaya bilər — lazım olarsa sxem TƏKLİF OLUNMUR.

**Gözlənilən nəticə:** 5 sualdan ibarət, qeydiyyat tələb etməyən quiz, 3 səviyyəli nəticə göstərir.

**Necə yoxlanacaq:** hər 3 nəticə diapazonunu (≥75%/≥45%/<45%) manual olaraq təxmin edilən cavablarla test etmək.

---

## Faza 7 — Q&A modulu

**Məqsəd:** Sual/cavab/şərh funksionallığını sıfırdan tikmək (SPEC-də ən çox reputasiya generasiya edən modul — +10 qəbul edilən cavab).

**Toxunulan fayllar:** yeni səhifələr (`community/questions.html`, `community/ask.html` və ya oxşar), `js/community-common.js`-ə əlavələr.
**Data qeydi:** Question/Answer/Comment/ReputationEvent üçün sxem TƏKLİF OLUNMUR — bu fazaya başlamazdan əvvəl sizdən data strukturu soruşulacaq.

**Gözlənilən nəticə:** istifadəçilər sual yaza, cavablaya, cavab qəbul edə bilir; qəbul edilmiş cavab reputasiyaya +10 əlavə edir.

**Necə yoxlanacaq:** uçdan-uca ssenari — sual yarat → cavabla → qəbul et → reputasiyanın artdığını yoxla.

---

## Faza 8 — Resurs kitabxanası

**Məqsəd:** SPEC-in resurs/şablon kitabxanası bölməsini tikmək.

**Toxunulan fayllar:** yeni səhifə (`community/resources.html` və ya oxşar) + admin tərəfdə idarəetmə (`admin.html`-ə yeni tab və ya mövcud Kurslar tabına bənzər struktur).
**Data qeydi:** Resource varlığı üçün sxem TƏKLİF OLUNMUR.

**Gözlənilən nəticə:** resurslar siyahılanır, filtrlənir, yüklənə bilir (SPEC-ə görə `verified=false` bunu bloklamır).

**Necə yoxlanacaq:** verified və qeyri-verified istifadəçi ilə yükləmənin hər ikisində işlədiyini yoxlamaq.

---

## Faza 9 — Mentor kataloqu + reputasiya

**Məqsəd:** Reputasiya sayğacını (Faza 5/7-dən toplanan) və 500-bal həddini istifadə edərək mentor namizədliyi/kataloqu tikmək.

**Toxunulan fayllar:** yeni səhifə (`community/mentors.html`), `admin.html`-ə `mentor_enabled` idarəetməsi (yalnız staff/admin dəyişə bilər — SPEC §16 tələbi).
**Data qeydi:** mentor profili sahələri üçün sxem TƏKLİF OLUNMUR.

**Gözlənilən nəticə:** 500+ reputasiyalı istifadəçilər mentor namizədi kimi görünür; `mentor_enabled` yalnız admin/moderator tərəfindən dəyişdirilə bilir.

**Necə yoxlanacaq:** reputasiyası 500-dən aşağı/yuxarı iki test istifadəçisi ilə görünüşün fərqləndiyini yoxlamaq; qeyri-admin istifadəçinin `mentor_enabled`-i dəyişə bilmədiyini (RLS səviyyəsində) təsdiqləmək.

---

## Faza 10 — Roadmap

**Məqsəd:** SPEC-in ev səhifəsindəki roadmap bölməsini tikmək (statik/admin-idarəli məzmun ola bilər — Faza 0/9-a bənzər qərar tələb edə bilər).

**Toxunulan fayllar:** ev səhifəsi build şablonuna (`scripts/build-site.js`) yeni bölmə.
**Data qeydi:** əgər admin-idarəli olacaqsa, sxem TƏKLİF OLUNMUR.

**Gözlənilən nəticə:** roadmap bölməsi ev səhifəsində görünür.

**Necə yoxlanacaq:** build-i lokal işə salıb bölmənin düzgün render olunduğunu yoxlamaq.

---

## Faza 11 — Classroom / dəvət / qeydiyyat

**Məqsəd:** `classroom_enrolled`/`classroom_owner` flag-larını və dəvət (invite) axınını tikmək — SPEC-in "classroom rol deyil, flag-dır" prinsipinə görə.

**Toxunulan fayllar:** yeni səhifələr (dəvət-qəbul ekranı `community/`-də, `reference/itba.html`-dəki `#v-newpass` axınına bənzər), `admin.html`-ə/`teacher` roluna dəvət-göndərmə UI-si.
**Data qeydi:** Classroom/Enrollment/Invite varlıqları üçün sxem TƏKLİF OLUNMUR.

**Gözlənilən nəticə:** instruktor dəvət göndərir → tələbə linklə qeydiyyatdan keçir → `classroom_enrolled` flag-ı aktivləşir → kurs bitəndə flag söndürülür (rol/reputasiya/tarixçə toxunulmaz qalır — SPEC prinsipi).

**Necə yoxlanacaq:** uçdan-uca dəvət→qeydiyyat→flag aktiv→flag deaktiv ssenarisi.

---

## Faza 12 — İş elanları aqreqatoru + bildiriş konfiquratoru

**Məqsəd:** SPEC §12/§12.1-i tikmək — xarici mənbələrdən sinxronizasiya, filtrlər, bildiriş konfiqurasiyası.

**Toxunulan fayllar:** yeni səhifə (`community/jobs.html`), sinxronizasiya üçün ayrıca build/cron skripti (`scripts/` altında, `build-articles.yml`-ə bənzər workflow).
**Data qeydi:** Job/JobAlert sxemi TƏKLİF OLUNMUR — həmçinin xarici mənbələrə giriş (API/scraping icazələri) ayrıca müzakirə tələb edir.

**Gözlənilən nəticə:** iş elanları siyahılanır (mənbə göstərilir, ITBA vasitəçi kimi görünmür, əskik maaş uydurulmur), istifadəçi bildiriş konfiqurasiya edə bilir (tezlik, filtr, canlı önizləmə).

**Necə yoxlanacaq:** manual sinxronizasiya işə salıb elanların düzgün göründüyünü, bildiriş önizləməsinin filtrə uyğun dəyişdiyini yoxlamaq.

---

## Faza 13 — Bildiriş (Notification) sistemi

**Məqsəd:** Q&A cavabları, moderasiya nəticələri, dəvətlər, iş elanı bildirişləri kimi hadisələr üçün ümumi Notification mexanizmini tikmək (əvvəlki fazalarda yaranan hadisələrin "toplanma nöqtəsi").

**Toxunulan fayllar:** `js/community-common.js`-ə bildiriş oxuma/işarələmə funksiyaları, dashboard-a bildiriş bloku (Faza 3-dəki `BLOCKS` reyestrinə əlavə).
**Data qeydi:** Notification sxemi TƏKLİF OLUNMUR.

**Gözlənilən nəticə:** istifadəçi öz bildirişlərini dashboard-da görür, oxunmamış sayını izləyir.

**Necə yoxlanacaq:** Faza 7/11/12-dən bir hadisə tetiklənib müvafiq bildirişin göründüyünü yoxlamaq.

---

## Qeyd: bu sənədin əhatə etmədiyi

- Konkret sxem/DDL — hər fazada qeyd olunduğu kimi, layihə sahibinin işidir.
- Fazaların dəqiq vaxt qrafiki — hər faza ayrıca təsdiqdən sonra başlayır, ardıcıllıq asılılığa görədir, təqvimə görə deyil.
- Faza 0 bağlanmadan sonrakı fazaların detalları dəyişə bilər (xüsusilə Faza 4, 6, 10-un əhatəsi Faza 0 qərarlarından asılıdır).
