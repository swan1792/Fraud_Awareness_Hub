-- Fraud Awareness Hub - SQLite Schema

-- Admin Users (JWT Auth)
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('super_admin', 'admin')),
  created_at TEXT NOT NULL
);

-- Scam Alerts (Admin CRUD)
CREATE TABLE IF NOT EXISTS scam_alerts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_my TEXT,
  category TEXT NOT NULL CHECK(category IN ('Fake APK', 'Phishing Link', 'Social Engineering')),
  description TEXT NOT NULL,
  description_my TEXT,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published'))
);

-- Scam Patterns (read-only reference data)
CREATE TABLE IF NOT EXISTS scam_patterns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Fake APK', 'Phishing Link', 'Social Engineering')),
  description TEXT NOT NULL,
  red_flags TEXT NOT NULL, -- JSON array
  example TEXT NOT NULL,
  icon TEXT NOT NULL
);

-- Adventure Scenarios (branching story game)
CREATE TABLE IF NOT EXISTS adventure_scenarios (
  id TEXT PRIMARY KEY,
  act INTEGER NOT NULL,
  scene INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('SMS', 'Viber', 'Email')),
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  choices TEXT NOT NULL, -- JSON array of 3 choice objects
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL, -- JSON array of 3 explanations (one per choice)
  red_flags TEXT NOT NULL -- JSON array
);

-- Game Scenarios (read-only reference data)
CREATE TABLE IF NOT EXISTS game_scenarios (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK(channel IN ('SMS', 'Viber', 'Email')),
  sender TEXT NOT NULL,
  message TEXT NOT NULL,
  is_scam INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL,
  red_flags TEXT NOT NULL -- JSON array
);

-- Seed: scam_alerts
INSERT OR IGNORE INTO scam_alerts (id, title, title_my, category, description, description_my, date, status) VALUES
('alert-001', 'Fake KPay APK Spreading via Viber', 'Viber တွင် ဖြန့်ဝေနေသော KPay APK အတု', 'Fake APK', 'A malicious APK disguised as a KPay update is being shared in Viber groups across Yangon. The app steals login credentials and OTP codes.', 'KPay update အဖြစ် ထိုးဖောက်ထားသော malware APK တစ်ခုကို ရန်ကုန်တစ်ဝိုက်ရှိ Viber ဂရုပ်များတွင် ဖြန့်ဝေနေပါသည်။ အဆိုပါ app သည် login credentials နှင့် OTP codes များကို ခိုးယူပါသည်။', '2026-07-01', 'published'),
('alert-002', 'KBZ Bank OTP Phishing SMS', 'KBZ Bank OTP phishing SMS', 'Phishing Link', 'Mass SMS campaign targeting KBZ customers with fake ''account locked'' messages containing phishing links to kbz-verify.net.', 'KBZ ဖောက်သည်များကို ပစ်မှတ်ထား၍ ''account locked'' မက်ဆေ့ခ်ျအတုများဖြင့် kbz-verify.net သို့ phishing link များ ပါဝင်သော SMS စည်းရုံးလှုပ်ရှားမှုကြီး ဖြစ်ပေါ်နေပါသည်။', '2026-06-28', 'published'),
('alert-003', 'Wave Money Refund Phone Scam', 'Wave Money ငွေပြန်အမ်းခေါ်ဆိုမှု လိမ်လည်မှု', 'Social Engineering', 'Scammers calling Wave Money users claiming they have a pending refund, then asking for PIN codes to ''process'' the refund.', 'လိမ်လည်သူများသည် Wave Money သုံးစွဲသူများကို ခေါ်ဆို၍ ငွေပြန်အမ်းရန်ရှိနေကြောင်း ပြောဆိုပြီး ငွေပြန်အမ်းရန် PIN codes ကို တောင်းခံပါသည်။', '2026-06-25', 'published'),
('alert-004', 'Fake Government Relief Website', 'အစိုးရ ကယ်ဆယ်ရေးဝက်ဘ်ဆိုက်အတု', 'Phishing Link', 'A website at gov-mm-relief.com is collecting personal and bank account details by impersonating a government subsidy program.', 'gov-mm-relief.com ရှိ ဝက်ဘ်ဆိုက်တစ်ခုသည် အစိုးရအကူအညီထောက်ပံ့ရေးအစီအစဉ်အဖြစ် ထိုးဖောက်၍ ကိုယ်ရေးအချက်အလက်နှင့် ဘဏ်အကောင်ထည်များကို စုဆောင်းနေပါသည်။', '2026-06-20', 'published');

-- Seed: scam_patterns
INSERT OR IGNORE INTO scam_patterns (id, title, category, description, red_flags, example, icon) VALUES
('fake-kpay-apk', 'Fake KPay APK', 'Fake APK', 'Scammers send links to download a fake KPay app that steals your login credentials and OTP codes.', '["Download link from unknown Viber/Telegram groups","App asks for excessive permissions","Misspelled app name (e.g., ''KPayy'' or ''K-Pay'')"]', 'Download the new KPay Pro APK here: http://kpay-update.xyz/download.apk', 'download'),
('kbz-otp-phishing', 'KBZ Bank OTP Scam', 'Phishing Link', 'A fake SMS or message claiming your KBZ account is locked, asking you to click a link and enter your OTP.', '["Urgent language like ''Account will be locked in 24 hours''","URL is not kbzbank.com","Asks for OTP — banks never ask for this"]', 'Your KBZ account is locked. Verify now: http://kbz-verify.net/auth', 'link'),
('wave-money-refund', 'Wave Money Refund Scam', 'Social Engineering', 'Caller pretends to be from Wave Money support and claims you''re owed a refund, then asks for your PIN.', '["Unsolicited call claiming you have a refund","Asks for your PIN or OTP over the phone","Creates urgency: ''Refund expires in 1 hour''"]', 'Hello, this is Wave Money support. You have a 50,000 MMK refund. Please share your PIN to process it.', 'phone'),
('viber-investment', 'Viber Investment Group', 'Social Engineering', 'A Viber group promising guaranteed returns on crypto or forex trading, targeting Myanmar users with fake testimonials.', '["Promises of guaranteed high returns (e.g., ''50% per week'')","Pressure to recruit friends for bonuses","Fake screenshots of profits from ''members''"]', 'Join our VIP trading group! Guaranteed 30% profit weekly. Send 100,000 MMK to start. Limited spots!', 'users'),
('delivery-scam', 'Parcel Delivery Phishing', 'Phishing Link', 'Fake delivery notification claiming you have a package stuck at customs, requesting a ''clearance fee'' via mobile payment.', '["You didn''t order anything","Asks for payment via mobile wallet before delivery","Generic message with no tracking details"]', 'Your parcel is held at customs. Pay 15,000 MMK clearance fee via Wave Money: http://parcel-mm.com/pay', 'package'),
('gov-subsidy', 'Government Subsidy Scam', 'Phishing Link', 'Fake government website claiming to offer COVID-19 or disaster relief subsidies, collecting personal and financial data.', '["Domain is not a .gov.mm site","Asks for bank account details to ''deposit subsidy''","Poor grammar and unofficial logos"]', 'Apply for 200,000 MMK government relief: http://gov-mm-relief.com/register', 'landmark');

-- Game Stages (admin-manageable 2D action story game)
CREATE TABLE IF NOT EXISTS game_stages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Fake APK', 'Phishing Link', 'Social Engineering')),
  description TEXT,
  difficulty INTEGER DEFAULT 1 CHECK(difficulty BETWEEN 1 AND 5),
  scammer_line TEXT NOT NULL,
  correct_intervention TEXT NOT NULL,
  why_text TEXT NOT NULL,
  do_text TEXT NOT NULL,
  dont_text TEXT NOT NULL,
  assets TEXT, -- JSON for sprite/background refs
  is_published INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Target Lines (ordered escalation per stage)
