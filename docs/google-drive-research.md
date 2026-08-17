# Google Drive Sync Research

## Sources

1. https://capawesome.io/docs/sdks/capacitor/google-sign-in/
2. https://developers.google.com/identity/protocols/oauth2
3. https://developers.google.com/workspace/drive/api/guides/about-sdk

## Key findings

- `@capawesome/capacitor-google-sign-in` version `0.1.x` is documented as compatible with Capacitor `8.x`.
- The plugin must be initialized with a **Web OAuth 2.0 Client ID** from Google Cloud Console, including on Android. It can request OAuth scopes and return an access token.
- Google Drive API access uses OAuth 2.0. The app obtains an access token, sends it in the HTTP Authorization header, and must handle token expiration.
- The restricted `https://www.googleapis.com/auth/drive.file` scope is suitable for app-created backup files and avoids requesting access to the user's whole Drive.
- Google Drive API supports creating, updating, downloading, and searching files. The app can store a JSON backup file with a deterministic name and update it on later backups.
- The current implementation uses a placeholder client ID until the user creates a Google Cloud project and provides an OAuth Web Client ID. Without that client ID, the app remains buildable and offline-capable, but Google sign-in/sync cannot be activated.

## Setup requirements to document

- Create/select a Google Cloud project.
- Enable Google Drive API.
- Configure the OAuth consent screen.
- Create an OAuth Web Client ID for the plugin initialization.
- Create an Android OAuth client for package `pos.rifaldo` and the app's SHA-1 certificate where required by Google sign-in.
- Replace `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com` in the app's Google Drive settings with the real Web Client ID.

## Security notes

- Do not store Google access tokens in the POS database; retain only the account email and backup metadata.
- Request only the `drive.file` scope for app-created backup files.
- The app must show a clear configuration status when the placeholder client ID is still active.
