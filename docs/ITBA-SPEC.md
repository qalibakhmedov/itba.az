# ITBA.AZ — Layihə Spesifikasiyası (Source of Truth)

> **Bu sənəd nədir?** `index.html` prototipindən çıxarılmış arxitektura, UI və proseslərin
> təmiz təsviridir. Məqsəd: Claude Code (VS Code extension) bu sənədi oxuyub real layihəni
> ona uyğun yenidən qursun.
>
> **Sənədin sərhədi:** Fiziki verilənlər bazası (cədvəllər, DDL, indekslər, miqrasiyalar)
> bu sənədə **daxil deyil** — onu layihə sahibi özü quracaq. Aşağıdakı "Konseptual data
> modeli" bölməsi yalnız *hansı məlumatın mövcud olduğunu* təsvir edir, cədvəl dizaynını yox.
>
> **Prototip = demo.** `index.html`-dəki autentifikasiya saxtadır (`USERS` massivi, açıq
> şifrələr). Bu, hərfi kopyalanmamalıdır. Götürülməli olan: **rol/flag modeli, UX, ekranlar,
> proseslər və qaydalar** — demo-nun saxta girişi yox.

---

## 0. Claude Code üçün icra qaydaları

1. **Silib-yenidən qurma tələsinə düşmə.** Mövcud işləyən backend, baza və inteqrasiyaları
   dağıtma. Əvvəlcə oxu → fərqi çıxar → plan ver → təsdiqdən sonra dəyiş.
2. **Auth-ı prototipdən götürmə.** Real auth Supabase Auth (və ya ekvivalent) olmalıdır.
   Şifrələr heç vaxt client tərəfdə saxlanmır.
3. **Fiziki cədvəlləri sən yaratma.** Data modelini konseptual səviyyədə anla, amma
   cədvəl/DDL yazma — bunu layihə sahibi edir.
4. **Dizayn tokenlərini qoru.** Aşağıdakı rəng və şrift sistemi məhsulun kimliyidir.
5. **Dil: Azərbaycan dili.** Bütün UI mətnləri Azərbaycan dilində.

---

## 1. Layihənin mahiyyəti

ITBA.AZ — Azərbaycanın **IT Business Analysis** icması. Peşəkarların bilik bölüşdüyü
platforma: sual-cavab, məqalələr, hazır artefaktlar (şablonlar), mentor kataloqu, karyera
yol xəritəsi, özünüqiymətləndirmə, vakansiya aqreqatoru və opsional sinif (kurs) modulu.

**Mövqe:** İcma satış yox, bilik mərkəzidir. Kurslar bir moduldur, mərkəz deyil. Platforma
kurs satmır, komissiya almadır; sıralama reputasiyaya görədir, reklama yox.

**Metrikalar satışı yox, icma sağlamlığını ölçür** (iştirakçı, məqalə, cavab, şablon sayı;
həftəlik aktivlik).

---

## 2. Əsas arxitektura prinsipi (ən vacib bölmə)

> **Kimlik roldan gəlir. İmkanlar flagdan gəlir.**
>
> **Panel rola görə seçilmir — bloklar flaglara görə yığılır.**

Sistem klassik "hər rol üçün ayrı panel" yanaşmasından qaçır. Bunun əvəzinə:

- **Rol** = bazis kimlik (dəyişməz, nadir hallarda dəyişir).
- **Flag** = imkanları açıb-bağlayan boolean overlay (rolu dəyişmədən əlavə olunur/götürülür).
- **Kimlik etiketi** (`identity()`) = rol + flag kombinasiyasından hesablanır.
- **İcazələr** (`caps()`) = rol + flagdan hesablanır, heç yerdə hardcode edilmir.
- **Dashboard** = flaglara uyğun blokların yığılması (`dashMeta` → blok siyahısı).

Bu model kritik keçidləri asanlaşdırır: məsələn kurs bitəndə `classroom_enrolled` flag-ı
sönür — hesab, reputasiya, suallar yerində qalır, rol dəyişmir.

---

## 3. Rollar (4 ədəd)

