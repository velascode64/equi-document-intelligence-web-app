import { google } from "googleapis"

export type PartialOAuthCredentials = {
  accessToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  redirectUri?: string
  expiresAt?: number
}

export const GOOGLE_DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
]

export function getOAuth2Client(credentials?: PartialOAuthCredentials) {
  const clientId = credentials?.clientId || process.env.GOOGLE_CLIENT_ID
  const clientSecret = credentials?.clientSecret || process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = credentials?.redirectUri || process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI")
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  if (credentials?.accessToken || credentials?.refreshToken) {
    auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      expiry_date: credentials.expiresAt,
    })
  }

  return auth
}

export function getGoogleAuthUrl(scopes: string[] = GOOGLE_DRIVE_SCOPES, state = "default") {
  return getOAuth2Client().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  })
}

export function getDriveClient(credentials?: PartialOAuthCredentials) {
  return google.drive({ version: "v3", auth: getOAuth2Client(credentials) })
}

export async function getTokensFromCode(code: string): Promise<PartialOAuthCredentials> {
  const { tokens } = await getOAuth2Client().getToken(code)

  return {
    accessToken: tokens.access_token || undefined,
    refreshToken: tokens.refresh_token || undefined,
    expiresAt: tokens.expiry_date || undefined,
  }
}
