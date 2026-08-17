import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in'
import type { PosState } from './types'
import { createBackup, parseBackup } from './storage'

export interface GoogleDriveUser {
  email: string
  displayName: string
  imageUrl: string
  accessToken: string
}

let cachedUser: GoogleDriveUser | null = null

export function getCachedDriveUser(): GoogleDriveUser | null {
  return cachedUser
}

export async function initGoogleSignIn(clientId: string = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com'): Promise<void> {
  try {
    await GoogleSignIn.initialize({
      clientId,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    })
  } catch (error) {
    console.warn('Google Sign-In initialization note:', error)
  }
}

export async function signInWithGoogle(clientId: string): Promise<GoogleDriveUser> {
  await initGoogleSignIn(clientId)
  const result = await GoogleSignIn.signIn()
  if (!result.accessToken) {
    throw new Error('Gagal mendapatkan Access Token dari Google. Pastikan OAuth scopes dikonfigurasi dengan benar.')
  }
  cachedUser = {
    email: result.email || 'user@gmail.com',
    displayName: result.displayName || 'Pengguna',
    imageUrl: result.imageUrl || '',
    accessToken: result.accessToken,
  }
  return cachedUser
}

export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignIn.signOut()
  } catch {}
  cachedUser = null
}

export async function uploadBackupToDrive(state: PosState, accessToken: string, customFileName?: string): Promise<string> {
  const backup = createBackup(state)
  const fileName = customFileName || `ini-pos-backup-${new Date().toISOString().slice(0, 10)}.json`
  const fileContent = JSON.stringify(backup, null, 2)

  // First, check if file exists in Drive
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name='${fileName}' and trashed=false`)}`
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const searchData = await searchRes.json()
  const existingFile = searchData.files?.[0]

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
  }

  if (existingFile) {
    // Update existing file
    const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: fileContent,
    })
    if (!updateRes.ok) {
      const errText = await updateRes.text()
      throw new Error(`Gagal memperbarui backup di Google Drive: ${errText}`)
    }
    return existingFile.id
  } else {
    // Create new file using multipart upload
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', new Blob([fileContent], { type: 'application/json' }))

    const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    })
    if (!createRes.ok) {
      const errText = await createRes.text()
      throw new Error(`Gagal mengunggah backup ke Google Drive: ${errText}`)
    }
    const data = await createRes.json()
    return data.id
  }
}

export async function listDriveBackups(accessToken: string): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name contains 'ini-pos-backup-' and trashed=false`)}&orderBy=modifiedTime desc`
  const res = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error('Gagal mengambil daftar backup dari Google Drive.')
  }
  const data = await res.json()
  return data.files || []
}

export async function downloadBackupFromDrive(fileId: string, accessToken: string): Promise<PosState> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error('Gagal mengunduh file backup dari Google Drive.')
  }
  const rawText = await res.text()
  const backup = parseBackup(rawText)
  return backup.data
}