Yalnız dörd bazis rol var:

| Rol | Təyinat | Necə alınır |
|---|---|---|
| `potential` | BA olmaq istəyən, öyrənən | Qeydiyyatda seçilir |
| `professional` | Hazırda işləyən BA | Qeydiyyatda seçilir |
| `moderator` | Moderasiya işçisi (staff) | Təyin olunur |
| `admin` | Platforma administratoru (staff) | Təyin olunur |

**Rol OLMAYAN anlayışlar (bunlar flagdır):**

- **"Student / Sinif" rol deyil** → `classroom_enrolled` flag-ı (istənilən rolun üstünə).
- **"Mentor" rol deyil** → `professional + verified + mentor_enabled`.

---

## 4. Flaglar (5 ədəd, defolt `false`)

| Flag | Mənası | Kimə aiddir |
|---|---|---|
| `verified` | Admin təsdiqi keçib | professional |
| `mentor_enabled` | Mentor kataloqunda görünür | professional (verified sonrası) |
| `trusted_author` | Məqalələr dərhal dərc olunur (post-hoc moderasiya) | professional / staff |
| `classroom_enrolled` | Sinifdə tələbədir | əsasən potential |
| `classroom_owner` | Sinif aparır (sahibidir) | mentor |

**Kritik fərq:** `classroom_enrolled` (tələbə) ≠ `classroom_owner` (aparan). Hər mentor sinif
aparmır. Sinif icmadan ayrı modul kimi işləyir.

---

## 5. Kimlik hesablanması (`identity()`)

Rol + flagdan görünən etiket:

| Şərt | Etiket |
|---|---|
| `professional` + `mentor_enabled` | **Mentor** |
| `professional` + `!verified` | **Professional BA · pending** |
| `professional` + `verified` | **Professional BA ✓** |
| `potential` + `classroom_enrolled` | **Potential BA · sinifdə** |
| `potential` | **Potential BA** |
| `moderator` / `admin` | Rol adı |
| istifadəçi yoxdur | **Qonaq** |

---

## 6. İcazələr matrisi (`caps()`)

İcazələr rol + flagdan hesablanır. Hardcode panel yoxdur.

| İcazə | Kim üçün |
|---|---|
| `browse` | Hamı (qonaq daxil) |
| `comment`, `ask`, `answer`, `download` | Giriş etmiş **istənilən** istifadəçi (rol fərqi yoxdur) |
| `publish` | Aşağıdakı publish qaydasına bax |
| `mentor` | `mentor_enabled` |
| `moderate` | staff (moderator/admin) |
| `admin` | `role === admin` |
| `cls_student` | `classroom_enrolled` |
| `cls_owner` | `classroom_owner` |
| `jobs_alert` | `role === potential` |

**Vacib qayda (A1):** Cavab vermək mentor imtiyazı DEYİL. Giriş etmiş hər kəs — potential
daxil — sual verə və cavablaya bilər. "6 ay öndə olan adam çox vaxt daha yaxşı izah edir."

**Qonaq:** yalnız oxuya bilər. Sual, cavab, şərh, endirmə — hamısı qeydiyyat tələb edir
(siyahını görmək yox, əməliyyat üçün).

### 6.1 Publish (məqalə dərci) qaydası

| Vəziyyət | `publish` dəyəri | Nəticə |
|---|---|---|
| staff **və ya** `trusted_author` | `'direct'` | Dərhal dərc, moderasiya sonradan |
| `potential` | `'review'` | Draft → Submit → Pending review → Published |
| `professional` + `verified` | `'review'` | Eyni review axını |
| digər (məs. professional + `!verified`) | `false` | Məqalə yaza bilməz |

**Diqqət:** `verified = false` YALNIZ məqalə dərcini və mentor namizədliyini bağlayır.
Sual/cavab/şərh/endirmə açıq qalır. "İştirak gözləmir."

---

## 7. Ekran / səhifə inventarı

