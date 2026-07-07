import { Storage } from '@google-cloud/storage';
/**
 * Creates a GCS Storage client whose HTTP requests go through Node's native
 * `fetch` (undici) instead of `node-fetch`.
 *
 * Why: `@google-cloud/storage@7` pins `google-auth-library@9`, which ships
 * `gaxios@6`. gaxios 6 always uses `node-fetch` in Node (it only picks the
 * native fetch when a browser `window.fetch` exists). `node-fetch` fails against
 * the Google OAuth token endpoint with `Invalid response body while trying to
 * fetch https://www.googleapis.com/oauth2/v4/token: Premature close`, whereas
 * the native fetch works (verified). By giving the auth client a Gaxios
 * transporter with `fetchImplementation` set to the native fetch, gtoken/JWT
 * mint tokens via undici and the failure disappears.
 *
 * The same transporter is reused by `@google-cloud/storage` for JSON-API
 * uploads/downloads, hence {@link nativeFetchWithDuplex} for streaming bodies.
 *
 * TODO (remove this workaround when upstream upgrades): there is currently no
 * `@google-cloud/storage` release that drops gaxios 6 — even the latest (7.21)
 * still depends on `google-auth-library@^9`. Native fetch arrives only with
 * gaxios 7 (`google-auth-library@10`). Once `@google-cloud/storage` officially
 * moves to google-auth 10, delete this whole file, replace `createStorage(id)`
 * with `new Storage({ projectId: id })` at the call sites, and drop the explicit
 * `gaxios` / `google-auth-library` dependencies from package.json.
 */
export declare function createStorage(projectId: string): Storage;
//# sourceMappingURL=storage.utils.d.ts.map