const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "TOPIK Registration <no-reply@resend.dev>";
const TEST_EMAIL = "topik.reg.kec1@gmail.com";

// helper
function getRecipient(toEmail) {
  return process.env.NODE_ENV === "production"
    ? toEmail
    : TEST_EMAIL;
}

// =======================
// SUBMISSION EMAIL
// =======================
exports.sendSubmissionEmail = async (toEmail, applicantName, applicationNumber) => {
  const recipient = getRecipient(toEmail);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: recipient,
    subject: "TOPIK Application Submitted – Under Review",

    text: `
Dear ${applicantName},

Your TOPIK application has been successfully submitted.

Application Number: ${applicationNumber}
Status: Under Review (PENDING)

Only approved applicants will receive the official Proof of Registration.

Regards,
TOPIK Registration Unit
    `
  });

  console.log("SUBMISSION EMAIL SENT TO:", recipient);
};

// =======================
// REJECTION EMAIL
// =======================
exports.sendRejectionEmail = async (toEmail, name, reason) => {
  const recipient = getRecipient(toEmail);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: recipient,
    subject: "TOPIK Application Rejected",

    html: `
      <p>Dear ${name},</p>
      <p>Your TOPIK application has been <strong>rejected</strong>.</p>
      <p><strong>Reason:</strong></p>
      <p>${reason.replace(/\n/g, "<br>")}</p>
    `
  });

  console.log("REJECTION EMAIL SENT TO:", recipient);
};

// =======================
// APPROVAL EMAIL WITH (PDF)
// =======================
const fs = require("fs");

exports.sendApprovalEmail = async (
  toEmail,
  name,
  registrationNumber,
  pdfPath
) => {
  const recipient = getRecipient(toEmail);

  // baca PDF & convert ke base64
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString("base64");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: recipient,
    subject: "TOPIK Registration Approved",

    html: `
      <p>Dear ${name},</p>
      <p>Your TOPIK application has been <strong>approved</strong>.</p>
      <p><strong>Registration Number:</strong> ${registrationNumber}</p>
      <p>Your Proof of Registration is attached.</p>
    `,

    attachments: [
      {
        filename: `Proof_of_Registration_${registrationNumber}.pdf`,
        content: pdfBase64
      }
    ]
  });

  console.log("APPROVAL EMAIL SENT TO:", recipient);
};
