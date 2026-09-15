# Employment inquiry form setup

The GitHub Pages preview intentionally does not transmit or store information. Production intake requires a same-origin serverless endpoint, a verified Resend sending domain, and encrypted environment variables.

## Required production settings

- `RESEND_API_KEY`: a sending-only Resend key restricted to the approved Employment sending domain.
- `INTAKE_FROM`: the approved sender, for example `Avodah Employment <inquiries@subdomain.example>`.
- `INTAKE_RECIPIENTS`: comma-separated intake recipients. Ben Johnson and Sinead O'Neill are approved initially. Do not add Josh Jewett until he confirms.
- `INTAKE_ALLOWED_ORIGINS`: comma-separated exact HTTPS origins allowed to submit the form. Do not use a wildcard.

Do not commit any values. Store them as encrypted production environment variables in the approved host.

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

The endpoint validates and sanitizes the short form, includes a honeypot and basic rate limit, and sends through Resend without storing submissions in this repository or application.
