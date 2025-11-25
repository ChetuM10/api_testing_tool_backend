require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.use(cors());
app.use(express.json());

// 1. Root Route
app.get("/", (req, res) => res.send("API Testing Tool Backend Running"));

// 2. Health Check
app.get("/health", (req, res) => {
  res.json({ status: "Backend is running!" });
});

// 3. Supabase Connection Test
app.get("/supabase-test", async (req, res) => {
  if (supabase.supabaseUrl && supabase.supabaseKey) {
    res.json({ ok: true, message: "Supabase client initialized successfully" });
  } else {
    res.status(500).json({ error: "Supabase credentials missing" });
  }
});

// 4. Proxy (Saves to History with user_id)
app.post("/api/proxy", async (req, res) => {
  const { url, method, headers, body, params, user_id } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const startTime = Date.now();

    const response = await axios({
      url,
      method,
      headers,
      params,
      data: body,
      validateStatus: () => true,
    });

    const endTime = Date.now();

    const historyRow = {
      url,
      method,
      headers: headers || {},
      body: body || {},
    };

    if (user_id) {
      historyRow.user_id = user_id;
    }

    supabase
      .from("history")
      .insert([historyRow])
      .then()
      .catch((err) => console.error("History insert error:", err));

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      time: `${endTime - startTime}ms`,
      size: `${JSON.stringify(response.data).length} bytes`,
    });
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).json({ error: "Request Failed", details: error.message });
  }
});

// 5. Get History
app.get("/api/history", async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    if (!userId) return res.status(400).json({ error: "User ID required" });

    const { data, error } = await supabase
      .from("history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5b. Delete Single History Item (NEW)
app.delete("/api/history/:id", async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    const historyId = req.params.id;

    if (!userId) return res.status(400).json({ error: "User ID required" });

    const { error } = await supabase
      .from("history")
      .delete()
      .eq("id", historyId)
      .eq("user_id", userId); // Security: Ensure user owns the record

    if (error) throw error;
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete History Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5c. Clear All History (NEW)
app.delete("/api/history", async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    if (!userId) return res.status(400).json({ error: "User ID required" });

    const { error } = await supabase
      .from("history")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ message: "History cleared" });
  } catch (error) {
    console.error("Clear History Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Create Collection
app.post("/api/collections", async (req, res) => {
  try {
    const { name, user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "User ID required" });

    const { data, error } = await supabase
      .from("collections")
      .insert([{ name, user_id }])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error("Create Collection Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Get Collections
app.get("/api/collections", async (req, res) => {
  try {
    const userId = req.headers["user-id"];
    if (!userId) return res.status(400).json({ error: "User ID required" });

    const { data: collections, error: colError } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (colError) throw colError;

    const { data: items, error: itemError } = await supabase
      .from("collection_items")
      .select("*");

    if (itemError) throw itemError;

    const result = collections.map((c) => ({
      ...c,
      items: items.filter((i) => i.collection_id === c.id),
    }));

    res.json(result);
  } catch (error) {
    console.error("Get Collections Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Save Request to Collection
app.post("/api/collection-items", async (req, res) => {
  const { collection_id, name, url, method, headers, body } = req.body;

  const { data, error } = await supabase
    .from("collection_items")
    .insert([{ collection_id, name, url, method, headers, body }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.listen(PORT, () =>
  console.log(`Backend running on: http://localhost:${PORT}`)
);
