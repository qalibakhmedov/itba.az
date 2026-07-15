-- itba.az — one-time migration: admin_wordings becomes per-language.
--
-- `wordings` JSONB shape changes from a flat object ({heroTitle: "...", ...})
-- to one nested under a language code ({az: {...}, en: {...}, ru: {...}}).
-- No schema/column change — same table, same single row (id = 1).
--
-- Existing saved edits (all Azerbaijani today) are wrapped under "az" so
-- nothing an admin already customized is lost. Safe to run more than
-- once — the `not (wordings ? 'az')` guard means it's a no-op if the
-- row is already in the new shape.
update admin_wordings
set wordings = jsonb_build_object('az', wordings)
where id = 1 and not (wordings ? 'az');
