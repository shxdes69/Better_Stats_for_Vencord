---

# BetterStats — Vencord Plugin

Ever wondered how *much* you really type on Discord?
**BetterStats** tracks your activity in a clean and fun way — messages, replies, emojis, reactions, and even your most active servers and channels.

> ⭐ **Don’t forget to star this repo if you find it useful!** It helps a ton.

---

## 🚀 Getting Started

> **Before anything else**
> 👉 Go read the [official Vencord installation guide](https://docs.vencord.dev/installing/)
> Seriously — **read it fully**. Things will break if you skip it.
> Don't forget to Delete anything unrelated to the plugin this Readme.md or any other file  other than BetterStats.tsx & index.ts 
? Need help ? Contact me on Discord : shxdes0
---

### 📁 Plugin Setup

1. Inside your Vencord project, go to `src/` and make a new folder called:

   ```
   userplugins
   ```

2. Inside that, create a new folder for this plugin:

   ```
   BetterStats
   ```

3. Add your plugin files inside `BetterStats`.

⚠️ **Heads up:**
Don’t leave the plugin folder or files empty. If you do, Vencord will throw an error like this:

```
TypeError: Cannot read properties of undefined (reading 'localeCompare')
```

---

### 🛠 Build & Inject

Once you’ve got the plugin in place, run:

```bash
pnpm build
pnpm inject
```

That’s it! You’re good to go.

---

## 📊 What It Can Do

### `/stats` – Your Personal Stats

Shows how active you are on Discord:

```
◆ Messages
│ Sent:        xxxx 
│ Words:       xxxx 
│ Characters:  xxxx 
└ Edits:       xxxx 

◆ Interactions
│ Replies:     xxxx sent, xxxx received 
│ Reactions:   xxxx 
│ Files:       xxxx 
└ Emojis:      xxxxx 

◆ Network
└ Active in xx servers, xx channels
```

---

### `/serverstats` – Most Active Spots

Shows your top servers and channels:

```
▸ Most Active Servers
│ 1. xxxx 
│ ├ xxxx messages 
│ └ ████░░░░░░░░░░░░░░░░ 15.4%

▸ Most Active Channels
│ 1. xxxx 
│ ├ xxxx messages 
│ └ ███░░░░░░░░░░░░░░░░░ 14.0%
```

---

### `/resetstats`

Want a fresh start? Use this command to clear all tracked stats.

---

## 💬 Suggestions? Want to Contribute?

Feel like this plugin could do even more?
Got a cool idea or found a bug? Open an issue or send a pull request. Help make **BetterStats** even better!

---

## 🔗 Also Check Out

If you're into Vencord plugins, you might like this too:
👉 [Vencord Animated Status](https://github.com/shxdes69/vencord-animated-Status)

---

