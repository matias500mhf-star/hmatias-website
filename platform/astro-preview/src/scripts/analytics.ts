/* HMATIAS Astro analytics — consent-gated, production-only, GTM as the sole tag loader. */
type ConsentState = { statistics?: boolean };
type AnalyticsWindow = Window & {
  Cookiebot?: { consent?: ConsentState };
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    Cookiebot?: { consent?: ConsentState };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const enabled = import.meta.env.PUBLIC_ANALYTICS_ENABLED === "true";
const gtmId = import.meta.env.PUBLIC_GTM_CONTAINER_ID || "GTM-MXT9VM65";
const allowedHosts = new Set(["comercialhmatiasps.com", "www.comercialhmatiasps.com"]);
const path = window.location.pathname || "/";
const robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content || "";
const privateRoute = /^\/(?:source-ao\/(?:ops|review|requests|confirm|track)(?:\/|$)|admin(?:\/|$))/i.test(path);

if (
  enabled &&
  allowedHosts.has(window.location.hostname) &&
  !/\bnoindex\b/i.test(robots) &&
  !privateRoute &&
  /^GTM-[A-Z0-9]+$/.test(gtmId)
) {
  const w = window as AnalyticsWindow;
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function (...args: unknown[]) {
    w.dataLayer?.push(args);
  };

  // Consent is denied by default. GTM is not requested until Statistics consent is granted.
  w.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted"
  });

  let gtmLoaded = false;
  const statisticsAllowed = () => Boolean(w.Cookiebot?.consent?.statistics);

  const loadGtm = () => {
    if (!statisticsAllowed() || gtmLoaded || document.querySelector("script[data-hmatias-gtm]")) return;
    gtmLoaded = true;
    w.dataLayer?.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    script.dataset.hmatiasGtm = gtmId;
    document.head.appendChild(script);
  };

  const updateConsent = () => {
    const granted = statisticsAllowed();
    w.gtag?.("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
      security_storage: "granted"
    });
    if (granted) {
      loadGtm();
      sendInitialEvents();
    }
  };

  const language = (document.documentElement.lang || "pt-AO").toLowerCase();
  const serviceForPath = (pathname: string) => {
    const p = pathname.toLowerCase();
    if (/\/(?:construcao|construction)\/$/.test(p)) return "construction";
    if (/\/facilities\/$/.test(p)) return "facilities";
    if (/\/supply\/$/.test(p)) return "supply";
    if (/\/business-services\/$/.test(p)) return "business_services";
    if (/\/(?:clean|post-construction-cleaning)\/$/.test(p)) return "clean";
    return null;
  };
  const service = serviceForPath(path);

  // Only fixed, allowlisted values are sent. Never pass link URLs, form values or query strings.
  const emit = (event: string, params: Record<string, string> = {}) => {
    if (!statisticsAllowed()) return;
    const safe = Object.fromEntries(
      Object.entries(params).filter(([, value]) =>
        typeof value === "string" && /^[a-z0-9_-]{1,64}$/i.test(value)
      )
    );
    w.dataLayer?.push({
      event,
      page_language: language,
      page_path: path,
      ...(service ? { service_name: service } : {}),
      ...safe
    });
  };

  let initialEventsSent = false;
  const sendInitialEvents = () => {
    if (initialEventsSent || !statisticsAllowed()) return;
    initialEventsSent = true;
    if (service) emit("service_view", { service_name: service });

    // AI attribution is provider-only; no search text or full referrer URL is transmitted.
    try {
      const referrerHost = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
      const utmSource = new URLSearchParams(window.location.search).get("utm_source")?.toLowerCase() || "";
      const aiProvider =
        ["chatgpt", "chatgpt.com"].includes(utmSource) || referrerHost === "chatgpt.com" || referrerHost.endsWith(".chatgpt.com") || referrerHost === "chat.openai.com"
          ? "chatgpt"
          : referrerHost === "perplexity.ai" || referrerHost.endsWith(".perplexity.ai")
            ? "perplexity"
            : referrerHost === "gemini.google.com"
              ? "gemini"
              : referrerHost === "copilot.microsoft.com"
                ? "copilot"
                : null;
      if (aiProvider) emit("ai_referral_view", { ai_provider: aiProvider });
    } catch {
      // Ignore malformed or unavailable referrer data.
    }
  };

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor) return;

    const href = (anchor.getAttribute("href") || "").toLowerCase();
    if (href.startsWith("tel:")) emit("contact_click", { contact_method: "phone" });
    else if (href.startsWith("mailto:")) emit("contact_click", { contact_method: "email" });
    else {
      try {
        const host = new URL(anchor.href, window.location.href).hostname.toLowerCase();
        if (host === "wa.me" || host === "whatsapp.com" || host.endsWith(".whatsapp.com")) {
          emit("contact_click", { contact_method: "whatsapp" });
        }
      } catch {
        // Invalid or non-URL href; ignore.
      }
    }

    if (anchor.dataset.analyticsEvent === "quote_cta_click") {
      emit("quote_cta_click", {
        service_name: anchor.dataset.analyticsService || service || "general",
        contact_method: anchor.dataset.analyticsMethod || "website"
      });
    }

    if (anchor.hasAttribute("download") || /\.pdf(?:$|[?#])/.test(href)) {
      emit("file_download", {
        asset_category: anchor.dataset.analyticsAsset || "public_document",
        file_type: "pdf"
      });
    }

    if (anchor.dataset.analyticsEvent === "catalogue_open") {
      emit("catalogue_open", {
        catalogue_id: anchor.dataset.analyticsCatalogue || "general",
        page_language: language
      });
    }
  }, { passive: true });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const formId = form.dataset.analyticsForm;
    if (!formId || !/^[a-z0-9_-]{1,48}$/i.test(formId)) return;
    emit("form_submit", {
      form_id: formId,
      lead_type: form.dataset.analyticsLeadType || "general"
    });
  }, true);

  // Only trusted success handlers should dispatch this event after a server-confirmed receipt.
  window.addEventListener("hmatias:lead-confirmed", (event) => {
    const detail = (event as CustomEvent<{ leadType?: string; method?: string }>).detail || {};
    const leadType = detail.leadType || "general";
    const method = detail.method || "website";
    if (!/^[a-z0-9_-]{1,48}$/i.test(leadType) || !/^[a-z0-9_-]{1,32}$/i.test(method)) return;
    emit("generate_lead", { lead_type: leadType, method });
  });

  window.addEventListener("CookiebotOnConsentReady", updateConsent);
  window.addEventListener("CookiebotOnAccept", updateConsent);
  window.addEventListener("CookiebotOnDecline", updateConsent);
  updateConsent();
}