CREATE TABLE IF NOT EXISTS target_lines (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL,
  line_text TEXT NOT NULL,
  line_order INTEGER NOT NULL,
  FOREIGN KEY (stage_id) REFERENCES game_stages(id) ON DELETE CASCADE
);

-- Character Skins (palette-swapped variants)
CREATE TABLE IF NOT EXISTS character_skins (
  id TEXT PRIMARY KEY,
  character_type TEXT NOT NULL CHECK(character_type IN ('scammer', 'target', 'good_friend')),
  variant_name TEXT NOT NULL,
  css_class TEXT, -- Tailwind classes for styling
  created_at TEXT NOT NULL
);

-- Stage Interventions (tappable chips with distractors)
CREATE TABLE IF NOT EXISTS stage_interventions (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL,
  intervention_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL,
  FOREIGN KEY (stage_id) REFERENCES game_stages(id) ON DELETE CASCADE
);

-- Seed: adventure_scenarios (6 branching story scenarios)
INSERT OR IGNORE INTO adventure_scenarios (id, act, scene, channel, sender, message, choices, correct_index, explanation, red_flags) VALUES
('adv-1-1', 1, 1, 'SMS', 'KBZ Bank', 'URGENT: Your KBZ account has been locked due to suspicious activity. You must verify within 2 hours or your account will be permanently suspended. Click here: http://kbz-secure-verify.com/login',
'["Click the link and enter your login details to verify", "Ignore it — KBZ Bank never locks accounts via SMS links", "Call KBZ Bank hotline to ask if this is real"]', 1,
'["You entered your credentials on a fake website. The scammers now have your login details and can access your real account.", "Correct! KBZ Bank never sends verification links via SMS. The URL is not kbzbank.com — it is a phishing site.", "Good instinct to verify, but the link is already a red flag. Always check the sender domain first before clicking anything."]',
'["Fake urgency (2-hour deadline)", "Suspicious URL not matching kbzbank.com", "Banks never ask you to verify via SMS links"]'),
('adv-1-2', 1, 2, 'Viber', 'Ma Khin (Friend)', 'Hey! I just got 100,000 MMK free from this government relief program. Register here before it ends today! http://gov-relief-mm.org/register — Mya helped me sign up too!',
'["Register right away — you don''t want to miss free money", "Ask your friend if this is really from the government", "Ignore it — government programs use official .gov.mm websites"]', 2,
'["You signed up on a fake website and gave away your personal information and bank details. This is a phishing scam.", "Good to verify with your friend, but they may have been scammed too. Always check if the website is an official .gov.mm domain.", "Correct! The domain is .org, not .gov.mm. Real government programs are announced officially, not through Viber forwarded messages."]',
'["Pressure to act quickly (\"before it ends today\")", "Non-government domain (.org instead of .gov.mm)", "Forwarded message chain — common in scam distribution"]'),
('adv-2-1', 2, 1, 'Email', 'Myanmar Supplies Co. <invoices@myanmarsupplies.co>', 'Dear Sir/Madam, please find attached invoice #INV-2026-0847 for office supplies delivered on July 10. Amount: 850,000 MMK. Payment due within 3 days. KBZ Account: 1234567890123456.',
'["Pay the invoice immediately — you don''t want to be late", "Forward to your accounts team to verify before paying", "Check if you actually ordered anything from this company recently"]', 2,
'["You paid 850,000 MMK to scammers. The invoice was fake — you never received any supplies.", "Good practice to verify with your team, but step 1 is confirming the order existed.", "Correct! Always verify that you actually placed an order before paying any invoice. Scammers send fake invoices hoping companies pay without questioning."]',
'["You never ordered from this company", "Urgency pressure (3-day deadline)", "Generic greeting (\"Dear Sir/Madam\") instead of your name"]'),
('adv-2-2', 2, 2, 'SMS', 'Telenor Myanmar', 'Congratulations! Your number has won 5,000,000 MMK in the Telenor Lucky Draw! Claim your prize now by calling +959-888-777-666 or visiting http://telenor-prize-mm.com. You have 24 hours to claim!',
'["Call the number to claim your prize — 5 million is a lot of money!", "Visit the website to see if it is real", "Ignore it — you never entered any lucky draw"]', 2,
'["You called a premium-rate scam number and they kept you on the line to charge fees, then asked for your NRC details to \"verify\" your identity.", "The website is designed to steal your personal information. It looks official but is not the real Telenor site.", "Correct! You never entered a lucky draw, so you cannot have won. Legitimate prizes don''t require you to call or visit a website — they contact you directly."]',
'["You never entered any lucky draw", "Urgency (24-hour deadline)", "Fake prize to lure victims", "Non-official website domain"]'),
('adv-3-1', 3, 1, 'Viber', 'Nay Chi (new friend)', 'Hi! We chatted on Facebook last week. I work at a trading company and we have a special program — invest 200,000 MMK and get 50% return in just 5 days! I started with 100K and already earned 50K. Want me to show you how? Trust me, this is real.',
'["Invest 200,000 MMK — the returns sound amazing and your friend recommends it", "Ask to meet in person or see official company documents first", "Block and report — guaranteed returns and urgency are classic scam signs"]', 2,
'["You transferred 200,000 MMK to a scammer''s account. \"Nay Chi\" disappears after receiving your money. This is a romance/investment scam.", "Asking for documentation is smart, but scammers can forge documents. The red flags are already clear.", "Correct! \"Guaranteed returns\" do not exist in legitimate investing. The pressure, fake testimonials, and urgency are all scam tactics."]',
'["Guaranteed high returns (50% in 5 days) — impossible in legitimate investing", "Asks for money transfer to personal account", "Creates urgency and social proof with fake earnings"]'),
('adv-3-2', 3, 2, 'Email', 'KBZ Bank Security <security@kbzbank-alerts.com>', 'Dear KBZ customer, we detected an unauthorized login attempt on your account from an unknown device in Mandalay. For your protection, please verify your identity by replying with the OTP sent to your phone. If you do not respond within 1 hour, your account will be frozen for 30 days.',
'["Reply with the OTP quickly — you don''t want your account frozen", "Forward the email to KBZ Bank''s official support to verify", "Ignore it — KBZ Bank will never ask for your OTP via email"]', 2,
'["You gave scammers your OTP. They used it to access your KBZ account and transfer out your money. Never share OTPs with anyone — even if the request seems urgent.", "Good idea to verify, but the email is already suspicious. The domain is kbzbank-alerts.com, not kbzbank.com.", "Correct! Banks NEVER ask for OTPs via email, SMS, or phone. The fake urgency (1-hour deadline) and non-official domain are clear red flags."]',
'["Banks never ask for OTPs via email", "Fake urgency (1-hour deadline)", "Non-official domain (kbzbank-alerts.com instead of kbzbank.com)", "Threatening account freeze to create panic"]');