### 7.1 Home (tək səhifə, bölmələr)
- **Hero** — rola görə dəyişən başlıq/mətn (`HERO` açarları: guest, potential, pending, pro, mentor, staff) + canlı statistika + canlı lent.
- **Feed** (`#feed`) — həftənin ən çox oxunanları + publish zonası (rola görə banner).
- **Q&A** (`#qa`) — sual siyahısı, "sual ver" zonası, cavabla/şərh düymələri (icazəyə görə kilidli).
- **Resources** (`#resources`) — hazır artefaktlar (şablonlar), endirmə (icazəyə görə).
- **Mentors** (`#mentors`) — mentor kataloqu, reputasiyaya görə sıralı, ödənişli yer yoxdur.
- **Jobs** (`#jobs`) — vakansiya aqreqatoru (aşağıda ayrıca bölmə).
- **Roadmap** (`#roadmap`) — 6 mərhələli BA karyera yolu.
- **Assess** (`#assess`) — 5 suallıq özünüqiymətləndirmə (yalnız qonaq və potential görür).
- **Courses** (`#courses`) — kurs müqayisə kataloqu (satış yox, müqayisə). "SPONSOR" ödənişli yerləşdirmədir, sıralamaya təsir etmir.

### 7.2 Auth ekranları
- **Login** — email + şifrə. (Prototipdə test hesabları göstərilir; real sistemdə OLMAYACAQ.)
- **Register — Addım 1** — rol seçimi (Potential BA / Professional BA). "Sinifdə oxuyuram" kartı deaktivdir (rol deyil, flag).
- **Register — Addım 2** — rola görə forma (aşağıda).
- **Register — Done** — rola görə uğur ekranı (timeline ilə).
- **Invite Accept** (`newpass`) — sinif dəvətini qəbul (müvəqqəti şifrə YOX, birdəfəlik link).

### 7.3 Dashboard
Blok kompozisiyası (aşağıda ayrıca bölmə).

### 7.4 Naviqasiya (`navFor()`)
- Qonaq → dashboard-dan başqa hamısı.
- `potential` → hamısı (assess daxil).
- digər → assess-dən başqa hamısı.

---

## 8. Qeydiyyat formaları

### 8.1 Potential BA
- **Tələb olunan (3):** Tam ad, Email, Şifrə (min 8 simvol).
- **Opsional:** Telefon, Hazırkı vəzifə, LinkedIn, Ölkə, Təcrübə (il).
- **Nəticə:** hesab **dərhal aktiv**, `role = potential`, təsdiq yoxdur.

### 8.2 Professional BA
- **Tələb olunan (8):** Tam ad, Email, Şifrə (min 8), Şirkət, Vəzifə, BA təcrübəsi (il), LinkedIn (yoxlanır), Bio.
- **Opsional (təsdiqi sürətləndirir):** CV (link), Sertifikatlar, Portfolio, Bacarıqlar, Şəxsi sayt.
- **Nəticə:** hesab **dərhal aktiv**, `verified = false`. Təsdiq yalnız məqalə dərcinə və mentor namizədliyinə aiddir. Admin yoxlaması 1–2 iş günü.

---

## 9. Dashboard blok kompozisiyası

Panel `dashMeta` ilə rol + flagdan yığılır. Hər blok bir flaga/vəziyyətə bağlıdır.

| Rol / flag | Bloklar |
|---|---|
| `admin` | `adminVerify`, `adminMentor` |
| `moderator` | `moderation` |
| `professional` + `mentor_enabled` | `mentorInbox`, `clsOwner` |
| `professional` + `!verified` | `verification`, `answerNow` |
| `professional` + `verified` | `mentorPath`, `myArticles` |
| `potential` + `classroom_enrolled` | `roadmap`, `myQuestions`, `clsStudent` |
| `potential` (sinifsiz) | `roadmap`, `myQuestions` |

**Həmişə əlavə olunur:** "Aktiv flaglar" bloku (role + bütün flagların vəziyyəti).
**`jobs_alert` (potential) üçün:** vakansiya bildiriş konfiquratoru bloku.

