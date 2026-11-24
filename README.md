# Shopping_Glue — Cloudflare Pages + Decap CMS + WhatsApp E-Commerce

Zero-cost dark streetwear store (Hype Flame theme) selling Shirts & Shoes with:
- **Cloudflare Pages** hosting (unlimited free bandwidth) + built-in GitHub OAuth Functions (`/functions/api/auth.js` & `callback.js`)
- **Decap CMS** visual dashboard (`/admin`) with **Direct Upload** (`assets/uploads/`, no Cloudinary required)
- **Editable Streetwear Sub-Tags** (`Oversized Tees`, `Casual Shirts`, `Flannels`, `Sneakers`, `High-Tops`, `Boots`)
- **4-System Shoe Sizing** (`IND / UK / EU / US` live switcher + Size Guide modal)
- **WhatsApp Checkout** (`+919856701460`) with **UPI (₹0 extra)** vs **COD (+₹50 extra, editable in CMS)** and **Shipping calculated & confirmed on WhatsApp**

## Quick Deploy Checklist
1. Push this folder to a GitHub repository (public or private).
2. Create a Cloudflare Pages project connected to that GitHub repo (Framework preset: `None`, Build command: leave blank, Output directory: `.`).
3. Create a GitHub OAuth App (`Settings → Developer Settings → OAuth Apps`):
   - Homepage URL: `https://YOUR-SITE.pages.dev`
   - Authorization callback URL: `https://YOUR-SITE.pages.dev/api/callback`
4. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to Cloudflare Pages **Settings → Environment Variables** (Production & Preview), then redeploy.
5. Edit `admin/config.yml` and replace `YOUR_GITHUB_USERNAME/shopping-glue` and `https://YOUR-SITE.pages.dev`.
6. Open `https://YOUR-SITE.pages.dev/admin/` and log in with GitHub to manage products, sub-tags, COD fee, and photos!
