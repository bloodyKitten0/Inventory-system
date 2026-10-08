import test, { mock } from "node:test";
import assert from "node:assert/strict";
import type { MockModuleContext } from "node:test";

type Verify = () => Promise<void>;
type SendMail = (options: any) => Promise<void>;

let verify: Verify;
let sendMail: SendMail;
let mockedNodemailer: MockModuleContext | undefined;
let loadCount = 0;

// services/email.ts creates its transporter when the module is evaluated, so
// nodemailer is replaced with mock.module() and the service is imported again
// (the ?load= query makes Node evaluate it fresh) for every test.
async function loadEmailService() {
  verify = async () => {};
  sendMail = async () => {};

  const transporter = {
    verify: () => verify(),
    sendMail: (options: unknown) => sendMail(options),
  };

  mockedNodemailer = mock.module("nodemailer", {
    defaultExport: {
      createTransport: () => transporter,
    },
  });

  loadCount += 1;

  const module = await import(`../../../services/email.js?load=${loadCount}`);

  return module.default as (email: string, rawToken: string) => Promise<void>;
}

test.afterEach(() => {
  mockedNodemailer?.restore();
  mockedNodemailer = undefined;
});

test("sends a verification email successfully", async () => {
  const sendVerificationEmail = await loadEmailService();

  let verifyCalled = false;
  let sendMailCalled = false;

  verify = async () => {
    verifyCalled = true;
  };

  sendMail = async () => {
    sendMailCalled = true;
  };

  await sendVerificationEmail("alice@example.com", "abc123verificationtoken");

  assert.equal(verifyCalled, true);
  assert.equal(sendMailCalled, true);
});

test("calls verify before sendMail", async () => {
  const sendVerificationEmail = await loadEmailService();

  const calls: string[] = [];

  verify = async () => {
    calls.push("verify");
  };

  sendMail = async () => {
    calls.push("sendMail");
  };

  await sendVerificationEmail("alice@example.com", "abc123verificationtoken");

  assert.deepEqual(calls, ["verify", "sendMail"]);
});

test("sends the email to the supplied recipient", async () => {
  const sendVerificationEmail = await loadEmailService();

  let mailOptions: any;

  sendMail = async (options: unknown) => {
    mailOptions = options;
  };

  await sendVerificationEmail("alice@example.com", "abc123verificationtoken");

  assert.equal(mailOptions.to, "alice@example.com");
});

test("uses SMTP_FROM as the sender", async () => {
  process.env.SMTP_FROM = "no-reply@inventory.example";

  const sendVerificationEmail = await loadEmailService();

  let mailOptions: any;

  sendMail = async (options: unknown) => {
    mailOptions = options;
  };

  await sendVerificationEmail("alice@example.com", "abc123verificationtoken");

  assert.equal(mailOptions.from, "no-reply@inventory.example");
});

test("uses the correct verification email subject", async () => {
  const sendVerificationEmail = await loadEmailService();

  let mailOptions: any;

  sendMail = async (options: unknown) => {
    mailOptions = options;
  };

  await sendVerificationEmail("alice@example.com", "abc123verificationtoken");

  assert.equal(mailOptions.subject, "Verify your Inventory System account");
});

test("includes the raw verification token in the email body", async () => {
  const sendVerificationEmail = await loadEmailService();

  let mailOptions: any;

  sendMail = async (options: unknown) => {
    mailOptions = options;
  };

  const rawToken = "abc123verificationtoken";

  await sendVerificationEmail("alice@example.com", rawToken);

  assert.match(mailOptions.text, /abc123verificationtoken/);
});

test("sends exactly the expected email options", async () => {
  process.env.SMTP_FROM = "no-reply@inventory.example";

  const sendVerificationEmail = await loadEmailService();

  let mailOptions: any;

  sendMail = async (options: unknown) => {
    mailOptions = options;
  };

  const email = "alice@example.com";
  const rawToken = "abc123verificationtoken";

  await sendVerificationEmail(email, rawToken);

  assert.deepEqual(mailOptions, {
    from: "no-reply@inventory.example",
    to: email,
    subject: "Verify your Inventory System account",
    text: `Your verification token is: ${rawToken}`,
  });
});

test("does not send the email when transporter verification fails", async () => {
  const sendVerificationEmail = await loadEmailService();

  const verificationError = new Error("SMTP verification failed");

  let sendMailCalled = false;

  verify = async () => {
    throw verificationError;
  };

  sendMail = async () => {
    sendMailCalled = true;
  };

  await assert.rejects(
    sendVerificationEmail("alice@example.com", "abc123verificationtoken"),
    (error: unknown) => {
      assert.equal(error, verificationError);
      return true;
    },
  );

  assert.equal(sendMailCalled, false);
});

test("propagates sendMail errors", async () => {
  const sendVerificationEmail = await loadEmailService();

  const sendMailError = new Error("SMTP message delivery failed");

  verify = async () => {};

  sendMail = async () => {
    throw sendMailError;
  };

  await assert.rejects(
    sendVerificationEmail("alice@example.com", "abc123verificationtoken"),
    (error: unknown) => {
      assert.equal(error, sendMailError);
      return true;
    },
  );
});

test("passes the exact email options to sendMail", async () => {
  process.env.SMTP_FROM = "security@inventory.example";

  const sendVerificationEmail = await loadEmailService();

  let receivedArguments: unknown[] = [];

  sendMail = async (...args: unknown[]) => {
    receivedArguments = args;
  };

  await sendVerificationEmail("customer@example.com", "raw-token-123");

  assert.equal(receivedArguments.length, 1);

  assert.deepEqual(receivedArguments[0], {
    from: "security@inventory.example",
    to: "customer@example.com",
    subject: "Verify your Inventory System account",
    text: "Your verification token is: raw-token-123",
  });
});

test("resolves when verification and email delivery succeed", async () => {
  const sendVerificationEmail = await loadEmailService();

  verify = async () => {};
  sendMail = async () => {};

  const result = await sendVerificationEmail(
    "alice@example.com",
    "abc123verificationtoken",
  );

  assert.equal(result, undefined);
});
