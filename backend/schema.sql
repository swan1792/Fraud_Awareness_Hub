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
  category TEXT NOT NULL CHECK(category IN ('Fake APK', 'Phishing Link', 'Social Engineering')),
  description TEXT NOT NULL,
  date TEXT NOT NULL
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
INSERT OR IGNORE INTO scam_alerts (id, title, category, description, date) VALUES
('alert-001', 'Fake KPay APK Spreading via Viber', 'Fake APK', 'A malicious APK disguised as a KPay update is being shared in Viber groups across Yangon. The app steals login credentials and OTP codes.', '2026-07-01'),
('alert-002', 'KBZ Bank OTP Phishing SMS', 'Phishing Link', 'Mass SMS campaign targeting KBZ customers with fake ''account locked'' messages containing phishing links to kbz-verify.net.', '2026-06-28'),
('alert-003', 'Wave Money Refund Phone Scam', 'Social Engineering', 'Scammers calling Wave Money users claiming they have a pending refund, then asking for PIN codes to ''process'' the refund.', '2026-06-25'),
('alert-004', 'Fake Government Relief Website', 'Phishing Link', 'A website at gov-mm-relief.com is collecting personal and bank account details by impersonating a government subsidy program.', '2026-06-20');

-- Seed: scam_patterns
INSERT OR IGNORE INTO scam_patterns (id, title, category, description, red_flags, example, icon) VALUES
('fake-kpay-apk', 'Fake KPay APK', 'Fake APK', 'Scammers send links to download a fake KPay app that steals your login credentials and OTP codes.', '["Download link from unknown Viber/Telegram groups","App asks for excessive permissions","Misspelled app name (e.g., ''KPayy'' or ''K-Pay'')"]', 'Download the new KPay Pro APK here: http://kpay-update.xyz/download.apk', 'download'),
('kbz-otp-phishing', 'KBZ Bank OTP Scam', 'Phishing Link', 'A fake SMS or message claiming your KBZ account is locked, asking you to click a link and enter your OTP.', '["Urgent language like ''Account will be locked in 24 hours''","URL is not kbzbank.com","Asks for OTP — banks never ask for this"]', 'Your KBZ account is locked. Verify now: http://kbz-verify.net/auth', 'link'),
('wave-money-refund', 'Wave Money Refund Scam', 'Social Engineering', 'Caller pretends to be from Wave Money support and claims you''re owed a refund, then asks for your PIN.', '["Unsolicited call claiming you have a refund","Asks for your PIN or OTP over the phone","Creates urgency: ''Refund expires in 1 hour''"]', 'Hello, this is Wave Money support. You have a 50,000 MMK refund. Please share your PIN to process it.', 'phone'),
('viber-investment', 'Viber Investment Group', 'Social Engineering', 'A Viber group promising guaranteed returns on crypto or forex trading, targeting Myanmar users with fake testimonials.', '["Promises of guaranteed high returns (e.g., ''50% per week'')","Pressure to recruit friends for bonuses","Fake screenshots of profits from ''members''"]', 'Join our VIP trading group! Guaranteed 30% profit weekly. Send 100,000 MMK to start. Limited spots!', 'users'),
('delivery-scam', 'Parcel Delivery Phishing', 'Phishing Link', 'Fake delivery notification claiming you have a package stuck at customs, requesting a ''clearance fee'' via mobile payment.', '["You didn''t order anything","Asks for payment via mobile wallet before delivery","Generic message with no tracking details"]', 'Your parcel is held at customs. Pay 15,000 MMK clearance fee via Wave Money: http://parcel-mm.com/pay', 'package'),
('gov-subsidy', 'Government Subsidy Scam', 'Phishing Link', 'Fake government website claiming to offer COVID-19 or disaster relief subsidies, collecting personal and financial data.', '["Domain is not a .gov.mm site","Asks for bank account details to ''deposit subsidy''","Poor grammar and unofficial logos"]', 'Apply for 200,000 MMK government relief: http://gov-mm-relief.com/register', 'landmark');

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