-- Seed: game_scenarios
INSERT OR IGNORE INTO game_scenarios (id, channel, sender, message, is_scam, explanation, red_flags) VALUES
('game-1', 'SMS', 'KBZ-Bank', 'Your KBZ account is temporarily locked due to unusual activity. Verify your identity immediately: http://kbz-secure-login.com/verify', 1, 'KBZ Bank will never send verification links via SMS. The URL ''kbz-secure-login.com'' is not the official kbzbank.com domain.', '["Fake urgency: ''temporarily locked''","Suspicious URL not matching official domain","Banks never ask you to verify via SMS links"]'),
('game-2', 'Viber', 'Ma Sandar', 'Hey! I just got 50,000 MMK free from this government program. Register here before it ends today: http://myanmar-relief.org', 1, 'This is a classic social engineering attack. Government programs use official .gov.mm domains, and real programs don''t require urgent registration via Viber links.', '["Pressure to act quickly (''before it ends today'')","Non-government domain (.org instead of .gov.mm)","Unsolicited message from a contact about money"]'),
('game-3', 'Email', 'Wave Money <support@wavemoney.com.mm>', 'Dear customer, your Wave Money account has been credited with 100,000 MMK from a recent transfer. Log in to view: https://www.wavemoney.com.mm/login', 0, 'This message uses the official Wave Money domain and directs you to the real website rather than asking for credentials in the message itself.', '[]'),
('game-4', 'Viber', 'KPay Official', 'KPay system maintenance notice: All users must update their app now or lose access. Download the latest version: http://kpay-maintenance.apk', 1, 'Legitimate apps update through official app stores (Google Play, App Store), not through direct APK download links shared on Viber.', '["Direct APK download link instead of app store","Creates panic with ''lose access'' threat","Sender name ''KPay Official'' on Viber is not verified"]'),
('game-5', 'SMS', '+959-123-456-789', 'Your OTP for Wave Money transfer is 847256. Do not share this code with anyone. - Wave Money', 0, 'This is a standard OTP message. Note that it warns you NOT to share the code — a real OTP message will never ask you to share it with anyone.', '[]'),
('game-6', 'Email', 'Myanmar Post <delivery@myanmar-post-service.com>', 'Your package (ID: MMK-29481) is held at Yangon customs. Pay 25,000 MMK processing fee via KBZPay to release: http://customs-fee-mm.com', 1, 'Myanmar Post uses the official domain myanmarpost.mm. Real customs fees are paid at the post office, not through third-party payment links.', '["Non-official email domain","Asks for payment via mobile wallet link","Suspicious URL for customs payment"]'),
('game-7', 'Viber', 'U Aung Kyaw', 'Congratulations! You''ve been selected for a special investment opportunity. Guaranteed 200% return in 7 days. Send 50,000 MMK to start. This offer expires in 2 hours!', 1, 'No legitimate investment guarantees returns. The extreme urgency (''2 hours'') and unrealistic returns (''200% in 7 days'') are classic scam tactics.', '["Guaranteed high returns are always a scam","Extreme artificial urgency","Asks for money upfront via message"]'),
('game-8', 'Email', 'KBZ Bank <noreply@kbzbank.com>', 'Dear valued customer, KBZ Bank will never ask for your password, PIN, or OTP via email, SMS, or phone. If you receive suspicious messages, please call our hotline at 01-234-5678. Stay safe!', 0, 'This is a genuine security awareness message from KBZ Bank. It uses the official domain and does NOT ask for any personal information — instead, it warns you about scams.', '[]');

-- Seed: game_stages (6 initial stages from scam_patterns)
INSERT OR IGNORE INTO game_stages (id, title, category, description, difficulty, scammer_line, correct_intervention, why_text, do_text, dont_text, is_published, created_at, updated_at) VALUES
('stage-1', 'Fake KPay APK', 'Fake APK', 'A friend shares a "KPay update" link in a Viber group. The app is fake and steals your credentials.', 2, 'They''ll install it without checking the source', 'Wait — real KPay updates come from the app store, not Viber links!', 'Scammers distribute fake APKs through messaging groups, mimicking popular payment apps.', 'Always download apps from official stores (Google Play, App Store).', 'Never install APKs shared via messaging apps or links.', 1, datetime('now'), datetime('now')),
('stage-2', 'KBZ Bank OTP Scam', 'Phishing Link', 'A SMS claims your KBZ account is locked and asks you to verify via a link.', 2, 'They''ll enter the OTP without thinking', 'Stop — KBZ Bank never asks for OTPs via SMS links!', 'Phishing SMS uses urgency to trick you into entering credentials on fake sites.', 'Call KBZ Bank directly using the official number on their website.', 'Never enter OTPs or PINs on links sent via SMS.', 1, datetime('now'), datetime('now')),
('stage-3', 'Wave Money Refund Scam', 'Social Engineering', 'A caller claims you have a pending refund and asks for your PIN to "process" it.', 3, 'They''ll share their PIN for the refund', 'Hang up — Wave Money never asks for PINs over the phone!', 'Scammers impersonate support staff to extract PINs and OTPs.', 'Contact Wave Money through the official app or hotline.', 'Never share your PIN or OTP with anyone over the phone.', 1, datetime('now'), datetime('now')),
('stage-4', 'Viber Investment Group', 'Social Engineering', 'A Viber group promises guaranteed returns and uses fake testimonials.', 4, 'They''ll send money for guaranteed returns', 'Don''t do it — guaranteed high returns are always a scam!', 'Investment scams use fake profits and testimonials to lure victims.', 'Research investments through official financial regulators.', 'Never send money to "investment opportunities" found on social media.', 1, datetime('now'), datetime('now')),
('stage-5', 'Parcel Delivery Phishing', 'Phishing Link', 'A message claims your package is stuck at customs and needs a clearance fee.', 2, 'They''ll pay the clearance fee', 'Wait — you didn''t order anything! This is a phishing scam.', 'Fake delivery scams request payments for non-existent packages.', 'Track packages through official postal service websites.', 'Never pay fees for packages you didn''t order.', 1, datetime('now'), datetime('now')),
('stage-6', 'Government Subsidy Scam', 'Phishing Link', 'A fake government site collects personal data for a "relief subsidy".', 3, 'They''ll enter their bank details', 'Don''t enter anything — real government sites use .gov.mm domains!', 'Scammers create fake government sites to harvest personal and financial data.', 'Verify subsidy programs through official government channels.', 'Never enter bank details on non-government websites.', 1, datetime('now'), datetime('now'));

-- Seed: target_lines (escalation per stage)
INSERT OR IGNORE INTO target_lines (id, stage_id, line_text, line_order) VALUES
-- Stage 1: Fake KPay APK
('tl-1-1', 'stage-1', 'Should I download this KPay update?', 1),
('tl-1-2', 'stage-1', 'It says it''s urgent...', 2),
('tl-1-3', 'stage-1', 'Fine, I''ll install it now', 3),
-- Stage 2: KBZ Bank OTP Scam
('tl-2-1', 'stage-2', 'Oh no, my account is locked?', 1),
('tl-2-2', 'stage-2', 'I need to verify immediately', 2),
('tl-2-3', 'stage-2', 'I''ll enter the OTP now', 3),
-- Stage 3: Wave Money Refund Scam
('tl-3-1', 'stage-3', 'A refund? That sounds nice', 1),
('tl-3-2', 'stage-3', 'They need my PIN to process it?', 2),
('tl-3-3', 'stage-3', 'I''ll share it quickly', 3),
-- Stage 4: Viber Investment Group
('tl-4-1', 'stage-4', '30% profit weekly? Really?', 1),
('tl-4-2', 'stage-4', 'How do I join the group?', 2),
('tl-4-3', 'stage-4', 'I''ll send the money now', 3),
-- Stage 5: Parcel Delivery Phishing
('tl-5-1', 'stage-5', 'I have a package at customs?', 1),
('tl-5-2', 'stage-5', 'I need to pay the fee to release it', 2),
('tl-5-3', 'stage-5', 'I''ll pay it right away', 3),
-- Stage 6: Government Subsidy Scam
('tl-6-1', 'stage-6', 'Government relief money? I need this', 1),
('tl-6-2', 'stage-6', 'I should register before it ends', 2),
('tl-6-3', 'stage-6', 'I''ll enter my bank details', 3);

