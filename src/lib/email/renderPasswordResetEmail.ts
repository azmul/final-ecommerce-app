import type { PasswordResetContext } from '@/lib/email/resolvePasswordResetUrl'
import { escapeHtml } from '@/utilities/escapeHtml'

type RenderPasswordResetEmailArgs = {
  context?: PasswordResetContext
  resetURL: string
}

export function renderPasswordResetEmailHtml({
  context = 'storefront',
  resetURL,
}: RenderPasswordResetEmailArgs): string {
  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  const accountLabel = context === 'admin' ? 'admin dashboard' : 'account'

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
      <h1 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Reset your password</h1>
      <p style="margin: 0 0 1rem; line-height: 1.5;">
        We received a request to reset the password for your ${escapeHtml(siteName)} ${escapeHtml(accountLabel)}.
        Click the button below to choose a new password. This link expires in one hour.
      </p>
      <p style="margin: 1.5rem 0 0;">
        <a href="${resetURL}" style="display: inline-block; background: #111; color: #fff; padding: 0.65rem 1.25rem; text-decoration: none; border-radius: 6px;">
          Reset password
        </a>
      </p>
      <p style="margin: 1rem 0 0; font-size: 0.875rem; color: #555;">Or copy this link: ${resetURL}</p>
      <p style="margin: 1.5rem 0 0; font-size: 0.875rem; color: #555; line-height: 1.5;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
  `
}

export function renderPasswordResetEmailSubject(context: PasswordResetContext = 'storefront'): string {
  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  if (context === 'admin') {
    return `Reset your ${siteName} admin password`
  }
  return `Reset your ${siteName} password`
}
