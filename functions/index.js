const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Replace with the path to your Firebase service account JSON file
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Your Zapier webhook URL here
const zapierWebhookUrl = "https://hooks.zapier.com/hooks/catch/24183783/u6zl7u9/";

const notifiedItems = new Set(); // track notified items to prevent repeat alerts

async function checkLowStock() {
  try {
    const snapshot = await db.collection("inventory").get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const qty = data.qty || 0;
      const threshold = data.threshold || 0;
      const item = data.item || "Unknown";

      if (qty <= threshold) {
        if (!notifiedItems.has(doc.id)) {
          const payload = {
            item,
            quantity: qty,
            threshold,
            message: `Low stock alert for item ${item}: Quantity is ${qty} at or below threshold ${threshold}.`
          };

          await fetch(zapierWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          console.log(`Zapier notified for item: ${item}`);
          notifiedItems.add(doc.id);
        }
      } else {
        // If stock replenished, remove from notified set so future alerts can trigger
        notifiedItems.delete(doc.id);
      }
    }
  } catch (error) {
    console.error("Error checking low stock:", error);
  }
}

// Run every 5 seconds (5,000 ms)
setInterval(checkLowStock, 5000);

console.log("Low stock monitor started. Checking every 5 seconds.");
checkLowStock(); // initial run
