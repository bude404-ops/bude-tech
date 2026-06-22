const CONFIG = {
  priceSOL: 0.05,
  wallet: AnJDRjTaxtRbqYazSkRjLm1Y2jSfuCmHJhygKiNyrKmx
};

let premium = localStorage.getItem("premium") === "true";

function updateUI() {
  const el = document.getElementById("status");
  if (el) el.innerText = premium ? "PREMIUM UNLOCKED" : "FREE TIER";
}

function simulatePayment() {
  console.log("Simulated payment to:", CONFIG.wallet);

  premium = true;
  localStorage.setItem("premium", "true");

  updateUI();
  alert("Premium unlocked (test mode)");
}

function useFeature() {
  if (!premium) return alert("Requires 0.05 SOL (simulated)");
  alert("Premium feature active");
}

updateUI();