-- Seed: character_skins (default variants)
INSERT OR IGNORE INTO character_skins (id, character_type, variant_name, css_class, created_at) VALUES
('skin-scammer-1', 'scammer', 'Bank Representative', 'bg-red-100 border-red-300', datetime('now')),
('skin-scammer-2', 'scammer', 'Delivery Agent', 'bg-red-100 border-red-300', datetime('now')),
('skin-scammer-3', 'scammer', 'Government Officer', 'bg-red-100 border-red-300', datetime('now')),
('skin-target-1', 'target', 'Default', 'bg-blue-100 border-blue-300', datetime('now')),
('skin-friend-1', 'good_friend', 'Default', 'bg-green-100 border-green-300', datetime('now'));

-- Seed: stage_interventions (1 correct + 2-3 distractors per stage)
INSERT OR IGNORE INTO stage_interventions (id, stage_id, intervention_text, is_correct, display_order) VALUES
-- Stage 1: Fake KPay APK
('int-1-1', 'stage-1', 'Check the official KPay app store page', 1, 1),
('int-1-2', 'stage-1', 'Download it quickly before the link expires', 0, 2),
('int-1-3', 'stage-1', 'Ask them to send a screenshot of the app', 0, 3),
-- Stage 2: KBZ Bank OTP Scam
('int-2-1', 'stage-2', 'Call KBZ''s official hotline to verify', 1, 1),
('int-2-2', 'stage-2', 'Ask them to confirm your account number first', 0, 2),
('int-2-3', 'stage-2', 'Enter the OTP quickly before it expires', 0, 3),
-- Stage 3: Wave Money Refund Scam
('int-3-1', 'stage-3', 'Hang up and call Wave Money directly', 1, 1),
('int-3-2', 'stage-3', 'Ask for their employee ID number', 0, 2),
('int-3-3', 'stage-3', 'Share your PIN so they can process it', 0, 3),
-- Stage 4: Viber Investment Group
('int-4-1', 'stage-4', 'Research the company on official regulators'' websites', 1, 1),
('int-4-2', 'stage-4', 'Ask members for proof of profits', 0, 2),
('int-4-3', 'stage-4', 'Send a small amount to test it first', 0, 3),
-- Stage 5: Parcel Delivery Phishing
('int-5-1', 'stage-5', 'Check tracking on the official postal website', 1, 1),
('int-5-2', 'stage-5', 'Ask them to send the tracking number', 0, 2),
('int-5-3', 'stage-5', 'Pay the fee to release your package', 0, 3),
-- Stage 6: Government Subsidy Scam
('int-6-1', 'stage-6', 'Verify on the official .gov.mm website', 1, 1),
('int-6-2', 'stage-6', 'Check if the site has a padlock icon', 0, 2),
('int-6-3', 'stage-6', 'Enter your details to claim the subsidy', 0, 3);

-- ─── Fraud City: World Maps ──────────────────────────────────

CREATE TABLE IF NOT EXISTS world_maps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  width INTEGER NOT NULL DEFAULT 40,
  height INTEGER NOT NULL DEFAULT 30,
  tile_size INTEGER NOT NULL DEFAULT 16,
  bg_color TEXT DEFAULT '#2d5016',
  ambient_light REAL DEFAULT 1.0,
  music_track TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS world_objects (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL,
  object_type TEXT NOT NULL CHECK(object_type IN ('building', 'tree', 'bench', 'light', 'sign', 'door', 'wall', 'water', 'npc_spot', 'mission_spot')),
  name TEXT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  width INTEGER NOT NULL DEFAULT 1,
  height INTEGER NOT NULL DEFAULT 1,
  solid INTEGER NOT NULL DEFAULT 1,
  interactive INTEGER NOT NULL DEFAULT 0,
  interaction_type TEXT,
  data TEXT,
  sprite TEXT,
  FOREIGN KEY (map_id) REFERENCES world_maps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS world_npcs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  npc_type TEXT NOT NULL CHECK(npc_type IN ('citizen', 'police', 'bank_staff', 'teacher', 'delivery', 'elderly', 'student', 'scammer', 'business_owner')),
  map_id TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  sprite TEXT DEFAULT 'citizen',
  patrol_x1 INTEGER,
  patrol_y1 INTEGER,
  patrol_x2 INTEGER,
  patrol_y2 INTEGER,
  dialogue_id TEXT,
  trust_level INTEGER DEFAULT 50,
  is_visible INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (map_id) REFERENCES world_maps(id) ON DELETE CASCADE
);

-- Seed: world_maps
INSERT OR IGNORE INTO world_maps (id, name, display_name, description, width, height, bg_color, created_at, updated_at) VALUES
('home', 'home', 'Your Home', 'A cozy apartment in the city center.', 20, 15, '#8b7355', datetime('now'), datetime('now')),
('neighborhood', 'neighborhood', 'Neighborhood', 'A quiet residential area with shops and families.', 40, 30, '#2d5016', datetime('now'), datetime('now')),
('market', 'market', 'Central Market', 'A bustling market full of vendors and suspicious deals.', 50, 35, '#c4a882', datetime('now'), datetime('now'));

-- Seed: world_objects (neighborhood map)
INSERT OR IGNORE INTO world_objects (id, map_id, object_type, name, x, y, width, height, solid, interactive, interaction_type, sprite) VALUES
-- Buildings
('obj-nb-1', 'neighborhood', 'building', 'Player House', 5, 5, 4, 3, 1, 1, 'door_home', 'house'),
('obj-nb-2', 'neighborhood', 'building', 'Coffee Shop', 15, 5, 3, 3, 1, 1, 'enter_coffee', 'coffee_shop'),
('obj-nb-3', 'neighborhood', 'building', 'School', 28, 5, 5, 4, 1, 1, 'enter_school', 'school'),
('obj-nb-4', 'neighborhood', 'building', 'ATM Booth', 10, 15, 2, 2, 1, 1, 'inspect_atm', 'atm'),
('obj-nb-5', 'neighborhood', 'building', 'Mini Mart', 20, 15, 3, 2, 1, 1, 'enter_mart', 'mini_mart'),
-- Nature
('obj-nb-t1', 'neighborhood', 'tree', 'Oak Tree', 2, 2, 1, 2, 1, 0, NULL, 'tree'),
('obj-nb-t2', 'neighborhood', 'tree', 'Palm Tree', 12, 1, 1, 2, 1, 0, NULL, 'tree'),
('obj-nb-t3', 'neighborhood', 'tree', 'Bush', 25, 12, 1, 1, 1, 0, NULL, 'bush'),
-- Street furniture
('obj-nb-b1', 'neighborhood', 'bench', 'Park Bench', 8, 10, 2, 1, 1, 1, 'sit', 'bench'),
('obj-nb-l1', 'neighborhood', 'light', 'Street Light', 0, 8, 1, 1, 0, 0, NULL, 'street_light'),
('obj-nb-l2', 'neighborhood', 'light', 'Street Light', 15, 8, 1, 1, 0, 0, NULL, 'street_light'),
('obj-nb-s1', 'neighborhood', 'sign', 'Welcome Sign', 0, 0, 2, 1, 1, 1, 'read_sign', 'sign');

