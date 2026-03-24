/* ============================================================
   Mentoring Nabidka – Vzorová šablona
   Konfigurace: změň níže při kopii pro klientku.
   ============================================================ */

// ------------------------------------------------------------------
// KONFIGURACE
// ------------------------------------------------------------------
const CONFIG = {
  HESLO_HASH: "",
  KLIENTKA_JMENO: "[Jméno klientky]",
  CENA_ZA_HODINU: 4000,
  MAILTO: "petra.kvetova-psenicna@aibility.cz",
  KALENDAR_URL: "https://calendar.app.google/UAmLdMxEeTVpDtjz5",
};

// Výchozí heslo vzoru: "aibility2026"
CONFIG.HESLO_HASH = "6350e1b2b64d2ec65d7bbae33b1bc9460b242429ce95a7ecc35586f1e37367c4";

// ------------------------------------------------------------------
// Ochrana heslem (JS brána)
// ------------------------------------------------------------------
(async function initPasswordGate() {
  const SESSION_KEY = "mentoring_unlocked";
  const overlay = document.getElementById("password-overlay");
  if (!overlay) return;

  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    overlay.remove();
    return;
  }

  overlay.style.display = "flex";
  document.body.style.overflow = "hidden";

  const form = document.getElementById("password-form");
  const input = document.getElementById("password-input");
  const error = document.getElementById("password-error");
  const btn = document.getElementById("password-btn");
  if (!form || !input || !error || !btn) return;

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    btn.disabled = true;
    try {
      const hash = await sha256(input.value.trim());
      if (hash === CONFIG.HESLO_HASH) {
        sessionStorage.setItem(SESSION_KEY, "1");
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.remove();
          document.body.style.overflow = "";
        }, 300);
      } else {
        error.textContent = "Nesprávné heslo. Zkuste to znovu.";
        error.style.display = "block";
        input.value = "";
        input.focus();
        btn.disabled = false;
      }
    } catch (err) {
      error.textContent =
        "Tento prohlížeč nepodporuje ověření hesla. Otevřete stránku přes https nebo localhost.";
      error.style.display = "block";
      btn.disabled = false;
    }
  });

  input.addEventListener("input", () => {
    error.style.display = "none";
    btn.disabled = false;
  });
})();

// ------------------------------------------------------------------
// Pomocné funkce
// ------------------------------------------------------------------
function getHodinyTotal() {
  const select = document.getElementById("hodiny-select");
  const hodiny = select ? parseInt(select.value, 10) || 1 : 1;
  const total = hodiny * CONFIG.CENA_ZA_HODINU;
  return { hodiny, total };
}

function hodinySlovo(hodiny) {
  if (hodiny === 1) return "hodina";
  if (hodiny >= 2 && hodiny <= 4) return "hodiny";
  return "hodin";
}

function mentoringHodinySlovo(hodiny) {
  if (hodiny === 1) return "mentoringová hodina";
  if (hodiny >= 2 && hodiny <= 4) return "mentoringové hodiny";
  return "mentoringových hodin";
}

function getFormValues() {
  return {
    name: (document.getElementById("poptavka-jmeno") || {}).value?.trim() || "",
    email: (document.getElementById("poptavka-email") || {}).value?.trim() || "",
    billing: (document.getElementById("poptavka-fakturace") || {}).value?.trim() || "",
  };
}

function buildMailParts(hodiny, total, extra) {
  const billing = (extra && extra.billing) || "";
  const name = (extra && extra.name) || "";
  const email = (extra && extra.email) || "";
  const subject = "Objedn\u00e1vka mentoringu \u2013 " + CONFIG.KLIENTKA_JMENO;
  const lines = ["Dobr\u00fd den Petro,", ""];
  lines.push("M\u00e1m z\u00e1jem o AI mentoring u Aibility.", "");
  if (name) lines.push("Jm\u00e9no: " + name);
  if (email) lines.push("E-mail: " + email);
  if (name || email) lines.push("");
  lines.push(
    "Po\u010det mentoringov\u00fdch hodin (60 min): " + hodiny + " (celkem " + hodiny * 60 + " min)",
    "Celkov\u00e1 cena: " + total.toLocaleString("cs-CZ") + " K\u010d bez DPH",
    "",
    "Faktura\u010dn\u00ed \u00fadaje:",
    billing || "(dopln\u011bno n\u00ed\u017ee)",
    "",
    "Po obdr\u017een\u00ed faktury a uhrazen\u00ed platby si rezervuji term\u00edn v kalend\u00e1\u0159i.",
    "",
    "S pozdravem,"
  );
  return { subject, body: lines.join("\n") };
}

