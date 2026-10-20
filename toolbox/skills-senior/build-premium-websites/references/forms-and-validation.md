# 028 — Formuláre a validácia

Use when the site accepts user input, including contact, booking, checkout or CMS editing. Keep input collection proportional to the real task.

## Decide

Specify why each field is needed, which system validates it and when an operation is confirmed. Distinguish required, optional and conditionally required data. Prefer native controls with familiar behavior unless a specialized control has a defensible benefit.

## Execute

Provide persistent labels, appropriate input types/autocomplete, grouped controls and useful instructions. Explain errors in context and preserve valid input. Use a summary for multi-field errors when it aids navigation. Client validation supports usability; the receiving server must enforce the actual contract.

Define idle, editing, invalid, submitting, confirmed and recoverable failure states. Keep focus changes purposeful. Prevent duplicate intent while retaining recovery if a response is lost. Do not display success after a timer or animation. Ensure submission and cancellation semantics are separate from decorative transition cleanup.

## Verify

Use keyboard entry, pasted values, missing/invalid input, slow response and server rejection. Check that errors identify the affected field and can be found without color. Exercise mobile keyboard obstruction and return to an earlier step. A required field silently hidden by a responsive layout is a release defect.

## Deliver

Provide field/schema contracts, validation timing, error messages, state designs and actual submission evidence. S051 supplies accessible form principles; provider-specific validation and transaction rules must be checked for the selected backend. Do not use a synthetic success response as proof of a working live form.
