# 📂 Phase 1: Setup & Local Development (စတင်ပြင်ဆင်ခြင်းနှင့် ကုဒ်ရေးသားခြင်း)

## Step 1: Project ကို မိမိစက်ထဲသို့ Clone ယူပါ

Terminal သို့မဟုတ် Git Bash ကိုဖွင့်ပြီး Remote Repository (GitHub) ပေါ်က project ကို ကိုယ့်စက်ထဲ ဒေါင်းလုဒ်ဆွဲပါ။

```bash
git clone <repository-url>
```

> ဥပမာ - `git clone git@github.com:username/project-repo.git`

---

## Step 2: Project Folder ထဲသို့ ဝင်ပါ

```bash
cd <project-folder-name>
```

---

## Step 3: dev Branch ထဲသို့ ပြောင်းပါ

Project ကို clone လုပ်ပြီးချင်းမှာ ပုံမှန်အားဖြင့် main branch ထဲ ရောက်နေတတ်လို့ လုပ်ငန်းခွင်သုံး dev branch ထဲကို ပြောင်းရပါမယ်။

```bash
git checkout dev
```

---

## Step 4: ကုဒ်များကို စတင်ရေးသားပါ (Make Development)

ဒီအဆင့်မှာ dev branch ထဲမှာပဲ ရှိနေစဉ် မိမိလုပ်ရမည့် Feature updates တွေ၊ Bug fixes တွေကို IDE/Code Editor (VS Code စသည်) မှာ စိတ်ကြိုက် ရေးသားပါ။

> ⚠️ **သတိပြုရန်:** ကုဒ်ရေးလို့ ပြီးသွားတဲ့အထိ `git add` သို့မဟုတ် `git commit` မလုပ်ရသေးပါ။ ကုဒ်များကို မသိမ်းဆည်းဘဲ ဒီအတိုင်းပဲ ထားထားပါ။

---

# 🌿 Phase 2: Branching & Pushing (Branch အသစ်ခွဲပြီး Push တင်ခြင်း)

## Step 5: ယာယီ Local Branch အသစ်တစ်ခု ဆောက်ပြီး ပြောင်းပါ

> ### ⛔ အရေးကြီး - ယာယီ branch တစ်ခု မတည်ဆောက်မီ `git pull origin dev` ကို ပြန်ရိုက်ပါ (တခြားသူများ တင်ပြီး merge ထားတာတွေ ရှိနေနိုင်)
>
> **မပြုလုပ်ပါက merge conflict များ ဖြစ်ပေါ်နိုင်ပါသည်။**
>
> ```bash
> git pull origin dev
> ```

dev branch ထဲမှာ ရေးထားတဲ့ အပြောင်းအလဲတွေကို သိမ်းဆည်းဖို့အတွက် ယာယီ branch အသစ်တစ်ခု (ဥပမာ- feature-xyz) ကို ဆောက်ပြီး ၎င်းထဲသို့ ကူးပြောင်းပါ။

```bash
git checkout -b feature-xyz
```

ဒီ Command ကြောင့် `feature-xyz` ဆိုတဲ့ branch အသစ် ပေါ်လာပြီး dev ထဲမှာ ရေးထားသမျှ မသိမ်းရသေးတဲ့ code တွေက ဒီ branch သစ်ထဲကို အလိုအလျောက် ပါလာမှာ ဖြစ်ပါတယ်။

---

## Step 6: ပြင်ဆင်မှုများကို Stage လုပ်ပြီး Commit မှတ်ပါ

```bash
# ပြင်ဆင်ထားသော file အားလုံးကို ယာယီသိမ်းရန် နေရာချခြင်း
git add .

# လုပ်ဆောင်ချက် မှတ်တမ်းနှင့်အတူ Commit လုပ်ခြင်း
git commit -m "Add new feature development details"
```

---

## Step 7: ထို Branch အသစ်ကို GitHub ပေါ်သို့ Push တင်ပါ

မိမိစက်ထဲက `feature-xyz` ကို GitHub (Remote) ပေါ် ရောက်အောင် တွန်းတင်လိုက်ပါ။

```bash
git push origin feature-xyz
```

---

# 🤝 Phase 3: GitHub Self-Merge & Final PR (GitHub ပေါ်တွင် ပေါင်းစည်းခြင်း)

## Step 8: ပထမအကြိမ် Pull Request (PR) တင်ခြင်း (To Your Own Branch)

1. ဘရောက်ဆာကနေ GitHub ဝဘ်ဆိုက် ရှိ မိမိတို့ Project Repo ထဲသို့ သွားပါ။
2. **"Pull Requests"** Tab ကို နှိပ်ပြီး **"New Pull Request"** ခလုတ်ကို နှိပ်ပါ။
3. Branch ရွေးချယ်မှုကို အောက်ပါအတိုင်း အတိအကျ ရွေးပေးပါ -

   - **Base:** `your-own-branch-name` (မိမိ၏ ကိုယ်ပိုင် long-term branch နာမည် (eg: komyoaung, koyenaung))
   - **Compare:** `feature-xyz` (ခုနက တင်လိုက်သည့် ယာယီ branch)

4. ရွေးပြီးပါက **"Create pull request"** ခလုတ်ကို နှိပ်ပါ။

---

## Step 9: မိမိဘာသာ Merge ပြုလုပ်ခြင်း (Self-Merge)

PR ဆောက်ပြီးတာနဲ့ အဆိုပါ PR စာမျက်နှာအောက်ခြေမှာ **"Merge pull request"** ဆိုတဲ့ ခလုတ်အစိမ်းရောင် ပေါ်လာပါလိမ့်မယ်။

