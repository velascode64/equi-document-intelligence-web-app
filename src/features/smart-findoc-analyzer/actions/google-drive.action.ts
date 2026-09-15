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
    create?(params: {
      requestBody: {
        name: string
        mimeType: "application/vnd.google-apps.folder"
        parents: ["root"]
      }
      fields: "id, name"
    }): Promise<{ data: DriveFile }>
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

export type GoogleDriveFolder = {
  id: string
  name: string
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

export async function listGoogleDriveFolders(
  credentials: PartialOAuthCredentials,
  search?: string,
  drive: DriveClientLike = getDriveClient(credentials) as unknown as DriveClientLike
): Promise<GoogleDriveFolder[]> {
  const folders: GoogleDriveFolder[] = []
  let pageToken: string | undefined
  const searchQuery = search ? ` and name contains '${escapeDriveQuery(search)}'` : ""

  do {
    const response = await drive.files.list({
      q: `'root' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false${searchQuery}`,
      fields: "nextPageToken, files(id, name)",
      pageSize: 100,
      pageToken,
    })

    for (const folder of response.data.files ?? []) {
      if (!folder.id || !folder.name) continue
      folders.push({ id: folder.id, name: folder.name })
    }

    pageToken = response.data.nextPageToken || undefined
  } while (pageToken)

  return folders.sort((a, b) => a.name.localeCompare(b.name))
}

export async function createGoogleDriveRootFolder(
  credentials: PartialOAuthCredentials,
  name: string,
  drive: DriveClientLike = getDriveClient(credentials) as unknown as DriveClientLike
): Promise<GoogleDriveFolder> {
  if (!drive.files.create) {
    throw new Error("Google Drive client cannot create folders")
  }

  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: ["root"],
    },
    fields: "id, name",
  })

  if (!response.data.id || !response.data.name) {
    throw new Error("Google Drive did not return the created folder")
  }

  return { id: response.data.id, name: response.data.name }
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

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}