Blokların qısa təsviri: `roadmap` (yol xəritəsi + irəliləyiş), `myQuestions` (verdiyin
suallar + tövsiyə mentorlar), `verification` (təsdiq statusu + profil tamlığı), `answerNow`
(indi cavablaya biləcəyin açıq suallar), `mentorPath` (500 rep yolu), `myArticles`
(məqalələrin + trusted_author sayğacı), `mentorInbox` (sənə ünvanlanan suallar + reputasiya
mənbəyi), `clsStudent` (tapşırıq/quiz/material), `clsOwner` (sinif idarəsi, tələbələr),
`moderation` (məqalə növbəsi), `adminVerify` (professional təsdiqi), `adminMentor` (mentor
aktivasiyası + moderasiya).

---

## 10. Əsas proseslər (flows)

### 10.1 Qeydiyyat
Rol seç → forma doldur → hesab dərhal aktiv. Potential: status Active. Professional:
`verified = false`, admin yoxlamasına düşür.

### 10.2 Giriş
Email + şifrə yoxla → uğurlu → gözləyən **sinif dəvəti** varsa dəvət ekranına, yoxsa panelə.

### 10.3 Sinif dəvəti (invite)
Mentor/owner email ilə tələbə əlavə edir:
- **Hesab varsa** → `classroom_enrolled = true`. Yeni hesab YARADILMIR, rol DƏYİŞMİR, dəvət emaili gedir.
- **Hesab yoxdursa** → dəvət linki → Potential BA kimi qeydiyyat → `classroom_enrolled = true`.
- **Müvəqqəti şifrə yaradılmır** — dəvət linki birdəfəlikdir.
- Kurs bitəndə flag sönür; hesab, reputasiya, suallar qalır.

### 10.4 Məqalə dərci
`review` icazəsi: Draft → Submit → Pending review → Published. **3 təsdiqdən sonra**
`trusted_author` açılır → sonrakı məqalələr dərhal dərc, moderasiya post-hoc.

### 10.5 Sual-cavab
Sual verilir → teq-lərə uyğun töhfəçilərə bildiriş → cavablar → sual sahibi birini qəbul
edir → qəbul edilən cavab bilik bazasına düşür və müəllifə **+10 reputasiya**.

### 10.6 Mentor yolu
Şərtlər: `verified = true` + tam profil + qaydalar qəbul edilib + **500 reputasiya**.
Admin `mentor_enabled = true` edir → mentor kataloquna düşür. Sıralama reputasiyaya görədir.

### 10.7 Moderasiya
Məqalə növbəsi. **Rədd səbəbsiz olmamalıdır** (səbəbsiz rədd churn yaradır). Növbənin
uzunluğu supply-ın sürət limitidir; `trusted_author` həddi növbəni azaldan alətdir.

### 10.8 Admin
Professional təsdiqi (`verified = true`), mentor aktivasiyası (`mentor_enabled = true`),
məqalə moderasiyası, analitika.

---

## 11. Reputasiya sistemi

| Hadisə | Bal |
|---|---|
| Qəbul edilən cavab | +10 |
| Məqalə (dərc olunan) | +20 |
| Featured məqalə | +50 |

Mentor namizədliyi həddi: **500 reputasiya**. (Nümunə: 91 qəbul + 34 məqalə + 4 featured.)

---

## 12. Vakansiya modulu (Jobs)

**Mahiyyət:** Aqreqator. ITBA vasitəçi DEYİL — müraciət mənbə saytda gedir. ITBA maaş
uydurmur (mənbədə yoxdursa, göstərilmir; elanların ~55%-i maaşsızdır). Gündə 2 dəfə yenilənir.

**Mənbələr:** boss.az, hh.az, jobsearch.az, banco.az, djinni.co, linkedin.com.

**Elan sahələri:** şirkət, vəzifə, səviyyə (Junior/Middle/Senior), şəhər, remote/hibrid
(bool), maaş min, maaş max (null ola bilər), mənbə, neçə gün əvvəl, teqlər.

**Filtrlər:** səviyyə (çoxseçim), mənbə (çoxseçim), yalnız remote/hibrid (toggle), yalnız
maaşı göstərilən (toggle), sıfırla.

