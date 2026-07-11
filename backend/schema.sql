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
