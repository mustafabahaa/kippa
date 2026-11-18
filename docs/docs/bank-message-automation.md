# Bank SMS automation

Send selected bank SMS messages to your Kippa household. Kippa parses supported messages and puts detected transactions in **Pending → Needs review**. A pending item enters the ledger only after you approve it.

## iOS

### 1. Create a secure connection

1. Sign in to the target Kippa instance and switch to the household that should receive the messages.
2. Open **Pending → Secure message connection → Connect**. If a connection already exists, choose **Manage**.
3. Choose **HSBC** or **National Bank of Egypt (NBE)** in **Bank**, then select **Create secure connection**. The dialog displays an **Endpoint** and a **Bearer token**. Use the copy controls while the dialog is open. The full token is shown when you create the connection.
4. Enter both values on the iPhone that receives the bank SMS. The token is tied to the selected bank, the household, and its creator's membership. Use one connection and one shortcut per bank. Existing connections created before bank selection use HSBC.

For a fresh Kippa instance, finish [Getting Started](./getting-started.md) first. Deploy the web app, Cloud Functions, Firestore rules, and indexes to the same Firebase project. Use the endpoint issued by the target instance, especially when moving between test and production.

Keep the bearer token in the device configuration. Do not put it, the exported configured shortcut, real SMS text, or screenshots of the request headers in docs, source control, or chat. An assistant can walk through the settings with placeholders while the device owner pastes the actual token.

### 2. Add the iPhone message triggers

1. Open **Shortcuts → All Shortcuts → +**. If you see **Describe a shortcut**, dismiss that panel. Name the shortcut **Kippa Bank Message** plus the bank name so each shortcut is easy to identify.
2. In the editor, tap the action search bar, look in **Automation**, and choose **Message**. The editor adds **When I receive a message**. On versions with a separate **Automation** tab, open **Automation → + → Message** instead.
3. Tap the blue criterion on the trigger. Choose **Message**, keep **contains**, and enter one phrase from the table below. If the trigger starts with **Sender**, switch that criterion to **Message** first. Then use **Add Filter → Sender** to select the sender used by your bank if Shortcuts lets you select it. A sender and phrase in one trigger must both match.
4. In the shortcut editor, add a separate **Message** trigger for each phrase you want to capture. Verify that Shortcuts joins them with **or**. On older iOS versions, create a separate Message personal automation for each phrase. If you add **Run Shortcut** to call a reusable shortcut, expand that action and explicitly pass the trigger's message body in **Input**. If the **Input** field is unavailable, add the HTTP request from step 3 directly to each automation. Use its incoming-message variable in the request.
5. Choose **Run Immediately** when offered. If your iOS version shows **Ask Before Running**, turn it off and confirm **Don't Ask**. In the current editor, **ⓘ → Privacy → Allow Running When Locked** controls whether the shortcut may run while locked, where available. Verify it with a matching message before depending on locked operation.

Choose a phrase for the bank selected on the connection. Use phrases that appear in your bank's templates and avoid overlapping rules that forward the same SMS twice.

**National Bank of Egypt (NBE)** supports these Arabic SMS templates. Add a separate **Message** trigger for each phrase below, and restrict the sender to your bank's sender where possible.

| NBE message type | Message contains | Expected result |
| --- | --- | --- |
| ATM withdrawal | `من البطاقة رقم` | Transfer from the bank account to cash. This verified template has an amount followed by the currency and a month-day date. |
| Debit-card purchase | `بطاقة الخصم المباشر` | Expense. The amount may appear before or after its currency; the supported template includes the card suffix, merchant, and a day/month/year date and time. |
| Incoming instant transfer | `تم إضافة تحويل لحظي لحسابكم` | Income. The date in this template is month-day with no year. |
| Outgoing instant transfer | `تم تنفيذ تحويل لحظي من حسابكم` | Expense. The date in this template is month-day with no year. |

For ATM withdrawals and the two instant-transfer templates, Kippa interprets the month-day in Cairo time when the message reaches Kippa. It uses the current year unless the month-day is later than today, in which case it uses the previous year. Invalid calendar dates are rejected. The trigger phrase only selects candidate messages; Kippa validates the full SMS against the supported template. Do not broaden triggers to generic words such as `خصم` or `تحويل`, which can match unrelated alerts.

NBE uses the same event classifications as HSBC for these verified templates.

| HSBC event | NBE support |
| --- | --- |
| Debit-card purchase expense | Implemented |
| ATM cash withdrawal as transfer to cash | Implemented |
| Incoming IPN transfer income | Implemented for the Arabic incoming instant-transfer template |
| Outgoing IPN transfer expense | Implemented for the Arabic outgoing instant-transfer template |
| Credit-card purchase | Not implemented |
| Credit-card payment notification | Not implemented |
| Separate IPN merchant purchase | Not implemented |
| Phone-banking transfer and paired foreign-exchange legs | Not implemented |
| Other recurring bank debits, credits, or salary templates | Not implemented |
| Statement and minimum-payment alerts | Not implemented |