// ------------------------------------------------------------------
// UI: přepočet hodin + souhrn
// ------------------------------------------------------------------
function refreshHoursUI() {
  const { hodiny, total } = getHodinyTotal();

  const totalEl = document.getElementById("total-cena");
  const totalHodEl = document.getElementById("total-hodiny");
  if (totalEl) totalEl.textContent = total.toLocaleString("cs-CZ") + "\u00a0K\u010d";
  if (totalHodEl) totalHodEl.textContent = hodiny + "\u00a0" + hodinySlovo(hodiny);

  const souhrnH = document.getElementById("poptavka-souhrn-hodiny");
  const souhrnSlovo = document.getElementById("poptavka-souhrn-hodiny-slovo");
  const souhrnM = document.getElementById("poptavka-souhrn-minuty");
  const souhrnKrat = document.getElementById("poptavka-souhrn-krat-hodiny");
  const souhrnC = document.getElementById("poptavka-souhrn-cena");
  if (souhrnH) souhrnH.textContent = String(hodiny);
  if (souhrnSlovo) souhrnSlovo.textContent = mentoringHodinySlovo(hodiny);
  if (souhrnM) souhrnM.textContent = String(hodiny * 60);
  if (souhrnKrat) souhrnKrat.textContent = String(hodiny);
  if (souhrnC) souhrnC.textContent = total.toLocaleString("cs-CZ") + "\u00a0K\u010d";
}

// ------------------------------------------------------------------
// DOM init
// ------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  // Výběr hodin
  const select = document.getElementById("hodiny-select");
  if (select) {
    select.addEventListener("change", refreshHoursUI);
    refreshHoursUI();
  }

  // Předvyplnit jméno pokud není vzorový placeholder
  const jmenoInput = document.getElementById("poptavka-jmeno");
  if (jmenoInput && CONFIG.KLIENTKA_JMENO && !CONFIG.KLIENTKA_JMENO.includes("[")) {
    jmenoInput.value = CONFIG.KLIENTKA_JMENO;
  }

  // Kopírovat text do schránky
  const kopirujBtn = document.getElementById("cta-kopiruj");
  if (kopirujBtn) {
    kopirujBtn.addEventListener("click", async function () {
      const { hodiny, total } = getHodinyTotal();
      const { name, email, billing } = getFormValues();
      const { subject, body } = buildMailParts(hodiny, total, { name, email, billing: billing || undefined });
      const plain = "Komu: " + CONFIG.MAILTO + "\nP\u0159edm\u011bt: " + subject + "\n\n" + body;
      const statusEl = document.getElementById("poptavka-status");
      try {
        await navigator.clipboard.writeText(plain);
        const prev = kopirujBtn.innerHTML;
        kopirujBtn.textContent = "Zkop\u00edrov\u00e1no \u2013 vlo\u017ete do e-mailu (Ctrl+V)";
        if (statusEl) {
          statusEl.className = "poptavka-status poptavka-status--ok";
          statusEl.innerHTML = "<strong>Text je ve schr\u00e1nce.</strong> Otev\u0159ete e-mail, napi\u0161te adresu <em>" + CONFIG.MAILTO + "</em> a vlo\u017ete text (Ctrl+V).";
          statusEl.style.display = "block";
        }
        setTimeout(function () { kopirujBtn.innerHTML = prev; }, 4000);
      } catch {
        kopirujBtn.textContent = "Kop\u00edrov\u00e1n\u00ed selhalo";
        if (statusEl) {
          statusEl.className = "poptavka-status poptavka-status--err";
          statusEl.innerHTML = "Kop\u00edrov\u00e1n\u00ed selhalo. Zkuste otev\u0159\u00edt str\u00e1nku p\u0159es <strong>https</strong> nebo po\u0161lete e-mail p\u0159\u00edmo na <a href=\"mailto:" + CONFIG.MAILTO + "\">" + CONFIG.MAILTO + "</a>.";
          statusEl.style.display = "block";
        }
        setTimeout(function () { kopirujBtn.textContent = "Kop\u00edrovat text popt\u00e1vky do schr\u00e1nky"; }, 4000);
      }
    });
  }
});
