# AVault Security Specification

## 1. Data Invariants
1. **User Isolation**: A user can only access, list, read, create, update, or delete documents within their own `/users/{userId}` hierarchy where `request.auth.uid == userId`.
2. **Identity Integrity**: All file records must have `userId == request.auth.uid`. Cross-user spoofing is strictly prohibited.
3. **No Unauthenticated Access**: Unauthenticated requests (`request.auth == null`) are completely blocked.
4. **Boundary Limits**: Strings must strictly enforce length boundaries (e.g., file names <= 255 chars, IDs <= 128 chars, notes <= 1000 chars, preview data <= 20480 chars).
5. **ID Poisoning Guard**: Document IDs must match the `isValidId` regex (`^[a-zA-Z0-9_-]+$`) and be <= 128 characters.
6. **Immutable Fields**: `userId`, `id`, and creation timestamps cannot be mutated upon update.
7. **Strict Field Whitelist**: Writes cannot inject unexpected shadow or ghost keys (`hasOnly`).
8. **Owner-Only PII Protection**: User profile records containing email addresses are restricted to the owner.

---

## 2. The "Dirty Dozen" Threat Payloads

| ID | Attack Vector | Target Path | Payload / Scenario | Expected Result |
|----|---------------|-------------|--------------------|-----------------|
| P01 | Unauthenticated Write | `/users/user1/files/f1` | `{ name: 'contract.pdf' }` with `auth = null` | PERMISSION_DENIED |
| P02 | Cross-Tenant User Read | `/users/victim_123` | Read by `attacker_999` | PERMISSION_DENIED |
| P03 | Cross-Tenant File Create | `/users/victim_123/files/f1` | Create attempted by `attacker_999` | PERMISSION_DENIED |
| P04 | Identity Spoofing in Payload | `/users/attacker_999/files/f1` | `{ userId: 'victim_123', name: 'evil.png' }` | PERMISSION_DENIED |
| P05 | ID Poisoning Attack | `/users/user1/files/../../etc` | Path contains path traversal characters | PERMISSION_DENIED |
| P06 | Shadow Key Injection | `/users/user1/files/f1` | `{ id: 'f1', userId: 'user1', name: 'a.pdf', size: 10, type: 'pdf', clientName: 'C1', isAdmin: true }` | PERMISSION_DENIED |
| P07 | Massive Buffer Exhaustion (Denial of Wallet) | `/users/user1/files/f1` | File name containing 50,000 characters | PERMISSION_DENIED |
| P08 | Negative File Size Injection | `/users/user1/files/f1` | `{ size: -99999 }` | PERMISSION_DENIED |
| P09 | Immutable Field Tampering | `/users/user1/files/f1` (update) | Changing `userId` to another user's ID | PERMISSION_DENIED |
| P10 | Unbounded List Query Scraping | `/users/{anyUser}/files` | Blanket `collectionGroup('files')` query | PERMISSION_DENIED |
| P11 | PII Scraping on Users Collection | `/users` | Listing all user emails | PERMISSION_DENIED |
| P12 | Malformed Document ID Injection | `/users/user1/files/!@#$%^&*` | Invalid regex pattern ID | PERMISSION_DENIED |