The unimplemented NBE templates return an unsupported result through the ingestion flow. Add a verified example and tests in `nbe.ts` and its test file when supporting each additional event.

**HSBC** supports the following templates.

| Message type | Example trigger phrase | Expected result for a supported template |
| --- | --- | --- |
| ATM withdrawal | `ATM Cash Withdrawal` | Transfer from a bank account to cash |
| Debit or credit card purchase | `Purchase from` or `Your Credit Card` | Expense |
| IPN merchant purchase | `IPN purchase` | Expense |
| Incoming IPN transfer | `IPN inward transfer` | Income |
| Outgoing IPN transfer | `IPN outward transfer` | Expense with the recipient in the description |
| Phone banking transfer | `Phone Banking Transfer` | Transfer. A supported foreign exchange pair can arrive as two messages. |

A phrase only decides when Shortcuts sends the SMS. Kippa checks the complete message against its parser. Some credit card payment messages produce a notification instead of a pending transaction, and statement reminders are ignored.

See [Apple's automation setup guide](https://support.apple.com/guide/shortcuts/add-automations-apdfbdbd7123/ios) and [message trigger options](https://support.apple.com/guide/shortcuts/communication-triggers-apdd711f9dff/ios).

### 3. Configure the HTTP request in Shortcuts

1. Tap the action search bar, search for **Get Contents of URL**, and add it below the triggers. Tap the URL field and paste the **Endpoint** from the Kippa dialog.
2. Tap the disclosure arrow or **Show More** on the action. Tap **Method → POST**.
3. Expand **Headers → Add new header**. In **Key**, enter `Authorization`. In its text field, type `Bearer`, then one space, then paste the **Bearer token** from the same Kippa connection.
4. Set **Request Body → JSON → Add new field → Text**. Enter `message` as the key. Tap its value field, then tap **Shortcut Input** in the variable bar above the keyboard. If the bar is collapsed, use **Select Variable** or touch and hold the value field to open the variable picker. If your iOS version exposes the incoming **Message** variable directly, select its body or content as text.
5. Confirm the `message` value shows a blue variable token. Typing the words `Shortcut Input` sends those literal words to Kippa.
6. Tap **Add new field → Text** again. Enter `source` as the key and `message-automation` as its literal value. Return to the shortcuts list to save.

For SMS-only operation, open **ⓘ → Details → Show in Share Sheet** and leave the switch off. If the editor displays a **Receive** card, tap its blue input type and select **Text**. It can read **Receive Text from Nowhere** with **If there’s no input → Continue**. Keep that card when the request uses **Shortcut Input**. The **Message** automation supplies the text during an automatic run. If you also run the shortcut by hand, you can wrap the request in an **If** block so it runs only when the input has a value.

For someone implementing another client, the request contract is:

```http
POST <KIPPA_INGESTION_ENDPOINT>
Authorization: Bearer <KIPPA_BEARER_TOKEN>
Content-Type: application/json

{"message":"<INCOMING_SMS_BODY>","source":"message-automation"}
```

`message` must be nonblank and at most 5,000 characters. The source label does not select a bank parser. For an SMS-triggered Shortcuts run, no extra idempotency field is required. Kippa deduplicates repeated submissions of the same message text within a connection.

See [Apple's HTTP request guide](https://support.apple.com/en-lamr/guide/shortcuts/apd58d46713f/ios), [Apple's Shortcut Input guide](https://support.apple.com/en-gb/guide/shortcuts/apdd2b316022/9.0/ios/26) and [an example of the input card in an SMS automation](https://pocketclear.app/help/capture.html#auto-log-bank-sms).

### 4. Verify end to end

1. On a test instance, send the iPhone a synthetic SMS that matches the configured phrase and a supported format. Use the sample for the connection’s bank with no bank-sender restriction on the temporary test trigger, since the SMS comes from a test sender. If testing your actual sender-restricted setup, wait for the next genuine matching SMS.
2. Confirm the item appears in the intended household under **Pending → Needs review**. Check the amount, currency, date, and transaction type. Discard the synthetic item.
3. If hands-free delivery while locked matters, repeat with a different synthetic message and the iPhone locked. The editor's **▶** button alone supplies no incoming SMS, so it does not verify the trigger.

Synthetic HSBC-style input with fictitious values:

```text
********0000 was credited with IPN inward transfer for EGP 12.34 on 15-01-2030 09:00 from Example Sender with reference TEST-ONLY.
```

Synthetic NBE-style debit-card purchase with fictitious values (currency may precede or follow the amount):

```text
تم خصم EGP 12.34 من بطاقة الخصم المباشر رقم 0000 عند EXAMPLE SHOP يوم 15/01/30 الساعه 14:02
تم خصم 12.34 EGP من بطاقة الخصم المباشر رقم 0000 عند EXAMPLE SHOP يوم 15/01/30 الساعه 14:02
```

Synthetic NBE-style incoming and outgoing instant transfers with fictitious values (the dates are month-day and the receipt-time context determines the year):

```text
تم إضافة تحويل لحظي لحسابكم رقم 0000 بمبلغ 12.34 جم من EXAMPLE SENDER رقم مرجعي 000001 يوم 01-15 الساعة 09:00
تم تنفيذ تحويل لحظي من حسابكم رقم 0000 بمبلغ 12.34 جم إلى EXAMPLE RECIPIENT رقم مرجعي 000001 يوم 01-15 الساعة 09:00
```

Synthetic NBE-style ATM withdrawal with fictitious values:

```text
تم خصم 250EGP من البطاقة رقم 0000 عند EXAMPLE ATM يوم 01-15 الساعة 20:18 المتاح 999.1 جم للمزيد اتصل ب 00000
```

The verified withdrawal template does not explicitly say ATM. Enable its phrase only for the bank sender and template verified for your account. Check the proposed cash destination in Pending before approving.

For a client that can inspect the HTTP response:

| Result | What to check |
| --- | --- |
| `202` with `accepted: true` | Open **Pending** in the correct household. |
| `200` with `duplicate: true` | The same connection already handled that text. Use a different synthetic message for the next test. |
| `200` with `ignored: true` | Check the reply's reason and confirm the full body matches a supported template. Matching the trigger phrase alone is insufficient. |
| `200` with `notificationSent: true` | This message follows the notification path. Check the account or card view for the corresponding activity. |
| `400 invalid_message` | Check the JSON field name and confirm its value is the incoming SMS body. |
| `401 unauthorized` | Use the token issued by the same instance as the endpoint and check that the connection is active. |
| `403 membership_revoked` | Check whether the connection creator still belongs to the household. |
| No request reaches Kippa | Check the iPhone's sender and phrase filters, automatic-run settings, and network access. |

### 5. Move to another iPhone or Kippa instance

- **New iPhone, same instance.** Check that the device has the shortcut and that the Message automation is enabled on that device. Create a fresh connection, update the shortcut with its endpoint and token, and verify a matching message. Disable the old connection from **Pending → Manage** when retiring the old phone.
- **New instance or household.** Create a connection in the destination. Replace both the endpoint and bearer token. Test that the item appears in the destination household before disabling the old connection.
- **Lost phone or exposed token.** Disable the affected connection in Kippa and create a replacement for the authorized device.

## Android

## Add support for another bank

**Kippa has separate parsers for HSBC and National Bank of Egypt.** The bank selected on the secure connection chooses the parser. Shortcuts filters choose which texts to forward, and the `source` field labels the client. The following workflow applies to a developer or coding assistant working on a new integration.

1. **Inventory templates by event.** Collect redacted or synthetic examples of ATM withdrawals, debit and credit purchases, incoming and outgoing transfers, and both sides of any paired transfer. Include card repayments and statement alerts so they can be distinguished from purchases. Preserve punctuation, date order, spacing, masks, currency notation, and decimal separators in examples. Replace actual names, identifiers, balances, references, and transaction details with fictitious values.
2. **Map the event semantics.** A purchase is an expense. A withdrawal that moves money into a cash account is a transfer to cash. For incoming credits and outgoing payments, decide whether the template represents income, an expense, or a move between accounts. Preserve both amounts and currencies where the template represents a foreign exchange transfer. Treat repayment and statement alerts separately.
3. **Implement and test bank-specific parsing.** Add a separate module beside `hsbc.ts` and `nbe.ts` under `backend/functions/src/domain/message-ingestion`. Register its parser and preview builder in `parser.ts`, add its bank ID to `MessageIngestionBank`, and expose it in the secure connection bank selector. Keep synthetic fixtures next to the new parser. Identify the template and provider, normalize amount, currency, and date, and return the correct account hints and direction. Use bank-specific regular expressions or a structured parser suited to the format. Reject ambiguous inputs and cover near matches, malformed fields, date and currency variants, and alerts that should be ignored. Check that the bank's preview builder omits identifiers, balances, and references. Use a fixed preview label until any needed redaction is verified.
4. **Check ingestion behavior.** If the new bank needs to pair transfer legs, use bank-specific matching keys and verify account suggestions in `backend/functions/src/features/message-ingestion/messageIngestion.ts`. Validate that duplicate or out-of-order SMS messages cannot create an extra transaction. Run the Functions tests and deploy the updated parser to a test instance.
5. **Add iPhone triggers after the parser is ready.** Choose a narrow sender and phrase from each supported template, point Shortcuts at the test instance, and verify each withdrawal, purchase, and transfer through **Pending → Needs review** before using production credentials.
