-- community/ — career test seed content (draft v1)
--
-- 13 questions across 3 categories. Explicitly meant to be edited later —
-- run against test_questions directly (Table Editor or SQL) since there's
-- no question-editing UI in Phase 1. Run after supabase/schema-phase1.sql.

insert into test_questions (category, question_text, options, order_index) values

-- Analytical thinking (5)
('analytical',
 'A stakeholder tells you "the report is wrong" with no other detail. What''s your first move?',
 '[{"text":"Dismiss it and rebuild the report from scratch","score":0},{"text":"Ask them exactly what looks wrong and compare it against expected values","score":3},{"text":"Escalate to the developer immediately","score":1},{"text":"Assume it''s a data refresh delay and wait","score":0}]'::jsonb,
 1),

('analytical',
 'You''re given a spreadsheet of raw sales data and asked to "find what''s driving the drop last month." How do you start?',
 '[{"text":"Guess based on gut feeling","score":0},{"text":"Break the drop down by region, product, and time period to isolate where it''s concentrated","score":3},{"text":"Ask someone else to analyze it","score":1},{"text":"Conclude the market is just bad","score":0}]'::jsonb,
 2),

('analytical',
 'Two documents describing the same business process disagree with each other. What do you do?',
 '[{"text":"Pick whichever was written more recently","score":1},{"text":"Trace both back to the people who own the process and reconcile the difference with them","score":3},{"text":"Merge them without checking","score":0},{"text":"Ignore the conflict — it''s not your job","score":0}]'::jsonb,
 3),

('analytical',
 'You notice a process has 6 approval steps, but only 2 of them ever result in a rejection. What''s the analytical instinct here?',
 '[{"text":"Nothing — that''s just how it is","score":0},{"text":"Question whether the other 4 steps add real value or just delay","score":3},{"text":"Add a 7th step for extra safety","score":0},{"text":"Assume the 2 rejecting steps should be removed instead","score":1}]'::jsonb,
 4),

('analytical',
 'Which best describes how you approach a problem with incomplete information?',
 '[{"text":"Wait until all the information arrives","score":0},{"text":"Make a reasonable assumption, state it explicitly, and proceed","score":3},{"text":"Guess silently and hope it''s right","score":1},{"text":"Ask someone else to decide","score":1}]'::jsonb,
 5),

-- Stakeholder communication (4)
('communication',
 'A senior stakeholder disagrees with a requirement you documented. How do you respond?',
 '[{"text":"Insist that you''re right","score":0},{"text":"Ask them to walk you through their concern and find where the requirement and their need diverge","score":3},{"text":"Quietly change it without discussion","score":1},{"text":"Escalate to your manager immediately","score":1}]'::jsonb,
 6),

('communication',
 'You must explain a technical limitation to a non-technical business owner. What''s the best approach?',
 '[{"text":"Use the same technical terms the developers used","score":0},{"text":"Translate it into business impact — what it means for their timeline, cost, or options","score":3},{"text":"Avoid the conversation and let IT explain it","score":0},{"text":"Tell them it''s too technical to explain","score":0}]'::jsonb,
 7),

('communication',
 'In a requirements workshop, two departments want contradictory things. What do you do?',
 '[{"text":"Side with whichever department is more senior","score":1},{"text":"Facilitate a discussion to surface the underlying business need behind each request","score":3},{"text":"Document both and let the developers pick","score":0},{"text":"Avoid the conflict topic in the meeting","score":0}]'::jsonb,
 8),

('communication',
 'How do you prefer to confirm you understood a stakeholder correctly?',
 '[{"text":"Assume you understood and move on","score":0},{"text":"Paraphrase it back to them and ask them to confirm","score":3},{"text":"Wait for them to notice if you got it wrong","score":0},{"text":"Send a long meeting transcript and hope they read it","score":1}]'::jsonb,
 9),

-- Tooling familiarity (4)
('tooling',
 'How familiar are you with process-modeling notations (e.g. BPMN, flowcharts)?',
 '[{"text":"Never heard of them","score":0},{"text":"I''ve seen them but never made one","score":1},{"text":"I''ve drawn simple flowcharts before","score":2},{"text":"I''ve used BPMN or something similar formally","score":3}]'::jsonb,
 10),

('tooling',
 'How comfortable are you writing user stories or acceptance criteria?',
 '[{"text":"Not familiar with the concept","score":0},{"text":"I understand the idea but haven''t written one","score":1},{"text":"I''ve written a few informally","score":2},{"text":"I write them regularly","score":3}]'::jsonb,
 11),

('tooling',
 'How would you rate your comfort level with spreadsheets (formulas, pivot tables, basic data analysis)?',
 '[{"text":"Basic data entry only","score":0},{"text":"Comfortable with formulas","score":1},{"text":"Comfortable with pivot tables and filtering","score":2},{"text":"Comfortable building small analyses or dashboards","score":3}]'::jsonb,
 12),

('tooling',
 'Have you used any project or task-tracking tools (Jira, Trello, Azure DevOps, etc.)?',
 '[{"text":"Never","score":0},{"text":"Used one briefly as a task-taker","score":1},{"text":"Used one regularly, including creating tickets","score":2},{"text":"Have configured or administered boards/workflows","score":3}]'::jsonb,
 13);