-- Seed: world_npcs
INSERT OR IGNORE INTO world_npcs (id, name, npc_type, map_id, x, y, sprite, patrol_x1, patrol_y1, patrol_x2, patrol_y2, trust_level, is_visible, created_at) VALUES
('npc-1', 'U Kyaw Win', 'elderly', 'neighborhood', 10, 10, 'elderly', 8, 10, 14, 10, 60, 1, datetime('now')),
('npc-2', 'Ma Thida', 'citizen', 'neighborhood', 18, 8, 'citizen', 16, 8, 22, 8, 50, 1, datetime('now')),
('npc-3', 'Sgt. Aung', 'police', 'neighborhood', 25, 10, 'police', 24, 10, 26, 10, 70, 1, datetime('now')),
('npc-4', 'Ko Min Htike', 'delivery', 'neighborhood', 5, 12, 'delivery', 3, 12, 12, 12, 45, 1, datetime('now')),
('npc-5', 'Daw Thin Thin', 'elderly', 'market', 10, 10, 'elderly', 8, 10, 14, 10, 55, 1, datetime('now')),
('npc-6', 'Shady Guy', 'scammer', 'market', 30, 20, 'scammer', 28, 20, 35, 20, 10, 1, datetime('now'));

-- ─── Fraud City: NPC Dialogues ───────────────────────────────

