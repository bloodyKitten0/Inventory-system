const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const originalLoad = Module._load;

let verify;
let sendMail;
let transporter;

function loadEmailService() {
  verify = async () => {};
  sendMail = async () => {};

  transporter = {
    verify: (...args) => verify(...args),
    sendMail: (...args) => sendMail(...args),
  };

  Module._load = function (request, parent, isMain) {
    if (request === "nodemailer") {
      return {
        createTransport: () => transporter,
      };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  delete require.cache[require.resolve("../../../services/email.js")];

  return require("../../../services/email.js");
}

function unloadEmailService() {
  Module._load = originalLoad;

  delete require.cache[require.resolve("../../../services/email.js")];
}

test.afterEach(() => {
  unloadEmailService();
});

test("sends a verification email successfully", async () => {
  const sendVerificationEmail = loadEmailService();

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
  const sendVerificationEmail = loadEmailService();

  const calls = [];

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
  const sendVerificationEmail = loadEmailService();

  let mailOptions;

  sendMail = async (options) => {
    mailOptions = options;
  };

  await sendVerificationEmail("alice@example.com", "abc123verificationtoken");

  assert.equal(mailOptions.to, "alice@example.com");
});

test("uses SMTP_FROM as the sender", async () => {
  process.env.SMTP_FROM = "no-reply@inventory.example";

  const sendVerificationEmail = loadEmailService();

  let mailOptions;

  sendMail = async (options) => {
    mailOptions = options;
  };

  await sendVerificationEmail("alice@example.com", "abc123verificationtoken");

  assert.equal(mailOptions.from, "no-reply@inventory.example");
});

test("uses the correct verification email subject", async () => {
  const sendVerificationEmail = loadEmailService();

  let mailOptions;

  sendMail = async (options) => {
    mailOptions = options;
  };

  await sendVerificationEmail("alice@example.com", "abc123verificationtoken");

  assert.equal(mailOptions.subject, "Verify your Inventory System account");
});

test("includes the raw verification token in the email body", async () => {
  const sendVerificationEmail = loadEmailService();

  let mailOptions;

  sendMail = async (options) => {
    mailOptions = options;
  };

  const rawToken = "abc123verificationtoken";

  await sendVerificationEmail("alice@example.com", rawToken);

  assert.match(mailOptions.text, /abc123verificationtoken/);
});

test("sends exactly the expected email options", async () => {
  process.env.SMTP_FROM = "no-reply@inventory.example";

  const sendVerificationEmail = loadEmailService();

  let mailOptions;

  sendMail = async (options) => {
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
  const sendVerificationEmail = loadEmailService();

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
    (error) => {
      assert.equal(error, verificationError);
      return true;
    },
  );

  assert.equal(sendMailCalled, false);
});

test("propagates sendMail errors", async () => {
  const sendVerificationEmail = loadEmailService();

  const sendMailError = new Error("SMTP message delivery failed");

  verify = async () => {};

  sendMail = async () => {
    throw sendMailError;
  };

  await assert.rejects(
    sendVerificationEmail("alice@example.com", "abc123verificationtoken"),
    (error) => {
      assert.equal(error, sendMailError);
      return true;
    },
  );
});

test("passes the exact email options to sendMail", async () => {
  process.env.SMTP_FROM = "security@inventory.example";

  const sendVerificationEmail = loadEmailService();

  let receivedArguments;

  sendMail = async (...args) => {
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
  const sendVerificationEmail = loadEmailService();

  verify = async () => {};
  sendMail = async () => {};

  const result = await sendVerificationEmail(
    "alice@example.com",
    "abc123verificationtoken",
  );

  assert.equal(result, undefined);
});
//
