const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadStudentPhoto(file, applicationNumber, fullName) {
  if (!applicationNumber || !fullName) {
    throw new Error("Missing application number or name");
  }

  const ext = file.originalname.split(".").pop();

  const safeName = fullName
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z_]/g, "");

  const filename = `${applicationNumber}_${safeName}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("student-photos")
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("student-photos")
    .getPublicUrl(filename);

  return data.publicUrl;
}

module.exports = {
  uploadStudentPhoto
};