CREATE TABLE IF NOT EXISTS dialogues (
  id TEXT PRIMARY KEY,
  npc_id TEXT NOT NULL,
  chapter TEXT DEFAULT 'chapter-1',
  title TEXT,
  lines TEXT NOT NULL, -- JSON array of { speaker, text, emotion }
  choices TEXT, -- JSON array of { text, next_dialogue_id, trust_change, requirement }
  is_available INTEGER DEFAULT 1,
  prereq_dialogue_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (npc_id) REFERENCES world_npcs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS npc_relationships (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL DEFAULT 'player-1',
  npc_id TEXT NOT NULL,
  trust_level INTEGER DEFAULT 50,
  met INTEGER DEFAULT 0,
  total_talks INTEGER DEFAULT 0,
  last_talk_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(player_id, npc_id),
  FOREIGN KEY (npc_id) REFERENCES world_npcs(id) ON DELETE CASCADE
);

-- Seed: dialogues
INSERT OR IGNORE INTO dialogues (id, npc_id, chapter, title, lines, choices, created_at) VALUES
-- U Kyaw Win (elderly, neighborhood) - knows about ATM scam
('dlg-1-1', 'npc-1', 'chapter-1', 'U Kyaw Win''s Warning',
'[{"speaker":"U Kyaw Win","text":"Mingalabar, young one! Be careful around the ATM booth over there.","emotion":"concerned"},{"speaker":"U Kyaw Win","text":"Last week, someone put a strange sticker over the card slot. My friend almost lost his card!","emotion":"angry"},{"speaker":"Player","text":"A sticker over the card slot? What does it do?","emotion":"curious"},{"speaker":"U Kyaw Win","text":"It copies your card data! They call it a skimmer. Now I always check the ATM before using it.","emotion":"serious"}]',
'[{"text":"Thank you for the warning!","next_dialogue_id":null,"trust_change":5},{"text":"Can you show me how to check?","next_dialogue_id":"dlg-1-2","trust_change":10},{"text":"That sounds made up.","next_dialogue_id":null,"trust_change":-10}]',
datetime('now')),

('dlg-1-2', 'npc-1', 'chapter-1', 'ATM Safety Tips',
'[{"speaker":"U Kyaw Win","text":"Good question! Here is what I check every time:","emotion":"happy"},{"speaker":"U Kyaw Win","text":"First, wiggle the card slot. If it moves or feels loose, someone added something.","emotion":"serious"},{"speaker":"U Kyaw Win","text":"Second, cover the keypad with your hand when entering your PIN.","emotion":"serious"},{"speaker":"U Kyaw Win","text":"Third, if a camera is pointed at the keypad, do NOT use that ATM!","emotion":"angry"},{"speaker":"U Kyaw Win","text":"Remember: real bank ATMs never have loose parts or hidden cameras.","emotion":"happy"}]',
'[{"text":"I will be more careful now. Thank you!","next_dialogue_id":null,"trust_change":5}]',
datetime('now')),

-- Ma Thida (citizen, neighborhood) - received a phishing SMS
('dlg-2-1', 'npc-2', 'chapter-1', 'Ma Thida''s Problem',
'[{"speaker":"Ma Thida","text":"Oh hello! Can I ask you something? I got a strange message on my phone.","emotion":"confused"},{"speaker":"Ma Thida","text":"It says my KBZ account is locked and I need to click a link to verify. Should I do it?","emotion":"worried"},{"speaker":"Player","text":"Let me see that message. Can you show me?","emotion":"curious"}]',
'[{"text":"Show me the message","next_dialogue_id":"dlg-2-2","trust_change":5},{"text":"Never click links in messages!","next_dialogue_id":"dlg-2-3","trust_change":10},{"text":"Just ignore it","next_dialogue_id":null,"trust_change":0}]',
datetime('now')),

('dlg-2-2', 'npc-2', 'chapter-1', 'Phishing Analysis',
'[{"speaker":"Player","text":"This is a phishing message! Look at the link - it says kbz-verify.net, not kbzbank.com","emotion":"serious"},{"speaker":"Ma Thida","text":"What is phishing? How can you tell?","emotion":"confused"},{"speaker":"Player","text":"Phishing means scammers pretend to be your bank to steal your password. Real banks never ask for OTPs via SMS.","emotion":"happy"},{"speaker":"Ma Thida","text":"Oh my! I almost clicked it! Thank you so much!","emotion":"relieved"}]',
'[{"text":"Always check the sender and URL carefully!","next_dialogue_id":null,"trust_change":10}]',
datetime('now')),

('dlg-2-3', 'npc-2', 'chapter-1', 'Quick Advice',
'[{"speaker":"Player","text":"Never click links in suspicious messages! If you are worried, call your bank directly.","emotion":"serious"},{"speaker":"Ma Thida","text":"You are right! I will delete it right now. Thank you!","emotion":"relieved"}]',
'[{"text":"Stay safe!","next_dialogue_id":null,"trust_change":5}]',
datetime('now')),

-- Sgt. Aung (police, neighborhood) - reports on local scam activity
('dlg-3-1', 'npc-3', 'chapter-1', 'Police Report',
'[{"speaker":"Sgt. Aung","text":"Hello citizen. I am Sgt. Aung from the local police station.","emotion":"neutral"},{"speaker":"Sgt. Aung","text":"We have been getting reports about a scam operation in the market area.","emotion":"serious"},{"speaker":"Sgt. Aung","text":"Someone is pretending to sell cheap phones but sending fake APK files instead.","emotion":"angry"},{"speaker":"Player","text":"A fake APK scam? What should people look out for?","emotion":"curious"}]',
'[{"text":"Tell me more about the scam","next_dialogue_id":"dlg-3-2","trust_change":5},{"text":"I will keep my eyes open","next_dialogue_id":null,"trust_change":3}]',
datetime('now')),

('dlg-3-2', 'npc-3', 'chapter-1', 'Scam Details',
'[{"speaker":"Sgt. Aung","text":"The suspect uses Viber groups to share links. The link looks like a phone deal.","emotion":"serious"},{"speaker":"Sgt. Aung","text":"But when you download it, it installs a fake app that steals your banking credentials.","emotion":"angry"},{"speaker":"Sgt. Aung","text":"Tell anyone you see: NEVER download APK files from messaging apps!","emotion":"serious"},{"speaker":"Sgt. Aung","text":"If you find evidence, bring it to me. Screenshots, messages, anything helps.","emotion":"happy"}]',
'[{"text":"I will help catch this scammer!","next_dialogue_id":null,"trust_change":10}]',
datetime('now')),

-- Ko Min Htike (delivery, neighborhood) - target of social engineering
('dlg-4-1', 'npc-4', 'chapter-1', 'Confused Delivery Rider',
'[{"speaker":"Ko Min Htike","text":"Hey, have you seen a woman around here looking for package delivery?","emotion":"confused"},{"speaker":"Ko Min Htike","text":"She called me saying I have a package stuck at customs and need to pay 15,000 MMK.","emotion":"worried"},{"speaker":"Player","text":"Wait - did you actually order anything recently?","emotion":"curious"},{"speaker":"Ko Min Htike","text":"No... that is why I am confused. She sounded so official though.","emotion":"confused"}]',
'[{"text":"That is a scam! Real delivery never calls for money first","next_dialogue_id":"dlg-4-2","trust_change":10},{"text":"Maybe it is real? Better safe than sorry","next_dialogue_id":"dlg-4-3","trust_change":-5}]',
datetime('now')),

('dlg-4-2', 'npc-4', 'chapter-1', 'Scam Explained',
'[{"speaker":"Player","text":"Ko, this is a classic delivery scam! They call about a package you never ordered.","emotion":"serious"},{"speaker":"Player","text":"Real delivery companies send SMS with tracking numbers, not phone calls demanding money.","emotion":"serious"},{"speaker":"Ko Min Htike","text":"She said if I do not pay, the package will be destroyed!","emotion":"worried"},{"speaker":"Player","text":"That is the pressure tactic. Delete the number and block it. You are safe.","emotion":"happy"},{"speaker":"Ko Min Htike","text":"Thank you! I almost fell for it! I will tell my friends too.","emotion":"relieved"}]',
'[{"text":"Smart choice! Share this knowledge with others.","next_dialogue_id":null,"trust_change":5}]',
datetime('now')),

('dlg-4-3', 'npc-4', 'chapter-1', 'Bad Advice',
'[{"speaker":"Player","text":"Hmm, maybe you should pay just to be safe...","emotion":"neutral"},{"speaker":"Ko Min Htike","text":"You think so? But 15,000 MMK is a lot for me...","emotion":"worried"},{"speaker":"Player","text":"Actually wait - I just remembered. Real delivery companies never ask for money over the phone!","emotion":"serious"},{"speaker":"Ko Min Htike","text":"Oh! So it IS a scam? Good thing I did not pay yet!","emotion":"relieved"}]',
'[{"text":"Sorry for the confusion. Always verify first!","next_dialogue_id":null,"trust_change":3}]',
datetime('now')),

-- Daw Thin Thin (elderly, market) - potential romance scam victim
('dlg-5-1', 'npc-5', 'chapter-1', 'Daw Thin Thin''s Online Friend',
'[{"speaker":"Daw Thin Thin","text":"Oh dear, can you help me? I made a friend on Facebook who says he works overseas.","emotion":"happy"},{"speaker":"Daw Thin Thin","text":"He says he wants to send me money but I need to pay a small fee first.","emotion":"confused"},{"speaker":"Player","text":"How long have you known this person? Have you ever met them?","emotion":"curious"},{"speaker":"Daw Thin Thin","text":"We have been chatting for 3 months. He is so kind and caring...","emotion":"happy"}]',
'[{"text":"This sounds like a romance scam. Never send money to someone you have not met!","next_dialogue_id":"dlg-5-2","trust_change":10},{"text":"If he is your friend, maybe you should trust him","next_dialogue_id":"dlg-5-3","trust_change":-15}]',
datetime('now')),

('dlg-5-2', 'npc-5', 'chapter-1', 'Romance Scam Warning',
'[{"speaker":"Player","text":"Daw, I am sorry but this is a romance scam. It happens to many people.","emotion":"serious"},{"speaker":"Player","text":"Scammers create fake profiles, build trust over weeks, then ask for money.","emotion":"serious"},{"speaker":"Daw Thin Thin","text":"But he said he loves me... he sends me poems every day...","emotion":"sad"},{"speaker":"Player","text":"That is their trick. Real love does not ask for money. Please do not send anything.","emotion":"serious"},{"speaker":"Daw Thin Thin","text":"I... I think you are right. I will not send any money. Thank you, dear.","emotion":"relieved"}]',
'[{"text":"You made the right choice. Stay safe online.","next_dialogue_id":null,"trust_change":10}]',
datetime('now')),

('dlg-5-3', 'npc-5', 'chapter-1', 'Dangerous Advice',
'[{"speaker":"Player","text":"If you trust him, maybe you should send the fee...","emotion":"neutral"},{"speaker":"Daw Thin Thin","text":"You think so? Maybe I should send it quickly before he gets angry...","emotion":"worried"},{"speaker":"Player","text":"Wait! Actually no - I just realized this is a scam pattern! Do NOT send money!","emotion":"serious"},{"speaker":"Daw Thin Thin","text":"Oh my! Thank goodness you stopped me! I almost made a big mistake!","emotion":"relieved"}]',
'[{"text":"Sorry for the scare. Please never send money to online strangers.","next_dialogue_id":null,"trust_change":3}]',
datetime('now')),

-- Shady Guy (scammer, market) - the antagonist
('dlg-6-1', 'npc-6', 'chapter-1', 'Suspicious Stranger',
'[{"speaker":"Shady Guy","text":"Hey kid! Want to buy a brand new phone? Very cheap! Only 50,000 MMK!","emotion":"suspicious"},{"speaker":"Shady Guy","text":"I have iPhone, Samsung, all latest models. Come, come!","emotion":"suspicious"},{"speaker":"Player","text":"That price is too good to be true. Where did you get these phones?","emotion":"suspicious"}]',
'[{"text":"Show me the phones","next_dialogue_id":"dlg-6-2","trust_change":-5},{"text":"This looks suspicious. I should report you.","next_dialogue_id":"dlg-6-3","trust_change":5},{"text":"No thanks, I am not interested","next_dialogue_id":null,"trust_change":0}]',
datetime('now')),

('dlg-6-2', 'npc-6', 'chapter-1', 'The Trap',
'[{"speaker":"Shady Guy","text":"Ha! You have good taste! Here, take this one. Just transfer the money first.","emotion":"suspicious"},{"speaker":"Player","text":"Wait - this phone is not even turned on. And the box looks fake...","emotion":"suspicious"},{"speaker":"Shady Guy","text":"No no no! It is real! Just trust me! Transfer now before someone else buys it!","emotion":"angry"},{"speaker":"Player","text":"I am walking away. This is a scam.","emotion":"serious"}]',
'[{"text":"I am reporting you to the police","next_dialogue_id":"dlg-6-3","trust_change":5},{"text":"Fine, I will leave","next_dialogue_id":null,"trust_change":0}]',
datetime('now')),

('dlg-6-3', 'npc-6', 'chapter-1', 'Confrontation',
'[{"speaker":"Player","text":"I know what you are doing. Selling fake phones and stealing money!","emotion":"angry"},{"speaker":"Shady Guy","text":"You... you do not know what you are talking about!","emotion":"angry"},{"speaker":"Shady Guy","text":"Fine! I do not need your business anyway!","emotion":"angry"},{"speaker":"Shady Guy","text":"(muttering) I will remember your face...","emotion":"angry"}]',
'[{"text":"I will tell the police about you","next_dialogue_id":null,"trust_change":10}]',
datetime('now'));

-- ─── Fraud City: Missions ────────────────────────────────────

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  chapter_order INTEGER NOT NULL,
  unlocked_by TEXT,
  is_unlocked INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  mission_type TEXT NOT NULL CHECK(mission_type IN ('main', 'side', 'random', 'emergency')),
  fraud_type TEXT,
  objectives TEXT NOT NULL, -- JSON array of { id, description, type, target, done }
  rewards TEXT NOT NULL, -- JSON { xp, trust, items }
  map_id TEXT,
  npc_id TEXT,
  trigger_dialogue_id TEXT,
  completion_dialogue_id TEXT,
  is_available INTEGER DEFAULT 1,
  mission_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_progress (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL DEFAULT 'player-1',
  mission_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK(status IN ('locked', 'available', 'active', 'completed', 'failed')),
  objectives_complete TEXT DEFAULT '[]', -- JSON array of completed objective IDs
  started_at TEXT,
  completed_at TEXT,
  xp_earned INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(player_id, mission_id),
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);

-- Seed: chapters
INSERT OR IGNORE INTO chapters (id, title, description, chapter_order, unlocked_by, is_unlocked, created_at) VALUES
('chapter-1', 'Welcome to Fraud City', 'Learn the basics of scam detection. Meet your neighbors and discover the threats lurking in the city.', 1, NULL, 1, datetime('now')),
('chapter-2', 'The ATM Mystery', 'Strange things are happening at the ATM booth. Investigate and protect the community.', 2, 'chapter-1', 0, datetime('now')),
('chapter-3', 'Digital Danger', 'Scams are going digital. Phishing, fake APKs, and online fraud target everyone.', 3, 'chapter-2', 0, datetime('now')),
('chapter-4', 'The Market Conspiracy', 'The Central Market is hiding a major scam operation. Gather evidence and expose the truth.', 4, 'chapter-3', 0, datetime('now')),
('chapter-5', 'The Final Boss', 'Confront the mastermind behind Fraud City''s scam syndicate with all the evidence you have collected.', 5, 'chapter-4', 0, datetime('now'));

-- Seed: missions (Chapter 1)
INSERT OR IGNORE INTO missions (id, chapter_id, title, description, mission_type, fraud_type, objectives, rewards, map_id, npc_id, trigger_dialogue_id, is_available, mission_order, created_at) VALUES
-- Main Story Missions
('mission-1-1', 'chapter-1', 'Meet the Neighborhood', 'Explore the neighborhood and talk to the locals. They might have valuable information about recent scams.',
 'main', NULL,
 '[{"id":"obj-1","description":"Talk to U Kyaw Win","type":"talk","target":"npc-1","done":false},{"id":"obj-2","description":"Talk to Ma Thida","type":"talk","target":"npc-2","done":false},{"id":"obj-3","description":"Talk to Sgt. Aung","type":"talk","target":"npc-3","done":false}]',
 '{"xp":100,"trust":{"npc-1":10,"npc-2":10,"npc-3":10}}',
 'neighborhood', NULL, NULL, 1, 1, datetime('now')),

('mission-1-2', 'chapter-1', 'The Confused Delivery Rider', 'Ko Min Htike received a suspicious phone call about a package. Help him figure out if it is a scam.',
 'main', 'Social Engineering',
 '[{"id":"obj-1","description":"Find Ko Min Htike","type":"find","target":"npc-4","done":false},{"id":"obj-2","description":"Listen to his story","type":"talk","target":"npc-4","done":false},{"id":"obj-3","description":"Advise him correctly","type":"choose","target":"dlg-4-2","done":false}]',
 '{"xp":150,"trust":{"npc-4":15}}',
 'neighborhood', 'npc-4', 'dlg-4-1', 1, 2, datetime('now')),

('mission-1-3', 'chapter-1', 'Grandma Online Friend', 'Daw Thin Thin has been chatting with someone online who might be a romance scammer. Investigate the situation.',
 'main', 'Romance Scam',
 '[{"id":"obj-1","description":"Find Daw Thin Thin at the market","type":"find","target":"npc-5","done":false},{"id":"obj-2","description":"Hear about her online friend","type":"talk","target":"npc-5","done":false},{"id":"obj-3","description":"Warn her about romance scams","type":"choose","target":"dlg-5-2","done":false}]',
 '{"xp":200,"trust":{"npc-5":20}}',
 'market', 'npc-5', 'dlg-5-1', 1, 3, datetime('now')),

('mission-1-4', 'chapter-1', 'The Suspicious Seller', 'A shady character is selling phones in the market. Investigate and decide what to do.',
 'main', 'Fake APK',
 '[{"id":"obj-1","description":"Find the suspicious seller","type":"find","target":"npc-6","done":false},{"id":"obj-2","description":"Confront the seller","type":"talk","target":"npc-6","done":false},{"id":"obj-3","description":"Report to Sgt. Aung","type":"interact","target":"dlg-6-3","done":false}]',
 '{"xp":250,"trust":{"npc-3":10},"items":["evidence_phone"]}',
 'market', 'npc-6', 'dlg-6-1', 1, 4, datetime('now')),

-- Side Quests
('mission-1-s1', 'chapter-1', 'ATM Safety Check', 'Help U Kyaw Win teach the neighborhood about ATM safety.',
 'side', 'QR Scam',
 '[{"id":"obj-1","description":"Talk to U Kyaw Win about ATMs","type":"talk","target":"npc-1","done":false},{"id":"obj-2","description":"Learn about skimmers","type":"choose","target":"dlg-1-2","done":false}]',
 '{"xp":75,"trust":{"npc-1":5}}',
 'neighborhood', 'npc-1', 'dlg-1-1', 1, 5, datetime('now')),

('mission-1-s2', 'chapter-1', 'Phishing Alert', 'Ma Thida received a suspicious SMS. Help her identify the threat.',
 'side', 'Phishing',
 '[{"id":"obj-1","description":"Talk to Ma Thida about the message","type":"talk","target":"npc-2","done":false},{"id":"obj-2","description":"Analyze the phishing SMS","type":"choose","target":"dlg-2-2","done":false}]',
 '{"xp":75,"trust":{"npc-2":10}}',
 'neighborhood', 'npc-2', 'dlg-2-1', 1, 6, datetime('now')),

-- Random Events
('mission-1-r1', 'chapter-1', 'Lost Tourist', 'A tourist is asking for directions but seems confused. Maybe they need help with more than directions.',
 'random', 'Social Engineering',
 '[{"id":"obj-1","description":"Help the tourist","type":"interact","target":"tourist","done":false}]',
 '{"xp":50}',
 'neighborhood', NULL, NULL, 1, 7, datetime('now'));

-- ─── Fraud City: Evidence & Bosses ───────────────────────────

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL DEFAULT 'player-1',
  evidence_type TEXT NOT NULL CHECK(evidence_type IN ('sms', 'call_log', 'screenshot', 'photo', 'qr_scan', 'witness', 'document', 'recording')),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- JSON with type-specific data (phone number, URL, image path, etc.)
  source_npc_id TEXT,
  source_mission_id TEXT,
  map_id TEXT,
  location_x INTEGER,
  location_y INTEGER,
  is_read INTEGER DEFAULT 0,
  collected_at TEXT NOT NULL,
  FOREIGN KEY (source_npc_id) REFERENCES world_npcs(id) ON DELETE SET NULL,
  FOREIGN KEY (source_mission_id) REFERENCES missions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bosses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  boss_type TEXT NOT NULL CHECK(boss_type IN ('scammer_boss', 'syndicate_leader', 'online_mastermind')),
  chapter_id TEXT NOT NULL,
  map_id TEXT,
  x INTEGER DEFAULT 0,
  y INTEGER DEFAULT 0,
  sprite TEXT DEFAULT 'scammer',
  hp INTEGER DEFAULT 3,
  weakness TEXT, -- evidence type that deals extra damage
  evidence_required TEXT NOT NULL, -- JSON array of evidence IDs needed to confront
  defeat_dialogue TEXT, -- JSON dialogue played on defeat
  reward_xp INTEGER DEFAULT 500,
  reward_trust INTEGER DEFAULT 20,
  is_defeated INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_evidence (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL DEFAULT 'player-1',
  boss_id TEXT NOT NULL,
  evidence_id TEXT NOT NULL,
  presented_at TEXT NOT NULL,
  UNIQUE(player_id, boss_id, evidence_id),
  FOREIGN KEY (boss_id) REFERENCES bosses(id) ON DELETE CASCADE,
  FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE
);

-- Seed: evidence (obtainable during chapter 1)
INSERT OR IGNORE INTO evidence (id, evidence_type, title, description, content, source_mission_id, is_read, collected_at) VALUES
('ev-sms-1', 'sms', 'Phishing SMS from KBZ', 'Fake KBZ account locked message with phishing link',
 '{"sender":"+95912345678","message":"Your KBZ account is locked. Verify now: kbz-verify.net","link":"http://kbz-verify.net","timestamp":"2026-07-10 14:30:00"}',
 'mission-1-s2', 0, datetime('now')),

('ev-photo-1', 'photo', 'ATM Skimmer Photo', 'Photo of a suspicious device attached to the ATM card slot',
 '{"location":"Neighborhood ATM Booth","timestamp":"2026-07-11 09:15:00","notes":"Card slot has extra overlay device"}',
 'mission-1-s1', 0, datetime('now')),

('ev-witness-1', 'witness', 'U Kyaw Win Statement', 'Eyewitness account of ATM skimmer incident',
 '{"witness":"U Kyaw Win","statement":"I saw someone put a sticker on the ATM last week. My friend almost lost his card.","date":"2026-07-05"}',
 'mission-1-1', 0, datetime('now')),

('ev-screenshot-1', 'screenshot', 'Shady Guy Viber Message', 'Screenshot of suspicious phone sale message from Viber group',
 '{"platform":"Viber","group":"Yangon Deals","sender":"ShadyPhone_deals","message":"Cheap iPhone 15! Only 50,000 MMK! DM me","timestamp":"2026-07-12 11:00:00"}',
 'mission-1-4', 0, datetime('now')),

('ev-photo-2', 'photo', 'Fake Phone Package', 'Photo of the counterfeit phone packaging from Shady Guy',
 '{"brand":"iPhone 15","issues":["Wrong font on box","Missing Apple logo","Cheap plastic feel","No serial number sticker"],"timestamp":"2026-07-12 11:30:00"}',
 'mission-1-4', 0, datetime('now')),

('ev-call-1', 'call_log', 'Scam Call Recording', 'Recorded phone call from fake delivery service',
 '{"caller":"+95987654321","duration":"2:45","claim":"Package stuck at customs, pay 15,000 MMK","timestamp":"2026-07-10 16:20:00"}',
 'mission-1-2', 0, datetime('now')),

('ev-document-1', 'document', 'Romance Scam Chat Log', 'Exported chat messages from Daw Thin Thin''s online "friend"',
 '{"platform":"Facebook","sender":"John Smith (fake profile)","messages":["I love you darling","Send 50,000 MMK for the fee","I will come to Myanmar soon"],"period":"3 months","timestamp":"2026-07-12"}',
 'mission-1-3', 0, datetime('now')),

('ev-qr-1', 'qr_scan', 'Suspicious QR Code', 'QR code found on a fake charity poster at the market',
 '{"url":"http://fake-charity-mm.com/donate","poster_location":"Market entrance","claims":"Donate for flood victims","actual_destination":"Phishing site"}',
 NULL, 0, datetime('now'));

-- Seed: bosses
INSERT OR IGNORE INTO bosses (id, name, title, boss_type, chapter_id, map_id, x, y, sprite, hp, weakness, evidence_required, defeat_dialogue, reward_xp, created_at) VALUES
('boss-1', 'Phone Faker', 'Fake Phone Seller', 'scammer_boss', 'chapter-1', 'market', 30, 20, 'scammer', 3, 'photo',
'["ev-screenshot-1","ev-photo-2"]',
'[{"speaker":"Phone Faker","text":"You... you have proof?!","emotion":"shocked"},{"speaker":"Player","text":"Yes! I have photos of your fake phones and screenshots of your Viber messages!","emotion":"angry"},{"speaker":"Phone Faker","text":"Fine! You win this time! But I will be back!","emotion":"angry"},{"speaker":"Player","text":"Not if Sgt. Aung gets to you first!","emotion":"happy"}]',
500, datetime('now')),

('boss-2', 'Scam Mastermind', 'Syndicate Leader', 'syndicate_leader', 'chapter-5', 'neighborhood', 20, 15, 'scammer', 5, 'document',
'["ev-sms-1","ev-photo-1","ev-witness-1","ev-screenshot-1","ev-photo-2","ev-call-1","ev-document-1","ev-qr-1"]',
'[{"speaker":"Scam Mastermind","text":"Impressive. You collected all the evidence...","emotion":"shocked"},{"speaker":"Player","text":"Your whole operation is exposed. The police have everything.","emotion":"angry"},{"speaker":"Scam Mastermind","text":"I underestimated you, kid. This city was supposed to be easy prey...","emotion":"sad"},{"speaker":"Player","text":"Not anymore. Fraud City is safe now.","emotion":"happy"}]',
1000, datetime('now'));

-- ─── Fraud City: Player Progression ──────────────────────────

CREATE TABLE IF NOT EXISTS player_stats (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL DEFAULT 'player-1' UNIQUE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_to_next INTEGER DEFAULT 100,
  total_xp INTEGER DEFAULT 0,
  skill_points INTEGER DEFAULT 0,
  skills TEXT DEFAULT '{}', -- JSON { investigation: 0, communication: 0, trust: 0, technology: 0 }
  reputation TEXT DEFAULT '{}', -- JSON { neighborhood: 50, market: 50, school: 50 }
  titles TEXT DEFAULT '[]', -- JSON array of unlocked titles
  achievements TEXT DEFAULT '[]', -- JSON array of achievement IDs
  play_time INTEGER DEFAULT 0, -- seconds
  scams_prevented INTEGER DEFAULT 0,
  citizens_helped INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Seed: default player stats
INSERT OR IGNORE INTO player_stats (id, player_id, level, xp, xp_to_next, total_xp, skill_points, skills, reputation, titles, achievements, created_at, updated_at) VALUES
('stats-player-1', 'player-1', 1, 0, 100, 0, 0,
 '{"investigation":0,"communication":0,"trust":0,"technology":0}',
 '{"neighborhood":50,"market":50,"school":50}',
 '["Newcomer"]',
 '[]',
 datetime('now'), datetime('now'));

-- ─── Fraud City: Save/Load System ────────────────────────────

CREATE TABLE IF NOT EXISTS save_slots (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL DEFAULT 'player-1',
  slot_name TEXT NOT NULL,
  slot_number INTEGER NOT NULL,
  save_data TEXT NOT NULL, -- JSON with full game state
  level INTEGER DEFAULT 1,
  play_time INTEGER DEFAULT 0,
  location TEXT DEFAULT 'neighborhood',
  thumbnail TEXT, -- JSON with summary for display
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(player_id, slot_number)
);

-- Seed: empty save slots
INSERT OR IGNORE INTO save_slots (id, player_id, slot_name, slot_number, save_data, level, play_time, location, created_at, updated_at) VALUES
('save-1', 'player-1', 'Slot 1', 1, '{}', 1, 0, 'neighborhood', datetime('now'), datetime('now')),
('save-2', 'player-1', 'Slot 2', 2, '{}', 1, 0, 'neighborhood', datetime('now'), datetime('now')),
('save-3', 'player-1', 'Slot 3', 3, '{}', 1, 0, 'neighborhood', datetime('now'), datetime('now'));
