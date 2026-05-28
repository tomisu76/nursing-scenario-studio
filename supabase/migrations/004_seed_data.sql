with s as (
  insert into public.studio_scenarios (id, owner_id, title, description, level, language, is_published)
  values
  (gen_random_uuid(), null, 'Greeting and Self Introduction', 'Basic opening script', 'beginner', 'en-th', true),
  (gen_random_uuid(), null, 'Vital Signs', 'Vitals conversation', 'beginner', 'en-th', true),
  (gen_random_uuid(), null, 'Pain Assessment', 'Pain interview flow', 'intermediate', 'en-th', true),
  (gen_random_uuid(), null, 'Shortness of Breath', 'Respiratory assessment', 'intermediate', 'en-th', true),
  (gen_random_uuid(), null, 'SBAR Handover', 'Structured handover', 'advanced', 'en-th', true)
  returning id, title
)
insert into public.studio_slides (scenario_id, slide_number, slide_key, title, student_text, patient_text, teacher_note, audio_text, audio_status)
select s.id, v.slide_number, 'slide-' || lpad(v.slide_number::text, 3, '0'), v.title, v.student_text, v.patient_text, v.teacher_note, v.audio_text, 'missing'
from s
join lateral (
  values
  (1, 'Opening', 'Hello, my name is Nurse Amy.', 'Hello nurse.', 'Check eye contact and pace.', 'Hello, my name is Nurse Amy. Hello nurse.'),
  (2, 'Identity Check', 'Can I confirm your name?', 'I am Mr. Somchai.', 'Teach name/date verification.', 'Can I confirm your name? I am Mr. Somchai.'),
  (3, 'Purpose', 'I will ask a few questions today.', 'Okay.', 'Clear transition language.', 'I will ask a few questions today. Okay.')
) as v(slide_number,title,student_text,patient_text,teacher_note,audio_text) on s.title='Greeting and Self Introduction'
union all
select s.id, v.slide_number, 'slide-' || lpad(v.slide_number::text, 3, '0'), v.title, v.student_text, v.patient_text, v.teacher_note, v.audio_text, 'missing'
from s
join lateral (values
  (1,'Preparation','I will check your vital signs now.','Sure.','Confirm consent first.','I will check your vital signs now. Sure.'),
  (2,'Blood Pressure','Please relax your arm for blood pressure.','Okay.','Explain cuff sensation.','Please relax your arm for blood pressure.'),
  (3,'Pulse','I am checking your pulse rate.','Alright.','Count silently for 30 seconds.','I am checking your pulse rate.'),
  (4,'Temperature','I will take your temperature.','No problem.','Mention route used.','I will take your temperature.')
) as v(slide_number,title,student_text,patient_text,teacher_note,audio_text) on s.title='Vital Signs'
union all
select s.id, v.slide_number, 'slide-' || lpad(v.slide_number::text, 3, '0'), v.title, v.student_text, v.patient_text, v.teacher_note, v.audio_text, 'missing'
from s
join lateral (values
  (1,'Pain Onset','When did your pain start?','Last night.','Use OPQRST structure.','When did your pain start? Last night.'),
  (2,'Pain Scale','How severe is the pain from 0 to 10?','It is 7.','Clarify numeric scale.','How severe is the pain from 0 to 10? It is 7.'),
  (3,'Pain Location','Where do you feel the pain?','In my lower back.','Ask radiation as follow-up.','Where do you feel the pain? In my lower back.'),
  (4,'Aggravating Factors','What makes it worse?','Walking makes it worse.','Ask relieving factors too.','What makes it worse? Walking makes it worse.')
) as v(slide_number,title,student_text,patient_text,teacher_note,audio_text) on s.title='Pain Assessment'
union all
select s.id, v.slide_number, 'slide-' || lpad(v.slide_number::text, 3, '0'), v.title, v.student_text, v.patient_text, v.teacher_note, v.audio_text, 'missing'
from s
join lateral (values
  (1,'Symptom Check','Are you short of breath right now?','Yes, a little.','Assess current severity first.','Are you short of breath right now? Yes, a little.'),
  (2,'Duration','How long have you felt this way?','Since this morning.','Capture onset timing.','How long have you felt this way? Since this morning.'),
  (3,'Associated Symptoms','Do you have chest pain or cough?','I have cough but no chest pain.','Screen for red flags.','Do you have chest pain or cough?'),
  (4,'Positioning','Does sitting up help your breathing?','Yes, it helps.','Note orthopnea clues.','Does sitting up help your breathing? Yes, it helps.')
) as v(slide_number,title,student_text,patient_text,teacher_note,audio_text) on s.title='Shortness of Breath'
union all
select s.id, v.slide_number, 'slide-' || lpad(v.slide_number::text, 3, '0'), v.title, v.student_text, v.patient_text, v.teacher_note, v.audio_text, 'missing'
from s
join lateral (values
  (1,'Situation','This is Nurse Amy in Ward B about Mr. Somchai.','Okay, go ahead.','Start with clear situation.','This is Nurse Amy in Ward B about Mr. Somchai.'),
  (2,'Background','He was admitted for pneumonia yesterday.','Understood.','Provide concise background.','He was admitted for pneumonia yesterday.'),
  (3,'Assessment','His oxygen saturation dropped to 90 percent.','Noted.','Include objective data.','His oxygen saturation dropped to 90 percent.'),
  (4,'Recommendation','Please review him urgently.','I will come now.','End with specific request.','Please review him urgently.')
) as v(slide_number,title,student_text,patient_text,teacher_note,audio_text) on s.title='SBAR Handover';
