const BANKS = ['KBZ Bank', 'AYA Bank', 'Wave Money', 'KPay', 'CB Bank', 'UAB Bank', 'AGD Bank', 'MF Bank']
const PLATFORMS = ['Viber', 'Telegram', 'Facebook Messenger', 'WhatsApp', 'SMS', 'Email']

const TEMPLATES = {
  'Fake APK': [
    (b, p) => ({
      title: `Fake ${b} APK Circulating on ${p}`,
      description: `A malicious APK disguised as a ${b} update is being shared on ${p} groups. The app steals login credentials, OTP codes, and personal banking information. Users in Yangon and Mandalay have already been affected.`,
    }),
    (b, p) => ({
      title: `Counterfeit ${b} App Targeting Android Users`,
      description: `Scammers are distributing a fake ${b} application through ${p} links. Once installed, the app requests excessive permissions and intercepts SMS messages containing OTP codes. Do not download apps from unofficial sources.`,
    }),
    (b, p) => ({
      title: `Modified ${b} APK with Keylogger Detected`,
      description: `Security researchers have identified a modified ${b} APK spreading via ${p} that includes a keylogger. The malware records all keystrokes including passwords and PIN numbers. Only download apps from Google Play Store or official websites.`,
    }),
  ],
  'Phishing Link': [
    (b) => ({
      title: `${b} Account Suspended — Verify Now`,
      description: `A phishing SMS campaign is targeting ${b} customers with messages claiming their account has been suspended. The link leads to a fake login page that harvests credentials. ${b} will never ask you to verify your account via SMS links.`,
    }),
    (b) => ({
      title: `Fake ${b} OTP Verification Request`,
      description: `Users are receiving SMS messages asking them to forward their ${b} OTP code to a "verification number". This is a social engineering attack — never share your OTP with anyone, even if they claim to be from the bank.`,
    }),
    (b, p) => ({
      title: `${b} Phishing Email with Malicious Link`,
      description: `A phishing email impersonating ${b} is circulating, claiming unusual account activity. The email contains a link to a fake ${b} website that steals login credentials. Always verify the URL matches the official domain.`,
    }),
  ],
  'Social Engineering': [
    (b) => ({
      title: `${b} Support Call Scam — PIN Theft`,
      description: `Scammers are calling ${b} customers pretending to be bank support staff. They claim there is an issue with your account and ask for your PIN to "fix" it. ${b} will never call you asking for your PIN or password.`,
    }),
    (b) => ({
      title: `Fake ${b} Refund Processing Scam`,
      description: `A new wave of phone scams involves callers claiming to process a ${b} refund. They ask victims to share their OTP or PIN to receive the refund. Legitimate refunds are processed automatically without any action required.`,
    }),
    (p) => ({
      title: `Social Media Impersonation for Data Theft`,
      description: `Scammers are creating fake profiles on ${p} impersonating bank representatives. They offer "special promotions" and ask users to share personal information. Always verify official accounts through the bank's website.`,
    }),
  ],
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function generateAlerts(count) {
  const categories = Object.keys(TEMPLATES)
  const alerts = []

  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length] || pickRandom(categories)
    const template = pickRandom(TEMPLATES[category])
    const bank = pickRandom(BANKS)
    const platform = pickRandom(PLATFORMS)

    const result = template(bank, platform)
    alerts.push({
      title: result.title,
      category,
      description: result.description,
    })
  }

  return shuffleArray(alerts)
}
