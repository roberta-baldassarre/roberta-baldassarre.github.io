# La Trottola audience launch

Status: signup placements prepared but hidden; Kit is not connected. No campaigns or posts have been sent or scheduled.

Audience: San Francisco Bay Area parents with young children.
Promise: Little adventures from San Francisco—with good food, happy children, and less planning.

## Activate Kit

1. Create a Kit hosted signup form named “La Trottola — little adventures”. Use the heading “A little adventure for your inbox.” Explain the twice-monthly frequency and include a privacy-policy link identifying who handles subscriber data. Enable confirmed opt-in.
2. Keep the free activity pack publicly accessible without email. If offering email delivery separately, use a separate newsletter-consent choice; requesting a download alone must not subscribe someone.
3. Paste the public HTTPS signup URL into `la-trottola/assets/growth-config.js` as `newsletterSignupUrl`. This reveals the existing signup sections on the homepage, Places, Games and four guides. No Kit API key is needed or permitted in browser code.
4. In Kit, create an automation triggered by confirmed subscription to that form. Add the three reviewed emails in `welcome-emails.md`, spaced immediately, three days later, then four days later. Configure the sender, reply-to address, required mailing address, unsubscribe footer and subscriber preferences in Kit.
5. Test with your own address: confirmation, delivery, all links, reply-to, mobile rendering and unsubscribe. Publish only after testing.

## Weekly rhythm: approximately two hours

- 30 minutes: verify a guide’s venue links, practical details and personal claims. Use official websites for current details. Record the review date.
- 45 minutes: select and edit one Instagram draft and three Pinterest drafts from `first-month.md`. Add your own photographs or appropriately licensed graphics; no invented visit stories.
- 15 minutes: schedule the approved posts in Metricool or the platforms’ own scheduler. Metricool is optional and not connected yet.
- 30 minutes: answer replies and review clicks, new confirmed subscribers and unsubscribes. Twice monthly, send one reviewed email built from an existing guide.

Use the same destination story across channels. Keep website guides evergreen; avoid a daily events calendar, new account features or a second brand during this test.

## Measurement

For each published link add `utm_source=instagram` or `pinterest`, `utm_medium=social`, `utm_campaign=launch_month_1`, and a unique `utm_content` such as `monterey_pin_1`. Keep existing query parameters when adding these.

Record weekly: published posts, outbound clicks reported by each platform, confirmed new subscribers, email clicks and unsubscribes. Record unknown values as unknown. Use Kit reports for email and platform reports for social; site-wide analytics is not installed by this setup.

After four weeks, compare outbound clicks per post and confirmed signups per visit where attribution is available. Continue the two topics attracting useful clicks and replies. Do not judge success on follower count alone. There are no promised growth or revenue results.

## Automation installed

`.github/workflows/content-health.yml` runs every Monday at 16:00 UTC and on demand. It checks internal HTML links and produces an external-URL inventory and a report artifact. It does not verify external websites, prices, opening hours or personal experience. Review external links manually before promoting a guide. GitHub scheduled runs may be delayed or disabled according to repository settings.

Drafting, layout reuse and link checks can be automated. Venue verification, editorial approval and sending remain deliberate steps. Never auto-publish unreviewed AI drafts.
