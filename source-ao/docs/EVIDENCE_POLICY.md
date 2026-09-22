# Source AO — Evidence Policy v1

Status: launch baseline for Source AO v1.

## Rule
Source AO v1 does **not** accept or store private screenshots, PDFs, photos, email files, chat exports or other evidence attachments through its public, supplier or internal API.

The database may store an internal `evidence_reference` that identifies the verification event or an authorized evidence location, but that reference is not exposed in public search results.

## Public provenance
A public verified result may expose only the minimum provenance required for commercial transparency:
- supplier identity;
- verification method (for example, direct supplier confirmation);
- verification timestamp;
- expiry/reconfirmation timestamp;
- approved commercial fields such as confirmed quantity or price when applicable.

Private conversation content and internal evidence references remain private.

## Supplier responses
Supplier confirmation forms collect structured commercial fields only. They do not accept file uploads in v1.

## Internal operation
If HMATIAS needs to preserve a document for a contract, dispute or separate procurement process, it must be handled in an authorized business document system outside the Source AO public repository and outside the v1 public/supplier API.

Operators must not paste customer contacts, private email content, passwords, tokens or sensitive documents into `internal_notes` or public evidence fields.

## Future attachment storage
Attachment upload must not be added until all of the following exist:
1. private object storage with access controls;
2. encryption and authenticated retrieval;
3. malware/file-type controls;
4. explicit retention and deletion periods;
5. audit logging without public URLs;
6. staging tests proving that private evidence cannot leak through public search, tracking or logs;
7. updated Privacy Notice and security documentation.

## Launch consequence
Because v1 rejects evidence attachments, the production launch gate does not require an attachment-retention implementation. It does require confirmation that no upload route or public evidence URL has been introduced before release.
