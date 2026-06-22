const CONFIG = {
  treasuryWallet: "YOUR_WALLET_ADDRESS_HERE",
  priceSOL: 0.05,
  network: "devnet" // start free/test mode
};

// =========================
// 💰 PAYMENT STATE
// =========================

let premiumUnlocked = JSON.parse(localStorage.getItem("premium") || "false");

// =========================
// 🧠 UI UPDATE
// =========================

function updateUI() {
  const status = document.getElementById("premiumStatus");
  if (status) {
    status.innerText = premiumUnlocked ? "UNLOCKED 💰" : "FREE TIER";
  }
}

// =========================
// 🔓 FAKE PAYMENT (PHASE 1 TEST MODE)
// =========================

function simulatePayment() {

  // This simulates Solana payment before wallet integration
  const tx = {
    id: Date.now(),
    wallet: CONFIG.treasuryWallet,
    amount: CONFIG.priceSOL,
    status: "CONFIRMED_SIMULATION"
  };

  console.log("Payment received:", tx);

  premiumUnlocked = true;
  localStorage.setItem("premium", "true");

  updateUI();

  alert("Premium unlocked (test mode)");
}

// =========================
// 🔐 FEATURE GATE
// =========================

function isPremium() {
  return premiumUnlocked;
}

// Example usage
function getPremiumFeature() {
  if (!isPremium()) {
    alert("Upgrade required (0.05 SOL)");
    return;
  }

  alert("Premium feature activated 🚀");
}

// init
updateUI();