### 12.1 Vakansiya bildirişləri (yalnız potential — `jobs_alert`)
Konfiqurasiya panel blokunda:
- Aç/söndür (email bildirişi).
- Tezlik: `instant` (hər elan ayrı email), `daily` (gündəlik yığcam), `weekly` (həftəlik yığcam).
- Həftəlik üçün: hansı gün (Bazar ertəsi / Cümə), səhər 09:00.
- Səviyyə filtri, mənbələr, remote, maaş.
- Canlı email preview (kimə, mövzu, uyğun elanlar).
- Uyğun elan yoxdursa email getmir. Həftədə 5+ email olarsa, "gündəlik yığcam" tövsiyə olunur.

---

## 13. Özünüqiymətləndirmə (Assessment)

5 sual, maksimum 15 bal, faizə çevrilir. Diaqnostikadır — imtahan deyil. Qeydiyyat lazım deyil.
- ≥ 75% → "Junior BA-ya hazırsan" + konkret növbəti addımlar.
- ≥ 45% → "Yaxınsan" + addımlar.
- < 45% → "Başlanğıc" + addımlar.
Nəticə yol xəritəsini müəyyən edir. Qonaq nəticəni saxlamaq üçün qeydiyyata dəvət olunur.

---

## 14. Dizayn sistemi (qorunmalı)

### 14.1 Rəng tokenləri (CSS dəyişənləri)
```
--ink:    #07141A   (fon)
--ink-2:  #0C1F27   (kart fonu)
--ink-3:  #12303B   (dərin element)
--line:   #1D4553   (sərhəd/xətt)
--chalk:  #E6EFEE   (əsas mətn)
--muted:  #7C9AA3   (ikinci dərəcəli mətn)
--signal: #FFB020   (vurğu / amber — CTA, aktiv vəziyyət)
--teal:   #17C3A2   (uğur / müsbət vəziyyət)
--red:    #FF6B5A   (xəta / rədd)
--r:      4px       (radius)
--maxw:   1180px
```

### 14.2 Şriftlər
- **IBM Plex Serif** (600) — başlıqlar, display, statistika rəqəmləri.
- **IBM Plex Sans** (400–700) — əsas mətn, düymələr.
- **IBM Plex Mono** (400–500) — etiketlər, meta, flag adları, kod.

### 14.3 Vizual dil
Tünd, "chalkboard/grid" estetikası (fonda 48px grid). Vəziyyət rəngləri məna daşıyır:
amber = diqqət/CTA, teal = müsbət/aktiv, red = xəta/rədd. Reduced-motion dəstəklənir.

---

## 15. Konseptual data modeli (fiziki cədvəllər SƏNDƏ)

> Bu bölmə yalnız *hansı məlumatın mövcud olduğunu* göstərir. Cədvəl adları, tipləri,
> açarlar, indekslər, normalizasiya — hamısı sənin qərarındır.

**User** — kimlik: id, ad, email, şifrə (Supabase Auth-da, bazada YOX), rol
(`potential|professional|moderator|admin`), init (avatar hərfləri), başlıq/vəzifə,
reputasiya, yaranma tarixi. Profil detalları: şirkət, LinkedIn, bio, təcrübə (il), CV,
sertifikatlar, portfolio, bacarıqlar, şəxsi sayt, telefon, ölkə.

**Flags** — user-ə bağlı 5 boolean: `verified`, `mentor_enabled`, `trusted_author`,
`classroom_enrolled`, `classroom_owner`. (Ayrı cədvəl, yoxsa user-in sütunları — sənin qərarın.)

**Question** — başlıq, detal, teqlər, müəllif, yaranma vaxtı, səs sayı, statusu (açıq/qəbul
edilmiş), qəbul edilən cavab.

**Answer** — sual, müəllif, mətn, səs, qəbul edilibmi, yaranma vaxtı.

**Comment** — sual/cavaba bağlı, müəllif, mətn.