၎င်းခလုတ်ကို နှိပ်ပြီး **"Confirm merge"** ကို ထပ်နှိပ်ပါ။ ယခုဆိုရင် `feature-xyz` ထဲက code တွေဟာ မိမိရဲ့ ကိုယ်ပိုင် branch ထဲကို အောင်မြင်စွာ ရောက်ရှိသွားပါပြီ။

---

## Step 10: ဒုတိယအကြိမ် Final PR တင်ခြင်း (To dev Branch)

1. GitHub ပေါ်တွင် **"New Pull Request"** ကို ထပ်မံနှိပ်ပါ။
2. ယခုတစ်ကြိမ်တွင် Branch ရွေးချယ်မှုကို အောက်ပါအတိုင်း ပြောင်းလဲသတ်မှတ်ပါ -

   - **Base:** `dev` (အဖွဲ့သုံး main dev branch)
   - **Compare:** `your-own-branch-name` (နောက်ဆုံးပေါ် update ရှိနေသည့် မိမိ၏ ကိုယ်ပိုင် branch)

3. ရွေးပြီးပါက **"Create pull request"** ကို နှိပ်ပြီး ခေါင်းစဉ် သို့မဟုတ် description ရေးကာ တင်လိုက်ပါ။

> ဤ PR ကိုတော့ Team Leader သို့မဟုတ် Senior Developer များက Code Review စစ်ဆေးပြီး အဆင်ပြေမှ dev ထဲကို Merge လုပ်ပေးမှာ ဖြစ်ပါတယ်။

---

# 🧹 Phase 4: Local Cleanup & Sync (Local စက်ကို သန့်ရှင်းရေးလုပ်ခြင်း)

dev branch ထဲကို code တွေ အားလုံး မာ့ခ်ျ (Merge) လုပ်ပြီးသွားပြီဆိုရင် မိမိ local စက်ကို နောက်ဆုံးပေါ် ကုဒ်တွေနဲ့ ထပ်တူဖြစ်အောင် (Sync) ပြန်လုပ်ပေးဖို့ လိုအပ်ပါတယ်။

## Step 11: Local dev branch သို့ ပြန်ပြောင်းပါ

```bash
git checkout dev
```

---

## Step 12: GitHub ပေါ်က နောက်ဆုံး update များကို Pull ဆွဲယူပါ

အခြား team members တွေ တင်ထားတာရော၊ မိမိ တင်လိုက်တာရော အားလုံး ပါဝင်တဲ့ နောက်ဆုံးပေါ် code တွေကို local dev ထဲ ရောက်အောင် ယူလိုက်တာ ဖြစ်ပါတယ်။

```bash
git pull origin dev
```

---

## Step 13: ယာယီသုံးခဲ့သော Local Branch ကို ဖျက်ပစ်ပါ

အလုပ်ပြီးသွားပြီဖြစ်လို့ local စက်ထဲမှာ ယာယီဆောက်ခဲ့တဲ့ `feature-xyz` branch ကို အမှိုက်ရှုပ်မနေအောင် ဖျက်ပစ်လိုက်ပါ။

```bash
git branch -d feature-xyz
```

---

# ⚠️ အရေးကြီး ဖြည့်စွက်ချက် - Conflict ဖြစ်လာလျှင် ဘာလုပ်ရမလဲ?

## အခြေအနေ (၁) - Step 8 မှာ PR တင်တဲ့အခါ GitHub မှာ Conflict ပြရင်

ဆိုလိုတာက မိမိ ကိုယ်ပိုင် branch ထဲမှာ ရှိနေတဲ့ code ဟောင်းနဲ့ `feature-xyz` က code တွေ ငြိနေတာ ဖြစ်ပါတယ်။

**ဖြေရှင်းနည်း:**

1. Local စက်ထဲမှာ `git checkout your-own-branch-name` ပြောင်းပါ
2. `git pull origin your-own-branch-name` လုပ်ပါ
3. `git checkout feature-xyz` ကို ပြန်သွားပါ
4. `git merge your-own-branch-name` ဟု ရိုက်ပါ
5. VS Code တွင် conflict ဖြစ်နေသည့် code လိုင်းများကို ညှိပါ
6. `git commit` ပြန်လုပ်ပါ
7. `git push origin feature-xyz` ပြန်တင်ပေးရပါမယ်

---

## အခြေအနေ (၂) - Step 10 မှာ dev ထဲ PR တင်တဲ့အခါ Conflict ပြရင်

မိမိ code မတင်ခင် ကြားထဲမှာ တခြားသူတစ်ယောက်ယောက်က dev ထဲကို code အသစ်တွေ တင်လိုက်လို့ ဖြစ်ပါတယ်။

**ဖြေရှင်းနည်း:**

1. Local စက်ထဲမှာ `git checkout dev` သို့ပြောင်းပြီး `git pull origin dev` ဆွဲပါ
2. မိမိကိုယ်ပိုင် branch (`git checkout your-own-branch-name`) ထဲကို ပြန်သွားပါ
3. `git merge dev` ဟု ရိုက်နှိပ်ကာ conflict များကို local မှာ အရင်ဖြေရှင်းပါ
4. အဆင်ပြေသွားမှ commit လုပ်ပြီး မိမိ branch ကို GitHub ပေါ်သို့ `git push origin your-own-branch-name` ပြန်တင်ပေးလိုက်ရင် GitHub ပေါ်က PR မှာ Conflict တွေ အလိုအလျောက် ပျောက်သွားပါလိမ့်မယ်ခင်ဗျာ။
