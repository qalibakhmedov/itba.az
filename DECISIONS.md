# DECISIONS.md — Faza 0 qərarları

> Vəziyyət: 3 qərar HƏLL OLUNDU (dizayn, dil, fayl adı). 2 qərar SƏNİN CAVABINI gözləyir:
> Qərar 1 (rol xəritələməsi) və Qərar 4 (karyera testi). Aşağıdakı boş sətirləri doldur,
> faylı saxla, commit et və Claude Code-a Faza 1-ə başlamağı de.

---

## Qərar 1 — Köhnə rolların xəritələnməsi  ⬅️ CAVAB LAZIMDIR

Mövcud 6 rol → SPEC-in 4 rol + 5 flag modelinə keçir. Mövcud istifadəçilərin girişinə təsir edir.

| Köhnə rol | Tövsiyəm | Səbəb |
|---|---|---|
| `admin` | `admin` | Birbaşa uyğun |
| `ba_professional` | `professional` (+ `verified` flag) | Eyni konsept |
| `potential_ba` | `potential` | Eyni konsept |
| `junior_ba` | **BA kimi işləyirsə → `professional` (verified=false); öyrənən/keçiddədirsə → `potential`** | SPEC-də "junior" yoxdur — mahiyyətinə görə qərar |
| `teacher` | `professional` + `mentor_enabled=true` + `classroom_owner=true` | Sinif aparmaq = `classroom_owner` (moderator DEYİL) |
| `enrolled_student` | `potential` + `classroom_enrolled=true` | SPEC: "sinif rol deyil, flagdır" |
| — | `moderator` (yeni) | Sıfırdan yaranır |

**Cavablanmalı:** Sənin saytında `junior_ba` seçib qeydiyyatdan keçənlər adətən artıq BA
vəzifəsində işləyirlər (→ professional), yoxsa hələ öyrənən/işaxtaran adamlardır (→ potential)?

**Qərar (junior_ba):** _______________________________________________

**Qərar (qalan xəritələmə təsdiqi — teacher & enrolled_student):** _______________________

---

## Qərar 2 — Canonical dizayn  ✅ HƏLL OLUNDU

`reference/itba.html` (açıq tema, indiqo vurğu, Space Grotesk / Inter / JetBrains Mono) canonical
oldu. SPEC §14 bu tokenlərlə yeniləndi. Köhnə marketing səhifələri sonrakı ayrı fazada köçürülür.

---

## Qərar 3 — Dil siyasəti  ✅ HƏLL OLUNDU

AZ-first: yeni modullar Azərbaycan dilində. Mövcud AZ/EN/RU i18n pipeline SİLİNMİR — EN/RU
indiki halda prioritet deyil, sonraya saxlanılır.

---

## Qərar 4 — Karyera testi vs özünüqiymətləndirmə  ⬅️ CAVAB LAZIMDIR

Mövcud 25-suallıq dərin karyera testi (artıq investisiya olunub) vs SPEC-in 5-suallıq
qeydiyyatsız qısa versiyası — bunlar fərqli məhsullardır.

**Tövsiyəm:** Hər ikisi saxlanılır. 5-suallıq versiya qonaqlar üçün giriş funneli (nəticədən
sonra qeydiyyata / 25-suallıq testə yönləndirir), 25-suallıq versiya giriş etmiş istifadəçilər
üçün dərin diaqnostika kimi qalır.

**Qərar:** _______________________________________________
(Tövsiyəni qəbul edirsənsə sadəcə yaz: "hər ikisi saxlanılır")

---

## Qərar 5 — Prototip fayl adı  ✅ HƏLL OLUNDU

Canonical fayl `reference/itba.html`-dır. Sənədlər (CLAUDE.md, SPEC §14) buna işarə edir.

---

## Bağlandıqdan sonra

1. Yuxarıdakı 2 boş sətri doldur (Qərar 1 və Qərar 4), faylı saxla.
2. Commit: `git add DECISIONS.md && git commit -m "Close Faza 0 decisions"`
3. Claude Code-a de: *"DECISIONS.md və yenilənmiş docs/ITBA-SPEC.md-i oxu. Faza 0 bağlanıb.
   Faza 1-ə (identity/caps adapter qatı) başla — davranış dəyişməsin, yalnız daxili struktur.
   Diff planını göstər, təsdiqimi gözlə."*
