const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadStudentPhoto(file) {
  const ext = file.originalname.split(".").pop();
  const filename = `${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("student-photos")
    .upload(filename, file.buffer, {
      contentType: file.mimetype
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
