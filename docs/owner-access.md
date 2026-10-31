# Kippa private access

Kippa access is controlled by the Firebase Authentication custom claim `kippaAccess`. Emails are supplied only to the administrative grant or revoke command; they are not stored in app source or Firebase rules. Firestore rules and callable Functions require the claim.

## Grant access

1. Each Google account must sign in to the deployed app once so Firebase Authentication creates its user record.
2. From the repository root, authenticate Application Default Credentials for the Firebase project and select that project with `firebase use <project-id>`.
3. Grant access to each account:

   ```sh
   npm run owner-access --workspace=kippa-functions -- grant account@example.com
   ```

4. Have the account sign out and back in, then deploy the rules, functions, and app:

   ```sh
   firebase deploy --only firestore,functions,hosting
   ```

The account running the command needs permission to manage Firebase Authentication users in the project.

## Revoke access

```sh
npm run owner-access --workspace=kippa-functions -- revoke account@example.com
```

The account must refresh its Firebase ID token for the claim change to take effect. For immediate revocation, revoke its refresh tokens in Firebase Authentication as well.
