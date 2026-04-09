# spec-0005-user-avatar

**Status:** done
**Version:** v2.0

## Objective

Add a user avatar component in the top-right corner of the app header displaying the user's initials (first letter of first name + first letter of last name), with a dropdown showing the full name, email, and a logout button.

## Context

The app has no authentication yet. User data (name and email) is held in a Zustand store seeded with placeholder values. This spec adds the UI only; auth integration is out of scope. The logout button triggers `resetUser` on the store (no-op for now).

## Requirements

### 1. Initials utility

1.1. A pure function `getInitials(name: string): string` **must** exist at `src/utils/initials.ts`.

1.2. The function **must** return the first letter of the first word and the first letter of the last word, uppercased:
  - `"Fabricio Souza"` → `"FS"`
  - `"Rayanne Lorrayne dos Santos"` → `"RS"`
  - `"João"` (single word) → `"J"`

---

### 2. User store

2.1. `src/store/useUserStore.ts` **must** expose:
  - `name: string`
  - `email: string`
  - `resetUser(): void` — resets name and email to placeholder values (used by logout).

2.2. The store **must** be seeded with placeholder values (`"Usuário"` / `"usuario@example.com"`).

---

### 3. `UserAvatar` component

3.1. `src/components/User/UserAvatar.tsx` **must** render a circular button (36×36 px) in the header containing the user's initials.

3.2. The circle background **must** use `--color-accent` and text must be white.

3.3. Clicking the avatar **must** toggle a dropdown below it.

3.4. The dropdown **must** show:
  - Left column: avatar circle (same style as the header button, non-interactive) with the user's initials.
  - Right column: user name (bold, primary text color) and email (smaller, secondary text color).
  - Below the name/avatar row: a full-width "Logout" button with a log-out icon (lucide-react `LogOut`).

3.5. Clicking outside the dropdown **must** close it.

3.6. The avatar button **must** have `aria-label="User menu"` and `aria-expanded` reflecting its open state.

3.7. The "Logout" button **must** call `resetUser` from `useUserStore` and close the dropdown.

---

### 4. Header placement

4.1. `UserAvatar` **must** be placed in the right side of the `AppShell` header, with `ml-auto` pushing it to the far right.

---

### 5. Testing

5.1. `src/tests/initials.test.ts` **must** cover:
  - Two-word name.
  - Multi-word name (uses first and last word only).
  - Single-word name (returns one letter).
  - Empty string (returns empty string).

5.2. `src/tests/UserAvatar.test.tsx` **must** cover:
  - Renders initials from store (header button).
  - Dropdown hidden by default.
  - Dropdown visible after click; shows name and email.
  - Dropdown shows avatar with initials inside the popup.
  - Dropdown closes when clicking outside.
  - Logout button calls `resetUser` and closes the dropdown.

---

## Out of Scope

- Login / session management.
- Editing user profile.
- Avatar image upload.
- Authentication integration.

## Dependencies

- `spec-0002-chat-ui.md` — must be `done`.

## Acceptance Criteria

- [ ] Avatar circle with correct initials appears in the top-right of the header.
- [ ] Clicking the avatar opens a dropdown with avatar + name/email row and a Logout button.
- [ ] Avatar circle with initials is visible inside the dropdown on the left.
- [ ] Clicking Logout calls `resetUser` and closes the dropdown.
- [ ] Clicking outside closes the dropdown.
- [ ] `getInitials` handles multi-word names correctly.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm run lint` exits 0.
- [ ] `npm run test` passes all tests.
