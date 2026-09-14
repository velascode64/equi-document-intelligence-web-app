import {
  getDriveClient,
  getGoogleAuthUrl,
  getTokensFromCode,
  type PartialOAuthCredentials,
} from "@/src/provider/google.provider"
import type { SupportedMimeType } from "../schemas/document.schema"

export function connectGoogleDrive(state?: string) {
  return getGoogleAuthUrl(undefined, state)
}

export async function completeGoogleDriveConnection(code: string): Promise<PartialOAuthCredentials> {
  return getTokensFromCode(code)
}

export function getGoogleDriveActionClient(credentials: PartialOAuthCredentials): DriveClientLike {
  return getDriveClient(credentials) as unknown as DriveClientLike
}

export type SyncGoogleDriveFolderInput = {
  userId: string
  folderId: string
  credentials: PartialOAuthCredentials
}

export type DriveClientLike = {
  files: {
    list(params: {
      q: string
      fields: string
      pageSize: number
      pageToken?: string
    }): Promise<{ data: { files?: DriveFile[]; nextPageToken?: string | null } }>
    get(
      params: { fileId: string; alt: "media" },
      options: { responseType: "arraybuffer" }
    ): Promise<{ data: ArrayBuffer | Buffer | string }>
  }
}

type DriveFile = {
  id?: string | null
  name?: string | null
  mimeType?: string | null
}

export type SupportedDriveDocument = {
  id: string
  name: string
  mimeType: SupportedMimeType
}

const supportedDriveMimeTypes: SupportedMimeType[] = ["application/pdf", "text/html", "text/csv"]

export async function listGoogleDriveFolderDocuments(
  input: Pick<SyncGoogleDriveFolderInput, "folderId" | "credentials">,
  drive: DriveClientLike = getDriveClient(input.credentials) as unknown as DriveClientLike
): Promise<SupportedDriveDocument[]> {
  const documents: SupportedDriveDocument[] = []
  let pageToken: string | undefined

  do {
    const response = await drive.files.list({
      q: `'${input.folderId}' in parents and trashed = false and (${supportedDriveMimeTypes
        .map((mimeType) => `mimeType = '${mimeType}'`)
        .join(" or ")})`,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: 100,
      pageToken,
    })

    for (const file of response.data.files ?? []) {
      if (!file.id || !file.name || !isSupportedMimeType(file.mimeType)) continue
      documents.push({ id: file.id, name: file.name, mimeType: file.mimeType })
    }

    pageToken = response.data.nextPageToken || undefined
  } while (pageToken)

  return documents
}

export async function downloadGoogleDriveFile(
  fileId: string,
  drive: DriveClientLike
): Promise<Buffer> {
  const response = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" })
  if (Buffer.isBuffer(response.data)) return response.data
  if (typeof response.data === "string") return Buffer.from(response.data)
  return Buffer.from(new Uint8Array(response.data))
}

function isSupportedMimeType(mimeType: string | null | undefined): mimeType is SupportedMimeType {
  return supportedDriveMimeTypes.includes(mimeType as SupportedMimeType)
}
