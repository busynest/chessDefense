# Chess Defense

Chess Defense is a chess and tower-defense game, built as a Lit web-components PWA.

## Stack

- [Lit 3](https://lit.dev/) custom elements
- [Redux Toolkit 2](https://redux-toolkit.js.org/) (`configureStore` and slices) with the [pwa-helpers](https://github.com/Polymer/pwa-helpers) `connect` mixin
- [pwa-auth](https://www.npmjs.com/package/pwa-auth) for Firebase sign-in (`<user-icon>`, `<user-drawer>`, `<user-login>`, `<user-settings>`, `<email-reset>`)
- Firebase 12 (the existing Chess Defense web config)
- TypeScript compiled with `tsc`, served in development by `@web/dev-server`, and bundled for hosting with Rollup

## Run

```bash
npm install
npm start
```

`npm start` typechecks and emits `out/`, then opens a dev server on port 8080 and keeps `tsc --watch` running. The page loads `out/application-shell.js`.

```bash
npm run typecheck
npm run build
```

`npm run build` emits `out/` and writes the hosting bundle to `dist/` (JavaScript, `index.html`, manifest, and images). Firebase Hosting is pointed at `dist`.

```bash
npx firebase deploy --only hosting
```

## Sign-in

The shell calls `initialize({ config })` from `pwa-auth` with the project's existing Firebase web config (`src/firebase-config.ts`). The same JSON is also passed as the `firebase-config` attribute on the auth tags. A signed-in user is `{ uid, displayName, email, photoURL, emailVerified }` and is stored in the Redux `user` slice.

Turn on Email/Password in the Firebase console. Leave Google on if the Continue with Google button stays. Profile photos are stored at `pwa-auth/{uid}/photo`.
