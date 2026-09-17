# Employment inquiry form setup

The GitHub Pages preview intentionally does not transmit or store information. Production intake requires a same-origin serverless endpoint, a verified Resend sending domain, and encrypted environment variables.

## Required production settings

- `RESEND_API_KEY`: a sending-only Resend key restricted to the approved Employment sending domain.
- `INTAKE_FROM`: the approved sender, for example `Avodah Employment <inquiries@subdomain.example>`.
- `INTAKE_RECIPIENTS`: comma-separated intake recipients. Ben Johnson and Sinead O'Neill are approved initially. Do not add Josh Jewett until he confirms.
- `INTAKE_ALLOWED_ORIGINS`: comma-separated exact HTTPS origins allowed to submit the form. Do not use a wildcard.

Do not commit any values. Store them as encrypted production environment variables in the approved host.

## Confirmed launch inputs

- Public Employment number: `804-492-7303`.
- The public number is a CallRail number. Its private routing destination is recorded in the canonical Avodah project task and must not be displayed on the website.
- Initial inquiry recipients: Ben Johnson and Sinead O'Neill. Do not add Josh Jewett until he confirms.
- Use Anchovies' existing Andy-owned Resend workspace. Do not create another Resend account or place this project in Sean's personal workspace.
- Do not publish or use the proposed mailbox or coworking address for a Google Business Profile. A future location must be staffed by Avodah, display permanent signage, and receive clients during its stated hours.
- The existing verified Richmond and Norfolk firm offices may remain as firm-location context until Avodah approves a dedicated Employment location.

## Activation checklist

1. Confirm the final Employment domain and production host.
2. Add and verify a dedicated sending subdomain in Resend using the DNS records Resend provides.
3. Create a sending-only API key restricted to that domain.
4. Add the four encrypted environment variables to the production project.
5. Replace the preview privacy notice with Avodah-approved production language covering email delivery, the Resend processor, retention, recipients, and intake ownership.
6. Deploy and confirm that `GET /api/intake` returns `{ "enabled": true }` from the approved origin.
7. Submit test inquiries with non-confidential test data and confirm delivery to every approved recipient.
8. Confirm the form remains blocked from other origins and that no visitor data is written to application logs.
9. Remove the preview `noindex` controls only as part of the separately approved production launch.
10. Keep the Insights landing page and draft articles out of navigation and `noindex` until each article completes attorney review and written publication approval.

The endpoint validates and sanitizes the short form, includes a honeypot and basic rate limit, and sends through Resend without storing submissions in this repository or application.

## Search and sharing controls

- Every preview route remains `noindex, nofollow`, and `robots.txt` blocks the preview root.
- Open Graph and X/Twitter card metadata are present for link-preview testing. The image URLs currently use the unindexed GitHub Pages asset host.
- Add the final HTTPS domain to canonical and `og:url` tags only after the domain is approved and attached to the production host.
- Generate and submit the production sitemap only after the final route and domain review.
- Do not enable local-business structured data for a mailbox or an ineligible coworking address.