**Article** — başlıq, müəllif, məzmun, status (`Draft|Pending review|Published|Rejected`),
featured (bool), like sayı, təsdiq sayı (trusted_author üçün), rədd səbəbi.

**Resource** — hazır artefakt: ad, fayl (tip: docx/bpmn/sql/puml/md/xlsx), endirmə sayı, müəllif.

**Job** — şirkət, vəzifə, səviyyə, şəhər, remote (bool), maaş min/max (nullable), mənbə,
tarix, teqlər. (Xarici mənbələrdən sinxronlaşdırılır.)

**JobAlert** — user (potential), aktivlik, tezlik, həftəlik gün, səviyyə filtri, mənbələr,
remote, maaş filtri.

**Classroom** — ad (məs. "IT BA əsasları · Batch 7"), owner (mentor), müddət, statusu.

**Enrollment** — user ↔ classroom (`classroom_enrolled`-un təfsilatı), qoşulma tarixi.

**Assignment / Quiz / Submission / Grade** — sinif tapşırıqları, təhvillər, ballar, mentor rəyi.

**Material** — sinif materialları (slayd/fayl).

**ModerationItem** — məqalə/şikayət növbəsi: obyekt, tip, status, moderator, qərar, səbəb.

**Notification** — teq/mention/dəvət bildirişləri.

**Invite** — sinif dəvəti: email, classroom, birdəfəlik token, statusu (müvəqqəti şifrə YOX).

**ReputationEvent** — audit üçün: user, hadisə tipi, bal, mənbə obyekt.

**Əlaqələr (konseptual):**
- User 1—* Question, Answer, Comment, Article, Resource.
- Question 1—* Answer; Question *—* Tag.
- Classroom 1—* Enrollment (—1 User); Classroom 1—* Assignment/Material.
- User 1—* JobAlert; Job *—* Tag.
- Mentor (User + `mentor_enabled`) 1—* Classroom (owner).

---

## 16. Qeyri-funksional tələblər

- **Auth:** Supabase Auth (və ya ekvivalent). Şifrələr client tərəfdə saxlanmır. Prototipdəki
  `USERS` massivi və test hesabları real sistemdə OLMAMALIDIR.
- **İcazə tətbiqi:** `caps()` məntiqi backend-də də tətbiq olunmalıdır (client-only kifayət deyil).
  Flag dəyişiklikləri (verify, mentor_enabled) yalnız admin/staff tərəfindən.
- **Dil:** Azərbaycan dili (i18n strukturu tövsiyə olunur).
- **Responsiv:** mobil/tablet/desktop; naviqasiya burger menyusu ilə.
- **Əlçatanlıq:** focus-visible, aria atributları, reduced-motion.
- **Vakansiya sinxronu:** mənbə saytlardan gündə 2 dəfə; ITBA müraciəti öz üzərinə götürmür.

---

## 17. Qorunmalı prinsiplər (məhsulun DNT-si)

1. Kimlik roldan, imkanlar flagdan gəlir; panel bloklardan yığılır.
2. Oxumaq pulsuz və qeydiyyatsızdır; əməliyyat qeydiyyat tələb edir.
3. Cavab vermək mentor imtiyazı deyil — potential da cavablayır.
4. `verified = false` yalnız məqalə + mentoru bağlayır, iştirakı yox.
5. Sinif rol deyil, flagdır; kurs bitəndə flag sönür, hesab qalır.
6. `mentor_enabled ≠ classroom_owner`; sinif icmadan ayrıdır.
7. ITBA satmır, komissiya almadır; SPONSOR sıralamaya təsir etmir.
8. Vakansiyada ITBA vasitəçi deyil; maaş uydurulmur.
9. Moderasiyada rədd səbəbli olmalıdır.
10. Metrikalar icma sağlamlığını ölçür, satışı yox.

---

*Bu sənəd `index.html` prototipinin v4 auth axınına əsaslanır. Real tətbiqdə auth, baza və
sinxron modulları bu qaydalara uyğun, lakin prodakşn-təhlükəsiz şəkildə qurulmalıdır.*
