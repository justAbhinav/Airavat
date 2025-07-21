require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

// ——— Init Supabase client ——————————————————————————
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ——— POST /upload ———————————————————————————————
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { userHash, email, token, currentTimeStamp, ttl, secondsLimit } =
      req.body;

    if (
      !userHash ||
      !email ||
      !token ||
      !currentTimeStamp ||
      !ttl ||
      !secondsLimit
    ) {
      return res.status(400).json({ error: "Missing required form fields" });
    }

    const { buffer, originalname, mimetype } = req.file;
    const extraFields = { "extra": "data" }; // Example extra fields, can be customized

    // const file      = req.file;
    const fields = req.body;
    const timestamp = Date.now().toString();

    // 1) Generate your SHA‑256 token
    const raw = originalname + JSON.stringify(fields) + timestamp;

    // 2) file upload to Supabase Storage
    const path = `${token}-${originalname}`;
    const { error: upErr } = await supabase.storage
      .from("airavat-storage")
      .upload(path, buffer, {
        contentType: mimetype,
        // you could set cacheControl, upsert, etc. here
      });
    if (upErr) throw upErr;

    // 3) Insert metadata and fields into table
    const { error: dbErr } = await supabase.from("airavat_storage").insert([
      {
        token,
        file_path: path,
        filename: originalname,
        fields: extraFields, // JSONB
        user_hash: userHash,
        email: email,
        client_timestamp: currentTimeStamp, // will be cast to timestamptz
        ttl: parseInt(ttl, 10),
        seconds_limit: parseFloat(secondsLimit),
      },
    ]);
    if (dbErr) throw dbErr;

    // 4) respond with same token
    res.json({ token, success: true });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ——— GET /data/:token —————————————————————————————
app.get("/data", async (req, res) => {
    const token = req.get("token");
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }
  try {
    const { data, error } = await supabase
      .from("airavat_storage")
      .select(
        "file_path, filename, fields, user_hash, email, client_timestamp, ttl, seconds_limit"
      )
      .eq("token", token)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: "Data not found" });
    }

    const {data: fileData, error: dlErr } = await supabase
        .storage
        .from("airavat-storage")
        .download(data.file_path);
    if (dlErr) throw dlErr;

    // 3) Return metadata + URL
    res.set({
        "Content-Type": fileData.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${data.filename}"`,
        "userHash" : data.user_hash,
        "email": data.email,
        "clientTimestamp": data.client_timestamp,
        "ttl": data.ttl,
        "secondsLimit": data.seconds_limit,
        "extraFields": JSON.stringify(data.fields),
    })
    res.send(Buffer.from(await fileData.arrayBuffer()));

  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
