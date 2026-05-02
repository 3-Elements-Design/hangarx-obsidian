"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/assets.ts
function appendHangarxLogo(target) {
  target.empty();
  const parsed = new DOMParser().parseFromString(HANGARX_LOGO_SVG, "image/svg+xml");
  const root = parsed.documentElement;
  if (root && root.tagName.toLowerCase() === "svg") {
    target.appendChild(root);
  }
}
var HANGARX_LOGO_SVG;
var init_assets = __esm({
  "src/assets.ts"() {
    "use strict";
    HANGARX_LOGO_SVG = `<svg width="108" height="25" viewBox="0 0 108 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="HangarX">
<path d="M95.0274 17.8333L100.035 12.5374L95.0068 7.2002H97.3972L101.23 11.2597L105.022 7.2002H107.433L102.425 12.5168L107.392 17.8333H105.001L101.209 13.815L97.4178 17.8333H95.0274Z" fill="currentColor"/>
<path d="M88.6416 17.8323V7.57007H89.6719V9.98107C89.8505 9.21175 90.2421 8.60728 90.8465 8.16767C91.451 7.71432 92.1585 7.44643 92.969 7.364C93.3812 7.32279 93.807 7.33653 94.2467 7.40522C94.6863 7.46017 95.1328 7.57007 95.5861 7.73493V8.88891C95.3388 8.77901 94.9748 8.67597 94.4939 8.57981C94.0269 8.48364 93.5941 8.43556 93.1957 8.43556C92.5775 8.43556 92.0417 8.54546 91.5884 8.76527C91.1488 8.98507 90.7847 9.28731 90.4962 9.67197C90.2077 10.0429 89.9948 10.4825 89.8574 10.9908C89.7338 11.4991 89.6719 12.0418 89.6719 12.6187V17.8323H88.6416Z" fill="currentColor"/>
<path d="M86.4764 17.8325V15.5864C86.3253 15.9298 86.1124 16.2458 85.8376 16.5343C85.5628 16.8091 85.24 17.0495 84.8691 17.2555C84.5119 17.4616 84.1204 17.6333 83.6945 17.7707C83.2686 17.8944 82.8359 17.9768 82.3962 18.018C81.7643 18.1004 81.1324 18.0936 80.5004 17.9974C79.8822 17.915 79.319 17.7432 78.8107 17.4822C78.3161 17.2075 77.9177 16.8434 77.6155 16.3901C77.3132 15.9367 77.1621 15.3803 77.1621 14.7209C77.1621 14.0752 77.2995 13.56 77.5742 13.1754C77.8627 12.777 78.2268 12.4748 78.6664 12.2687C79.1198 12.0626 79.6075 11.9252 80.1295 11.8565C80.6653 11.7879 81.1736 11.7535 81.6544 11.7535H85.7552C86.0711 11.7535 86.2635 11.678 86.3322 11.5268C86.4146 11.3757 86.4558 11.1903 86.4558 10.9705C86.4558 10.3935 86.3322 9.94011 86.0849 9.6104C85.8513 9.26696 85.5422 9.00594 85.1576 8.82734C84.7866 8.64875 84.3676 8.53198 83.9005 8.47703C83.4472 8.42208 82.9938 8.3946 82.5405 8.3946C82.252 8.3946 81.8879 8.42894 81.4483 8.49763C81.0087 8.55259 80.5828 8.66249 80.1707 8.82734C79.7723 8.9922 79.4289 9.21887 79.1404 9.50737C78.8519 9.79587 78.7076 10.1805 78.7076 10.6614H77.6773C77.6773 10.0569 77.8147 9.54858 78.0894 9.13645C78.3779 8.71057 78.7557 8.36712 79.2228 8.1061C79.6899 7.84508 80.2119 7.65962 80.7889 7.54972C81.3659 7.42608 81.9498 7.36426 82.5405 7.36426C83.2549 7.36426 83.9143 7.42608 84.5188 7.54972C85.1232 7.65962 85.6453 7.85195 86.0849 8.12671C86.5245 8.40147 86.8679 8.77239 87.1152 9.23948C87.3625 9.70657 87.4861 10.2904 87.4861 10.9911V17.8325H86.4764ZM86.4558 13.7112V12.619H81.6956C81.1049 12.619 80.5897 12.6602 80.1501 12.7426C79.7105 12.8251 79.3464 12.9487 79.0579 13.1136C78.7832 13.2784 78.5771 13.4914 78.4397 13.7524C78.3024 14.0134 78.2337 14.3225 78.2337 14.6797C78.2337 14.9957 78.3092 15.2979 78.4603 15.5864C78.6115 15.8749 78.8244 16.129 79.0992 16.3488C79.3877 16.5686 79.738 16.7472 80.1501 16.8846C80.5622 17.0083 81.0293 17.0769 81.5514 17.0907C82.1284 17.1044 82.7053 17.0426 83.2823 16.9052C83.8731 16.7541 84.402 16.5412 84.8691 16.2664C85.3362 15.9916 85.7208 15.6551 86.0231 15.2567C86.3253 14.8445 86.4764 14.3775 86.4764 13.8554V13.7112H86.4558Z" fill="currentColor"/>
<path d="M65.4754 19.275H66.4852C66.6088 19.6871 66.7943 20.0237 67.0415 20.2847C67.3026 20.5595 67.6117 20.7793 67.9689 20.9442C68.326 21.109 68.7382 21.2258 69.2053 21.2945C69.6724 21.3632 70.1807 21.3975 70.7302 21.3975C71.3758 21.3975 71.9666 21.3014 72.5024 21.109C73.0381 20.9167 73.4984 20.6625 73.883 20.3466C74.2677 20.0306 74.563 19.6597 74.7691 19.2338C74.9889 18.8217 75.0988 18.3889 75.0988 17.9356V15.2361C74.8241 15.7032 74.5081 16.1153 74.1509 16.4725C73.7937 16.8159 73.4091 17.1044 72.9969 17.338C72.5848 17.5715 72.152 17.7432 71.6987 17.8531C71.2591 17.9768 70.8057 18.0386 70.3386 18.0386C69.5006 18.0386 68.745 17.9012 68.0719 17.6265C67.4125 17.3517 66.8423 16.9739 66.3615 16.4931C65.8944 16.0123 65.5304 15.449 65.2694 14.8033C65.0221 14.1576 64.8984 13.4639 64.8984 12.722C64.8984 11.9802 65.0221 11.2864 65.2694 10.6407C65.5304 9.98133 65.8944 9.4112 66.3615 8.93038C66.8423 8.44955 67.4125 8.07176 68.0719 7.797C68.7313 7.50851 69.4663 7.36426 70.2768 7.36426C70.9225 7.36426 71.4995 7.43295 72.0078 7.57033C72.5161 7.69397 72.9626 7.87256 73.3472 8.1061C73.7456 8.33965 74.0822 8.62814 74.357 8.97159C74.6455 9.3013 74.8928 9.67222 75.0988 10.0844V7.57033H76.1292V17.8325C76.1292 18.4645 75.9987 19.0552 75.7376 19.6047C75.4766 20.1542 75.1057 20.6351 74.6249 21.0472C74.1578 21.4593 73.5877 21.789 72.9145 22.0363C72.2413 22.2836 71.4926 22.4141 70.6683 22.4279C70.0089 22.4416 69.377 22.3798 68.7725 22.2424C68.1681 22.1188 67.6254 21.9196 67.1446 21.6448C66.6775 21.3838 66.2928 21.0541 65.9906 20.6557C65.6884 20.2573 65.5166 19.7971 65.4754 19.275ZM65.9288 12.722C65.9288 13.3402 66.0318 13.9104 66.2379 14.4324C66.4577 14.9544 66.7599 15.4078 67.1446 15.7925C67.543 16.1771 68.0169 16.4794 68.5665 16.6992C69.116 16.9052 69.7342 17.0083 70.4211 17.0083C71.108 17.0083 71.7399 16.8846 72.3169 16.6373C72.8939 16.3763 73.3885 16.0397 73.8006 15.6276C74.2127 15.2155 74.5356 14.7484 74.7691 14.2263C75.0027 13.7043 75.1194 13.1823 75.1194 12.6602C75.1194 12.1107 75.0027 11.5681 74.7691 11.0323C74.5356 10.4965 74.2127 10.0226 73.8006 9.61046C73.3885 9.18458 72.8939 8.84801 72.3169 8.60073C71.7399 8.33971 71.108 8.2092 70.4211 8.2092C69.7342 8.2092 69.116 8.33284 68.5665 8.58012C68.0169 8.81366 67.543 9.12277 67.1446 9.50743C66.7599 9.89209 66.4577 10.3523 66.2379 10.8881C66.0318 11.4101 65.9288 11.9802 65.9288 12.5985V12.722Z" fill="currentColor"/>
<path d="M53.5098 17.8331V7.57087H54.5401V9.98187C54.8423 9.4461 55.1995 8.99961 55.6117 8.64243C56.0238 8.28524 56.4703 8.00362 56.9511 7.79755C57.4319 7.59148 57.9471 7.46097 58.4966 7.40602C59.0461 7.35107 59.6025 7.3648 60.1658 7.44723C60.784 7.5434 61.3129 7.71512 61.7525 7.9624C62.1921 8.20968 62.5562 8.51879 62.8447 8.88971C63.1332 9.26063 63.3392 9.70025 63.4629 10.2085C63.6003 10.7031 63.6689 11.2526 63.6689 11.8571V17.8331H62.6386V11.8983C62.6386 11.3351 62.5699 10.8405 62.4325 10.4146C62.3089 9.975 62.1028 9.61095 61.8143 9.32245C61.5258 9.02022 61.148 8.79354 60.6809 8.64243C60.2276 8.47757 59.6643 8.39515 58.9912 8.39515C58.2631 8.39515 57.6243 8.51879 57.0747 8.76607C56.5252 8.99961 56.0581 9.31559 55.6735 9.71398C55.3026 10.1124 55.0209 10.5726 54.8286 11.0946C54.6363 11.6167 54.5401 12.1662 54.5401 12.7432V17.8331H53.5098Z" fill="currentColor"/>
<path d="M51.7782 17.8325V15.5864C51.627 15.9298 51.4141 16.2458 51.1393 16.5343C50.8646 16.8091 50.5417 17.0495 50.1708 17.2555C49.8136 17.4616 49.4221 17.6333 48.9962 17.7707C48.5704 17.8944 48.1376 17.9768 47.698 18.018C47.0661 18.1004 46.4341 18.0936 45.8022 17.9974C45.184 17.915 44.6207 17.7432 44.1124 17.4822C43.6178 17.2075 43.2195 16.8434 42.9172 16.3901C42.615 15.9367 42.4639 15.3803 42.4639 14.7209C42.4639 14.0752 42.6012 13.56 42.876 13.1754C43.1645 12.777 43.5286 12.4748 43.9682 12.2687C44.4215 12.0626 44.9092 11.9252 45.4313 11.8565C45.967 11.7879 46.4753 11.7535 46.9562 11.7535H51.0569C51.3729 11.7535 51.5652 11.678 51.6339 11.5268C51.7163 11.3757 51.7576 11.1903 51.7576 10.9705C51.7576 10.3935 51.6339 9.94011 51.3866 9.6104C51.1531 9.26696 50.844 9.00594 50.4593 8.82734C50.0884 8.64875 49.6694 8.53198 49.2023 8.47703C48.749 8.42208 48.2956 8.3946 47.8423 8.3946C47.5538 8.3946 47.1897 8.42894 46.7501 8.49763C46.3105 8.55259 45.8846 8.66249 45.4725 8.82734C45.0741 8.9922 44.7306 9.21887 44.4421 9.50737C44.1536 9.79587 44.0094 10.1805 44.0094 10.6614H42.979C42.979 10.0569 43.1164 9.54858 43.3912 9.13645C43.6797 8.71057 44.0575 8.36712 44.5246 8.1061C44.9916 7.84508 45.5137 7.65962 46.0907 7.54972C46.6677 7.42608 47.2515 7.36426 47.8423 7.36426C48.5566 7.36426 49.216 7.42608 49.8205 7.54972C50.425 7.65962 50.947 7.85195 51.3866 8.12671C51.8262 8.40147 52.1697 8.77239 52.417 9.23948C52.6643 9.70657 52.7879 10.2904 52.7879 10.9911V17.8325H51.7782ZM51.7576 13.7112V12.619H46.9974C46.4066 12.619 45.8915 12.6602 45.4519 12.7426C45.0122 12.8251 44.6482 12.9487 44.3597 13.1136C44.0849 13.2784 43.8789 13.4914 43.7415 13.7524C43.6041 14.0134 43.5354 14.3225 43.5354 14.6797C43.5354 14.9957 43.611 15.2979 43.7621 15.5864C43.9132 15.8749 44.1262 16.129 44.4009 16.3488C44.6894 16.5686 45.0397 16.7472 45.4519 16.8846C45.864 17.0083 46.3311 17.0769 46.8531 17.0907C47.4301 17.1044 48.0071 17.0426 48.5841 16.9052C49.1748 16.7541 49.7037 16.5412 50.1708 16.2664C50.6379 15.9916 51.0225 15.6551 51.3248 15.2567C51.627 14.8445 51.7782 14.3775 51.7782 13.8554V13.7112H51.7576Z" fill="currentColor"/>
<path d="M29.8008 17.8331V3.98535H30.8929V10.1674H40.743V3.98535H41.8352V17.8331H40.743V11.0947H30.8929V17.8331H29.8008Z" fill="currentColor"/>
<path d="M21.4596 0.706815C21.8103 0.319578 22.2287 0.50116 22.1694 0.706798C21.0788 4.52594 20.1048 7.85098 20.0758 7.95066C19.6441 9.43871 19.6095 10.7833 20.2375 12.2906C20.2889 12.4141 26.1088 24.0506 26.2006 24.2464C26.303 24.4651 25.9225 24.8156 25.4588 24.3149C25.3862 24.2365 13.367 10.491 13.2051 10.3169C13.0433 10.1428 13.1199 10.0913 13.2051 9.99577C13.2904 9.90026 21.251 0.937139 21.4596 0.706815Z" fill="currentColor"/>
<path d="M4.75819 0.706815C4.40743 0.319578 3.98903 0.50116 4.04838 0.706798C5.13893 4.52594 6.11301 7.85098 6.14193 7.95066C6.57365 9.43871 6.6083 10.7833 5.98027 12.2906C5.92883 12.4141 0.108943 24.0506 0.0172195 24.2464C-0.0852556 24.4651 0.295279 24.8156 0.758943 24.3149C0.831594 24.2365 12.8508 10.491 13.0126 10.3169C13.1745 10.1428 13.0979 10.0913 13.0126 9.99577C12.9274 9.90026 4.96682 0.937139 4.75819 0.706815Z" fill="currentColor"/>
</svg>`;
  }
});

// src/services/error-format.ts
function formatError(err, contextHeadline) {
  const detail = err instanceof Error ? err.message : String(err);
  for (const p of PATTERNS) {
    if (p.match.test(detail)) {
      return {
        kind: p.kind,
        headline: contextHeadline ?? p.headline,
        detail,
        hint: p.hint
      };
    }
  }
  return {
    kind: "unknown",
    headline: contextHeadline ?? "Something went wrong",
    detail
  };
}
function errorIcon(kind) {
  switch (kind) {
    case "auth":
      return "lock";
    case "network":
      return "wifi-off";
    case "not_found":
      return "help-circle";
    case "rate_limit":
      return "timer";
    case "server":
      return "server-crash";
    case "validation":
      return "alert-octagon";
    case "cancelled":
      return "circle-slash";
    default:
      return "alert-triangle";
  }
}
var PATTERNS;
var init_error_format = __esm({
  "src/services/error-format.ts"() {
    "use strict";
    PATTERNS = [
      // LLM-provider-specific patterns. These have to come BEFORE the generic
      // 4xx/5xx patterns because the upstream message bubbles through with the
      // original status (e.g. Gemini "API key expired" arrives as 400).
      {
        match: /HuggingFace denied this request|Inference-Providers access/i,
        kind: "auth",
        headline: "HuggingFace denied this request",
        hint: `Your HF token can't access this inference provider. Either (a) enable provider access at https://huggingface.co/settings/inference-providers and add credits if it's a paid provider (novita / fireworks-ai / together), or (b) switch the model in Settings \u2192 HangarX \u2192 LLM to one with the ":hf-inference" suffix (free serverless tier).`
      },
      {
        match: /api key expired|expired api key|renew the api key/i,
        kind: "auth",
        headline: "LLM provider API key expired",
        hint: "The Gemini/OpenAI/Anthropic key the server is using has expired. Open Settings \u2192 HangarX \u2192 LLM and paste a fresh key, then save."
      },
      {
        match: /api key not valid|invalid api key|incorrect api key/i,
        kind: "auth",
        headline: "LLM provider rejected the API key",
        hint: "The key the server sent isn't valid. Open Settings \u2192 HangarX \u2192 LLM and paste a working key, then save."
      },
      {
        match: /quota.*exceeded|exceeded.*quota|billing|insufficient_quota|resource.?exhausted/i,
        kind: "rate_limit",
        headline: "LLM provider quota exceeded",
        hint: "Your LLM provider account is out of quota or unbilled. Top up the provider account or switch to a different provider in Settings \u2192 HangarX \u2192 LLM."
      },
      {
        match: /high demand|temporarily unavailable|model is overloaded|UNAVAILABLE/i,
        kind: "server",
        headline: "LLM provider temporarily unavailable",
        hint: "The model is overloaded on the provider's side. Wait a minute and retry, or switch model in Settings \u2192 HangarX \u2192 LLM."
      },
      {
        match: /\b(401|UNAUTHORIZED|AUTH_ERROR|INVALID_API_KEY|invalid bearer)\b/i,
        kind: "auth",
        headline: "Authentication failed",
        hint: "Open Settings \u2192 HangarX. In Cloud mode, sign in again or regenerate your API key in the dashboard. In Local mode, your container is running an older build that still requires a key \u2014 re-save the Compose file and rebuild with `docker compose -f docker-compose.cortex.yml up -d --force-recreate`."
      },
      {
        match: /\b403\b|forbidden|WORKSPACE_NOT_ALLOWED/i,
        kind: "auth",
        headline: "Access denied",
        hint: "Your API key isn't scoped to this workspace. Use a key with access, or switch workspaces."
      },
      {
        match: /\b404\b|NOT_FOUND/i,
        kind: "not_found",
        headline: "Resource not found",
        hint: "The endpoint or entity doesn't exist. If you just synced, give it a few seconds and retry."
      },
      {
        match: /\b429\b|rate.?limit|too many requests/i,
        kind: "rate_limit",
        headline: "Rate limited",
        hint: "HangarX is throttling requests. Wait ~30s and try again."
      },
      {
        match: /\b(503|SERVICE_UNAVAILABLE)\b/i,
        kind: "server",
        headline: "Service temporarily unavailable",
        hint: "The upstream service is overloaded. Wait a moment and retry."
      },
      {
        match: /\b(5\d\d)\b|INTERNAL|EAI_AGAIN/i,
        kind: "server",
        headline: "HangarX server error",
        hint: "Check the cortex-api logs (`docker logs cortex-api`) for the underlying cause."
      },
      {
        match: /ERR_NAME_NOT_RESOLVED|ENOTFOUND|getaddrinfo/i,
        kind: "network",
        headline: "Hostname not found",
        hint: "The API hostname couldn't be resolved. Check Settings \u2192 Connection \u2192 API URL \u2014 typo, wrong domain (.com vs .ai), or DNS issue. In Local mode the URL should be http://localhost:3400."
      },
      {
        match: /econnrefused|ECONNREFUSED/i,
        kind: "network",
        headline: "Connection refused",
        hint: "Nothing is listening on that port. In Local mode, run `docker compose ps` to confirm containers are up; check the port matches your compose file."
      },
      {
        match: /ERR_INTERNET_DISCONNECTED|ENETUNREACH/i,
        kind: "network",
        headline: "No internet connection",
        hint: "Your network is offline. Reconnect, or switch to Local mode if you have the Docker stack running."
      },
      {
        match: /ERR_CERT|ssl|TLS|certificate/i,
        kind: "network",
        headline: "TLS/certificate error",
        hint: "The server's certificate is invalid or expired. If you trust this host, you may need to update it; otherwise contact the API administrator."
      },
      {
        match: /fetch failed|network error|timeout|aborted|ETIMEDOUT/i,
        kind: "network",
        headline: "Cannot reach HangarX",
        hint: "The API isn't responding. In Local mode, run `docker compose ps` to confirm containers are up. Otherwise check your internet connection."
      },
      {
        match: /\b(400|VALIDATION_ERROR|ZodError|invalid input)\b/i,
        kind: "validation",
        headline: "Invalid request",
        hint: "The request body wasn't accepted. This is usually a plugin bug \u2014 please report."
      },
      {
        match: /aborted|cancelled|user cancelled/i,
        kind: "cancelled",
        headline: "Cancelled"
      }
    ];
  }
});

// src/views/diff-modal.ts
var diff_modal_exports = {};
__export(diff_modal_exports, {
  DiffModal: () => DiffModal
});
var import_obsidian4, PAGE_SIZE, MAX_NAMES_TO_SHOW, DiffModal;
var init_diff_modal = __esm({
  "src/views/diff-modal.ts"() {
    "use strict";
    import_obsidian4 = require("obsidian");
    PAGE_SIZE = 500;
    MAX_NAMES_TO_SHOW = 50;
    DiffModal = class extends import_obsidian4.Modal {
      constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.cancelToken = { aborted: false };
      }
      async onOpen() {
        this.modalEl.addClass("cortex-diff-modal");
        this.titleEl.setText("Vault \u2194 Graph diff");
        this.bodyEl = this.contentEl.createDiv({ cls: "cortex-diff-body" });
        this.statusEl = this.bodyEl.createDiv({ cls: "cortex-diff-status" });
        this.statusEl.setText("Loading\u2026");
        try {
          const startTime = Date.now();
          const graphNames = await this.fetchAllGraphNoteNames((progress) => {
            if (this.cancelToken.aborted) return;
            this.statusEl.setText(`Fetching graph notes\u2026 ${progress} so far`);
          });
          if (this.cancelToken.aborted) return;
          this.statusEl.setText("Computing diff\u2026");
          const diff = await this.plugin.sync.computeVaultGraphDiff(graphNames);
          if (this.cancelToken.aborted) return;
          const elapsedMs = Date.now() - startTime;
          this.renderDiff(diff, graphNames.size, elapsedMs);
        } catch (e) {
          this.statusEl.empty();
          const err = this.statusEl.createDiv({ cls: "cortex-diff-error" });
          const ic = err.createSpan({ cls: "cortex-diff-error-icon" });
          (0, import_obsidian4.setIcon)(ic, "alert-circle");
          err.createSpan({ text: `Couldn't load diff: ${e.message}` });
        }
      }
      onClose() {
        this.cancelToken.aborted = true;
        this.contentEl.empty();
      }
      /**
       * Paginate through `/v1/graph/entities?type=Note` until exhausted. Each
       * Note entity has a `name` (basename) we use as the diff match key.
       */
      async fetchAllGraphNoteNames(onProgress) {
        const names = /* @__PURE__ */ new Set();
        let offset = 0;
        while (!this.cancelToken.aborted) {
          const page = await this.plugin.client.exportGraphPage({
            entityTypes: ["Note"],
            limit: PAGE_SIZE,
            offset,
            includeRelationships: false
          });
          for (const e of page.entities) {
            if (e.name && typeof e.name === "string") names.add(e.name);
          }
          onProgress(names.size);
          if (page.entities.length < PAGE_SIZE) break;
          offset += PAGE_SIZE;
        }
        return names;
      }
      renderDiff(diff, graphTotal, elapsedMs) {
        this.bodyEl.empty();
        const summary = this.bodyEl.createDiv({ cls: "cortex-diff-summary" });
        this.summaryTile(summary, diff.vaultOnly.length.toLocaleString(), "Vault only", "Need to push");
        this.summaryTile(summary, diff.drifted.length.toLocaleString(), "Drifted", "Local newer than graph");
        this.summaryTile(summary, diff.graphOnly.length.toLocaleString(), "Graph only", "Likely deleted locally");
        this.summaryTile(summary, diff.inSync.length.toLocaleString(), "In sync", "Healthy");
        const meta = this.bodyEl.createDiv({ cls: "cortex-diff-meta" });
        meta.setText(
          `Vault: ${(diff.vaultOnly.length + diff.drifted.length + diff.inSync.length).toLocaleString()} notes  \xB7  Graph: ${graphTotal.toLocaleString()} notes  \xB7  ${elapsedMs}ms`
        );
        if (diff.vaultOnly.length > 0) {
          this.renderBucket({
            title: `Vault only \u2014 needs sync (${diff.vaultOnly.length})`,
            description: "Files exist locally but no matching Note entity in the graph. These haven't been synced yet.",
            names: diff.vaultOnly.map((f) => f.basename),
            files: diff.vaultOnly,
            actionLabel: "Sync these",
            actionIcon: "arrow-up",
            action: () => this.bulkSync(diff.vaultOnly),
            kind: "warning"
          });
        }
        if (diff.drifted.length > 0) {
          this.renderBucket({
            title: `Drifted \u2014 local newer than graph (${diff.drifted.length})`,
            description: "Local file mtime is newer than the last-synced timestamp. The graph likely has stale content.",
            names: diff.drifted.map((f) => f.basename),
            files: diff.drifted,
            actionLabel: "Re-sync these",
            actionIcon: "refresh-cw",
            action: () => this.bulkSync(diff.drifted),
            kind: "warning"
          });
        }
        if (diff.graphOnly.length > 0) {
          this.renderBucket({
            title: `Graph only \u2014 orphaned in graph (${diff.graphOnly.length})`,
            description: "Note entities in the graph with no matching vault file. Usually means the file was deleted locally and the deletion didn't propagate, or the graph was pulled from a different vault.",
            names: diff.graphOnly,
            files: null,
            actionLabel: null,
            actionIcon: null,
            action: null,
            kind: "info"
          });
        }
        if (diff.inSync.length > 0) {
          this.renderBucket({
            title: `In sync (${diff.inSync.length})`,
            description: "Local file matches the graph version. No action needed.",
            names: diff.inSync.map((f) => f.basename),
            files: diff.inSync,
            actionLabel: null,
            actionIcon: null,
            action: null,
            kind: "ok",
            collapsedByDefault: true
          });
        }
        const footer = this.bodyEl.createDiv({ cls: "cortex-diff-footer" });
        const refreshBtn = footer.createEl("button", { text: "Refresh" });
        refreshBtn.addEventListener("click", async () => {
          this.cancelToken = { aborted: false };
          this.bodyEl.empty();
          this.statusEl = this.bodyEl.createDiv({ cls: "cortex-diff-status", text: "Loading\u2026" });
          await this.onOpen();
        });
        const closeBtn = footer.createEl("button", { text: "Close", cls: "mod-cta" });
        closeBtn.addEventListener("click", () => this.close());
      }
      summaryTile(parent, value, label, sub) {
        const tile = parent.createDiv({ cls: "cortex-diff-tile" });
        tile.createDiv({ cls: "cortex-diff-tile-value", text: value });
        tile.createDiv({ cls: "cortex-diff-tile-label", text: label });
        tile.createDiv({ cls: "cortex-diff-tile-sub", text: sub });
      }
      renderBucket(opts) {
        const wrap = this.bodyEl.createEl("details", { cls: `cortex-diff-bucket cortex-diff-bucket-${opts.kind}` });
        if (!opts.collapsedByDefault) wrap.setAttr("open", "");
        const summary = wrap.createEl("summary", { cls: "cortex-diff-bucket-summary" });
        summary.createSpan({ cls: "cortex-diff-bucket-title", text: opts.title });
        const body = wrap.createDiv({ cls: "cortex-diff-bucket-body" });
        body.createEl("p", { cls: "cortex-diff-bucket-desc", text: opts.description });
        if (opts.action && opts.actionLabel) {
          const actionRow = body.createDiv({ cls: "cortex-diff-bucket-actions" });
          const btn = actionRow.createEl("button", { cls: "mod-cta cortex-diff-bucket-action" });
          if (opts.actionIcon) {
            const ic = btn.createSpan({ cls: "cortex-diff-bucket-action-icon" });
            (0, import_obsidian4.setIcon)(ic, opts.actionIcon);
          }
          btn.createSpan({ text: opts.actionLabel });
          btn.addEventListener("click", () => void opts.action());
        }
        const list = body.createDiv({ cls: "cortex-diff-bucket-list" });
        const visible = opts.names.slice(0, MAX_NAMES_TO_SHOW);
        for (const name of visible) {
          const row = list.createDiv({ cls: "cortex-diff-bucket-row" });
          const link = row.createEl("a", { text: name, attr: { href: "#" } });
          if (opts.files) {
            const file = opts.files.find((f) => f.basename === name);
            if (file) {
              link.addEventListener("click", (evt) => {
                evt.preventDefault();
                this.app.workspace.getLeaf(false).openFile(file);
                this.close();
              });
            }
          } else {
            const target = this.app.metadataCache.getFirstLinkpathDest(name, "");
            if (target) {
              link.addEventListener("click", (evt) => {
                evt.preventDefault();
                this.app.workspace.getLeaf(false).openFile(target);
                this.close();
              });
            } else {
              link.removeAttribute("href");
              link.addClass("cortex-diff-row-unlinked");
            }
          }
        }
        if (opts.names.length > MAX_NAMES_TO_SHOW) {
          list.createDiv({
            cls: "cortex-diff-bucket-more",
            text: `+${opts.names.length - MAX_NAMES_TO_SHOW} more not shown.`
          });
        }
      }
      /**
       * Push each file in series, throttled so we don't spike the LLM provider.
       * Surfaces progress in the status row and a final Notice.
       */
      async bulkSync(files) {
        if (files.length === 0) return;
        const total = files.length;
        let done = 0;
        let failed = 0;
        const oldText = this.statusEl.textContent;
        const update = () => {
          this.statusEl.setText(`Syncing ${done}/${total}${failed > 0 ? ` \xB7 ${failed} failed` : ""}\u2026`);
        };
        update();
        for (const f of files) {
          if (this.cancelToken.aborted) break;
          try {
            await this.plugin.sync.syncOneFile(f);
          } catch (e) {
            console.warn(`[Cortex] Diff bulk sync failed for ${f.path}:`, e);
            failed++;
          }
          done++;
          update();
        }
        new import_obsidian4.Notice(`Diff sync complete \u2014 ${done - failed} pushed, ${failed} failed.`, 4e3);
        this.statusEl.setText(oldText ?? "");
        this.bodyEl.empty();
        this.statusEl = this.bodyEl.createDiv({ cls: "cortex-diff-status", text: "Refreshing\u2026" });
        await this.onOpen();
      }
    };
  }
});

// src/views/sync-modal.ts
var sync_modal_exports = {};
__export(sync_modal_exports, {
  SyncModal: () => SyncModal
});
function relativeTime(ts) {
  const diffMs = Date.now() - ts;
  const min = Math.floor(diffMs / 6e4);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
var import_obsidian5, SyncModal;
var init_sync_modal = __esm({
  "src/views/sync-modal.ts"() {
    "use strict";
    import_obsidian5 = require("obsidian");
    init_error_format();
    SyncModal = class extends import_obsidian5.Modal {
      constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        /** Cached so both stats fills can independently trigger banner re-eval. */
        this.graphEntityCount = null;
      }
      onOpen() {
        this.modalEl.addClass("cortex-sync-modal");
        this.titleEl.setText("HangarX Sync");
        void this.renderPicker();
      }
      onClose() {
        this.contentEl.empty();
      }
      // ────────────────────────────────────────────────────────────────────
      // Picker
      // ────────────────────────────────────────────────────────────────────
      async renderPicker() {
        const c = this.contentEl;
        c.empty();
        c.addClass("cortex-sync-body");
        this.titleEl.setText("HangarX Sync");
        const s = this.plugin.settings;
        let host = s.apiUrl;
        try {
          host = new URL(s.apiUrl).host;
        } catch {
        }
        const badge = c.createDiv({ cls: "cortex-sync-badge" });
        const dot = badge.createSpan({ cls: "cortex-sync-badge-dot" });
        dot.addClass(s.connectionMode === "cloud" ? "is-cloud" : "is-local");
        badge.createSpan({
          cls: "cortex-sync-badge-text",
          text: `${s.connectionMode === "cloud" ? "Cloud" : "Local"} \xB7 ${host}`
        });
        const stats = c.createDiv({ cls: "cortex-sync-stats" });
        const vaultTile = this.statTile(stats, "file-text", "\u2014", "Notes in vault");
        const graphTile = this.statTile(stats, "network", "\u2014", "Entities in knowledge graph");
        const changesTile = this.statTile(stats, "history", "\u2014", "Changed since last sync");
        const banner = c.createDiv({ cls: "cortex-sync-banner is-hidden" });
        const actions = c.createDiv({ cls: "cortex-sync-actions" });
        this.actionCard(actions, {
          icon: "arrow-up",
          title: "Push vault to knowledge graph",
          description: "Send your changed notes to the knowledge graph. Skips files that haven't changed since last sync.",
          onClick: () => void this.runAction("push")
        });
        this.actionCard(actions, {
          icon: "arrow-down",
          title: "Import knowledge graph into vault",
          description: "Materialize knowledge graph entities + relationships as markdown so they appear in Obsidian's graph view.",
          onClick: () => void this.runAction("pull")
        });
        this.actionCard(actions, {
          icon: "refresh-cw",
          title: "Two-way sync",
          description: "Push first, then import. Keeps both sides aligned.",
          onClick: () => void this.runAction("both")
        });
        this.actionCard(actions, {
          icon: "git-compare",
          title: "Diff vault \u2194 knowledge graph",
          description: "See what's out of sync \u2014 local notes missing from the knowledge graph, knowledge graph entities orphaned, files newer than their last sync.",
          onClick: () => {
            this.close();
            void Promise.resolve().then(() => (init_diff_modal(), diff_modal_exports)).then((m) => new m.DiffModal(this.app, this.plugin).open());
          }
        });
        const forceCard = this.actionCard(actions, {
          icon: "rotate-cw",
          title: "Force re-ingest entire vault",
          description: "Wipes the local sync index and re-pushes every note. Use after the server knowledge graph has been reset (e.g. Docker volume wiped).",
          onClick: () => void this.runAction("force-reingest")
        });
        forceCard.addClass("cortex-sync-action-danger");
        const footer = c.createDiv({ cls: "cortex-sync-footer" });
        footer.createSpan({
          text: `Auto-sync on startup: ${s.syncOnStartup ? "On" : "Off"} \xB7 `
        });
        const link = footer.createEl("a", {
          text: "change in settings",
          attr: { href: "#" }
        });
        link.addEventListener("click", (evt) => {
          evt.preventDefault();
          this.close();
          this.app.setting?.open?.();
          this.app.setting?.openTabById?.(this.plugin.manifest.id);
        });
        void this.fillStats(vaultTile, graphTile, changesTile, banner);
      }
      async fillStats(vaultTile, graphTile, changesTile, banner) {
        const fileCount = this.app.vault.getMarkdownFiles().length;
        this.setStatValue(vaultTile, fileCount.toLocaleString());
        let lastSyncedAt = null;
        void this.plugin.sync.getChangesSinceLastSync().then((c) => {
          lastSyncedAt = c.lastSyncedAt;
          const parts = [];
          if (c.added > 0) parts.push(`+${c.added}`);
          if (c.changed > 0) parts.push(`~${c.changed}`);
          if (c.deleted > 0) parts.push(`-${c.deleted}`);
          const headline = parts.length > 0 ? parts.join(" ") : "0";
          this.setStatValue(changesTile, headline);
          const sub = changesTile.querySelector(".cortex-sync-stat-sub");
          if (sub && c.lastSyncedAt) {
            sub.textContent = `Last sync ${relativeTime(c.lastSyncedAt)}`;
          }
          this.maybeShowMismatchBanner(banner, fileCount, lastSyncedAt);
        }).catch(() => {
          this.setStatValue(changesTile, "\u2014");
        });
        void this.plugin.client.getGraphStats().then((g) => {
          this.setStatValue(graphTile, g.totalEntities.toLocaleString());
          this.graphEntityCount = g.totalEntities;
          this.maybeShowMismatchBanner(banner, fileCount, lastSyncedAt);
        }).catch(() => {
          this.setStatValue(graphTile, "\u2014");
        });
      }
      /**
       * Stale-index detection: a populated vault that's been "synced before" but
       * shows zero entities on the server is the classic "Docker volume got
       * wiped, plugin still thinks files are pushed" mismatch. The fix is to
       * clear the local hash index and re-ingest — surface the option here so
       * the user doesn't have to dig into Cmd-P to find it.
       */
      maybeShowMismatchBanner(banner, fileCount, lastSyncedAt) {
        if (this.graphEntityCount === null) return;
        const hasStaleIndex = lastSyncedAt !== null && this.graphEntityCount === 0 && fileCount >= 50;
        if (!hasStaleIndex) {
          banner.addClass("is-hidden");
          return;
        }
        banner.removeClass("is-hidden");
        banner.empty();
        const ic = banner.createSpan({ cls: "cortex-sync-banner-icon" });
        (0, import_obsidian5.setIcon)(ic, "alert-triangle");
        const text = banner.createSpan();
        text.createEl("strong", { text: "Graph is empty but your vault has notes. " });
        text.createSpan({
          text: `Last sync ${lastSyncedAt ? relativeTime(lastSyncedAt) : "a while ago"}. The server graph may have been reset (e.g. Docker volume wiped) \u2014 pushing won't repair it because the plugin thinks files are already synced. Use `
        });
        text.createEl("strong", { text: "Force re-ingest" });
        text.createSpan({ text: " below to wipe the local index and re-push every note." });
      }
      // ────────────────────────────────────────────────────────────────────
      // Action dispatch
      // ────────────────────────────────────────────────────────────────────
      async runAction(action) {
        if (!this.preflight()) return;
        if (action === "pull") {
          this.close();
          this.plugin.runGraphPull();
          return;
        }
        if (action === "push") {
          await this.runPush();
          return;
        }
        if (action === "force-reingest") {
          const fileCount = this.app.vault.getMarkdownFiles().length;
          const ok = confirm(
            `Force-resync ${fileCount} files into the knowledge graph?

This wipes the local sync index and re-pushes every note. Use after the server graph has been reset (Docker volume wiped, container rebuilt). Your notes themselves aren't touched.`
          );
          if (!ok) return;
          await this.runPush({ forceReingest: true });
          return;
        }
        await this.runPush({ thenPull: true });
      }
      /** Render the in-modal progress UI for a push, then optionally chain a pull.
       *  When forceReingest is set, the local sync index is cleared first so every
       *  file is treated as new and re-pushed. */
      async runPush(opts = {}) {
        const c = this.contentEl;
        c.empty();
        this.titleEl.setText(
          opts.forceReingest ? "HangarX Force Re-ingest" : opts.thenPull ? "HangarX Two-way Sync" : "HangarX Push"
        );
        let inFlight = true;
        this.renderBackBar(c, () => inFlight);
        const phaseRow = c.createDiv({ cls: "cortex-pull-phase-row" });
        const phaseIcon = phaseRow.createEl("span", { cls: "cortex-pull-phase-icon" });
        (0, import_obsidian5.setIcon)(phaseIcon, opts.forceReingest ? "rotate-cw" : "arrow-up");
        const phaseEl = phaseRow.createEl("span", {
          cls: "cortex-pull-phase-label",
          text: opts.forceReingest ? "Clearing local index\u2026" : "Pushing vault\u2026"
        });
        const messageEl = c.createDiv({ cls: "cortex-pull-message" });
        const barWrap = c.createDiv({ cls: "cortex-pull-bar-wrap" });
        const barFill = barWrap.createDiv({ cls: "cortex-pull-bar-fill" });
        const statsEl = c.createDiv({ cls: "cortex-pull-stats" });
        const btnRow = c.createDiv({ cls: "cortex-pull-btn-row" });
        const cancelBtn = btnRow.createEl("button", { cls: "cortex-pull-cancel", text: "Cancel" });
        const abort = new AbortController();
        let lastInFlight = 0;
        let cancelling = false;
        cancelBtn.addEventListener("click", () => {
          abort.abort();
          cancelling = true;
          cancelBtn.setText("Cancelling\u2026");
          cancelBtn.setAttr("disabled", "true");
          phaseEl.setText("Cancelling\u2026");
          messageEl.setText(
            `${lastInFlight} ${lastInFlight === 1 ? "file" : "files"} in flight on the server \u2014 waiting to drain (up to ~30s)\u2026`
          );
        });
        let pushResult = null;
        try {
          if (opts.forceReingest) {
            await this.plugin.sync.clearIndex();
            phaseEl.setText("Re-pushing every note\u2026");
          }
          pushResult = await this.plugin.sync.fullSync({
            signal: abort.signal,
            onProgress: ({ phase, done, total, currentPath }) => {
              lastInFlight = Math.min(6, total - done);
              if (cancelling) return;
              if (total > 0) {
                const pct = Math.min(100, Math.round(done / total * 100));
                barFill.style.width = `${pct}%`;
              }
              const verb = phase === "sync" ? "Syncing" : "Removing";
              const where = currentPath ? ` \xB7 ${currentPath.split("/").pop()}` : "";
              phaseEl.setText(`${verb} ${done} / ${total}`);
              messageEl.setText(where ? where.slice(3) : "");
            }
          });
          barFill.addClass("cortex-pull-bar-done");
          barFill.style.width = "100%";
          phaseEl.setText("Push complete");
          messageEl.empty();
          inFlight = false;
        } catch (e) {
          inFlight = false;
          this.renderError(c, statsEl, btnRow, cancelBtn, e, () => void this.runPush(opts));
          return;
        }
        if (opts.thenPull) {
          new import_obsidian5.Notice(
            `Push complete \u2014 ${pushResult.synced} synced, ${pushResult.deleted} removed, ${pushResult.skipped} skipped. Starting import\u2026`,
            4e3
          );
          this.close();
          this.plugin.runGraphPull();
          return;
        }
        statsEl.empty();
        const grid = statsEl.createDiv({ cls: "cortex-pull-stat-grid" });
        this.receiptItem(grid, "plus-circle", `${pushResult.synced} synced`, "cortex-pull-stat-create");
        this.receiptItem(grid, "trash-2", `${pushResult.deleted} removed`, "cortex-pull-stat-delete");
        this.receiptItem(grid, "minus-circle", `${pushResult.skipped} skipped (unchanged)`, "cortex-pull-stat-total");
        btnRow.empty();
        const doneBtn = btnRow.createEl("button", {
          text: "Done",
          cls: "mod-cta",
          attr: { type: "button" }
        });
        doneBtn.addEventListener("click", () => this.close());
        const again = btnRow.createEl("button", {
          text: "Run another",
          attr: { type: "button" }
        });
        again.addEventListener("click", () => void this.renderPicker());
      }
      // ────────────────────────────────────────────────────────────────────
      // Helpers
      // ────────────────────────────────────────────────────────────────────
      preflight() {
        const s = this.plugin.settings;
        if (!s.apiKey && s.connectionMode === "cloud") {
          new import_obsidian5.Notice("HangarX: API key is empty. Open Settings \u2192 Connection.");
          return false;
        }
        if (!s.workspaceId) {
          new import_obsidian5.Notice("HangarX: Workspace ID is empty. Open Settings \u2192 Connection.");
          return false;
        }
        return true;
      }
      statTile(parent, icon, value, label) {
        const tile = parent.createDiv({ cls: "cortex-sync-stat" });
        const ic = tile.createSpan({ cls: "cortex-sync-stat-icon" });
        (0, import_obsidian5.setIcon)(ic, icon);
        const body = tile.createDiv({ cls: "cortex-sync-stat-body" });
        body.createDiv({ cls: "cortex-sync-stat-value", text: value });
        body.createDiv({ cls: "cortex-sync-stat-label", text: label });
        body.createDiv({ cls: "cortex-sync-stat-sub", text: "" });
        return tile;
      }
      setStatValue(tile, value) {
        const valueEl = tile.querySelector(".cortex-sync-stat-value");
        if (valueEl) valueEl.textContent = value;
      }
      actionCard(parent, opts) {
        const card = parent.createDiv({ cls: "cortex-sync-action", attr: { role: "button", tabindex: "0" } });
        const icWrap = card.createSpan({ cls: "cortex-sync-action-icon" });
        (0, import_obsidian5.setIcon)(icWrap, opts.icon);
        const body = card.createDiv({ cls: "cortex-sync-action-body" });
        body.createDiv({ cls: "cortex-sync-action-title", text: opts.title });
        body.createDiv({ cls: "cortex-sync-action-desc", text: opts.description });
        const chevron = card.createSpan({ cls: "cortex-sync-action-chevron" });
        (0, import_obsidian5.setIcon)(chevron, "chevron-right");
        card.addEventListener("click", opts.onClick);
        card.addEventListener("keydown", (evt) => {
          if (evt.key === "Enter" || evt.key === " ") {
            evt.preventDefault();
            opts.onClick();
          }
        });
        return card;
      }
      /**
       * Subtle "← Back to sync menu" affordance rendered at the top of every
       * non-picker screen. If a run is in flight, asks the user to confirm
       * before bouncing back (the underlying sync will keep running in the
       * background — fullSync persists per-file state as it goes — but the
       * progress UI is gone).
       */
      renderBackBar(parent, isInFlight) {
        const bar = parent.createDiv({ cls: "cortex-sync-backbar" });
        const btn = bar.createEl("button", {
          cls: "cortex-sync-backbtn",
          attr: { type: "button", "aria-label": "Back to sync menu" }
        });
        const ic = btn.createSpan({ cls: "cortex-sync-backbtn-icon" });
        (0, import_obsidian5.setIcon)(ic, "arrow-left");
        btn.createSpan({ text: "Back to sync menu" });
        btn.addEventListener("click", () => {
          if (isInFlight()) {
            const ok = confirm(
              "A sync is currently running. Going back hides the progress UI but the sync keeps running. Continue?"
            );
            if (!ok) return;
          }
          void this.renderPicker();
        });
      }
      receiptItem(parent, icon, text, cls) {
        const item = parent.createDiv({ cls: `cortex-pull-stat ${cls}` });
        const ic = item.createSpan({ cls: "cortex-pull-stat-icon" });
        (0, import_obsidian5.setIcon)(ic, icon);
        item.createSpan({ text });
      }
      renderError(rootEl, statsEl, btnRow, cancelBtn, err, onRetry) {
        const fmt = formatError(err, "Push failed");
        statsEl.empty();
        const card = statsEl.createDiv({ cls: `cortex-error-card cortex-error-${fmt.kind}` });
        const head = card.createDiv({ cls: "cortex-error-head" });
        const ic = head.createSpan({ cls: "cortex-error-icon" });
        (0, import_obsidian5.setIcon)(ic, errorIcon(fmt.kind));
        head.createSpan({ cls: "cortex-error-headline", text: fmt.headline });
        if (fmt.hint) card.createDiv({ cls: "cortex-error-hint", text: fmt.hint });
        const detailWrap = card.createEl("details", { cls: "cortex-error-detail-wrap" });
        detailWrap.createEl("summary", { text: "Error details" });
        detailWrap.createEl("pre", { cls: "cortex-error-detail" }).createEl("code", { text: fmt.detail });
        btnRow.empty();
        const retry = btnRow.createEl("button", { text: "Retry", cls: "mod-cta" });
        retry.addEventListener("click", onRetry);
        const back = btnRow.createEl("button", { text: "Back" });
        back.addEventListener("click", () => void this.renderPicker());
      }
    };
  }
});

// src/views/onboarding-modal.ts
var onboarding_modal_exports = {};
__export(onboarding_modal_exports, {
  OnboardingModal: () => OnboardingModal
});
var import_obsidian6, OnboardingModal;
var init_onboarding_modal = __esm({
  "src/views/onboarding-modal.ts"() {
    "use strict";
    import_obsidian6 = require("obsidian");
    init_assets();
    OnboardingModal = class extends import_obsidian6.Modal {
      constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.pollTimer = null;
        this.autoCloseTimer = null;
        // Cache of step 2 + 3 detection — populated async at open and refreshed
        // on each poll tick.
        this.cache = {
          hasSyncedAnything: false,
          hasAnyConversation: false
        };
      }
      async onOpen() {
        this.modalEl.addClass("cortex-onboarding-modal");
        this.titleEl.empty();
        const titleWrap = this.titleEl.createDiv({ cls: "cortex-onboarding-title" });
        const logo = titleWrap.createDiv({ cls: "cortex-onboarding-logo" });
        appendHangarxLogo(logo);
        titleWrap.createEl("span", { text: "Welcome to HangarX" });
        this.bodyEl = this.contentEl.createDiv({ cls: "cortex-onboarding-modal-body" });
        this.bodyEl.createEl("p", {
          cls: "cortex-onboarding-tagline",
          text: "Your Obsidian vault becomes a knowledge graph that every AI agent on your machine can query \u2014 Claude Desktop, Claude Code, Cursor, Cline, Windsurf. Three steps to set it up."
        });
        await this.refreshCache();
        this.renderSteps();
        this.pollTimer = window.setInterval(() => {
          void this.refreshAndRerender();
        }, 800);
        this.plugin.settings.onboardingShownAt = Date.now();
        void this.plugin.saveSettings();
      }
      onClose() {
        if (this.pollTimer != null) {
          window.clearInterval(this.pollTimer);
          this.pollTimer = null;
        }
        if (this.autoCloseTimer != null) {
          window.clearTimeout(this.autoCloseTimer);
          this.autoCloseTimer = null;
        }
        this.contentEl.empty();
      }
      getState() {
        const s = this.plugin.settings;
        const isCloud = s.connectionMode === "cloud";
        const step1Done = isCloud ? !!(s.apiKey && s.workspaceId) : !!s.workspaceId;
        const step2Done = this.cache.hasSyncedAnything;
        const step3Done = this.cache.hasAnyConversation;
        return {
          step1Done,
          step2Done,
          step3Done,
          allComplete: step1Done && step2Done && step3Done
        };
      }
      async refreshCache() {
        try {
          const conversations = await this.plugin.conversations.list().catch(() => []);
          this.cache.hasAnyConversation = conversations.length > 0;
        } catch {
        }
        try {
          await this.plugin.sync.loadIndex();
          const fileCount = Object.keys(this.plugin.sync.index?.files ?? {}).length;
          this.cache.hasSyncedAnything = fileCount > 0;
        } catch {
        }
      }
      async refreshAndRerender() {
        const before = this.getState();
        await this.refreshCache();
        const after = this.getState();
        if (before.step1Done !== after.step1Done || before.step2Done !== after.step2Done || before.step3Done !== after.step3Done) {
          this.renderSteps();
        }
        if (after.allComplete && !this.autoCloseTimer) {
          this.scheduleAutoClose();
        }
      }
      scheduleAutoClose() {
        if (this.autoCloseTimer) return;
        this.autoCloseTimer = window.setTimeout(() => this.close(), 2500);
      }
      renderSteps() {
        this.bodyEl.querySelectorAll(".cortex-onboarding-modal-steps, .cortex-onboarding-modal-progress, .cortex-onboarding-modal-footer, .cortex-onboarding-modal-celebration").forEach((el) => el.remove());
        const state = this.getState();
        if (state.allComplete) {
          const cel = this.bodyEl.createDiv({ cls: "cortex-onboarding-modal-celebration" });
          const ic = cel.createSpan({ cls: "cortex-onboarding-modal-celebration-icon" });
          (0, import_obsidian6.setIcon)(ic, "check-circle");
          cel.createEl("div", {
            cls: "cortex-onboarding-modal-celebration-title",
            text: "You're all set."
          });
          cel.createEl("div", {
            cls: "cortex-onboarding-modal-celebration-sub",
            text: "HangarX is connected, your notes are synced, and the chat is ready. Closing this in a moment\u2026"
          });
          return;
        }
        const stepCount = (state.step1Done ? 1 : 0) + (state.step2Done ? 1 : 0) + (state.step3Done ? 1 : 0);
        const progress = this.bodyEl.createDiv({ cls: "cortex-onboarding-modal-progress" });
        const bar = progress.createDiv({ cls: "cortex-onboarding-modal-progress-bar" });
        bar.style.width = `${stepCount / 3 * 100}%`;
        progress.createSpan({
          cls: "cortex-onboarding-modal-progress-label",
          text: `${stepCount} of 3 done`
        });
        const steps = this.bodyEl.createDiv({ cls: "cortex-onboarding-modal-steps" });
        this.renderStep(steps, {
          done: state.step1Done,
          number: 1,
          title: "Connect HangarX",
          desc: state.step1Done ? `Connected \u2014 running in ${this.plugin.settings.connectionMode === "cloud" ? "Cloud" : "Local"} mode.` : "Pick Cloud (one-click OAuth) or Local (Docker on your machine), then enter the connection details.",
          actionLabel: state.step1Done ? "Settings" : "Open settings",
          actionIcon: "plug",
          action: () => {
            this.app.setting?.open?.();
            this.app.setting?.openTabById?.("hangarx-obsidian");
          }
        });
        this.renderStep(steps, {
          done: state.step2Done,
          number: 2,
          title: "Sync your first notes",
          desc: state.step2Done ? "Your vault has been synced to the knowledge graph at least once." : "Push your vault content to the knowledge graph so HangarX can answer questions about it.",
          actionLabel: state.step2Done ? "Re-sync" : "Sync now",
          actionIcon: "arrow-up",
          action: () => {
            void Promise.resolve().then(() => (init_sync_modal(), sync_modal_exports)).then((m) => new m.SyncModal(this.app, this.plugin).open());
          },
          disabled: !state.step1Done
        });
        this.renderStep(steps, {
          done: state.step3Done,
          number: 3,
          title: "Try a question",
          desc: state.step3Done ? "You've had at least one conversation. Keep going." : "Ask a question about your notes \u2014 open the chat in the right sidebar and try a starter prompt.",
          actionLabel: "Open chat",
          actionIcon: "message-square",
          action: () => {
            void this.plugin.askInChat("What was I working on this week? Highlight key projects, decisions, and open questions.");
            this.close();
          },
          disabled: !state.step2Done
        });
        const footer = this.bodyEl.createDiv({ cls: "cortex-onboarding-modal-footer" });
        const skipBtn = footer.createEl("button", { cls: "cortex-onboarding-modal-skip", text: "I'll come back later" });
        skipBtn.addEventListener("click", () => this.close());
        const help = footer.createEl("a", {
          cls: "cortex-onboarding-modal-help",
          attr: { href: "https://app.hangarx.ai/obsidian", target: "_blank", rel: "noopener" },
          text: "Read the docs \u2192"
        });
        help.addEventListener("click", (evt) => evt.stopPropagation());
      }
      renderStep(parent, opts) {
        const row = parent.createDiv({
          cls: "cortex-onboarding-step" + (opts.done ? " is-done" : "") + (opts.disabled ? " is-disabled" : "")
        });
        const status = row.createDiv({ cls: "cortex-onboarding-step-status" });
        if (opts.done) {
          const ic = status.createSpan({ cls: "cortex-onboarding-step-check" });
          (0, import_obsidian6.setIcon)(ic, "check");
        } else {
          status.setText(String(opts.number));
        }
        const body = row.createDiv({ cls: "cortex-onboarding-step-body" });
        body.createDiv({ cls: "cortex-onboarding-step-title", text: opts.title });
        body.createDiv({ cls: "cortex-onboarding-step-desc", text: opts.desc });
        if (!opts.disabled) {
          const btn = row.createEl("button", { cls: "cortex-onboarding-step-action" });
          const ic = btn.createSpan({ cls: "cortex-onboarding-step-action-icon" });
          (0, import_obsidian6.setIcon)(ic, opts.actionIcon);
          btn.createSpan({ text: opts.actionLabel });
          btn.addEventListener("click", opts.action);
        }
      }
    };
  }
});

// src/services/vault-writer.ts
function dateStamp(ts) {
  const d = ts ? new Date(ts) : /* @__PURE__ */ new Date();
  return d.toISOString().slice(0, 10);
}
function timeStamp(ts) {
  const d = ts ? new Date(ts) : /* @__PURE__ */ new Date();
  return d.toISOString().slice(0, 19).replace("T", " ");
}
function sanitize(name) {
  return name.replace(/[/\\:*?"<>|#^[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}
async function ensureFolder(app, folderPath) {
  const normalized = (0, import_obsidian7.normalizePath)(folderPath);
  const existing = app.vault.getAbstractFileByPath(normalized);
  if (existing instanceof import_obsidian7.TFolder) return;
  if (existing) return;
  await app.vault.createFolder(normalized);
}
async function uniquePath(app, folder, basename) {
  const base = (0, import_obsidian7.normalizePath)(`${folder}/${basename}`);
  let path = `${base}.md`;
  let i = 2;
  while (app.vault.getAbstractFileByPath(path)) {
    path = `${base} (${i}).md`;
    i++;
  }
  return path;
}
async function writeSingleAnswerNote(app, folder, question, answer, entities, citations) {
  await ensureFolder(app, folder);
  const title = sanitize(question.slice(0, 60));
  const path = await uniquePath(app, folder, `${dateStamp()} - ${title}`);
  const frontmatter = [
    "---",
    `type: cortex-chat`,
    `question: "${question.replace(/"/g, '\\"')}"`,
    `date: ${timeStamp()}`
  ];
  if (entities?.length) frontmatter.push(`entities: [${entities.map((e) => `"${e}"`).join(", ")}]`);
  frontmatter.push("---", "");
  const body = [
    `> **Q:** ${question}`,
    "",
    answer
  ];
  if (citations?.length) {
    body.push("", "---", "", "## Sources");
    for (const c of citations) {
      if (c.url) body.push(`- [${c.source}](${c.url})`);
      else body.push(`- [[${c.source}]]`);
    }
  }
  await app.vault.create(path, frontmatter.join("\n") + "\n" + body.join("\n") + "\n");
  return path;
}
async function writeConversationNote(app, folder, data) {
  await ensureFolder(app, folder);
  const title = sanitize(data.title || "Untitled Chat");
  const path = await uniquePath(app, folder, `${dateStamp(data.createdAt)} - ${title}`);
  const frontmatter = [
    "---",
    `type: cortex-conversation`,
    `title: "${data.title?.replace(/"/g, '\\"') || "Untitled"}"`,
    `date: ${timeStamp(data.createdAt)}`,
    `turns: ${data.turns.length}`
  ];
  if (data.entities?.length) frontmatter.push(`entities: [${data.entities.map((e) => `"${e}"`).join(", ")}]`);
  frontmatter.push("---", "");
  const body = [];
  for (const t of data.turns) {
    if (t.role === "user") {
      body.push(`## Q: ${t.content}`, "");
    } else {
      body.push(t.content, "");
    }
  }
  if (data.citations?.length) {
    body.push("---", "", "## Sources");
    for (const c of data.citations) {
      if (c.url) body.push(`- [${c.source}](${c.url})`);
      else body.push(`- [[${c.source}]]`);
    }
  }
  await app.vault.create(path, frontmatter.join("\n") + "\n" + body.join("\n") + "\n");
  return path;
}
async function writeMemoryNote(app, folder, data) {
  await ensureFolder(app, folder);
  const title = sanitize(data.title || data.content.slice(0, 50));
  const path = await uniquePath(app, folder, `${dateStamp()} - ${title}`);
  const frontmatter = [
    "---",
    `type: cortex-memory`,
    `date: ${timeStamp()}`,
    `category: ${data.category || "agent_memory"}`,
    `source: ${data.source || "mcp"}`
  ];
  if (data.tags?.length) frontmatter.push(`tags: [${data.tags.join(", ")}]`);
  frontmatter.push("---", "");
  const body = data.content;
  await app.vault.create(path, frontmatter.join("\n") + "\n" + body + "\n");
  return path;
}
var import_obsidian7;
var init_vault_writer = __esm({
  "src/services/vault-writer.ts"() {
    "use strict";
    import_obsidian7 = require("obsidian");
  }
});

// src/services/mcp-server.ts
var mcp_server_exports = {};
__export(mcp_server_exports, {
  McpServer: () => McpServer,
  generateToken: () => generateToken
});
function getHttp() {
  try {
    return typeof require !== "undefined" ? require("http") : null;
  } catch {
    return null;
  }
}
function generateToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var import_obsidian8, McpServer, BRIDGE_SCRIPT;
var init_mcp_server = __esm({
  "src/services/mcp-server.ts"() {
    "use strict";
    import_obsidian8 = require("obsidian");
    init_vault_writer();
    McpServer = class {
      constructor(plugin, client, settings) {
        this.plugin = plugin;
        this.client = client;
        this.settings = settings;
        this.server = null;
        this.port = 7474;
        this.token = "";
        this.tools = [];
        this._bridgePath = "";
      }
      /** Absolute filesystem path to the stdio bridge script — set after start(). */
      get bridgePath() {
        return this._bridgePath;
      }
      /** Start the server. Returns the resolved port + token (token is regenerated if missing). */
      async start() {
        const http = getHttp();
        if (!http) throw new Error("HTTP module not available \u2014 MCP server requires desktop Obsidian.");
        if (this.server) await this.stop();
        this.port = this.settings.mcpPort || 7474;
        this.token = this.settings.mcpToken || generateToken();
        this.tools = this.buildTools();
        this._bridgePath = await this.writeBridgeScript();
        return new Promise((resolve, reject) => {
          const srv = http.createServer((req, res) => this.handleRequest(req, res));
          srv.on("error", (err) => reject(err));
          srv.listen(this.port, "127.0.0.1", () => {
            this.server = srv;
            new import_obsidian8.Notice(`Cortex MCP server listening on 127.0.0.1:${this.port}`);
            resolve({ port: this.port, token: this.token, bridgePath: this._bridgePath });
          });
        });
      }
      /**
       * Write a self-contained stdio↔HTTP bridge to the plugin's directory.
       * Reads newline-delimited JSON-RPC from stdin, POSTs each message to our
       * local HTTP server with the bearer token, writes responses back to stdout.
       * Uses only Node's built-in `http`/`url` so it works on Node 16+.
       * Returns the absolute filesystem path Claude Desktop should spawn.
       */
      async writeBridgeScript() {
        const adapter = this.plugin.app.vault.adapter;
        const dir = this.plugin.manifest.dir ?? `.obsidian/plugins/${this.plugin.manifest.id}`;
        const relPath = `${dir}/mcp-bridge.cjs`;
        const script = BRIDGE_SCRIPT;
        await adapter.write(relPath, script);
        if (adapter instanceof import_obsidian8.FileSystemAdapter) {
          return adapter.getFullPath(relPath);
        }
        return relPath;
      }
      async stop() {
        if (!this.server) return;
        await new Promise((resolve) => {
          this.server.close(() => resolve());
        });
        this.server = null;
      }
      isRunning() {
        return this.server !== null;
      }
      async handleRequest(req, res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }
        const authHeader = req.headers["authorization"] ?? "";
        const expected = `Bearer ${this.token}`;
        if (authHeader !== expected) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32001, message: "unauthorized \u2014 invalid or missing bearer token" }
          }));
          return;
        }
        if (req.method !== "POST") {
          res.writeHead(405);
          res.end();
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", async () => {
          let request;
          try {
            request = JSON.parse(body);
          } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } }));
            return;
          }
          const reply = await this.dispatch(request);
          if (reply == null) {
            res.writeHead(202);
            res.end();
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(reply));
        });
      }
      async dispatch(req) {
        const id = req.id ?? null;
        try {
          switch (req.method) {
            case "initialize":
              return {
                jsonrpc: "2.0",
                id,
                result: {
                  protocolVersion: "2024-11-05",
                  serverInfo: { name: "hangarx-obsidian", version: "0.1.0" },
                  capabilities: { tools: {} }
                }
              };
            case "notifications/initialized":
              return null;
            case "tools/list":
              return {
                jsonrpc: "2.0",
                id,
                result: {
                  tools: this.tools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    inputSchema: t.inputSchema
                  }))
                }
              };
            case "tools/call": {
              const { name, arguments: args } = req.params ?? {};
              const tool = this.tools.find((t) => t.name === name);
              if (!tool) {
                return { jsonrpc: "2.0", id, error: { code: -32601, message: `unknown tool: ${name}` } };
              }
              if (!this.settings.workspaceId) {
                return {
                  jsonrpc: "2.0",
                  id,
                  error: {
                    code: -32e3,
                    message: "HangarX plugin is missing workspaceId in settings. Open Obsidian Settings \u2192 HangarX and fill in Connection."
                  }
                };
              }
              console.log("[Cortex MCP] tools/call", name, "workspaceId=", this.settings.workspaceId.slice(0, 8) + "\u2026", "apiKey=", this.settings.apiKey ? "present" : "none");
              const result = await tool.handler(args ?? {});
              return {
                jsonrpc: "2.0",
                id,
                result: {
                  content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }]
                }
              };
            }
            default:
              return { jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${req.method}` } };
          }
        } catch (e) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32e3, message: e.message }
          };
        }
      }
      buildTools() {
        const c = this.client;
        return [
          // ── Memory primitives (the headline tools agents reach for first) ──
          {
            name: "cortex_recall",
            description: "Search the user's personal knowledge base (Obsidian vault) for facts, decisions, or context relevant to a query. Use this BEFORE answering questions about the user's projects, preferences, prior decisions, or domain knowledge \u2014 the user has stored notes and your training data alone is not enough. Returns ranked memory items with source provenance.",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "What to search for, in natural language." },
                limit: { type: "number", description: "Max items to return (default 5)." }
              },
              required: ["query"]
            },
            handler: ({ query, limit }) => c.recall(query, limit ?? 5)
          },
          {
            name: "cortex_remember",
            description: "Persist a fact, decision, preference, or insight into the user's knowledge base for future sessions to recall. Use this when the user explicitly asks you to remember something OR when you derive an important conclusion the user will want preserved across sessions (e.g. architectural decisions, user preferences, project commitments). Stored both as a queryable memory and (optionally) as a markdown note in the vault.",
            inputSchema: {
              type: "object",
              properties: {
                content: { type: "string", description: "The fact or insight to persist. Self-contained sentence; do not rely on conversational context." },
                title: { type: "string", description: "Optional short title for the memory note." },
                category: { type: "string", description: "One of: agent_memory (default), user_fact, decision, insight." },
                tags: { type: "array", items: { type: "string" }, description: "Optional tags for filtering later." }
              },
              required: ["content"]
            },
            handler: async ({ content, title, category, tags }) => {
              await c.remember(content);
              let notePath;
              if (this.settings.writeMemoriesToVault) {
                try {
                  notePath = await writeMemoryNote(this.plugin.app, this.settings.memoryFolder, {
                    content,
                    title,
                    category: category || "agent_memory",
                    tags,
                    source: "mcp"
                  });
                } catch (e) {
                  console.warn("[Cortex MCP] Failed to write memory note:", e);
                }
              }
              return { ok: true, notePath };
            }
          },
          // ── Graph navigation (multi-hop reasoning over the user's notes) ──
          {
            name: "cortex_related",
            description: "Find notes related to a specific note in the user's vault. Use this when you have a concrete note title and want to discover what else the user has linked to or near it. Returns ranked notes with their relationship type (wikilink, embedding similarity, extracted entity).",
            inputSchema: {
              type: "object",
              properties: {
                noteName: { type: "string", description: "Exact note title to find related notes for." },
                limit: { type: "number", description: "Max results (default 10)." }
              },
              required: ["noteName"]
            },
            handler: ({ noteName, limit }) => c.related(noteName, limit ?? 10)
          },
          {
            name: "cortex_paths",
            description: `Trace the shortest paths through the knowledge graph between two notes or entities. Use this to answer "how is A related to B?" \u2014 returns the chain of intermediate concepts/people/projects that connect them. Multi-hop reasoning over the user's graph.`,
            inputSchema: {
              type: "object",
              properties: {
                fromNote: { type: "string", description: "Starting note/entity name." },
                toNote: { type: "string", description: "Destination note/entity name." },
                maxHops: { type: "number", description: "Max graph distance to consider (default 3)." }
              },
              required: ["fromNote", "toNote"]
            },
            handler: async ({ fromNote, toNote, maxHops }) => {
              const [from, to] = await Promise.all([
                c.searchEntitiesByName(fromNote, 5),
                c.searchEntitiesByName(toNote, 5)
              ]);
              const a = from.find((h) => h.name === fromNote) ?? from[0];
              const b = to.find((h) => h.name === toNote) ?? to[0];
              if (!a || !b) return { paths: [], note: "no matching entities found" };
              return c.findPaths(a.id, b.id, maxHops ?? 3);
            }
          },
          {
            name: "cortex_search_entities",
            description: "Search the knowledge graph for entities (people, concepts, projects, organizations, etc.) by name fragment. Use when the user mentions something by partial name and you need to disambiguate or find the canonical entity ID before further queries.",
            inputSchema: {
              type: "object",
              properties: {
                name: { type: "string", description: "Partial or full name to search for." },
                limit: { type: "number" }
              },
              required: ["name"]
            },
            handler: ({ name, limit }) => c.searchEntitiesByName(name, limit ?? 10)
          },
          {
            name: "cortex_contradictions",
            description: "List inconsistencies the system has detected across the user's notes \u2014 claims that directly conflict, temporal contradictions, or value mismatches. Use when reviewing a topic to surface what the user may have changed their mind about.",
            inputSchema: {
              type: "object",
              properties: {
                limit: { type: "number", description: "Max contradictions to return (default 25)." }
              }
            },
            handler: ({ limit }) => c.findContradictions(limit ?? 25)
          },
          {
            name: "cortex_suggest_links",
            description: "For a specific note, suggest other notes/entities the user should consider linking to. Useful when helping the user develop a note further or build out their knowledge graph. Driven by entity-extraction across the vault.",
            inputSchema: {
              type: "object",
              properties: { noteName: { type: "string", description: "Note to suggest links for." } },
              required: ["noteName"]
            },
            handler: ({ noteName }) => c.suggestLinks(noteName)
          },
          {
            name: "cortex_ask",
            description: "Ask a synthesized natural-language question against the user's knowledge base. Returns a generated answer with citations. Prefer cortex_recall for raw retrieval \u2014 use cortex_ask when the user wants a one-shot summarized answer rather than individual sources.",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string", description: "Question in natural language." } },
              required: ["query"]
            },
            handler: async ({ query }) => {
              const r = await c.ask(query);
              return {
                answer: r.answer,
                confidence: r.confidence,
                citations: r.citations.map((x) => ({ source: x.source, url: x.url })),
                entities: r.entities.map((x) => ({ name: x.name, type: x.type }))
              };
            }
          },
          // ── Graph introspection (totals + breakdowns for the whole vault) ──
          {
            name: "cortex_stats",
            description: `Return totals and per-type breakdowns for the user's whole knowledge graph: total entity count, total relationship count, top entity types with counts and sample properties, and top relationship types with counts. Use when the user asks "how many notes/entities/relationships do I have?", "what kinds of things are in my graph?", or wants a high-level overview of vault scale and structure. This is a single O(1) query against the graph backend \u2014 far better than enumerating via cortex_search_entities.`,
            inputSchema: {
              type: "object",
              properties: {}
            },
            handler: async () => {
              const stats = await c.getGraphStats();
              return {
                totalEntities: stats.totalEntities,
                totalRelationships: stats.totalRelationships,
                entityTypes: stats.entityTypes.slice(0, 25),
                relationshipTypes: stats.relationshipTypes.slice(0, 25)
              };
            }
          },
          // ── Ingest (write external sources into the graph) ──
          {
            name: "cortex_ingest_url",
            description: "Scrape a web page and add it to the user's knowledge graph as a new document, with extracted entities and relationships. Use when the user shares a link they want preserved in their notes.",
            inputSchema: {
              type: "object",
              properties: {
                url: { type: "string", description: "The URL to scrape and ingest." },
                title: { type: "string", description: "Optional title override for the document." }
              },
              required: ["url"]
            },
            handler: async ({ url, title }) => {
              return c.ingestUrl(url, title);
            }
          }
        ];
      }
    };
    BRIDGE_SCRIPT = `#!/usr/bin/env node
// Cortex MCP stdio\u2194HTTP bridge \u2014 auto-generated by the hangarx-obsidian plugin.
// Do not edit; this file is rewritten on every MCP enable.
'use strict';

const http = require('http');
const url = require('url');
const readline = require('readline');

const targetUrl = process.env.CORTEX_MCP_URL;
const token = process.env.CORTEX_MCP_TOKEN;

if (!targetUrl || !token) {
  process.stderr.write('cortex-mcp-bridge: CORTEX_MCP_URL and CORTEX_MCP_TOKEN env vars are required\\n');
  process.exit(1);
}

const parsed = url.parse(targetUrl);

function forward(line) {
  let request;
  try { request = JSON.parse(line); } catch (e) { return; }
  const isNotification = request.id === undefined || request.id === null;
  const data = Buffer.from(line, 'utf8');
  const opts = {
    hostname: parsed.hostname,
    port: parsed.port || 80,
    path: parsed.path || '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': 'Bearer ' + token,
    },
  };
  const req = http.request(opts, function (res) {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) { body += chunk; });
    res.on('end', function () {
      if (isNotification) return;
      const trimmed = body.trim();
      // Defensive: if the server returned a non-2xx status, the body may
      // not be a valid JSON-RPC envelope. Wrap it in one so the MCP
      // client gets an actionable error instead of a Zod validation
      // explosion. 2xx responses are forwarded as-is.
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        if (trimmed) process.stdout.write(trimmed + '\\n');
        return;
      }
      var msg = 'cortex-api returned HTTP ' + res.statusCode;
      try {
        var parsed = trimmed ? JSON.parse(trimmed) : null;
        if (parsed && parsed.error && typeof parsed.error.message === 'string') {
          msg += ' \u2014 ' + parsed.error.message;
        } else if (parsed && typeof parsed.error === 'string') {
          msg += ' \u2014 ' + parsed.error;
        } else if (trimmed) {
          msg += ' \u2014 ' + trimmed.slice(0, 200);
        }
      } catch (e) {
        if (trimmed) msg += ' \u2014 ' + trimmed.slice(0, 200);
      }
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id == null ? null : request.id,
        error: { code: -32000, message: msg },
      }) + '\\n');
    });
  });
  req.on('error', function (err) {
    if (isNotification) return;
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id == null ? null : request.id,
      error: { code: -32000, message: 'bridge: ' + err.message },
    }) + '\\n');
  });
  req.write(data);
  req.end();
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', forward);
rl.on('close', function () { process.exit(0); });
`;
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => CortexPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian18 = require("obsidian");

// src/cortex-client.ts
var import_obsidian = require("obsidian");
var CortexClient = class {
  constructor(settings) {
    this.settings = settings;
  }
  async req(path, init = {}) {
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.settings.apiKey) headers.Authorization = `Bearer ${this.settings.apiKey}`;
    if (this.settings.workspaceId) headers["x-workspace-id"] = this.settings.workspaceId;
    Object.assign(headers, init.headers ?? {});
    const res = await (0, import_obsidian.requestUrl)({
      url: `${this.settings.apiUrl}${path}`,
      method: init.method ?? "GET",
      headers,
      body: init.body,
      throw: false
    });
    if (res.status >= 400) {
      let host = "";
      try {
        host = new URL(this.settings.apiUrl).host;
      } catch {
      }
      throw new Error(`Cortex [${host}] ${path} \u2192 ${res.status}: ${res.text}`);
    }
    return res.json;
  }
  /**
   * Upload a single markdown note via the JSON-body upload endpoint.
   *
   * `fastMode` raises the LLM context cap and harmonizer concurrency at the
   * cost of skipping post-ingest VDB indexing + community detection. Use it
   * for force re-ingest where the user will follow up with a maintenance run
   * (see ChatPanel "Rebuild communities + reindex" command). Regular sync
   * should leave it false so retrieval quality stays consistent.
   */
  async ingestNote(filePath, content, opts = {}) {
    const res = await this.req("/v1/ingest/files/upload-json", {
      method: "POST",
      headers: opts.syncJobId ? { "x-sync-job-id": opts.syncJobId } : void 0,
      body: JSON.stringify({
        file: {
          originalname: filePath,
          mimetype: "text/markdown",
          contentText: content
        },
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId,
        sourceType: "md",
        fastMode: opts.fastMode === true
      })
    });
    return res.data;
  }
  /**
   * Upload a binary attachment (image, PDF, audio, video). The backend
   * decodes contentBase64; mimetype drives the right extraction pipeline.
   */
  async ingestBinary(filePath, mimetype, base64, opts = {}) {
    const res = await this.req("/v1/ingest/files/upload-json", {
      method: "POST",
      headers: opts.syncJobId ? { "x-sync-job-id": opts.syncJobId } : void 0,
      body: JSON.stringify({
        file: {
          originalname: filePath,
          mimetype,
          contentBase64: base64
        },
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId,
        sourceType: mimetype.split("/")[0] || "file",
        fastMode: false
      })
    });
    return res.data;
  }
  /**
   * Cancel an in-flight sync job. Sets a server-side flag that ingest workers
   * check at chunk boundaries — in-flight files bail out at the next safe
   * point, queued files don't start. Idempotent.
   */
  async cancelSyncJob(jobId) {
    if (!jobId) return;
    await this.req(`/v1/ingest/jobs/${encodeURIComponent(jobId)}/cancel`, { method: "POST" });
  }
  /**
   * Run community detection (Louvain by default) and persist results. Used
   * after a fastMode re-ingest to populate community-level retrieval which
   * the ingest path skipped. Workspace is taken from settings; the server
   * falls back to the request user's default if no workspace is set.
   */
  async detectCommunities(opts = {}) {
    const body = {
      ...opts,
      ...this.settings.workspaceId ? { workspaceId: this.settings.workspaceId } : {}
    };
    const res = await this.req(
      "/v1/graph/communities/detect",
      { method: "POST", body: JSON.stringify(body) }
    );
    return res.data;
  }
  async listCommunities(opts = {}) {
    const params = new URLSearchParams();
    if (this.settings.workspaceId) params.set("workspaceId", this.settings.workspaceId);
    if (opts.level !== void 0) params.set("level", String(opts.level));
    if (opts.minMembers !== void 0) params.set("minMembers", String(opts.minMembers));
    if (opts.limit !== void 0) params.set("limit", String(opts.limit));
    const res = await this.req(
      `/v1/graph/communities?${params.toString()}`
    );
    return res.data?.communities ?? [];
  }
  /**
   * Backfill embeddings on entities that were ingested without them (the
   * structured-entity VDB indexing that fastMode skips). Idempotent — safe to
   * run repeatedly; entities that already have embeddings are skipped.
   */
  async backfillEntityEmbeddings() {
    const res = await this.req("/v1/search/vectors/backfill-entity-embeddings", {
      method: "POST",
      body: JSON.stringify({})
    });
    return res.data;
  }
  async deleteNote(filePath) {
    await this.req("/v1/ingest/documents/by-path/delete", {
      method: "POST",
      body: JSON.stringify({
        filePath,
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId
      })
    });
  }
  /**
   * Ingest a URL — scrapes the page and extracts entities into the graph.
   */
  async ingestUrl(url, title) {
    const res = await this.req("/v1/ingest", {
      method: "POST",
      body: JSON.stringify({
        url,
        title,
        workspaceId: this.settings.workspaceId,
        extractEntities: true
      })
    });
    return {
      documentId: res.data?.documentId,
      entityCount: res.data?.entitiesCreated ?? res.data?.entityCount ?? 0
    };
  }
  /**
   * Get a diff of graph changes since a given timestamp.
   */
  async graphDiff(since) {
    const params = new URLSearchParams({
      sinceTimestamp: since,
      workspaceId: this.settings.workspaceId
    });
    const res = await this.req(`/v1/graph/diff?${params.toString()}`);
    return {
      added: res.data?.addedEntities ?? [],
      modified: res.data?.modifiedEntities ?? [],
      removed: res.data?.removedEntities ?? []
    };
  }
  /**
   * Search the graph for entities by name fragment. Returns raw entity records
   * (with IDs) — used by the Related view to find the entity ID of the
   * currently-open note (which `related()` filters out).
   */
  async searchEntitiesByName(name, limit = 5) {
    const params = new URLSearchParams({
      q: name,
      type: "Note",
      limit: String(limit),
      workspaceId: this.settings.workspaceId
    });
    const res = await this.req(
      `/v1/graph/search?${params.toString()}`
    );
    return (res.data?.entities ?? []).map((e) => ({ id: e.id, name: e.name, type: e.type }));
  }
  async related(noteName, limit = 10) {
    const params = new URLSearchParams({
      q: noteName,
      type: "Note",
      limit: String(limit),
      workspaceId: this.settings.workspaceId
    });
    const res = await this.req(
      `/v1/graph/search?${params.toString()}`
    );
    return (res.data?.entities ?? []).filter((e) => e?.name && e.name !== noteName).map((e) => ({
      noteName: e.name,
      entityId: e.id,
      filePath: e.properties?.filePath,
      score: typeof e.score === "number" ? e.score : typeof e.relevance === "number" ? e.relevance : 0,
      snippet: e.properties?.description,
      source: e.properties?.source === "user" ? "wikilink" : "embedding"
    }));
  }
  /**
   * Find the shortest paths through the graph between two entities — used to
   * explain *why* two notes are related (e.g. "Note A → MENTIONS → X → CITED_IN → Note B").
   */
  async findPaths(fromEntityId, toEntityId, maxHops = 3) {
    const params = new URLSearchParams({
      from: fromEntityId,
      to: toEntityId,
      maxHops: String(maxHops),
      workspaceId: this.settings.workspaceId
    });
    const res = await this.req(
      `/v1/graph/explore/paths?${params.toString()}`
    );
    return (res.data?.paths ?? []).map((p) => {
      const nodes = p.nodes ?? [];
      const edges = p.edges ?? [];
      const steps = edges.map((edge, i) => ({
        fromName: nodes[i]?.label ?? edge.source,
        fromType: nodes[i]?.type ?? "",
        toName: nodes[i + 1]?.label ?? edge.target,
        toType: nodes[i + 1]?.type ?? "",
        relType: edge.type
      }));
      return { steps, length: typeof p.length === "number" ? p.length : steps.length };
    });
  }
  /** Find contradicting claims across the workspace. */
  async findContradictions(limit = 25) {
    const params = new URLSearchParams({
      workspaceId: this.settings.workspaceId,
      limit: String(limit)
    });
    const res = await this.req(
      `/v1/graph/claims/contradictions?${params.toString()}`
    );
    return (res.data?.contradictions ?? []).map((c) => ({
      conflictType: c.conflictType,
      conflictDescription: c.conflictDescription,
      confidence: c.confidence ?? 0,
      claim1: {
        id: c.claim1?.id,
        text: c.claim1?.text,
        subject: c.claim1?.subject,
        sourceName: c.claim1?.source?.sourceName
      },
      claim2: {
        id: c.claim2?.id,
        text: c.claim2?.text,
        subject: c.claim2?.subject,
        sourceName: c.claim2?.source?.sourceName
      }
    }));
  }
  /** Persist a memory item (e.g. user preference) for future chat sessions. */
  async remember(content, source = "conversation") {
    await this.req("/v1/memory/remember", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: this.settings.workspaceId,
        agentId: "hangarx-obsidian",
        content,
        source,
        priority: "normal"
      })
    });
  }
  /** Retrieve memories relevant to a query — injected into the chat prompt. */
  async recall(query, limit = 5) {
    const res = await this.req("/v1/memory/recall", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: this.settings.workspaceId,
        agentId: "hangarx-obsidian",
        query,
        method: "hybrid",
        limit
      })
    });
    return (res.data?.items ?? []).map((m) => ({
      id: m.id,
      content: m.content,
      source: m.source,
      priority: m.priority,
      createdAt: m.createdAt
    }));
  }
  async ask(query, _sessionId) {
    const res = await this.req("/v1/ask/chat/answer", {
      method: "POST",
      body: JSON.stringify({
        message: query,
        workspaceId: this.settings.workspaceId,
        expanded: true
      })
    });
    const d = res.data;
    return {
      answer: d.answer,
      citations: extractCitations(d.raw),
      entities: extractEntities(d.raw),
      documents: extractDocuments(d.raw),
      confidence: typeof res.meta?.confidence === "number" ? res.meta.confidence : 0,
      followUps: d.suggestedFollowUps ?? [],
      metadata: { ...res.meta ?? {} }
    };
  }
  async suggestLinks(noteName) {
    const res = await this.req("/v1/graph/predict-links", {
      method: "POST",
      body: JSON.stringify({
        entityName: noteName,
        entityType: "Note",
        workspaceId: this.settings.workspaceId
      })
    });
    return res.data?.suggestions ?? [];
  }
  async exportSubgraph(seedNoteName, hops = 1) {
    const res = await this.req("/v1/graph/export", {
      method: "POST",
      body: JSON.stringify({
        seedEntity: seedNoteName,
        seedType: "Note",
        hops,
        workspaceId: this.settings.workspaceId
      })
    });
    return res.data;
  }
  /**
   * Export a subgraph anchored at a known entity ID. More robust than the
   * by-name overload because it skips the server-side name+type lookup that
   * fails when the note was indexed under a non-`Note` type or with a slightly
   * different name (e.g. extracted entity normalisation).
   */
  async exportSubgraphById(seedEntityId, hops = 1) {
    const res = await this.req("/v1/graph/export", {
      method: "POST",
      body: JSON.stringify({
        seedEntityId,
        hops,
        workspaceId: this.settings.workspaceId
      })
    });
    return res.data;
  }
  /**
   * Resolve an Obsidian note to its graph entity ID. Tries strategies in order
   * of specificity so the most reliable signal wins:
   *   1. Exact filePath property match (Note entity created during ingest stores it)
   *   2. Same, but for type=Document (some flows create Document instead of Note)
   *   3. Substring search by basename (for legacy/edge cases)
   * Returns null if the note isn't in the graph yet.
   */
  async resolveEntityId(noteName, filePath) {
    if (filePath) {
      for (const type of ["Note", "Document"]) {
        try {
          const res2 = await this.req(
            "/v1/graph/entities/find",
            {
              method: "POST",
              body: JSON.stringify({
                type,
                properties: { filePath },
                limit: 1
              })
            }
          );
          const hit = res2.data?.entities?.[0];
          if (hit?.id) return hit.id;
        } catch {
        }
      }
    }
    const params = new URLSearchParams({
      q: noteName,
      limit: "5",
      workspaceId: this.settings.workspaceId
    });
    const res = await this.req(
      `/v1/graph/search?${params.toString()}`
    );
    const list = res.data?.entities ?? [];
    if (list.length === 0) return null;
    const exact = list.find((e) => e.name === noteName);
    return (exact ?? list[0])?.id ?? null;
  }
  /**
   * Paginated workspace-wide entity listing for the pull-sync feature.
   * Uses GET /v1/graph/entities which supports type, limit, offset filtering.
   */
  async exportGraphPage(opts = {}) {
    const limit = opts.limit ?? 500;
    const offset = opts.offset ?? 0;
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (this.settings.workspaceId) params.set("workspaceId", this.settings.workspaceId);
    if (opts.entityTypes && opts.entityTypes.length === 1) {
      params.set("type", opts.entityTypes[0]);
    }
    const res = await this.req(`/v1/graph/entities?${params.toString()}`, {
      method: "GET"
    });
    const entities = (res.data?.entities ?? []).map((e) => ({
      id: e.id,
      name: e.name ?? e.properties?.name ?? "Unknown",
      type: e.type ?? e.properties?.type ?? "Entity",
      properties: e.properties ?? {}
    }));
    let relationships = [];
    if (opts.includeRelationships !== false && entities.length > 0) {
      try {
        const graphParams = new URLSearchParams();
        graphParams.set("limit", String(Math.min(limit, 500)));
        if (this.settings.workspaceId) graphParams.set("workspaceId", this.settings.workspaceId);
        if (opts.entityTypes && opts.entityTypes.length === 1) {
          graphParams.set("type", opts.entityTypes[0]);
        }
        const graphRes = await this.req(`/v1/graph?${graphParams.toString()}`, { method: "GET" });
        relationships = (graphRes.links ?? []).map((l) => ({
          from: l.source,
          to: l.target,
          type: l.type,
          properties: l.properties
        }));
      } catch {
      }
    }
    return {
      entities,
      relationships,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Validate the configured API key and return its metadata. The settings
   * panel uses this to show "✓ logged in as <email>" instead of guessing.
   *
   * Throws structured errors the caller can react to:
   *   - status 404  → endpoint missing on this server build (cloud may not
   *                   have shipped /v1/api-keys/whoami yet). Caller should
   *                   fall back to a lighter probe.
   *   - status 401  → key is invalid or expired.
   *   - other       → network / server issue; surface verbatim.
   */
  async getWhoami() {
    const res = await this.req("/v1/api-keys/whoami");
    if (!res.data) {
      throw new Error("whoami returned no data");
    }
    return res.data;
  }
  /**
   * Lightweight auth probe used as a fallback when whoami isn't available.
   * Calls a known authenticated endpoint (graph stats) and reports whether
   * the response indicated success. Doesn't reveal user identity, just
   * "the key works against this server."
   */
  async probeAuth() {
    try {
      await this.getGraphStats();
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Fetch entity types with counts.
   * Uses GET /v1/graph/entity-types endpoint.
   */
  async getEntityTypeCounts() {
    const params = new URLSearchParams();
    if (this.settings.workspaceId) params.set("workspaceId", this.settings.workspaceId);
    const res = await this.req(`/v1/graph/entity-types?${params.toString()}`, {
      method: "GET"
    });
    return (res.data?.entityTypes ?? []).sort((a, b) => b.count - a.count);
  }
  /**
   * Comprehensive workspace graph stats — totals + per-type breakdown.
   * Backed by GET /v1/graph/stats which reuses the introspection pipeline.
   */
  async getGraphStats() {
    const params = new URLSearchParams();
    if (this.settings.workspaceId) params.set("workspaceId", this.settings.workspaceId);
    const res = await this.req(`/v1/graph/stats?${params.toString()}`);
    return {
      totalEntities: res.data?.totalEntities ?? 0,
      totalRelationships: res.data?.totalRelationships ?? 0,
      entityTypes: (res.data?.entityTypes ?? []).slice().sort((a, b) => b.count - a.count),
      relationshipTypes: (res.data?.relationshipTypes ?? []).slice().sort((a, b) => b.count - a.count)
    };
  }
  /**
   * GraphRAG orchestrator stats — cache hit rate, query throughput, etc.
   * Optional companion to getGraphStats(); shape varies by orchestrator config.
   * Returns null on 404 (older container builds without the endpoint).
   */
  async getGraphRAGStats() {
    try {
      const res = await this.req("/v1/graph/graphrag/stats");
      return res.data ?? null;
    } catch (e) {
      if (/→ 404/.test(e.message)) return null;
      throw e;
    }
  }
  // ── Runtime LLM config ──────────────────────────────────────────────
  // The cortex-api stores per-org LLM configuration in Postgres (encrypted)
  // and reads from there at request time, so swapping providers/models or
  // updating an API key takes effect immediately — no container restart.
  // Mounted at /v1/ask/config/* (the inner aiConfigRouter has its own /config
  // and /test paths, hence the doubled segment).
  async getLlmConfig() {
    const res = await this.req("/v1/ask/config/config");
    return res.data;
  }
  async updateLlmConfig(input) {
    const res = await this.req("/v1/ask/config/config", {
      method: "PUT",
      body: JSON.stringify(input)
    });
    return res.data;
  }
  async testLlmConfig(input) {
    const res = await this.req(
      "/v1/ask/config/test",
      { method: "POST", body: JSON.stringify(input) }
    );
    return res.data;
  }
  async getLlmModels() {
    const res = await this.req("/v1/ask/config/models");
    return res.data.providers;
  }
  /**
   * List Cortex-originated documents that should be projected into this vault.
   * Returns items the server believes have not yet been delivered (the server
   * tracks acks, so this is idempotent across devices).
   */
  async inboxList() {
    const qs = new URLSearchParams({
      workspaceId: this.settings.workspaceId,
      vaultId: this.settings.vaultId
    }).toString();
    const res = await this.req(`/v1/inbox/list?${qs}`);
    return res.data?.items ?? [];
  }
  async inboxAck(itemId, vaultPath) {
    await this.req("/v1/inbox/ack", {
      method: "POST",
      body: JSON.stringify({
        itemId,
        vaultPath,
        workspaceId: this.settings.workspaceId,
        vaultId: this.settings.vaultId
      })
    });
  }
};
function extractCitations(raw) {
  if (!raw || typeof raw !== "object") return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (source, text, filePath, url) => {
    if (!source || seen.has(source)) return;
    seen.add(source);
    out.push({ source, text: text ?? "", filePath, url });
  };
  for (const doc of raw.documents?.recentDocuments ?? []) {
    push(
      doc?.name ?? doc?.filename ?? doc?.title,
      doc?.snippet ?? doc?.summary ?? doc?.description,
      doc?.filePath ?? doc?.path,
      doc?.url ?? doc?.youtubeurl
    );
  }
  for (const ent of raw.knowledgeGraph?.entities ?? raw.entities ?? []) {
    if (ent?.type === "Note" || ent?.type === "Document") {
      push(ent?.name, ent?.properties?.description, ent?.properties?.filePath);
    }
  }
  return out.slice(0, 10);
}
function extractEntities(raw) {
  if (!raw || typeof raw !== "object") return [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  const list = raw.knowledgeGraph?.entities ?? raw.entities ?? [];
  for (const e of list) {
    const name = e?.name;
    if (!name) continue;
    const key = `${name}::${e?.type ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name,
      type: e?.type ?? "Entity",
      description: e?.properties?.description ?? e?.description,
      score: typeof e?.score === "number" ? e.score : typeof e?.relevance === "number" ? e.relevance : void 0
    });
  }
  return out.slice(0, 25);
}
function extractDocuments(raw) {
  if (!raw || typeof raw !== "object") return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const recentList = raw.documents?.recentDocuments ?? raw.documents ?? [];
  for (const d of Array.isArray(recentList) ? recentList : []) {
    const title = d?.title ?? d?.name ?? d?.filename;
    if (!title || seen.has(title)) continue;
    seen.add(title);
    const matchRaw = d?.score ?? d?.match ?? d?.relevance;
    out.push({
      title,
      snippet: d?.snippet ?? d?.summary ?? d?.description,
      filePath: d?.filePath ?? d?.path,
      url: d?.url ?? d?.youtubeurl,
      matchPercent: typeof matchRaw === "number" ? Math.round(matchRaw * 100) : void 0,
      publishDate: d?.publishdate ?? d?.publishDate ?? d?.publish_date,
      source: d?.guest ?? d?.author ?? d?.source
    });
  }
  const chunks = raw.vectorMemory?.relevantChunks ?? raw.relevantChunks ?? [];
  for (const c of Array.isArray(chunks) ? chunks : []) {
    const rawTitle = c?.meta_fileName ?? c?.metadata?.documentName ?? c?.metadata?.source ?? c?.metadata?.fileName ?? c?.documentName ?? c?.source ?? c?.title ?? "Vault chunk";
    const title = typeof rawTitle === "string" ? rawTitle.replace(/\.(md|markdown|txt)$/i, "") : rawTitle;
    if (seen.has(title)) continue;
    seen.add(title);
    out.push({
      title,
      snippet: c?.text ?? c?.content ?? c?.snippet,
      filePath: c?.metadata?.filePath ?? c?.filePath,
      matchPercent: typeof c?.score === "number" ? Math.round(c.score * 100) : void 0,
      source: c?.metadata?.source
    });
  }
  return out.slice(0, 10);
}

// src/settings.ts
var import_obsidian9 = require("obsidian");

// src/services/agent-connect.ts
var dynRequire = (() => {
  try {
    return new Function("m", "return require(m)");
  } catch {
    return null;
  }
})();
function nodeFs() {
  return dynRequire("fs").promises;
}
function nodePath() {
  return dynRequire("path");
}
function nodeOs() {
  return dynRequire("os");
}
function isDesktop() {
  try {
    return !!dynRequire && !!nodeOs().homedir;
  } catch {
    return false;
  }
}
function claudeDesktopConfigPath() {
  if (!isDesktop()) return null;
  const path = nodePath();
  const os = nodeOs();
  const home = os.homedir();
  const platform = process.platform;
  if (platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(appData, "Claude", "claude_desktop_config.json");
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  return path.join(xdg, "Claude", "claude_desktop_config.json");
}
function claudeCodeConfigPath() {
  if (!isDesktop()) return null;
  return nodePath().join(nodeOs().homedir(), ".claude.json");
}
function cursorConfigPath() {
  if (!isDesktop()) return null;
  return nodePath().join(nodeOs().homedir(), ".cursor", "mcp.json");
}
function clineConfigPath() {
  if (!isDesktop()) return null;
  const path = nodePath();
  const os = nodeOs();
  const home = os.homedir();
  const platform = process.platform;
  const sub = ["Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"];
  if (platform === "darwin") return path.join(home, "Library", "Application Support", ...sub);
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(appData, ...sub);
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  return path.join(xdg, ...sub);
}
function windsurfConfigPath() {
  if (!isDesktop()) return null;
  return nodePath().join(nodeOs().homedir(), ".codeium", "windsurf", "mcp_config.json");
}
async function upsertMcpEntry(configPath, entry) {
  const fs = nodeFs();
  const path = nodePath();
  let existing = {};
  let fileExisted = false;
  try {
    const raw = await fs.readFile(configPath, "utf8");
    fileExisted = true;
    if (raw.trim()) existing = JSON.parse(raw);
  } catch (e) {
    if (e?.code !== "ENOENT") {
      return {
        ok: false,
        configPath,
        message: `Couldn't read ${configPath}: ${e.message}`
      };
    }
  }
  if (!existing.mcpServers || typeof existing.mcpServers !== "object") {
    existing.mcpServers = {};
  }
  const prev = existing.mcpServers["hangarx-obsidian"];
  const updated = !!prev;
  const unchanged = prev && JSON.stringify(prev) === JSON.stringify(entry);
  existing.mcpServers["hangarx-obsidian"] = entry;
  try {
    await fs.mkdir(path.dirname(configPath), { recursive: true });
  } catch {
  }
  try {
    await fs.writeFile(configPath, JSON.stringify(existing, null, 2) + "\n", "utf8");
  } catch (e) {
    return {
      ok: false,
      configPath,
      message: `Couldn't write ${configPath}: ${e.message}`
    };
  }
  let message;
  if (unchanged) {
    message = "Already connected \u2014 no changes needed.";
  } else if (updated) {
    message = "Updated existing connection in config.";
  } else if (!fileExisted) {
    message = "Created config file and connected.";
  } else {
    message = "Added HangarX to existing config.";
  }
  return { ok: true, configPath, message, updated, unchanged };
}
function bridgeEntry(b) {
  return {
    command: "node",
    args: [b.bridgePath],
    env: {
      CORTEX_MCP_URL: b.url,
      CORTEX_MCP_TOKEN: b.token
    }
  };
}
async function connectClaudeDesktop(b) {
  const p = claudeDesktopConfigPath();
  if (!p) return { ok: false, configPath: "", message: "Desktop only \u2014 Claude Desktop config path unavailable on mobile." };
  return upsertMcpEntry(p, bridgeEntry(b));
}
async function connectClaudeCode(b) {
  const p = claudeCodeConfigPath();
  if (!p) return { ok: false, configPath: "", message: "Desktop only." };
  return upsertMcpEntry(p, bridgeEntry(b));
}
async function connectCursor(b) {
  const p = cursorConfigPath();
  if (!p) return { ok: false, configPath: "", message: "Desktop only." };
  return upsertMcpEntry(p, bridgeEntry(b));
}
async function connectCline(b) {
  const p = clineConfigPath();
  if (!p) return { ok: false, configPath: "", message: "Desktop only." };
  return upsertMcpEntry(p, bridgeEntry(b));
}
async function connectWindsurf(b) {
  const p = windsurfConfigPath();
  if (!p) return { ok: false, configPath: "", message: "Desktop only." };
  return upsertMcpEntry(p, bridgeEntry(b));
}
function buildBridgeEntry(b) {
  return bridgeEntry(b);
}
async function disconnectMcpEntry(configPath) {
  const fs = nodeFs();
  let raw;
  try {
    raw = await fs.readFile(configPath, "utf8");
  } catch (e) {
    if (e?.code === "ENOENT") {
      return { ok: true, configPath, message: "Already disconnected \u2014 no config file.", unchanged: true };
    }
    return { ok: false, configPath, message: `Couldn't read ${configPath}: ${e.message}` };
  }
  let parsed;
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch (e) {
    return { ok: false, configPath, message: `Config file isn't valid JSON: ${e.message}` };
  }
  if (!parsed?.mcpServers || !parsed.mcpServers["hangarx-obsidian"]) {
    return { ok: true, configPath, message: "Already disconnected.", unchanged: true };
  }
  delete parsed.mcpServers["hangarx-obsidian"];
  try {
    await fs.writeFile(configPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  } catch (e) {
    return { ok: false, configPath, message: `Couldn't write ${configPath}: ${e.message}` };
  }
  return { ok: true, configPath, message: "Removed HangarX from config." };
}
function revealInFileManager(configPath) {
  if (!isDesktop()) return false;
  try {
    const { shell } = dynRequire("electron");
    shell.showItemInFolder(configPath);
    return true;
  } catch {
    return false;
  }
}
async function checkConnection(configPath) {
  if (!configPath) return { exists: false, connected: false, reason: "desktop-only" };
  try {
    const fs = nodeFs();
    const raw = await fs.readFile(configPath, "utf8");
    if (!raw.trim()) return { exists: true, connected: false };
    const parsed = JSON.parse(raw);
    const entry = parsed?.mcpServers?.["hangarx-obsidian"];
    return { exists: true, connected: !!entry };
  } catch (e) {
    if (e?.code === "ENOENT") return { exists: false, connected: false };
    return { exists: true, connected: false, reason: e.message };
  }
}

// src/services/oauth-flow.ts
var import_obsidian2 = require("obsidian");
var pending = null;
function randomUrlSafe(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function pkceChallenge(verifier) {
  const buf = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function startSignIn(options) {
  if (pending) {
    pending.reject(new Error("A new sign-in started; previous attempt cancelled."));
    clearTimeout(pending.timer);
    pending = null;
  }
  const state = randomUrlSafe(24);
  const codeVerifier = randomUrlSafe(48);
  const codeChallenge = await pkceChallenge(codeVerifier);
  const url = new URL(`${options.dashboardUrl.replace(/\/$/, "")}/oauth/authorize`);
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pending && pending.state === state) {
        pending = null;
        reject(new Error("Sign-in timed out \u2014 close the browser tab and try again."));
      }
    }, options.timeoutMs ?? 5 * 60 * 1e3);
    pending = { state, codeVerifier, options, resolve, reject, timer };
    const opened = window.open(url.toString(), "_blank");
    if (!opened) {
      navigator.clipboard.writeText(url.toString()).catch(() => {
      });
      new import_obsidian2.Notice("Browser blocked the new window. URL copied to clipboard \u2014 paste it in your browser to continue sign-in.", 8e3);
    }
  });
}
async function completeSignIn(params) {
  if (!pending) {
    new import_obsidian2.Notice("Received an OAuth callback but no sign-in is in progress. Ignoring.", 5e3);
    return;
  }
  const flow = pending;
  pending = null;
  clearTimeout(flow.timer);
  const errorCode = params.error;
  if (errorCode) {
    flow.reject(new Error(params.error_description || `Sign-in failed: ${errorCode}`));
    return;
  }
  if (params.state !== flow.state) {
    flow.reject(new Error("OAuth state mismatch \u2014 sign-in aborted for security."));
    return;
  }
  const code = params.code;
  if (!code) {
    flow.reject(new Error("Server didn't return an authorization code."));
    return;
  }
  try {
    const apiBase = flow.options.apiUrl.replace(/\/$/, "");
    const res = await (0, import_obsidian2.requestUrl)({
      url: `${apiBase}/v1/oauth/plugin/token`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        code_verifier: flow.codeVerifier,
        client_id: flow.options.clientId,
        redirect_uri: flow.options.redirectUri
      }),
      throw: false
    });
    if (res.status >= 400) {
      const body2 = (() => {
        try {
          return res.json;
        } catch {
          return {};
        }
      })();
      const desc = body2?.error_description || body2?.error || `Server returned ${res.status}`;
      flow.reject(new Error(desc));
      return;
    }
    const body = res.json;
    if (!body.access_token) {
      flow.reject(new Error("Server didn't return an access token."));
      return;
    }
    flow.resolve({
      accessToken: body.access_token,
      workspaceId: body.workspaceId,
      organizationId: body.organizationId,
      userEmail: body.userEmail
    });
  } catch (e) {
    flow.reject(e instanceof Error ? e : new Error(String(e)));
  }
}
function cancelSignIn() {
  if (pending) {
    clearTimeout(pending.timer);
    pending.reject(new Error("Sign-in cancelled."));
    pending = null;
  }
}

// src/views/readme-modal.ts
var import_obsidian3 = require("obsidian");

// README.md
var README_default = '<p align="center">\n  <img src="./docs/images/preview.png" alt="HangarX inside Obsidian \u2014 graph view, file explorer, and Ask your vault chat panel side-by-side" width="100%" />\n</p>\n\n# HangarX for Obsidian\n\n> Ask questions about your vault. Share its knowledge with every AI agent on your machine.\n\nHangarX turns your Obsidian notes into a queryable knowledge graph \u2014 then exposes that graph to Claude Desktop, Claude Code, Cursor, Cline, Windsurf, and any other [MCP-compatible](https://modelcontextprotocol.io) agent. Same vault. Every tool. No copy-pasting context between chats.\n\n\u{1F4D6} [Full docs](https://app.hangarx.ai/obsidian#docs) \xB7 \u{1F310} [Dashboard](https://app.hangarx.ai) \xB7 \u{1F41B} [Issues](https://github.com/3-Elements-Design/hangarx-obsidian/issues)\n\n---\n\n## Why\n\nYou\'ve already written everything: standups, design docs, half-finished thoughts. The bottleneck isn\'t capturing knowledge \u2014 it\'s making it usable by the agents you use every day.\n\n- **Claude Desktop forgot what you decided last week.** HangarX remembers.\n- **Cursor doesn\'t know your team\'s conventions.** HangarX answers from your notes.\n- **You repeat yourself across every new chat.** HangarX is the one source of truth they all read.\n\n## Who it\'s for\n\n- **Note-takers** who want a smarter Q&A surface than the built-in search.\n- **Agent power users** running 2+ AI tools that should share context.\n- **Teams** with a single vault of decisions, runbooks, and architectural notes.\n- **Privacy-first users** who want everything to stay on their laptop (Local mode = no cloud, no data leaves your machine).\n\n---\n\n## What it does\n\n| | |\n|---|---|\n| \u{1F4AC} **Ask your vault** | Multi-hop chat with citations back to the source notes. Lives in the right sidebar. |\n| \u{1F310} **Native graph integration** | Push chat answers into Obsidian\'s built-in Graph view \u2014 non-matching nodes dim, cited entities stay highlighted. |\n| \u{1F504} **Two-way sync** | Push notes to the graph, pull graph entities back as markdown, or diff the two sides to see what\'s drifted. |\n| \u{1F916} **MCP bridge** | One-click connect to Claude Desktop, Claude Code, Cursor, Cline, Windsurf \u2014 they get tools to query your vault. |\n| \u2728 **Inline link suggestions** | Ghost-text `[[wikilinks]]` while you type, driven by entity matches in your graph. |\n| \u{1F512} **Local or cloud** | Cloud is one-click OAuth. Local runs everything in Docker on your laptop. |\n\n---\n\n## Install\n\n**Community plugins (recommended).**\n\n1. Settings \u2192 **Community plugins \u2192 Browse**\n2. Search **"HangarX"** \u2192 **Install** \u2192 **Enable**\n3. The first-run onboarding modal walks you through Cloud / Local setup.\n\n<details>\n<summary><strong>Other install options</strong></summary>\n\n**BRAT (beta builds).**\nInstall [BRAT](https://github.com/TfTHacker/obsidian42-brat), then **Add beta plugin** \u2192 paste `https://github.com/3-Elements-Design/hangarx-obsidian`.\n\n**Manual.**\nGrab `main.js`, `manifest.json`, `styles.css` from the [latest release](https://github.com/3-Elements-Design/hangarx-obsidian/releases) and drop them in `<your-vault>/.obsidian/plugins/hangarx-obsidian/`. Reload Obsidian, enable in Community Plugins.\n\n</details>\n\n---\n\n## Quick start\n\n### Cloud \u2014 60 seconds\n\nBest for trying HangarX out. Sign-in is OAuth, no key copy-paste.\n\n1. Settings \u2192 **HangarX \u2192 Connection** \u2192 Mode: **\u2601\uFE0F Cloud (HangarX hosted)**\n2. **Sign in with HangarX** \u2192 approve in browser \u2192 API key + workspace auto-fill\n3. Command palette (\u2318P / Ctrl-P) \u2192 **HangarX: Sync**\n4. Open the **Ask your vault** chat in the right sidebar and ask anything\n\n### Local \u2014 fully private\n\nEverything runs in Docker on your machine. Notes never leave the laptop.\n\n1. Settings \u2192 **HangarX \u2192 Connection** \u2192 Mode: **\u{1F3E0} Local (Docker)**\n2. Click **Save Compose to vault** \u2014 writes `docker-compose.cortex.yml` next to your notes\n3. In a terminal: `docker compose -f docker-compose.cortex.yml up -d`\n4. Add at least one LLM key in **LLM provider keys** (Gemini, OpenAI, Anthropic, Kimi, HuggingFace, OpenRouter, xAI, or Ollama for fully offline)\n5. Run **HangarX: Sync** from the command palette\n\n> Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/). Images are pulled from Docker Hub (`hangarx/cortex-api`) \u2014 no source code or Node.js needed.\n\n---\n\n## How it works\n\n```\n\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510       \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510       \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502  Your vault  \u2502  \u2500\u2500\u25BA  \u2502  Cortex API  \u2502  \u2500\u2500\u25BA  \u2502 Knowledge graph  \u2502\n\u2502  (markdown)  \u2502       \u2502  (entity     \u2502       \u2502  FalkorDB +      \u2502\n\u2502              \u2502       \u2502  extraction) \u2502       \u2502  pgvector        \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n                              \u25B2                        \u25B2\n                              \u2502                        \u2502\n                       \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510       \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n                       \u2502 Obsidian      \u2502       \u2502 External agents\u2502\n                       \u2502 chat panel    \u2502       \u2502 (Claude, Cursor\u2502\n                       \u2502 + graph view  \u2502       \u2502  Cline, etc.)  \u2502\n                       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n```\n\n1. **Sync** parses your notes, extracts entities (people, projects, concepts) + relationships, and stores them as a graph alongside vector embeddings.\n2. **Ask** runs multi-hop retrieval (graph traversal + semantic search + reranking) over that graph and an LLM composes the answer with citations.\n3. **MCP bridge** exposes the same retrieval tools to external agents over a local protocol \u2014 they query your vault the same way the in-Obsidian chat does.\n\n---\n\n## Connect external agents\n\nSettings \u2192 **Agents** shows every supported harness:\n\n| Agent | One-click |\n|---|---|\n| Claude Desktop, Claude Code, Cursor, Cline, Windsurf | \u2705 |\n| Zed, Goose, Codex CLI, custom MCP clients | Copy JSON snippet |\n\nClick **Connect** and HangarX merges its MCP server entry into the agent\'s config (non-destructively \u2014 your other MCP servers stay). Restart the agent and it gets these tools:\n\n| Tool | What the agent can do |\n|---|---|\n| `cortex_ask` | Natural-language Q&A against your vault |\n| `cortex_recall` / `cortex_remember` | Persistent memory across agent sessions |\n| `cortex_related` | Find semantically similar notes |\n| `cortex_search_entities` | Search by person / project / concept name |\n| `cortex_stats` | Totals + per-type breakdowns for the whole graph |\n| `cortex_paths` | Trace connections between two ideas |\n| `cortex_contradictions` | Find conflicting claims across notes |\n| `cortex_suggest_links` | Wikilink suggestions for the current note |\n| `cortex_ingest_url` | Pull a URL into the graph |\n\n---\n\n## In-Obsidian features\n\n### Ask your vault\n\nRight-sidebar chat. Multi-hop retrieval with citations. Click an entity chip to open the source note; click a citation to jump to the exact paragraph.\n\n- **Suggested starters** \u2014 Catch me up \xB7 Trace connections \xB7 Surface decisions \xB7 Find blind spots\n- **Auto-highlight on graph** \u2014 toggle the pin on any answer to make every future answer auto-push its cited entities into the Graph view filter\n- **Save as note** \u2014 drop the answer into `Cortex Chats/`\n- **Conversation history** \u2014 sessions persist across restarts\n\n### Sync modal\n\n`HangarX: Sync` \u2014 one place, five actions:\n\n| Action | What it does |\n|---|---|\n| **Push** | Vault \u2192 graph (changed files only) |\n| **Pull** | Graph \u2192 vault (entities + relationships as markdown) |\n| **Two-way** | Push first, then pull |\n| **Diff** | Reconciliation view: vault-only / drifted / graph-only / in-sync |\n| **Force re-ingest** | Wipe local sync index and re-push everything |\n\nPush runs are cancellable mid-flight; cancellation propagates to in-flight server workers.\n\n### Inline link suggestions\n\nType and HangarX shows ghost-text `[[wikilink]]` autocompletes from your graph. **Tab** to accept, **Esc** to dismiss.\n\n---\n\n## Supported LLM providers\n\nPick any in **Settings \u2192 HangarX \u2192 LLM provider keys** (BYOK) or in the per-request **LLM (runtime)** panel. Switch on the fly \u2014 no container restart.\n\n- \u{1F7E6} **Google Gemini** \u2014 fast, cheap default\n- \u{1F7E9} **OpenAI** \u2014 GPT-4o, GPT-4.1, o-series\n- \u{1F7E7} **Anthropic Claude**\n- \u2B1B **xAI Grok**\n- \u{1F7E8} **Moonshot Kimi K2.5** \u2014 direct\n- \u{1F7EA} **HuggingFace Inference** \u2014 auto-routes Kimi K2.5, Llama 3.3 70B, Qwen 2.5 72B\n- \u{1F310} **OpenRouter** \u2014 200+ models behind one key\n- \u{1F4BB} **Ollama** \u2014 fully local (gemma4, llama3.3, qwen2.5, mistral, phi3, \u2026)\n\n---\n\n## Privacy\n\n| | Cloud | Local |\n|---|---|---|\n| Notes leave your machine | \u2713 (sent to HangarX API) | \u2717 |\n| LLM key required | \u2717 (we manage) | \u2713 (BYOK) |\n| Trained on your data | \u2717 | \u2717 |\n| Revocable | \u2713 ([dashboard](https://app.hangarx.ai/settings?tab=api-keys)) | \u2713 (delete the container) |\n\n**Excluded by default**: `.cortex/`, `.obsidian/`, `templates/`. Configurable in **What to sync**.\n**Attachments**: images, PDFs, and other binaries are ingested by default. Toggle off in **Sync attachments**.\n\n---\n\n## Commands\n\n| Command | Description |\n|---|---|\n| `HangarX: Ask your vault` | Open the Q&A chat |\n| `HangarX: Sync` | Open the multi-purpose sync modal |\n| `HangarX: Sync current note` | Push only the active file |\n| `HangarX: Diff vault vs knowledge graph` | Open the 4-bucket diff view |\n| `HangarX: Pull graph entities into vault` | Materialize entities as markdown |\n| `HangarX: Force re-ingest entire vault` | Re-sync everything |\n| `HangarX: Connect agents (Claude, Cursor)\u2026` | Jump to the Agents settings panel |\n| `HangarX: Knowledge graph stats` | Show graph + memory counts |\n| `HangarX: Ingest URL into knowledge graph` | Scrape a URL and add it to the graph |\n| `HangarX: Show onboarding` | Reopen the first-run walkthrough |\n\n---\n\n## Troubleshooting\n\n<details>\n<summary><strong>"This API key was rejected (401)" in Cloud mode</strong></summary>\n\nGenerate a fresh key in the [dashboard](https://app.hangarx.ai/settings?tab=api-keys) and click **Test** on the API Key field. If you signed in via OAuth, **Sign out** then **Sign in with HangarX** again.\n\n</details>\n\n<details>\n<summary><strong>"LLM provider API key expired"</strong></summary>\n\nThe chat error card surfaces this directly. Open **Settings \u2192 HangarX \u2192 LLM provider keys**, paste a fresh key in the relevant section. Runtime config updates immediately \u2014 no container restart.\n\n</details>\n\n<details>\n<summary><strong>HuggingFace 403</strong></summary>\n\nVisit [huggingface.co/settings/inference-providers](https://huggingface.co/settings/inference-providers) and confirm your token has provider access. Paid models (Kimi K2.5 via Novita, Llama 3.3 via Fireworks) need credits \u2014 switch to a free serverless model in the runtime panel if not.\n\n</details>\n\n<details>\n<summary><strong>Local stack: "Cannot reach http://localhost:3400"</strong></summary>\n\nMake sure Docker Desktop is running and `docker compose ps` shows `cortex-api` as healthy. Check `docker compose logs cortex-api` for startup errors. The most common cause is a missing LLM key \u2014 re-save the Compose YAML from settings (it bakes in whichever BYOK keys you\'ve configured) and `docker compose up -d --force-recreate`.\n\n</details>\n\n<details>\n<summary><strong>Local stack: embedding dimension mismatch</strong></summary>\n\nYou changed embedding providers and existing chunks were embedded with a different model. Run **HangarX: Force re-ingest entire vault**, or wipe the local Postgres volume.\n\n</details>\n\n<details>\n<summary><strong>Agent shows "Connected" but doesn\'t see HangarX tools</strong></summary>\n\nRestart the agent fully. Claude Desktop, Cursor, and Windsurf cache MCP servers and only re-read the config on launch. For Claude Code, start a new session.\n\n</details>\n\n<details>\n<summary><strong>"Show on graph" doesn\'t dim nodes</strong></summary>\n\nMake sure you\'ve synced your vault at least once \u2014 dimming requires the cited entities to exist as files. If the graph view was previously corrupted by an older plugin version, the plugin auto-detaches and recreates the leaf \u2014 reload Obsidian once.\n\n</details>\n\n<details>\n<summary><strong>Sync is slow</strong></summary>\n\nInitial syncs are bound by LLM latency (`O(notes \xD7 LLM round-trip)`). Cloud uses our infrastructure; local is bound by your provider. Switch the embedding provider to Ollama for free, fast local embeddings.\n\n</details>\n\n---\n\n## Architecture\n\nFor the deep-dive on how entity extraction, multi-hop retrieval, claim graphs, and the MCP bridge actually work, see [`docs/HOW_IT_WORKS.md`](./docs/HOW_IT_WORKS.md).\n\n## Contributing\n\nIssues and PRs welcome at [github.com/3-Elements-Design/hangarx-obsidian](https://github.com/3-Elements-Design/hangarx-obsidian).\n\n## License\n\nMIT \u2014 see [LICENSE](./LICENSE).\n';

// src/views/readme-modal.ts
var ReadmeModal = class extends import_obsidian3.Modal {
  constructor(app) {
    super(app);
    this.renderComponent = new import_obsidian3.Component();
  }
  async onOpen() {
    this.modalEl.addClass("cortex-readme-modal");
    this.titleEl.empty();
    const title = this.titleEl.createEl("div", { cls: "cortex-readme-title" });
    title.createEl("span", { text: "HangarX \u2014 Documentation" });
    const actions = title.createEl("div", { cls: "cortex-readme-title-actions" });
    const externalBtn = actions.createEl("button", {
      cls: "cortex-readme-iconbtn",
      attr: { "aria-label": "Open online docs" }
    });
    (0, import_obsidian3.setIcon)(externalBtn, "external-link");
    externalBtn.addEventListener("click", () => {
      window.open("https://app.hangarx.ai/obsidian", "_blank");
    });
    const body = this.contentEl.createDiv({ cls: "cortex-readme-body markdown-rendered" });
    this.renderComponent.load();
    await import_obsidian3.MarkdownRenderer.render(this.app, README_default, body, "", this.renderComponent);
    body.querySelectorAll("a[href]").forEach((el) => {
      const a = el;
      const href = a.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href)) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
      }
    });
  }
  onClose() {
    this.renderComponent.unload();
    this.contentEl.empty();
  }
};

// src/settings.ts
var CLOUD_API_URL = "https://cortex.hangarx.ai";
var LOCAL_API_URL = "http://localhost:3400";
var EMBEDDING_PRESETS = {
  gemini: { provider: "gemini", model: "gemini-embedding-001" },
  ollama: { provider: "ollama", model: "nomic-embed-text" }
};
function buildDockerCompose(encryptionKey, llmEncryptionKey, embedding = "gemini") {
  const e = EMBEDDING_PRESETS[embedding] ?? EMBEDDING_PRESETS.gemini;
  return `# Cortex GraphRAG \u2014 Local Stack (single-user)
# Start: docker compose -f docker-compose.cortex.yml up -d
# Stop:  docker compose -f docker-compose.cortex.yml down
#
# Auth: disabled for single-user use. The cortex-api port is bound to
# 127.0.0.1 only, so only this machine can reach it. To expose it on the
# LAN, change the bind to 0.0.0.0 AND set LOCAL_API_KEY (the server will
# refuse to start otherwise).
services:
  falkordb:
    image: falkordb/falkordb:latest
    container_name: cortex-falkordb
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${FALKORDB_PORT:-6379}:6379"
    volumes:
      - falkordb_data:/data
    # Default MAX_QUEUED_QUERIES is 25 \u2014 bursty ingestion saturates it and the
    # client sees "Max pending queries exceeded". Raise the cap for local use.
    command: ["redis-server", "--loadmodule", "/var/lib/falkordb/bin/falkordb.so", "MAX_QUEUED_QUERIES", "4000"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
  postgres:
    image: pgvector/pgvector:pg16
    container_name: cortex-postgres
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${POSTGRES_PORT:-5432}:5432"
    environment:
      POSTGRES_USER: cortex
      POSTGRES_PASSWORD: cortex
      POSTGRES_DB: cortex
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cortex -d cortex"]
      interval: 5s
      timeout: 5s
      retries: 10
  cortex-api:
    image: \${CORTEX_IMAGE:-hangarx/cortex-api:latest}
    container_name: cortex-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${CORTEX_PORT:-3400}:3400"
    environment:
      LOCAL_AUTH_DISABLED: "true"
      PORT: 3400
      GRAPH_STORE_TYPE: falkordb
      VECTOR_STORE_TYPE: pgvector
      FALKORDB_HOST: falkordb
      FALKORDB_PORT: 6379
      DATABASE_URL: postgres://cortex:cortex@postgres:5432/cortex
      AUTO_MIGRATE: "true"
      STORAGE_TYPE: postgres
      ANALYTICS_STORE_TYPE: memory
      LLM_PROVIDER: \${LLM_PROVIDER:-gemini}
      LLM_MODEL: \${LLM_MODEL:-gemini-2.5-flash}
      EMBEDDING_PROVIDER: \${EMBEDDING_PROVIDER:-${e.provider}}
      EMBEDDING_MODEL: \${EMBEDDING_MODEL:-${e.model}}
      GEMINI_API_KEY: \${GEMINI_API_KEY:-}
      OPENAI_API_KEY: \${OPENAI_API_KEY:-}
      ANTHROPIC_API_KEY: \${ANTHROPIC_API_KEY:-}
      MOONSHOT_API_KEY: \${MOONSHOT_API_KEY:-}
      HF_TOKEN: \${HF_TOKEN:-}
      OPENROUTER_API_KEY: \${OPENROUTER_API_KEY:-}
      XAI_API_KEY: \${XAI_API_KEY:-}
      COHERE_API_KEY: \${COHERE_API_KEY:-}
      JINA_API_KEY: \${JINA_API_KEY:-}
      OLLAMA_BASE_URL: \${OLLAMA_BASE_URL:-http://host.docker.internal:11434}
      MCP_ALLOW_UNAUTHENTICATED: "true"
      BOOTSTRAP_SECRET: cortex-local
      # Skip per-file Louvain community detection. The single-user Falkor
      # graph times out on this for vaults >1k entities and the resulting
      # communities aren't surfaced anywhere in the plugin UI. Cloud
      # deployments leave this unset and keep auto-detection on.
      DISABLE_AUTO_COMMUNITY_DETECTION: "true"
      CONNECTOR_ENCRYPTION_KEY: "${encryptionKey}"
      LLM_ENCRYPTION_KEY: "${llmEncryptionKey}"
    depends_on:
      falkordb:
        condition: service_healthy
      postgres:
        condition: service_healthy
volumes:
  falkordb_data:
  postgres_data:
`;
}
function generateEncryptionKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var DOCKER_START_CMD = `docker compose -f docker-compose.cortex.yml up -d --force-recreate`;
var DEFAULT_SETTINGS = {
  connectionMode: "cloud",
  apiUrl: CLOUD_API_URL,
  apiKey: "",
  workspaceId: "",
  vaultId: "",
  excludePatterns: [".cortex/", ".obsidian/", "templates/"],
  includeFolders: [],
  syncOnStartup: true,
  autoSyncDebounceMs: 2e3,
  syncAttachments: true,
  attachmentMaxBytes: 10 * 1024 * 1024,
  defaultRightPane: "chat",
  showRelatedPane: true,
  inlineSuggestionsEnabled: true,
  autoShowAnswerOnGraph: false,
  mcpEnabled: false,
  mcpPort: 7474,
  mcpToken: "",
  chatExportFolder: "Cortex Chats",
  memoryFolder: "Cortex Memories",
  writeMemoriesToVault: true,
  autoSaveChatToVault: false,
  graphPullFolder: ".cortex/graph",
  graphPullEntityTypes: [],
  graphPullEnrichSourceNotes: false,
  connectorEncryptionKey: "",
  llmEncryptionKey: "",
  llmKeys: {},
  embeddingPreset: "gemini",
  deviceId: "",
  deviceName: ""
};
function defaultDeviceName() {
  if (import_obsidian9.Platform.isMobileApp) return import_obsidian9.Platform.isIosApp ? "iOS" : "Android";
  if (import_obsidian9.Platform.isMacOS) return "Mac";
  if (import_obsidian9.Platform.isWin) return "Windows";
  if (import_obsidian9.Platform.isLinux) return "Linux";
  return "Desktop";
}
var CortexSettingTab = class extends import_obsidian9.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    /** Surfaced by checkLocalHealth(). */
    this.lastHealthDetail = "";
    /** Per-subsystem health captured from the /health response body. Drives the
     *  Stack Health panel; null when the API is unreachable so the panel can
     *  show "status unknown — API offline" for everything. */
    this.lastHealthSubsystems = null;
    this.lastHealthVersion = null;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.plugin.settings;
    const mode = s.connectionMode;
    containerEl.createEl("h3", { text: "Settings" });
    new import_obsidian9.Setting(containerEl).setName("Mode").setDesc("Choose where HangarX runs. Cloud uses the hosted API. Local runs everything on your machine via Docker.").addDropdown((d) => d.addOption("cloud", "\u2601\uFE0F  Cloud (HangarX hosted)").addOption("local", "\u{1F3E0}  Local (Docker)").setValue(mode).onChange(async (v) => {
      s.connectionMode = v;
      if (v === "cloud") s.apiUrl = CLOUD_API_URL;
      else if (v === "local") s.apiUrl = LOCAL_API_URL;
      await this.plugin.saveSettings();
      this.display();
    }));
    if (mode === "cloud") {
      this.renderCloudConnection(containerEl, s);
    }
    if (mode === "local") {
      this.renderLocalConnection(containerEl, s);
    }
    this.renderAgentsSection(containerEl);
    this.renderLlmRuntimeSection(containerEl);
    containerEl.createEl("h3", { text: "What to sync" });
    new import_obsidian9.Setting(containerEl).setName("Include folders").setDesc("Comma-separated folder prefixes. Empty = include everything not excluded.").addText((t) => t.setValue(this.plugin.settings.includeFolders.join(",")).onChange(async (v) => {
      this.plugin.settings.includeFolders = v.split(",").map((x) => x.trim()).filter(Boolean);
      await this.plugin.saveSettings();
    }));
    new import_obsidian9.Setting(containerEl).setName("Exclude patterns").setDesc("Comma-separated path prefixes to skip when pushing to HangarX.").addText((t) => t.setValue(this.plugin.settings.excludePatterns.join(",")).onChange(async (v) => {
      this.plugin.settings.excludePatterns = v.split(",").map((x) => x.trim()).filter(Boolean);
      await this.plugin.saveSettings();
    }));
    new import_obsidian9.Setting(containerEl).setName("Sync attachments").setDesc("Ingest images, PDFs, and other binaries referenced by your notes.").addToggle((t) => t.setValue(this.plugin.settings.syncAttachments).onChange(async (v) => {
      this.plugin.settings.syncAttachments = v;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "Sync behavior" });
    new import_obsidian9.Setting(containerEl).setName("Sync on startup").setDesc("Run a full vault sync when Obsidian launches. Skips files unchanged since the last sync.").addToggle((t) => t.setValue(this.plugin.settings.syncOnStartup).onChange(async (v) => {
      this.plugin.settings.syncOnStartup = v;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "Import Cortex graph" });
    const importDesc = containerEl.createEl("p", { cls: "setting-item-description" });
    importDesc.setText(
      "Pull entities and relationships from your Cortex cloud workspace into your vault as markdown files. Pulled notes appear in Obsidian's native graph view, with [[wikilinks]] for every relationship. Re-running is incremental \u2014 only changed entities are rewritten."
    );
    new import_obsidian9.Setting(containerEl).setName("Graph folder").setDesc("Where pulled entity files live. Folder is excluded from sync to prevent feedback loops.").addText((t) => t.setValue(this.plugin.settings.graphPullFolder).setPlaceholder(".cortex/graph").onChange(async (v) => {
      this.plugin.settings.graphPullFolder = v.trim() || ".cortex/graph";
      await this.plugin.saveSettings();
    }));
    new import_obsidian9.Setting(containerEl).setName("Entity types").setDesc("Comma-separated list of entity types to pull. Leave empty to pull a sensible default set (Concept, Person, Organization, Topic, Location, Event, \u2026).").addText((t) => t.setValue(this.plugin.settings.graphPullEntityTypes.join(", ")).setPlaceholder("Concept, Person, Topic").onChange(async (v) => {
      this.plugin.settings.graphPullEntityTypes = v.split(",").map((s2) => s2.trim()).filter(Boolean);
      await this.plugin.saveSettings();
    }));
    new import_obsidian9.Setting(containerEl).setName("Enrich source notes").setDesc("Add `cortex_entities` frontmatter to your existing notes that mention pulled entities \u2014 creates bidirectional wikilinks.").addToggle((t) => t.setValue(this.plugin.settings.graphPullEnrichSourceNotes).onChange(async (v) => {
      this.plugin.settings.graphPullEnrichSourceNotes = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian9.Setting(containerEl).setName("Run import").setDesc("Summary is a fast (~50ms) estimate from graph stats. Preview is a full dry-run that fetches every entity for exact diffs. Pull from cloud writes to disk.").addButton((b) => b.setButtonText("Summary").onClick(() => this.plugin.runGraphPullSummary())).addButton((b) => b.setButtonText("Preview").onClick(() => this.plugin.runGraphPullPreview())).addButton((b) => b.setButtonText("Pull from cloud").setCta().onClick(() => this.plugin.runGraphPull()));
    containerEl.createEl("h3", { text: "Interface" });
    new import_obsidian9.Setting(containerEl).setName("Default right pane").setDesc('Which sidebar auto-opens on startup. "Ask your vault" is always-on chat over your knowledge graph; "Related notes" surfaces semantically similar notes for the current file.').addDropdown((d) => d.addOption("chat", "Ask your vault").addOption("related", "Related notes").addOption("none", "None (open manually)").setValue(this.plugin.settings.defaultRightPane).onChange(async (v) => {
      this.plugin.settings.defaultRightPane = v;
      this.plugin.settings.showRelatedPane = v === "related";
      await this.plugin.saveSettings();
    }));
    new import_obsidian9.Setting(containerEl).setName("Inline link suggestions").setDesc("Show ghost-text [[wikilink]] suggestions while typing \u2014 driven by entity matches in your graph. Tab to accept, Esc to dismiss.").addToggle((t) => t.setValue(this.plugin.settings.inlineSuggestionsEnabled).onChange(async (v) => {
      this.plugin.settings.inlineSuggestionsEnabled = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian9.Setting(containerEl).setName("Auto-highlight chat answers on graph").setDesc(`After every chat answer, automatically push its cited entities into Obsidian's graph view filter \u2014 non-matching nodes dim, matching ones stay highlighted. Toggle is also accessible from the "Show on graph" button on each answer.`).addToggle((t) => t.setValue(this.plugin.settings.autoShowAnswerOnGraph).onChange(async (v) => {
      this.plugin.settings.autoShowAnswerOnGraph = v;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "Help" });
    new import_obsidian9.Setting(containerEl).setName("Onboarding").setDesc("Replay the 3-step welcome modal \u2014 connect, sync, and try a question.").addButton((b) => b.setButtonText("Show onboarding").onClick(async () => {
      const { OnboardingModal: OnboardingModal2 } = await Promise.resolve().then(() => (init_onboarding_modal(), onboarding_modal_exports));
      new OnboardingModal2(this.plugin.app, this.plugin).open();
    }));
    new import_obsidian9.Setting(containerEl).setName("Documentation").setDesc("Quick start, agent setup, troubleshooting, and the full plugin guide.").addButton((b) => b.setButtonText("View README").onClick(() => new ReadmeModal(this.app).open())).addButton((b) => b.setButtonText("Open online").setCta().onClick(() => window.open("https://app.hangarx.ai/obsidian", "_blank")));
  }
  /**
   * Headline section: turn this vault into a memory + context layer that any
   * MCP-compatible agent on this machine can call. The local MCP server is
   * the wedge feature; the one-click connect buttons make it 30-second setup.
   */
  /**
   * Cloud-mode connection panel. Two layouts driven by `s.apiKey`:
   *
   *   - Empty:  big sign-in CTA + Open dashboard, with manual paste fields
   *             visible below for users with an existing key.
   *   - Filled: compact one-liner status badge (✓ <email> · ws_<short> · last
   *             used <ago>) + Sign out + Open dashboard. Raw API key /
   *             workspace fields hide under an "Advanced" disclosure so
   *             users aren't staring at credentials they don't need to edit.
   */
  renderCloudConnection(containerEl, s) {
    const isAuthed = !!s.apiKey;
    if (!isAuthed) {
      const intro = containerEl.createDiv({ cls: "cortex-cloud-intro" });
      intro.createEl("p", {
        cls: "setting-item-description",
        text: "Sign in to auto-create an API key and pick your workspace, or paste an existing key below."
      });
      const introActions = intro.createDiv({ cls: "cortex-cloud-intro-actions" });
      const signInBtn = introActions.createEl("button", {
        text: "Sign in with HangarX",
        cls: "mod-cta"
      });
      signInBtn.addEventListener("click", () => this.startInteractiveSignIn(signInBtn, s));
      const dashBtn2 = introActions.createEl("button", { text: "Open dashboard \u2197" });
      dashBtn2.addEventListener("click", () => {
        window.open("https://app.hangarx.ai/settings?tab=api-keys", "_blank");
      });
      const statusBadge2 = intro.createDiv({ cls: "cortex-cloud-status" });
      this.renderCloudCredentialFields(containerEl, s, statusBadge2);
      return;
    }
    const compact = containerEl.createDiv({ cls: "cortex-cloud-compact" });
    const statusBadge = compact.createDiv({ cls: "cortex-cloud-status" });
    void this.validateCloudKey(statusBadge);
    const actions = compact.createDiv({ cls: "cortex-cloud-compact-actions" });
    const dashBtn = actions.createEl("button", { text: "Open dashboard \u2197" });
    dashBtn.addEventListener("click", () => {
      window.open("https://app.hangarx.ai/settings?tab=api-keys", "_blank");
    });
    const signOutBtn = actions.createEl("button", { text: "Sign out" });
    signOutBtn.addEventListener("click", async () => {
      s.apiKey = "";
      s.workspaceId = "";
      await this.plugin.saveSettings();
      this.display();
    });
    const advanced = containerEl.createEl("details", { cls: "cortex-cloud-advanced" });
    advanced.createEl("summary", { text: "Advanced \u2014 API key, workspace ID" });
    const advBody = advanced.createDiv();
    this.renderCloudCredentialFields(advBody, s, statusBadge);
  }
  /**
   * Local-mode connection panel. Two display modes driven by the live health
   * check:
   *   - Stack down → status pill + "Get started" hero (Save YAML + copy
   *     `docker compose up`). The thing the user actually needs.
   *   - Stack up   → compact status pill only. Hero hides.
   *
   * In both cases the BYO provider keys section is visible (it's the gate to
   * a working ingest), and API URL / API Key / Workspace ID collapse under a
   * single Advanced disclosure.
   */
  renderLocalConnection(containerEl, s) {
    if (!s.connectorEncryptionKey) {
      s.connectorEncryptionKey = generateEncryptionKey();
      void this.plugin.saveSettings();
    }
    if (!s.llmEncryptionKey) {
      s.llmEncryptionKey = generateEncryptionKey();
      void this.plugin.saveSettings();
    }
    if (!s.workspaceId) {
      s.workspaceId = "default";
      void this.plugin.saveSettings();
    }
    const statusEl = containerEl.createDiv({ cls: "cortex-local-status" });
    const dot = statusEl.createSpan({ cls: "cortex-status-dot" });
    const statusText = statusEl.createSpan({ cls: "cortex-status-text" });
    const retryBtn = statusEl.createEl("button", {
      cls: "cortex-status-retry",
      text: "Retry",
      attr: { "aria-label": "Retry connection check" }
    });
    const stackHealthWrap = containerEl.createDiv({ cls: "cortex-stack-health-wrap" });
    const setupCard = this.renderLocalSetupCard(containerEl, s);
    const runningCard = this.renderLocalRunningCard(containerEl, s);
    const runCheck = async () => {
      dot.removeClass("cortex-status-ok");
      dot.removeClass("cortex-status-err");
      dot.addClass("cortex-status-checking");
      statusText.textContent = "Checking connection\u2026";
      retryBtn.setAttr("disabled", "true");
      const ok = await this.checkLocalHealth(s.apiUrl);
      dot.removeClass("cortex-status-checking");
      dot.addClass(ok ? "cortex-status-ok" : "cortex-status-err");
      statusText.textContent = this.lastHealthDetail || (ok ? `Connected to ${s.apiUrl}` : `Cannot reach ${s.apiUrl}`);
      retryBtn.removeAttribute("disabled");
      setupCard.style.display = ok ? "none" : "";
      runningCard.style.display = ok ? "" : "none";
      this.renderStackHealthPanel(stackHealthWrap, s, ok);
    };
    retryBtn.addEventListener("click", () => void runCheck());
    void runCheck();
    this.renderProviderKeysSection(containerEl, s);
    this.renderConnectionDetails(containerEl, s);
  }
  /**
   * Three-step setup card shown when the local stack isn't running. Order
   * matters: provider key first (otherwise the stack starts but can't extract
   * anything), then save the YAML, then run the command. Returns the wrapping
   * element so the caller can hide it once the stack is healthy.
   */
  renderLocalSetupCard(containerEl, s) {
    const hero = containerEl.createDiv({ cls: "cortex-local-hero" });
    hero.createEl("div", { cls: "cortex-local-hero-title", text: "Set up HangarX in three steps" });
    hero.createEl("div", {
      cls: "cortex-local-hero-sub",
      text: "HangarX runs Postgres, FalkorDB, and the Cortex API on your machine via Docker. Pulls images from Docker Hub \u2014 no source code needed."
    });
    const configuredKeys = Object.keys(s.llmKeys).filter((k) => !!s.llmKeys[k]);
    const hasKey = configuredKeys.length > 0;
    const step1 = hero.createDiv({ cls: "cortex-local-hero-step" });
    step1.createEl("span", { cls: "cortex-local-hero-step-num", text: "1." });
    const step1Body = step1.createDiv({ cls: "cortex-local-hero-step-body" });
    step1Body.createEl("div", {
      text: hasKey ? `Add an LLM provider key \u2014 \u2713 ${configuredKeys.length} configured` : "Add an LLM provider key",
      cls: "cortex-local-hero-step-label"
    });
    step1Body.createEl("div", {
      cls: "setting-item-description",
      text: hasKey ? "Used for entity extraction and graph queries. You can add more below." : "Required so HangarX can read your notes. Gemini has a free tier \u2014 fastest to start."
    });
    const step1Actions = step1Body.createDiv({ cls: "cortex-local-hero-step-actions" });
    const jumpToKeysBtn = step1Actions.createEl("button", {
      text: hasKey ? "Manage keys \u2193" : "Add a key \u2193",
      cls: hasKey ? "" : "mod-cta"
    });
    jumpToKeysBtn.addEventListener("click", () => {
      const target = containerEl.querySelector("[data-cortex-keys-anchor]");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (target instanceof HTMLDetailsElement) target.open = true;
    });
    const step2 = hero.createDiv({ cls: "cortex-local-hero-step" });
    step2.createEl("span", { cls: "cortex-local-hero-step-num", text: "2." });
    const step2Body = step2.createDiv({ cls: "cortex-local-hero-step-body" });
    step2Body.createEl("div", { text: "Save docker-compose.cortex.yml to your vault", cls: "cortex-local-hero-step-label" });
    step2Body.createEl("div", {
      cls: "setting-item-description",
      text: "Bakes your API key + provider keys into the file. Re-save anytime they change."
    });
    const step2Actions = step2Body.createDiv({ cls: "cortex-local-hero-step-actions" });
    const saveBtn = step2Actions.createEl("button", { text: "Save to vault", cls: "mod-cta" });
    saveBtn.addEventListener("click", async () => {
      try {
        const path = "docker-compose.cortex.yml";
        await this.plugin.app.vault.adapter.write(path, buildDockerComposeWithKeys(s));
        saveBtn.setText("\u2713 Saved");
        setTimeout(() => saveBtn.setText("Save to vault"), 2e3);
      } catch (e) {
        saveBtn.setText("Failed \u2014 check console");
        console.error("[Cortex] Failed to write compose file:", e);
      }
    });
    const copyYamlBtn = step2Actions.createEl("button", { text: "Copy YAML" });
    copyYamlBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(buildDockerComposeWithKeys(s));
      copyYamlBtn.setText("Copied");
      setTimeout(() => copyYamlBtn.setText("Copy YAML"), 1400);
    });
    const step3 = hero.createDiv({ cls: "cortex-local-hero-step" });
    step3.createEl("span", { cls: "cortex-local-hero-step-num", text: "3." });
    const step3Body = step3.createDiv({ cls: "cortex-local-hero-step-body" });
    step3Body.createEl("div", { text: "Run this in your vault folder:", cls: "cortex-local-hero-step-label" });
    const codeWrap = step3Body.createDiv({ cls: "cortex-mcp-code-wrap" });
    const copyCmdBtn = codeWrap.createEl("button", { cls: "cortex-mcp-copy", text: "Copy" });
    copyCmdBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(DOCKER_START_CMD);
      copyCmdBtn.textContent = "Copied";
      copyCmdBtn.addClass("is-copied");
      setTimeout(() => {
        copyCmdBtn.textContent = "Copy";
        copyCmdBtn.removeClass("is-copied");
      }, 1400);
    });
    codeWrap.createEl("pre").createEl("code", { text: DOCKER_START_CMD });
    return hero;
  }
  /**
   * Success card shown when the local stack is reachable. Confirms what's
   * happening and points to the next obvious action so first-time users know
   * they've crossed the finish line.
   */
  renderLocalRunningCard(containerEl, s) {
    const card = containerEl.createDiv({ cls: "cortex-local-running-card" });
    card.style.margin = "8px 0 16px";
    card.style.padding = "14px 16px";
    card.style.borderLeft = "3px solid #22c55e";
    card.style.background = "rgba(34, 197, 94, 0.08)";
    card.style.borderRadius = "4px";
    card.style.color = "var(--text-normal)";
    card.createEl("div", {
      text: "\u2713 Local stack running",
      attr: { style: "font-weight: 600; font-size: 14px; margin-bottom: 6px; color: var(--text-normal);" }
    });
    card.createEl("div", {
      text: `Connected to ${s.apiUrl}. Your vault is ready to be searched and indexed by AI agents.`,
      attr: { style: "font-size: 13px; color: var(--text-normal); opacity: 0.85;" }
    });
    card.createEl("div", {
      text: 'Verify with Cmd/Ctrl+P \u2192 "HangarX: Memory stats". Manage agents under the Agents section below.',
      attr: { style: "font-size: 13px; color: var(--text-normal); opacity: 0.7; margin-top: 6px;" }
    });
    return card;
  }
  /**
   * Stack health + recovery commands. Renders one of three states:
   *
   *   1. API reachable, all subsystems ok → minimal "All services healthy"
   *      strip (collapsed by default, expand for details).
   *   2. API reachable but degraded → per-service rows showing which
   *      subsystem is down + tailored recovery commands.
   *   3. API unreachable → "API offline" with restart commands and the
   *      fallback "wipe + restart fresh" nuke option at the bottom.
   *
   * No buttons actually run docker — Obsidian plugins can't shell out from
   * the renderer. Each command has a Copy button + the plugin prepends
   * `cd "<vault path>" && ` so the user can paste-and-run.
   */
  renderStackHealthPanel(parent, s, apiReachable) {
    parent.empty();
    if (s.connectionMode !== "local") return;
    const subs = this.lastHealthSubsystems;
    const someDown = subs ? Object.entries(subs).some(([, v]) => v.status === "down") : !apiReachable;
    const wrap = parent.createEl("details", { cls: "cortex-stack-health" });
    if (!apiReachable || someDown) wrap.setAttr("open", "");
    const summary = wrap.createEl("summary", { cls: "cortex-stack-health-summary" });
    const dot = summary.createSpan({ cls: "cortex-stack-health-dot" });
    if (!apiReachable) dot.addClass("is-offline");
    else if (someDown) dot.addClass("is-degraded");
    else dot.addClass("is-ok");
    if (!apiReachable) {
      summary.createSpan({ text: "Stack health \u2014 API offline" });
    } else if (someDown) {
      const downCount = subs ? Object.values(subs).filter((v) => v.status === "down").length : 0;
      summary.createSpan({ text: `Stack health \u2014 ${downCount} ${downCount === 1 ? "service" : "services"} degraded` });
    } else {
      summary.createSpan({ text: "Stack health \u2014 all services healthy" });
    }
    if (this.lastHealthVersion) {
      summary.createSpan({
        cls: "cortex-stack-health-version",
        text: `cortex-api ${this.lastHealthVersion}`
      });
    }
    const body = wrap.createDiv({ cls: "cortex-stack-health-body" });
    const services = body.createDiv({ cls: "cortex-stack-health-services" });
    const serviceRows = [
      { name: "cortex-api", label: "cortex-api" },
      { name: "falkordb", label: "falkordb (graph)" },
      { name: "postgres", label: "postgres" }
    ];
    for (const svc of serviceRows) {
      const row = services.createDiv({ cls: "cortex-stack-health-service" });
      const icon = row.createSpan({ cls: "cortex-stack-health-service-icon" });
      let statusText = "";
      if (svc.name === "cortex-api") {
        if (apiReachable) {
          icon.addClass("is-ok");
          icon.setText("\u2713");
          statusText = "Responding";
        } else {
          icon.addClass("is-down");
          icon.setText("\u2717");
          statusText = "Not responding";
        }
      } else if (!apiReachable) {
        icon.addClass("is-unknown");
        icon.setText("?");
        statusText = "Unknown (api offline)";
      } else if (subs && subs[svc.name]) {
        const sub = subs[svc.name];
        if (sub.status === "ok") {
          icon.addClass("is-ok");
          icon.setText("\u2713");
          statusText = sub.latencyMs != null ? `Connected \xB7 ${sub.latencyMs}ms` : "Connected";
        } else if (sub.status === "not_configured") {
          icon.addClass("is-skip");
          icon.setText("\u2014");
          statusText = "Not configured (skipped)";
        } else {
          icon.addClass("is-down");
          icon.setText("\u2717");
          statusText = sub.error ? `Down \u2014 ${sub.error}` : "Down (no error reported)";
        }
      } else {
        icon.addClass("is-unknown");
        icon.setText("?");
        statusText = "Unknown";
      }
      row.createSpan({ cls: "cortex-stack-health-service-name", text: svc.label });
      row.createSpan({ cls: "cortex-stack-health-service-status", text: statusText });
    }
    this.renderRecoveryCommands(body, s, apiReachable, someDown);
    const ymlPath = "docker-compose.cortex.yml";
    const ymlExists = !!this.plugin.app.vault.getAbstractFileByPath(ymlPath);
    const actions = body.createDiv({ cls: "cortex-stack-health-actions" });
    if (ymlExists) {
      const adapter = this.plugin.app.vault.adapter;
      const fullYmlPath = adapter.getFullPath?.(ymlPath);
      if (import_obsidian9.Platform.isDesktopApp && fullYmlPath) {
        const logsBtn = actions.createEl("button", { text: "Show recent logs", cls: "mod-cta" });
        logsBtn.addEventListener("click", () => void this.showRecentLogs(logsBtn, body, fullYmlPath));
      }
      const dockerBtn = actions.createEl("button", { text: "Open in Docker Desktop" });
      dockerBtn.addEventListener("click", () => void this.openDockerDesktop());
      const revealBtn = actions.createEl("button", { text: "Reveal docker-compose.cortex.yml" });
      revealBtn.addEventListener("click", () => {
        if (fullYmlPath) {
          const showInFolder = this.plugin.app.showInFolder;
          if (typeof showInFolder === "function") {
            showInFolder.call(this.plugin.app, fullYmlPath);
          } else {
            new import_obsidian9.Notice(`docker-compose.cortex.yml lives at: ${fullYmlPath}`);
          }
        }
      });
    } else {
      const hint = actions.createDiv({ cls: "cortex-stack-health-yml-hint" });
      hint.createEl("span", {
        text: 'No docker-compose.cortex.yml in your vault yet \u2014 run "Save to vault" in step 2 above.'
      });
    }
  }
  /**
   * Run `docker compose logs --tail=200 cortex-api` via Node's child_process
   * and render the output below the action row. Desktop-only — mobile Obsidian
   * doesn't expose child_process. The user can still copy the equivalent
   * command from the recovery list and run it manually.
   *
   * Why this matters: when the API is offline, the user is one click away
   * from the *actual error*, not just a list of commands. Most common cases
   * (missing LLM key, Postgres healthcheck failing, image pull issue) are
   * obvious from the last 50 log lines.
   */
  /**
   * Launch Docker Desktop. The `docker-desktop://` URL scheme is flaky:
   * Electron's `window.open` sandbox blocks custom protocols in some
   * Obsidian builds, and the scheme itself is undocumented and changes
   * between Docker Desktop versions. Reliable path is to ask the OS to
   * launch the app, the same way the user would from a launcher:
   *
   *   macOS:   `open -a 'Docker'` (Docker Desktop registers as "Docker.app")
   *   Windows: `start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"`
   *   Linux:   `docker-desktop` (binary), then xdg-open as fallback
   */
  async openDockerDesktop() {
    if (!import_obsidian9.Platform.isDesktopApp) {
      new import_obsidian9.Notice("Docker Desktop launch is desktop-only.");
      return;
    }
    const cp = window.require?.("child_process");
    if (!cp) {
      new import_obsidian9.Notice("child_process unavailable. Open Docker Desktop manually.");
      return;
    }
    try {
      const electron = window.require?.("electron");
      if (electron?.shell?.openExternal) {
        await electron.shell.openExternal("docker-desktop://dashboard/containers").catch(() => {
        });
      }
    } catch {
    }
    const tryLaunch = (cmd, args) => new Promise((resolve) => {
      try {
        const child = cp.spawn(cmd, args, { detached: true, stdio: "ignore" });
        child.on("error", () => resolve(false));
        child.unref();
        setTimeout(() => resolve(true), 200);
      } catch {
        resolve(false);
      }
    });
    if (import_obsidian9.Platform.isMacOS) {
      const ok = await tryLaunch("open", ["-a", "Docker"]);
      if (ok) {
        new import_obsidian9.Notice("Launched Docker Desktop.");
        return;
      }
      new import_obsidian9.Notice("Couldn't launch Docker Desktop. Open it manually from Applications.");
      return;
    }
    if (import_obsidian9.Platform.isWin) {
      const ok = await tryLaunch("powershell", ["-NoProfile", "-Command", 'Start-Process "Docker Desktop"']) || await tryLaunch("cmd", ["/c", "start", "", "Docker Desktop"]);
      if (ok) {
        new import_obsidian9.Notice("Launched Docker Desktop.");
        return;
      }
      new import_obsidian9.Notice("Couldn't launch Docker Desktop. Open it from the Start menu.");
      return;
    }
    if (import_obsidian9.Platform.isLinux) {
      const ok = await tryLaunch("docker-desktop", []) || await tryLaunch("xdg-open", ["docker-desktop://dashboard/containers"]);
      if (ok) {
        new import_obsidian9.Notice("Launched Docker Desktop.");
        return;
      }
      new import_obsidian9.Notice("Couldn't launch Docker Desktop. Run `docker-desktop` from a terminal.");
      return;
    }
    new import_obsidian9.Notice("Unsupported platform for Docker Desktop launch.");
  }
  async showRecentLogs(btn, body, composeFilePath) {
    btn.setAttr("disabled", "true");
    btn.setText("Loading\u2026");
    body.querySelectorAll(".cortex-stack-health-logs").forEach((el) => el.remove());
    const container = body.createDiv({ cls: "cortex-stack-health-logs" });
    container.createEl("div", { cls: "cortex-stack-health-logs-header", text: "docker compose logs --tail=200 cortex-api" });
    const pre = container.createEl("pre", { cls: "cortex-stack-health-logs-pre" });
    const code = pre.createEl("code", { text: "Running\u2026" });
    try {
      const cp = window.require?.("child_process");
      const path = window.require?.("path");
      if (!cp || !path) {
        code.setText("child_process unavailable on this platform \u2014 copy the command above and run it in a terminal.");
        return;
      }
      const cwd = path.dirname(composeFilePath);
      const fileName = path.basename(composeFilePath);
      const stdout = await new Promise((resolve, reject) => {
        cp.execFile(
          "docker",
          ["compose", "-f", fileName, "logs", "--tail=200", "--no-color", "cortex-api"],
          { cwd, timeout: 1e4, maxBuffer: 2 * 1024 * 1024 },
          (err, out, errOut) => {
            if (err && !out && !errOut) return reject(err);
            resolve(out + (errOut ? `
--- stderr ---
${errOut}` : ""));
          }
        );
      });
      code.empty();
      code.setText(stdout.trim() || "(no log output \u2014 is the container running?)");
      pre.scrollTop = pre.scrollHeight;
    } catch (e) {
      const err = e;
      code.empty();
      const msg = err.code === "ENOENT" ? "docker not found on PATH. Make sure Docker Desktop is installed and the `docker` CLI is reachable from your shell." : `Couldn't fetch logs: ${err.message ?? String(e)}`;
      code.setText(msg);
    } finally {
      btn.removeAttribute("disabled");
      btn.setText("Refresh logs");
    }
  }
  /** Render the copy-able command blocks. Top section is the "most likely
   *  to help" command for the current symptom; bottom is the always-shown
   *  reference list of all common commands. */
  renderRecoveryCommands(parent, _s, apiReachable, someDown) {
    const adapter = this.plugin.app.vault.adapter;
    const vaultPath = adapter.getBasePath?.() ?? "<your-vault-folder>";
    const yml = "docker-compose.cortex.yml";
    const cdPrefix = `cd "${vaultPath}" && \\
  `;
    const recovery = parent.createDiv({ cls: "cortex-stack-health-recovery" });
    if (!apiReachable || someDown) {
      const headline = !apiReachable ? "API isn't responding. Try the restart command first:" : "A service is degraded. Try a targeted restart:";
      recovery.createEl("div", { cls: "cortex-stack-health-recovery-headline", text: headline });
      const primaryCmd = !apiReachable ? `${cdPrefix}docker compose -f ${yml} up -d` : `${cdPrefix}docker compose -f ${yml} restart`;
      this.renderCommandRow(recovery, "Restart the stack", primaryCmd, true);
    }
    const moreWrap = recovery.createEl("details", { cls: "cortex-stack-health-recovery-more" });
    if (!apiReachable || someDown) moreWrap.setAttr("open", "");
    moreWrap.createEl("summary", { text: "More recovery commands" });
    this.renderCommandRow(
      moreWrap,
      "See what's running",
      `${cdPrefix}docker compose -f ${yml} ps`
    );
    this.renderCommandRow(
      moreWrap,
      "Tail recent cortex-api logs",
      `${cdPrefix}docker compose -f ${yml} logs --tail=200 cortex-api`
    );
    this.renderCommandRow(
      moreWrap,
      "Force-recreate (after YAML change)",
      `${cdPrefix}docker compose -f ${yml} up -d --force-recreate`
    );
    this.renderCommandRow(
      moreWrap,
      "Pull the latest image",
      `${cdPrefix}docker compose -f ${yml} pull && \\
  docker compose -f ${yml} up -d`
    );
    this.renderCommandRow(
      moreWrap,
      "Wipe volumes + start fresh (destructive \u2014 graph data is lost)",
      `${cdPrefix}docker compose -f ${yml} down -v && \\
  docker compose -f ${yml} up -d`,
      false,
      true
    );
  }
  /** One labeled command block with a Copy button. `destructive` adds a
   *  warning border so the wipe command stands out from the safe ones. */
  renderCommandRow(parent, label, command, primary = false, destructive = false) {
    const row = parent.createDiv({ cls: "cortex-stack-health-cmd" });
    if (primary) row.addClass("is-primary");
    if (destructive) row.addClass("is-destructive");
    row.createEl("div", { cls: "cortex-stack-health-cmd-label", text: label });
    const codeWrap = row.createDiv({ cls: "cortex-stack-health-cmd-codewrap" });
    codeWrap.createEl("pre").createEl("code", { text: command });
    const copyBtn = codeWrap.createEl("button", { cls: "cortex-stack-health-cmd-copy", text: "Copy" });
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(command);
      copyBtn.setText("Copied");
      setTimeout(() => copyBtn.setText("Copy"), 1400);
    });
  }
  /**
   * Diagnostic / set-once fields, collapsed by default. Holds:
   *   - Docker Compose file (re-save when provider keys change)
   *   - API URL, Workspace ID, API Key
   *
   * The API key field is shown even in local mode so users can see/edit
   * the cloud key they've saved (preserved across mode switches). Local
   * mode runs auth-disabled and ignores the value at the wire level.
   */
  renderConnectionDetails(parent, s) {
    const wrap = parent.createEl("details", { cls: "cortex-cloud-advanced" });
    wrap.createEl("summary", { text: "Connection details \u2014 Compose file, URL, workspace, API key" });
    const body = wrap.createDiv();
    new import_obsidian9.Setting(body).setName("Docker Compose file").setDesc("Re-save the YAML when you change provider keys, then run docker compose up -d --force-recreate to apply.").addButton((b) => b.setButtonText("Save to vault").setCta().onClick(async () => {
      const path = "docker-compose.cortex.yml";
      try {
        await this.plugin.app.vault.adapter.write(path, buildDockerComposeWithKeys(s));
        b.setButtonText("\u2713 Saved");
        new import_obsidian9.Notice(
          `Saved ${path}. If the stack is already running, apply with: docker compose -f ${path} up -d --force-recreate`,
          8e3
        );
        setTimeout(() => b.setButtonText("Save to vault"), 2e3);
      } catch (e) {
        b.setButtonText("Failed");
        console.error("[Cortex] Failed to write compose file:", e);
        setTimeout(() => b.setButtonText("Save to vault"), 2e3);
      }
    })).addButton((b) => b.setButtonText("Copy YAML").onClick(async () => {
      await navigator.clipboard.writeText(buildDockerComposeWithKeys(s));
      b.setButtonText("Copied");
      setTimeout(() => b.setButtonText("Copy YAML"), 1400);
    }));
    new import_obsidian9.Setting(body).setName("API URL").setDesc("Your local HangarX API URL. Defaults to http://localhost:3400 \u2014 only change if you remapped the port.").addText((t) => t.setPlaceholder(LOCAL_API_URL).setValue(s.apiUrl).onChange(async (v) => {
      s.apiUrl = v || LOCAL_API_URL;
      await this.plugin.saveSettings();
    }));
    new import_obsidian9.Setting(body).setName("Workspace ID").setDesc("A namespace for your graph data. Auto-generated; only change if you want multiple isolated graphs.").addText((t) => t.setPlaceholder("default").setValue(s.workspaceId).onChange(async (v) => {
      s.workspaceId = v.trim() || "default";
      await this.plugin.saveSettings();
    }));
    new import_obsidian9.Setting(body).setName("API key").setDesc("Saved cloud API key. Local mode is auth-disabled and ignores this value, but the key is preserved across mode switches so you don't have to re-sign-in.").addText((t) => {
      t.inputEl.type = "password";
      t.setPlaceholder("ctx_\u2026").setValue(s.apiKey).onChange(async (v) => {
        s.apiKey = v.trim();
        await this.plugin.saveSettings();
      });
    }).addExtraButton((b) => b.setIcon("eye").setTooltip("Show/hide").onClick(() => {
      const inputs = Array.from(body.querySelectorAll("input"));
      for (const el of inputs) {
        if (el.placeholder === "ctx_\u2026" || el.value === s.apiKey) {
          el.type = el.type === "password" ? "text" : "password";
        }
      }
    })).addExtraButton((b) => b.setIcon("copy").setTooltip("Copy to clipboard").onClick(async () => {
      if (!s.apiKey) {
        new import_obsidian9.Notice("No API key saved.");
        return;
      }
      await navigator.clipboard.writeText(s.apiKey);
      new import_obsidian9.Notice("API key copied.");
    }));
  }
  /** Kicks off the OAuth sign-in flow, swapping the button label while it's in flight. */
  async startInteractiveSignIn(signInBtn, s) {
    const original = signInBtn.textContent;
    signInBtn.setText("Opening browser\u2026");
    signInBtn.setAttr("disabled", "true");
    try {
      const result = await startSignIn({
        dashboardUrl: "https://app.hangarx.ai",
        apiUrl: s.apiUrl || CLOUD_API_URL,
        clientId: "hangarx-obsidian",
        redirectUri: "obsidian://hangarx-callback"
      });
      s.apiKey = result.accessToken;
      s.workspaceId = result.workspaceId;
      await this.plugin.saveSettings();
      new import_obsidian9.Notice(`\u2713 Signed in${result.userEmail ? ` as ${result.userEmail}` : ""}. Workspace ready to sync.`, 6e3);
      this.display();
    } catch (e) {
      const msg = e.message || "Sign-in failed";
      new import_obsidian9.Notice(`Sign-in failed: ${msg}`, 8e3);
    } finally {
      signInBtn.setText(original ?? "Sign in with HangarX");
      signInBtn.removeAttribute("disabled");
    }
  }
  /** API key + Workspace ID inputs, shared by pre-auth and Advanced disclosure. */
  renderCloudCredentialFields(parent, s, statusBadge) {
    let validateTimer;
    const scheduleValidate = () => {
      if (validateTimer) window.clearTimeout(validateTimer);
      validateTimer = window.setTimeout(() => this.validateCloudKey(statusBadge), 600);
    };
    new import_obsidian9.Setting(parent).setName("API Key").setDesc("Org-scoped API key from your HangarX dashboard.").addText((t) => {
      t.inputEl.type = "password";
      t.setPlaceholder("ctx_\u2026").setValue(s.apiKey).onChange(async (v) => {
        s.apiKey = v.trim();
        await this.plugin.saveSettings();
        scheduleValidate();
      });
    }).addButton((b) => b.setButtonText("Test").setTooltip("Validate the API key by calling /v1/api-keys/whoami").onClick(() => this.validateCloudKey(statusBadge)));
    new import_obsidian9.Setting(parent).setName("Workspace ID").setDesc("Found in your HangarX workspace settings (Settings \u2192 Workspaces).").addText((t) => t.setPlaceholder("ws_\u2026").setValue(s.workspaceId).onChange(async (v) => {
      s.workspaceId = v.trim();
      await this.plugin.saveSettings();
      scheduleValidate();
    }));
    if (s.apiKey) {
      void this.validateCloudKey(statusBadge);
    }
  }
  /**
   * Runtime LLM provider/model picker. Calls /v1/ask/config/* on the cortex-api,
   * which stores per-org config in Postgres (encrypted) and overrides the static
   * env-var defaults at request time. Result: switching providers/models or
   * updating a key takes effect on the next request, no container restart.
   *
   * Distinct from the BYOK section in renderProviderKeysSection — that one bakes
   * keys into the docker-compose YAML for cold-boot. This one is the runtime
   * override that wins at request time, so it's the right place for "switch
   * Gemini → Claude in the middle of a session."
   */
  renderLlmRuntimeSection(parent) {
    parent.createEl("h3", { text: "LLM (runtime)" });
    parent.createEl("p", {
      cls: "setting-item-description",
      text: "Switch chat provider and model on the fly \u2014 no container restart. Stored encrypted on the server and overrides the docker-compose defaults at request time."
    });
    const xref = parent.createEl("p", { cls: "cortex-llm-runtime-xref setting-item-description" });
    xref.appendText("Switching to a provider requires a key configured in ");
    const link = xref.createEl("a", { text: "LLM provider keys", href: "#" });
    link.addEventListener("click", (evt) => {
      evt.preventDefault();
      const target = parent.querySelector("[data-cortex-keys-anchor]") ?? this.containerEl.querySelector("[data-cortex-keys-anchor]");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (target instanceof HTMLDetailsElement) target.open = true;
    });
    xref.appendText(" above. Providers without a key are greyed out below.");
    const wrap = parent.createDiv({ cls: "cortex-llm-runtime" });
    const status = wrap.createDiv({ cls: "cortex-llm-runtime-status", text: "Loading current config\u2026" });
    const FALLBACK_MODELS = {
      openai: [
        { id: "gpt-4o-mini", label: "gpt-4o-mini" },
        { id: "gpt-4o", label: "gpt-4o" },
        { id: "gpt-4.1-mini", label: "gpt-4.1-mini" },
        { id: "o3-mini", label: "o3-mini" }
      ],
      anthropic: [
        { id: "claude-haiku-4-5", label: "claude-haiku-4-5" },
        { id: "claude-sonnet-4-6", label: "claude-sonnet-4-6" },
        { id: "claude-opus-4-7", label: "claude-opus-4-7" }
      ],
      gemini: [
        { id: "gemini-2.5-flash", label: "gemini-2.5-flash" },
        { id: "gemini-2.5-pro", label: "gemini-2.5-pro" },
        { id: "gemini-2.0-flash", label: "gemini-2.0-flash (no thinking)" }
      ],
      grok: [
        { id: "grok-4", label: "grok-4" },
        { id: "grok-3-mini", label: "grok-3-mini" }
      ],
      moonshot: [
        { id: "kimi-k2", label: "kimi-k2" },
        { id: "kimi-k2-turbo", label: "kimi-k2-turbo" }
      ],
      ollama: [
        { id: "gemma4", label: "gemma4 (Google, latest)" },
        { id: "gemma4:4b", label: "gemma4:4b (Google, 4B)" },
        { id: "gemma4:12b", label: "gemma4:12b (Google, 12B)" },
        { id: "gemma4:27b", label: "gemma4:27b (Google, 27B)" },
        { id: "gemma3:4b", label: "gemma3:4b (Google, 4B)" },
        { id: "gemma3:12b", label: "gemma3:12b (Google, 12B)" },
        { id: "gemma3:27b", label: "gemma3:27b (Google, 27B)" },
        { id: "llama3.2", label: "llama3.2" },
        { id: "llama3", label: "llama3 (8B)" },
        { id: "qwen2.5", label: "qwen2.5 (7B)" },
        { id: "mistral", label: "mistral (7B)" },
        { id: "phi3", label: "phi3" },
        { id: "nomic-embed-text", label: "nomic-embed-text (embedding)" }
      ],
      openrouter: [
        { id: "openai/gpt-4o-mini", label: "openai/gpt-4o-mini" },
        { id: "anthropic/claude-sonnet-4-6", label: "anthropic/claude-sonnet-4-6" },
        { id: "google/gemini-2.5-flash", label: "google/gemini-2.5-flash" },
        { id: "meta-llama/llama-3.3-70b-instruct", label: "meta-llama/llama-3.3-70b-instruct" }
      ],
      huggingface: [
        { id: "moonshotai/Kimi-K2.5", label: "Kimi K2.5 (Moonshot)" },
        { id: "moonshotai/Kimi-K2-Instruct-0905", label: "Kimi K2 Instruct 0905 (Moonshot)" },
        { id: "meta-llama/Llama-3.3-70B-Instruct", label: "Llama 3.3 70B (Meta)" },
        { id: "Qwen/Qwen2.5-72B-Instruct", label: "Qwen 2.5 72B (Alibaba)" }
      ]
    };
    let modelsByProvider = { ...FALLBACK_MODELS };
    let currentProvider = "";
    let currentModel = "";
    let currentApiKey = "";
    const providerSel = { value: "" };
    const modelSel = { value: "" };
    let providerDropdownEl = null;
    const providerSetting = new import_obsidian9.Setting(wrap).setName("Chat provider").setDesc("Which LLM provider runs chat completions. Greyed-out providers need a key configured first.").addDropdown((d) => {
      const s = this.plugin.settings;
      for (const id of ["openai", "anthropic", "gemini", "grok", "moonshot", "huggingface", "ollama", "openrouter"]) {
        const keyField = runtimeProviderKeyField(id);
        const hasKey = keyField === null || !!s.llmKeys[keyField];
        const label = hasKey ? providerLabel(id) : `${providerLabel(id)} \u2014 no key configured`;
        d.addOption(id, label);
      }
      providerDropdownEl = d.selectEl;
      for (const opt of Array.from(providerDropdownEl.options)) {
        const keyField = runtimeProviderKeyField(opt.value);
        const hasKey = keyField === null || !!s.llmKeys[keyField];
        if (!hasKey) opt.disabled = true;
      }
      d.onChange((v) => {
        providerSel.value = v;
        repopulateModels();
      });
    });
    const modelSetting = new import_obsidian9.Setting(wrap).setName("Chat model").setDesc("Specific model from the chosen provider.").addDropdown((d) => {
      d.addOption("", "\u2014 pick a provider first \u2014");
      d.onChange((v) => {
        modelSel.value = v;
      });
    });
    let apiKeyInput = null;
    const keySetting = new import_obsidian9.Setting(wrap).setName("API key").setDesc("Optional. Leave blank to keep the existing key. Required only when switching providers or rotating.").addText((t) => {
      apiKeyInput = t;
      t.inputEl.type = "password";
      t.setPlaceholder("sk-\u2026 / AIza\u2026 / etc.");
    });
    const buttonRow = wrap.createDiv({ cls: "cortex-llm-runtime-actions" });
    const testBtn = buttonRow.createEl("button", { text: "Test", cls: "cortex-llm-runtime-test" });
    const applyBtn = buttonRow.createEl("button", { text: "Apply", cls: "cortex-llm-runtime-apply mod-cta" });
    const setStatus = (text, kind = "info") => {
      status.removeClass("is-ok");
      status.removeClass("is-err");
      status.removeClass("is-info");
      status.addClass(`is-${kind}`);
      status.setText(text);
    };
    const repopulateModels = () => {
      const dropdown = modelSetting.components[0].selectEl;
      while (dropdown.firstChild) dropdown.removeChild(dropdown.firstChild);
      const list = modelsByProvider[providerSel.value] ?? [];
      if (list.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.text = `\u2014 no models registered for ${providerSel.value} \u2014`;
        dropdown.appendChild(opt);
        modelSel.value = "";
        return;
      }
      for (const m of list) {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.text = m.label || m.id;
        dropdown.appendChild(opt);
      }
      const stillValid = list.some((m) => m.id === modelSel.value);
      modelSel.value = stillValid ? modelSel.value : providerSel.value === currentProvider && list.some((m) => m.id === currentModel) ? currentModel : list[0].id;
      dropdown.value = modelSel.value;
    };
    const seedFromConfig = (cfg) => {
      currentProvider = cfg.chatProvider ?? "";
      currentModel = cfg.chatModel ?? "";
      currentApiKey = "";
      providerSel.value = currentProvider || "gemini";
      modelSel.value = currentModel;
      const pDropdown = providerSetting.components[0].selectEl;
      pDropdown.value = providerSel.value;
      repopulateModels();
      const keyHint = cfg.chatApiKeyMasked ? `Current key: ${cfg.chatApiKeyMasked} \xB7 leave blank to keep` : "No key stored \u2014 required for cloud providers";
      keySetting.setDesc(keyHint);
    };
    void this.plugin.client.getLlmModels().then((reg) => {
      const arr = Array.isArray(reg) ? reg : Object.values(reg);
      for (const p of arr) {
        const serverList = (p.models ?? []).map((m) => ({
          id: m.id,
          label: m.label || m.name || m.id
        }));
        const merged = /* @__PURE__ */ new Map();
        for (const m of modelsByProvider[p.id] ?? []) merged.set(m.id, m);
        for (const m of serverList) merged.set(m.id, m);
        if (merged.size > 0) {
          modelsByProvider[p.id] = Array.from(merged.values());
        }
      }
    }).catch((e) => {
      console.warn("[Cortex] Couldn't load model registry, using fallback list:", e);
    }).then(async () => {
      try {
        const cfg = await this.plugin.client.getLlmConfig();
        seedFromConfig(cfg);
        setStatus(`Active: ${cfg.chatProvider ?? "\u2014"} / ${cfg.chatModel ?? "\u2014"}`, "ok");
      } catch (e) {
        seedFromConfig({
          chatProvider: "gemini",
          chatModel: ""
        });
        const msg = e.message;
        if (/→ 500/.test(msg)) {
          setStatus(
            "No runtime override saved yet. Pick a provider + model and click Apply to set one.",
            "info"
          );
        } else {
          setStatus(`Couldn't load runtime config: ${msg}`, "err");
        }
      }
    }).catch((e) => {
      setStatus(`Couldn't load model registry: ${e.message}`, "err");
    });
    testBtn.addEventListener("click", async () => {
      if (!providerSel.value || !modelSel.value) {
        setStatus("Pick a provider and model first.", "err");
        return;
      }
      const apiKey = apiKeyInput?.getValue?.();
      testBtn.setAttr("disabled", "true");
      testBtn.setText("Testing\u2026");
      try {
        const r = await this.plugin.client.testLlmConfig({
          provider: providerSel.value,
          model: modelSel.value,
          apiKey: apiKey || void 0
        });
        if (r.success) {
          setStatus(`\u2713 ${providerSel.value}/${modelSel.value} reachable${r.latencyMs ? ` (${r.latencyMs}ms)` : ""}`, "ok");
        } else {
          setStatus(`\u2717 Test failed: ${r.message ?? "unknown error"}`, "err");
        }
      } catch (e) {
        setStatus(`\u2717 Test threw: ${e.message}`, "err");
      } finally {
        testBtn.removeAttribute("disabled");
        testBtn.setText("Test");
      }
    });
    applyBtn.addEventListener("click", async () => {
      if (!providerSel.value || !modelSel.value) {
        setStatus("Pick a provider and model first.", "err");
        return;
      }
      const apiKey = apiKeyInput?.getValue?.();
      applyBtn.setAttr("disabled", "true");
      applyBtn.setText("Applying\u2026");
      try {
        const cfg = await this.plugin.client.updateLlmConfig({
          chatProvider: providerSel.value,
          chatModel: modelSel.value,
          // Only send the key if the user typed something — otherwise the
          // server keeps whatever's already stored.
          ...apiKey ? { chatApiKey: apiKey, useOwnChatKey: true } : {}
        });
        seedFromConfig(cfg);
        if (apiKeyInput?.setValue) apiKeyInput.setValue("");
        setStatus(`\u2713 Applied: ${cfg.chatProvider}/${cfg.chatModel}`, "ok");
        new import_obsidian9.Notice(`HangarX: switched to ${cfg.chatProvider}/${cfg.chatModel}`);
      } catch (e) {
        setStatus(`\u2717 Apply failed: ${e.message}`, "err");
      } finally {
        applyBtn.removeAttribute("disabled");
        applyBtn.setText("Apply");
      }
    });
  }
  renderAgentsSection(parent) {
    parent.createEl("h3", { text: "Agents" });
    parent.createEl("p", {
      cls: "setting-item-description",
      text: "Make this vault available as a memory + context layer for AI agents on this machine \u2014 Claude Desktop, Claude Code, Cursor, or anything else that speaks MCP. Your notes, decisions, and project history become permanent agent context across sessions."
    });
    parent.createEl("h4", { text: "Local agents", cls: "cortex-agents-subhead" });
    const connectRow = parent.createDiv({ cls: "cortex-agents-connect-row" });
    this.renderAgentConnectCards(connectRow);
    if (this.plugin.settings.connectionMode === "cloud" && this.plugin.settings.apiKey) {
      this.renderCloudAgentsSection(parent);
    }
    new import_obsidian9.Setting(parent).setName("Enable local MCP server").setDesc("Required for the connect buttons above. Binds to 127.0.0.1 only.").addToggle((t) => t.setValue(this.plugin.settings.mcpEnabled).onChange(async (v) => {
      this.plugin.settings.mcpEnabled = v;
      await this.plugin.saveSettings();
      await this.plugin.toggleMcpServer(v);
      this.display();
    }));
    if (!this.plugin.settings.mcpEnabled) {
      parent.createEl("p", {
        cls: "cortex-agents-hint",
        text: "Enable the MCP server to expose memory tools to agents. The server only listens on localhost."
      });
      return;
    }
    const advanced = parent.createEl("details", { cls: "cortex-mcp-advanced" });
    advanced.createEl("summary", { text: "Advanced MCP details (port, token, manual config snippet)" });
    const advBody = advanced.createDiv();
    new import_obsidian9.Setting(advBody).setName("MCP port").setDesc("Port to bind to (default 7474). Change requires server restart.").addText((t) => t.setValue(String(this.plugin.settings.mcpPort)).onChange(async (v) => {
      const n = parseInt(v, 10);
      if (Number.isFinite(n) && n > 0 && n < 65536) {
        this.plugin.settings.mcpPort = n;
        await this.plugin.saveSettings();
      }
    }));
    if (this.plugin.settings.mcpToken) {
      const url = `http://127.0.0.1:${this.plugin.settings.mcpPort}`;
      new import_obsidian9.Setting(advBody).setName("MCP URL").addText((t) => {
        t.inputEl.readOnly = true;
        t.setValue(url);
      });
      new import_obsidian9.Setting(advBody).setName("MCP token").setDesc("Bearer token required by clients. Keep it secret.").addText((t) => {
        t.inputEl.readOnly = true;
        t.inputEl.type = "password";
        t.setValue(this.plugin.settings.mcpToken);
      }).addButton((b) => b.setButtonText("Copy").onClick(async () => {
        await navigator.clipboard.writeText(this.plugin.settings.mcpToken);
      })).addButton((b) => b.setButtonText("Regenerate").onClick(async () => {
        const { generateToken: generateToken2 } = await Promise.resolve().then(() => (init_mcp_server(), mcp_server_exports));
        this.plugin.settings.mcpToken = generateToken2();
        await this.plugin.saveSettings();
        await this.plugin.toggleMcpServer(true);
        this.display();
      }));
      const bridgePath = this.plugin.mcp.bridgePath || `<reload-plugin-to-generate>`;
      const snippet = `"mcpServers": {
  "hangarx-obsidian": {
    "command": "node",
    "args": ["${bridgePath}"],
    "env": {
      "CORTEX_MCP_URL": "${url}",
      "CORTEX_MCP_TOKEN": "${this.plugin.settings.mcpToken}"
    }
  }
}`;
      const example = advBody.createEl("details", { cls: "cortex-mcp-example" });
      example.createEl("summary", { text: "Manual config snippet (for tools without one-click connect)" });
      const codeWrap = example.createEl("div", { cls: "cortex-mcp-code-wrap" });
      const copyBtn = codeWrap.createEl("button", {
        cls: "cortex-mcp-copy",
        text: "Copy"
      });
      copyBtn.addEventListener("click", async () => {
        await navigator.clipboard.writeText(snippet);
        const original = copyBtn.textContent;
        copyBtn.textContent = "Copied";
        copyBtn.addClass("is-copied");
        setTimeout(() => {
          copyBtn.textContent = original;
          copyBtn.removeClass("is-copied");
        }, 1400);
      });
      codeWrap.createEl("pre").createEl("code", { text: snippet });
    }
  }
  renderAgentConnectCards(parent) {
    parent.empty();
    if (!this.plugin.settings.mcpEnabled || !this.plugin.settings.mcpToken) return;
    if (!import_obsidian9.Platform.isDesktopApp) {
      parent.createEl("p", {
        cls: "setting-item-description",
        text: "Agent connectors are desktop-only \u2014 these clients don't run on mobile."
      });
      return;
    }
    const port = this.plugin.settings.mcpPort;
    const token = this.plugin.settings.mcpToken;
    const bridgePath = this.plugin.mcp?.bridgePath;
    if (!bridgePath) {
      parent.createEl("p", {
        cls: "setting-item-description",
        text: "Bridge script not yet generated. Toggle the MCP server off and on to regenerate."
      });
      return;
    }
    const bridge = { bridgePath, url: `http://127.0.0.1:${port}`, token };
    const harnesses = [
      {
        id: "claude-desktop",
        label: "Claude Desktop",
        description: "Anthropic's desktop app.",
        configPath: claudeDesktopConfigPath(),
        connect: () => connectClaudeDesktop(bridge)
      },
      {
        id: "claude-code",
        label: "Claude Code",
        description: "CLI coding agent.",
        configPath: claudeCodeConfigPath(),
        connect: () => connectClaudeCode(bridge)
      },
      {
        id: "cursor",
        label: "Cursor",
        description: "AI-first editor.",
        configPath: cursorConfigPath(),
        connect: () => connectCursor(bridge)
      },
      {
        id: "cline",
        label: "Cline (VS Code)",
        description: "Autonomous coding agent extension.",
        configPath: clineConfigPath(),
        connect: () => connectCline(bridge)
      },
      {
        id: "windsurf",
        label: "Windsurf",
        description: "Codeium's agentic IDE.",
        configPath: windsurfConfigPath(),
        connect: () => connectWindsurf(bridge)
      }
    ];
    const list = parent.createDiv({ cls: "cortex-agents-list" });
    for (const h of harnesses) {
      this.renderAgentRow(list, h, bridge);
    }
    this.renderGenericAgentRow(list, bridge);
  }
  /** One row in the agents list — name, description, status, Connect, kebab. */
  renderAgentRow(parent, h, bridge) {
    const row = parent.createDiv({ cls: "cortex-agent-row" });
    const main = row.createDiv({ cls: "cortex-agent-row-main" });
    const head = main.createDiv({ cls: "cortex-agent-row-head" });
    head.createEl("span", { cls: "cortex-agent-row-label", text: h.label });
    const status = head.createEl("span", { cls: "cortex-agent-row-status", text: "\u2026" });
    main.createEl("span", { cls: "cortex-agent-row-desc", text: h.description });
    const actions = row.createDiv({ cls: "cortex-agent-row-actions" });
    const connectBtn = actions.createEl("button", { text: "Connect" });
    void checkConnection(h.configPath).then((s) => {
      if (s.connected) {
        status.setText("\u2713 Connected");
        status.addClass("is-connected");
        connectBtn.setText("Reconnect");
      } else if (s.exists) {
        status.setText("Not connected");
      } else {
        status.setText("Not installed");
        status.addClass("is-faint");
      }
    });
    connectBtn.addEventListener("click", async () => {
      connectBtn.setText("Connecting\u2026");
      connectBtn.setAttr("disabled", "true");
      try {
        const result = await h.connect();
        if (result.ok) {
          status.setText(result.unchanged ? "\u2713 Already connected" : "\u2713 Connected");
          status.addClass("is-connected");
          status.removeClass("is-faint");
          new import_obsidian9.Notice(`${h.label}: ${result.message} ${restartHint(h.id)}`);
          connectBtn.setText("Reconnect");
        } else {
          status.setText("Failed");
          status.addClass("is-error");
          new import_obsidian9.Notice(`${h.label}: ${result.message}`);
          connectBtn.setText("Retry");
        }
      } finally {
        connectBtn.removeAttribute("disabled");
      }
    });
    if (h.configPath) {
      const menuBtn = actions.createEl("button", {
        text: "\u22EF",
        attr: { "aria-label": "More actions", title: "More actions" }
      });
      menuBtn.addEventListener("click", (evt) => {
        evt.preventDefault();
        this.openAgentRowMenu(evt, h, bridge, status, connectBtn);
      });
    }
  }
  /** Kebab menu for an agent row: copy path / reveal / show snippet / disconnect. */
  openAgentRowMenu(evt, h, bridge, status, connectBtn) {
    const path = h.configPath;
    if (!path) return;
    const menu = new import_obsidian9.Menu();
    menu.addItem((item) => item.setTitle("Copy config path").setIcon("clipboard").onClick(async () => {
      await navigator.clipboard.writeText(path);
      new import_obsidian9.Notice("Config path copied.");
    }));
    menu.addItem((item) => item.setTitle(this.fileManagerLabel()).setIcon("folder-open").onClick(() => {
      if (!revealInFileManager(path)) {
        new import_obsidian9.Notice("Couldn't open the file manager from this build of Obsidian.");
      }
    }));
    menu.addItem((item) => item.setTitle("Copy MCP snippet").setIcon("code").onClick(async () => {
      const snippet = JSON.stringify(
        { mcpServers: { "hangarx-obsidian": buildBridgeEntry(bridge) } },
        null,
        2
      );
      await navigator.clipboard.writeText(snippet);
      new import_obsidian9.Notice("MCP config snippet copied.");
    }));
    menu.addSeparator();
    menu.addItem((item) => item.setTitle("Disconnect").setIcon("unplug").setWarning(true).onClick(async () => {
      const result = await disconnectMcpEntry(path);
      if (result.ok) {
        status.setText(result.unchanged ? "Not connected" : "Disconnected");
        status.removeClass("is-connected");
        connectBtn.setText("Connect");
        new import_obsidian9.Notice(`${h.label}: ${result.message} ${restartHint(h.id)}`);
      } else {
        new import_obsidian9.Notice(`${h.label}: ${result.message}`);
      }
    }));
    menu.showAtMouseEvent(evt);
  }
  /** OS-aware label for the "Reveal in …" menu item. */
  fileManagerLabel() {
    if (import_obsidian9.Platform.isMacOS) return "Reveal in Finder";
    if (import_obsidian9.Platform.isWin) return "Show in Explorer";
    return "Show in file manager";
  }
  /**
   * Generic row for "any other MCP-compatible app". Expands to show the JSON
   * snippet to paste manually. Covers harnesses we haven't packaged a
   * connector for (Zed, Goose, Codex CLI, anything new).
   */
  renderGenericAgentRow(parent, bridge) {
    const row = parent.createEl("details", { cls: "cortex-agent-row cortex-agent-row-generic" });
    const summary = row.createEl("summary");
    const main = summary.createDiv({ cls: "cortex-agent-row-main" });
    main.createEl("span", { cls: "cortex-agent-row-label", text: "Other MCP-compatible app" });
    main.createEl("span", {
      cls: "cortex-agent-row-desc",
      text: "Copy the snippet below into any client that speaks MCP (Zed, Goose, Codex CLI, custom agents)."
    });
    const body = row.createDiv({ cls: "cortex-agent-row-body" });
    const entry = { mcpServers: { "hangarx-obsidian": buildBridgeEntry(bridge) } };
    const snippet = JSON.stringify(entry, null, 2);
    const codeWrap = body.createDiv({ cls: "cortex-mcp-code-wrap" });
    const copyBtn = codeWrap.createEl("button", { cls: "cortex-mcp-copy", text: "Copy" });
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(snippet);
      copyBtn.setText("Copied");
      copyBtn.addClass("is-copied");
      setTimeout(() => {
        copyBtn.setText("Copy");
        copyBtn.removeClass("is-copied");
      }, 1400);
    });
    codeWrap.createEl("pre").createEl("code", { text: snippet });
  }
  /**
   * Cloud agents section. Same vault, accessed remotely from a cloud-side
   * agent (Claude.ai web/mobile, ChatGPT desktop, Cursor on a remote dev
   * box) rather than via the local MCP bridge. The cloud already exposes a
   * public MCP endpoint at cortex.hangarx.ai/mcp; agents authenticate with
   * the same `ctx_…` API key the plugin already has, so we just need to
   * surface the URL + key in copy-pasteable form.
   */
  renderCloudAgentsSection(parent) {
    const apiKey = this.plugin.settings.apiKey;
    const apiUrl = (this.plugin.settings.apiUrl || "https://cortex.hangarx.ai").replace(/\/$/, "");
    const mcpUrl = `${apiUrl}/mcp`;
    const workspaceId = this.plugin.settings.workspaceId;
    parent.createEl("h4", { text: "Cloud agents", cls: "cortex-agents-subhead" });
    parent.createEl("p", {
      cls: "setting-item-description",
      text: "Reach the same workspace from agents that don't run on this machine \u2014 Claude.ai web/mobile, ChatGPT desktop, or any agent on a cloud dev box. They authenticate against cortex.hangarx.ai/mcp using your API key."
    });
    const summary = parent.createDiv({ cls: "cortex-cloud-agent-summary" });
    const summaryLeft = summary.createDiv({ cls: "cortex-cloud-agent-summary-fields" });
    summaryLeft.createEl("div", { cls: "cortex-cloud-agent-row", text: `URL: ${mcpUrl}` });
    summaryLeft.createEl("div", {
      cls: "cortex-cloud-agent-row",
      text: `Auth: x-api-key: ${apiKey ? maskKey(apiKey) : "<not configured>"}`
    });
    if (workspaceId) {
      summaryLeft.createEl("div", {
        cls: "cortex-cloud-agent-row",
        text: `Workspace: x-workspace-id: ${workspaceId}`
      });
    }
    const summaryActions = summary.createDiv({ cls: "cortex-cloud-agent-summary-actions" });
    const copyAllBtn = summaryActions.createEl("button", { text: "Copy URL + key", cls: "mod-cta" });
    copyAllBtn.addEventListener("click", async () => {
      const lines = [`URL: ${mcpUrl}`, `x-api-key: ${apiKey}`];
      if (workspaceId) lines.push(`x-workspace-id: ${workspaceId}`);
      await navigator.clipboard.writeText(lines.join("\n"));
      copyAllBtn.setText("Copied");
      setTimeout(() => copyAllBtn.setText("Copy URL + key"), 1400);
    });
    const clients = [
      {
        id: "claude-ai",
        label: "Claude.ai (web / mobile)",
        description: "Add as a Custom Connector under Settings \u2192 Connectors.",
        openUrl: "https://claude.ai/settings/connectors"
      },
      {
        id: "chatgpt-desktop",
        label: "ChatGPT desktop",
        description: "Add as an MCP server in Settings \u2192 Connections (desktop only)."
      },
      {
        id: "cursor-remote",
        label: "Cursor (cloud dev box)",
        description: "Add to ~/.cursor/mcp.json on the remote machine \u2014 same shape as the local connector."
      },
      {
        id: "cloud-other",
        label: "Other cloud-hosted agent",
        description: "Any client that supports remote MCP via HTTP + API key."
      }
    ];
    const list = parent.createDiv({ cls: "cortex-agents-list" });
    for (const c of clients) {
      const row = list.createDiv({ cls: "cortex-agent-row" });
      const main = row.createDiv({ cls: "cortex-agent-row-main" });
      main.createEl("span", { cls: "cortex-agent-row-label", text: c.label });
      main.createEl("span", { cls: "cortex-agent-row-desc", text: c.description });
      const actions = row.createDiv({ cls: "cortex-agent-row-actions" });
      const setupBtn = actions.createEl("button", { text: c.openUrl ? "Open & copy" : "Copy creds" });
      setupBtn.addEventListener("click", async () => {
        const lines = [`URL: ${mcpUrl}`, `x-api-key: ${apiKey}`];
        if (workspaceId) lines.push(`x-workspace-id: ${workspaceId}`);
        await navigator.clipboard.writeText(lines.join("\n"));
        if (c.openUrl) window.open(c.openUrl, "_blank");
        setupBtn.setText("Copied");
        setTimeout(() => setupBtn.setText(c.openUrl ? "Open & copy" : "Copy creds"), 1400);
      });
      const moreBtn = actions.createEl("button", {
        text: "\u22EF",
        attr: { "aria-label": "More actions", title: "More actions" }
      });
      moreBtn.addEventListener("click", (evt) => {
        evt.preventDefault();
        const menu = new import_obsidian9.Menu();
        menu.addItem((item) => item.setTitle("Copy URL only").setIcon("clipboard").onClick(async () => {
          await navigator.clipboard.writeText(mcpUrl);
          new import_obsidian9.Notice("MCP URL copied.");
        }));
        menu.addItem((item) => item.setTitle("Copy key only").setIcon("clipboard").onClick(async () => {
          await navigator.clipboard.writeText(apiKey);
          new import_obsidian9.Notice("API key copied.");
        }));
        if (workspaceId) {
          menu.addItem((item) => item.setTitle("Copy workspace ID").setIcon("clipboard").onClick(async () => {
            await navigator.clipboard.writeText(workspaceId);
            new import_obsidian9.Notice("Workspace ID copied.");
          }));
        }
        menu.addItem((item) => item.setTitle("Copy curl test").setIcon("terminal").onClick(async () => {
          const curl = `curl -s -X POST -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -H 'x-api-key: ${apiKey}'${workspaceId ? ` -H 'x-workspace-id: ${workspaceId}'` : ""} -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' ${mcpUrl}`;
          await navigator.clipboard.writeText(curl);
          new import_obsidian9.Notice("curl one-liner copied \u2014 paste in any terminal to verify connectivity.");
        }));
        menu.showAtMouseEvent(evt);
      });
    }
  }
  /**
   * BYOK + embedding-provider selection. Local-mode only (cloud users get
   * keys via the HangarX dashboard).
   */
  renderProviderKeysSection(parent, s) {
    const PROVIDERS = [
      { id: "gemini", label: "Gemini (Google AI Studio)", placeholder: "AIza\u2026", href: "https://aistudio.google.com/apikey" },
      { id: "openai", label: "OpenAI", placeholder: "sk-\u2026", href: "https://platform.openai.com/api-keys" },
      { id: "anthropic", label: "Anthropic (Claude)", placeholder: "sk-ant-\u2026", href: "https://console.anthropic.com/settings/keys" },
      { id: "moonshot", label: "Moonshot (Kimi)", placeholder: "sk-\u2026", href: "https://platform.moonshot.ai/console/api-keys" },
      { id: "huggingface", label: "HuggingFace (HF Inference)", placeholder: "hf_\u2026", href: "https://huggingface.co/settings/tokens" },
      { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-\u2026", href: "https://openrouter.ai/keys" },
      { id: "xai", label: "xAI (Grok)", placeholder: "xai-\u2026", href: "https://console.x.ai/" },
      // Reranker providers — neither runs chat completions, but configuring
      // either flips on the learned-reranker step in retrieval, which the
      // Memory Stats "Heads up" panel surfaces as the missing piece for
      // higher-quality answers. Cohere is the higher-quality option, Jina
      // has a generous free tier.
      { id: "cohere", label: "Cohere (reranker)", placeholder: "\u2026", href: "https://dashboard.cohere.com/api-keys" },
      { id: "jina", label: "Jina (reranker)", placeholder: "jina_\u2026", href: "https://jina.ai/?sui=apikey" }
    ];
    const configuredCount = PROVIDERS.filter((p) => !!s.llmKeys[p.id]).length;
    const summaryText = configuredCount === 0 ? "LLM provider keys \u2014 no keys configured yet" : `LLM provider keys \u2014 ${configuredCount} of ${PROVIDERS.length} configured`;
    const wrap = parent.createEl("details", { cls: "cortex-llm-keys" });
    wrap.setAttr("data-cortex-keys-anchor", "");
    if (configuredCount === 0) wrap.setAttr("open", "");
    wrap.createEl("summary", { text: summaryText });
    const body = wrap.createDiv({ cls: "cortex-llm-keys-body" });
    body.createEl("p", {
      cls: "setting-item-description",
      text: "Bring your own API keys. They're baked into the docker-compose YAML on disk and never sent to HangarX. Cohere and Jina aren't chat LLMs \u2014 they enable the learned reranker for higher-quality retrieval. After adding or changing any key, re-save the Compose file in Connection details to apply."
    });
    new import_obsidian9.Setting(body).setName("Embedding provider").setDesc(
      "Where embedding calls run. Gemini is fastest to start (free tier, rate-limited). Switch to Ollama for unlimited local embeddings once your vault grows \u2014 requires installing Ollama and running `ollama pull nomic-embed-text`."
    ).addDropdown((d) => d.addOption("gemini", "Gemini (cloud, free tier \u2014 rate-limited)").addOption("ollama", "Ollama local (recommended for heavy ingests)").setValue(s.embeddingPreset || "gemini").onChange(async (v) => {
      s.embeddingPreset = v;
      await this.plugin.saveSettings();
    }));
    if ((s.embeddingPreset || "gemini") === "ollama") {
      const hint = body.createDiv({ cls: "cortex-local-note" });
      hint.createEl("p", {
        text: "Ollama setup: install Ollama (https://ollama.com), then run: ollama pull nomic-embed-text. The HangarX container reaches Ollama at host.docker.internal:11434."
      });
    }
    const list = body.createDiv({ cls: "cortex-providers-list" });
    for (const p of PROVIDERS) {
      this.renderProviderRow(list, s, p);
    }
    void this.plugin.client.getLlmConfig().then((cfg) => {
      const runtimeProvider = cfg?.chatProvider;
      if (!runtimeProvider) return;
      const targetKeysField = PROVIDERS.find(
        (p) => keysFieldToRuntimeProvider(p.id) === runtimeProvider
      )?.id;
      if (!targetKeysField) return;
      const targetRow = list.querySelector(
        `.cortex-provider-row[data-provider-id="${targetKeysField}"]`
      );
      if (!targetRow) return;
      const summary = targetRow.querySelector(".cortex-provider-row-summary");
      if (!summary) return;
      if (summary.querySelector(".cortex-provider-row-active-chip")) return;
      const chip = createDiv({ cls: "cortex-provider-row-active-chip" });
      chip.setText("active for chat");
      chip.setAttr("title", `${runtimeProvider}/${cfg.chatModel ?? "\u2014"} is the current runtime override.`);
      const label = summary.querySelector(".cortex-provider-row-label");
      if (label) label.insertAdjacentElement("afterend", chip);
      else summary.appendChild(chip);
    }).catch(() => {
    });
  }
  /**
   * One provider row. Collapsed view: name + status pill. Expanded view:
   * password input, "Get a key" external link, and Test button. Keeps the
   * settings page navigable when most providers aren't configured.
   */
  renderProviderRow(parent, s, p) {
    const row = parent.createEl("details", { cls: "cortex-provider-row" });
    row.setAttr("data-provider-id", p.id);
    if (s.llmKeys[p.id]) row.setAttr("open", "");
    const summary = row.createEl("summary", { cls: "cortex-provider-row-summary" });
    summary.createEl("span", { cls: "cortex-provider-row-label", text: p.label });
    const status = summary.createEl("span", { cls: "cortex-provider-row-status" });
    const renderStatus = () => {
      const key = s.llmKeys[p.id];
      status.empty();
      status.removeClass("is-configured", "is-empty");
      if (key) {
        status.addClass("is-configured");
        status.setText(`\u2713 ${maskKey(key)}`);
      } else {
        status.addClass("is-empty");
        status.setText("Not configured");
      }
    };
    renderStatus();
    const body = row.createDiv({ cls: "cortex-provider-row-body" });
    const setting = new import_obsidian9.Setting(body);
    setting.addText((t) => {
      t.inputEl.type = "password";
      t.setPlaceholder(p.placeholder);
      t.setValue(s.llmKeys[p.id] || "");
      t.onChange(async (v) => {
        const trimmed = v.trim();
        if (trimmed) s.llmKeys[p.id] = trimmed;
        else delete s.llmKeys[p.id];
        await this.plugin.saveSettings();
        renderStatus();
        const RUNTIME_PROVIDERS = /* @__PURE__ */ new Set(["gemini", "openai", "anthropic", "moonshot", "openrouter", "xai", "huggingface"]);
        if (RUNTIME_PROVIDERS.has(p.id) && trimmed) {
          this.pushBYOKToRuntime(p.id, trimmed).catch((err) => {
            console.warn("[Cortex] Couldn't push BYOK to runtime config:", err);
          });
        }
      });
    });
    setting.addExtraButton((b) => b.setIcon("external-link").setTooltip("Get a key").onClick(() => window.open(p.href, "_blank")));
    setting.addButton((b) => b.setButtonText("Test").setTooltip("Verify the key by calling the provider through the local cortex-api.").onClick(async () => {
      const key = s.llmKeys[p.id];
      if (!key) {
        new import_obsidian9.Notice(`Enter a ${p.label} key first.`);
        return;
      }
      b.setButtonText("Testing\u2026");
      b.setDisabled(true);
      try {
        const ok = await this.testProviderKey(p.id, key);
        b.setButtonText(ok ? "\u2713 Valid" : "\u2717 Invalid");
        setTimeout(() => b.setButtonText("Test"), 2200);
      } catch (e) {
        b.setButtonText("\u2717 Error");
        new import_obsidian9.Notice(`Test failed: ${e.message}`);
        setTimeout(() => b.setButtonText("Test"), 2800);
      } finally {
        b.setDisabled(false);
      }
    }));
    if (s.llmKeys[p.id]) {
      setting.addButton((b) => b.setButtonText("Remove").setWarning().onClick(async () => {
        delete s.llmKeys[p.id];
        await this.plugin.saveSettings();
        renderStatus();
        this.display();
      }));
    }
  }
  /**
   * Validate the configured cloud API key + workspace by calling whoami.
   * Renders a one-line status badge into the provided element:
   *   ✓ green  — key valid, shows owner email (or key name) + key prefix + last-used hint
   *   ⚠ yellow — key valid but workspace ID is missing/empty
   *   ✗ red    — invalid / network error
   * Empty key short-circuits to a neutral "not yet configured" hint.
   */
  async validateCloudKey(badgeEl) {
    const s = this.plugin.settings;
    badgeEl.empty();
    badgeEl.removeClass("is-valid", "is-invalid", "is-warn");
    if (!s.apiKey) {
      badgeEl.addClass("is-warn");
      badgeEl.createEl("span", { text: "No API key set yet \u2014 paste one above to connect." });
      return;
    }
    badgeEl.createEl("span", { text: "Checking API key\u2026", cls: "cortex-cloud-status-checking" });
    try {
      const info = await this.plugin.client.getWhoami();
      badgeEl.empty();
      this.renderWhoamiSuccess(badgeEl, info, s.workspaceId);
    } catch (e) {
      const msg = e.message || "";
      const status = parseStatusFromErrorMessage(msg);
      if (status === 404) {
        const ok = await this.plugin.client.probeAuth();
        badgeEl.empty();
        if (ok) {
          badgeEl.addClass("is-valid");
          badgeEl.createEl("span", {
            text: "\u2713 API key works (server doesn't expose identity details)",
            cls: "cortex-cloud-status-head"
          });
          if (!s.workspaceId) {
            badgeEl.addClass("is-warn");
            badgeEl.createEl("span", {
              cls: "cortex-cloud-status-sub",
              text: "\u26A0 Workspace ID is empty \u2014 set it below to enable sync and ask."
            });
          }
        } else {
          badgeEl.addClass("is-invalid");
          badgeEl.createEl("span", {
            text: "\u2717 This API key was rejected by the server. Confirm it was copied correctly from the dashboard, or generate a new one.",
            cls: "cortex-cloud-status-head"
          });
        }
        return;
      }
      badgeEl.empty();
      badgeEl.addClass("is-invalid");
      if (status === 401 || status === 403) {
        const detail = parseServerErrorDetail(msg);
        const headlineByCode = {
          INVALID_API_KEY: "This key is invalid or expired \u2014 generate a fresh one in the dashboard.",
          UNAUTHORIZED: "Server didn't recognise the auth header \u2014 make sure you copied the whole key.",
          AUTH_LOCKOUT: "Too many failed attempts from this IP. Wait a few minutes and try again.",
          WORKSPACE_NOT_ALLOWED: `This key isn't authorised for the workspace ID below. Pick a different workspace, or generate a new key without workspace scoping.`,
          FORBIDDEN: detail.message || "Key is missing the required permissions."
        };
        const headline = detail.code && headlineByCode[detail.code] || `Server rejected the key (${status}).`;
        badgeEl.createEl("span", {
          text: `\u2717 ${headline}`,
          cls: "cortex-cloud-status-head"
        });
        if (detail.code || detail.message) {
          badgeEl.createEl("span", {
            text: `${detail.code ? `[${detail.code}] ` : ""}${detail.message ?? ""}`.trim(),
            cls: "cortex-cloud-status-sub"
          });
        }
      } else if (status >= 500) {
        badgeEl.createEl("span", {
          text: `\u2717 Server error (${status}) \u2014 try again in a moment.`,
          cls: "cortex-cloud-status-head"
        });
      } else {
        badgeEl.createEl("span", {
          text: `\u2717 ${msg.slice(0, 240) || "Validation failed"}`,
          cls: "cortex-cloud-status-head"
        });
      }
    }
  }
  /** Render the happy-path identity badge given a successful whoami response. */
  renderWhoamiSuccess(badgeEl, info, workspaceId) {
    badgeEl.addClass("is-valid");
    const headParts = ["\u2713"];
    if (info.email) headParts.push(info.email);
    else if (info.name) headParts.push(info.name);
    else headParts.push("Authenticated");
    if (info.keyPrefix) headParts.push(`(${info.keyPrefix}\u2026)`);
    badgeEl.createEl("span", { text: headParts.join(" "), cls: "cortex-cloud-status-head" });
    const subParts = [];
    if (info.lastUsedAt) {
      const ago = relativeTimestamp(info.lastUsedAt);
      if (ago) subParts.push(`Last used ${ago}`);
    }
    if (typeof info.totalRequests === "number") {
      subParts.push(`${info.totalRequests.toLocaleString()} requests`);
    }
    if (subParts.length > 0) {
      badgeEl.createEl("span", { text: subParts.join(" \xB7 "), cls: "cortex-cloud-status-sub" });
    }
    if (!workspaceId) {
      badgeEl.addClass("is-warn");
      badgeEl.createEl("span", {
        cls: "cortex-cloud-status-sub",
        text: "\u26A0 Workspace ID is empty \u2014 set it below to enable sync and ask."
      });
    } else if (info.allowedWorkspaceIds && !info.allowedWorkspaceIds.includes(workspaceId)) {
      badgeEl.addClass("is-warn");
      badgeEl.createEl("span", {
        cls: "cortex-cloud-status-sub",
        text: `\u26A0 This key isn't authorized for workspace ${workspaceId.slice(0, 16)}\u2026`
      });
    }
  }
  /**
   * Smoke-test a provider key via the local cortex-api's `/v1/system/test-provider`
   * endpoint. Falls back to a direct provider call when the endpoint isn't available.
   */
  /**
   * Push a BYOK chat-provider key into the runtime LLM config so the
   * cortex-api uses it for the next request without requiring a compose
   * YAML re-save + container restart. Picks a sensible default model per
   * provider when the runtime config doesn't already have one set.
   *
   * Why this matters: previously the BYOK section wrote only to the
   * docker-compose env var, which meant updating a key required:
   *   1. Save to vault (regenerate YAML with new key)
   *   2. docker compose up -d --force-recreate
   * Three-step UX for what should be one click. By mirroring BYOK changes
   * into the runtime config (Postgres-backed, encrypted, picked up by
   * the model router on every request), the key takes effect immediately.
   */
  async pushBYOKToRuntime(providerId, apiKey) {
    const providerMap = {
      gemini: "gemini",
      openai: "openai",
      anthropic: "anthropic",
      moonshot: "moonshot",
      openrouter: "openrouter",
      xai: "grok",
      huggingface: "huggingface"
    };
    const runtimeProvider = providerMap[providerId];
    if (!runtimeProvider) return;
    const defaultModelByProvider = {
      gemini: "gemini-2.5-flash",
      openai: "gpt-4o-mini",
      anthropic: "claude-haiku-4-5",
      moonshot: "kimi-k2",
      openrouter: "anthropic/claude-sonnet-4-6",
      grok: "grok-4",
      huggingface: "moonshotai/Kimi-K2.5"
    };
    let chatModel;
    try {
      const current = await this.plugin.client.getLlmConfig();
      if (current?.chatProvider === runtimeProvider && current?.chatModel) {
        chatModel = current.chatModel;
      }
    } catch {
    }
    chatModel = chatModel ?? defaultModelByProvider[runtimeProvider];
    await this.plugin.client.updateLlmConfig({
      chatProvider: runtimeProvider,
      chatModel,
      chatApiKey: apiKey,
      useOwnChatKey: true
    });
  }
  async testProviderKey(provider, apiKey) {
    const apiUrl = this.plugin.settings.apiUrl.replace(/\/$/, "");
    try {
      const res = await (0, import_obsidian9.requestUrl)({
        url: `${apiUrl}/v1/system/test-provider`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.plugin.settings.apiKey}`
        },
        body: JSON.stringify({ provider, apiKey }),
        throw: false
      });
      if (res.status >= 200 && res.status < 300) return true;
      if (res.status !== 404) return false;
    } catch {
    }
    return await directProviderProbe(provider, apiKey);
  }
  /**
   * Probe a Cortex API URL and report reachability. Distinguishes:
   *   ok (200) | degraded (503) | reachable-but-non-/health | unreachable
   */
  async checkLocalHealth(url) {
    const cleanUrl = url.replace(/\/$/, "");
    const healthResult = await this.probeWithBody(`${cleanUrl}/health`);
    if (healthResult.kind === "ok" || healthResult.kind === "http") {
      const subsystems = readSubsystems(healthResult.body);
      this.lastHealthSubsystems = subsystems;
      this.lastHealthVersion = readVersion(healthResult.body);
      if (healthResult.kind === "ok") {
        this.lastHealthDetail = `Connected to ${cleanUrl}`;
        return true;
      }
      if (healthResult.status === 503) {
        const downCount = subsystems ? Object.values(subsystems).filter((v) => v.status === "down").length : 0;
        this.lastHealthDetail = downCount > 0 ? `Container reachable but ${downCount} ${downCount === 1 ? "service" : "services"} degraded \u2014 see Stack health below.` : "Container reachable but degraded (503). Check Docker logs.";
        return true;
      }
      this.lastHealthDetail = `Container reachable (${healthResult.status} from /health).`;
      return true;
    }
    const rootResult = await this.probeWithBody(cleanUrl);
    if (rootResult.kind !== "network") {
      this.lastHealthSubsystems = null;
      this.lastHealthVersion = null;
      this.lastHealthDetail = `Container reachable at ${cleanUrl} (no /health endpoint).`;
      return true;
    }
    this.lastHealthSubsystems = null;
    this.lastHealthVersion = null;
    this.lastHealthDetail = `Cannot reach ${cleanUrl} \u2014 ${healthResult.error}`;
    return false;
  }
  async probeWithBody(url) {
    try {
      const res = await Promise.race([
        (0, import_obsidian9.requestUrl)({ url, method: "GET", throw: false }),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("timeout after 5s")), 5e3)
        )
      ]);
      let body = null;
      try {
        body = res.json;
      } catch {
      }
      if (res.status >= 200 && res.status < 400) return { kind: "ok", status: res.status, body };
      return { kind: "http", status: res.status, body };
    } catch (e) {
      return { kind: "network", error: e.message || "connection refused" };
    }
  }
};
function readSubsystems(body) {
  if (!body || typeof body !== "object") return null;
  const data = body.data;
  if (!data || typeof data !== "object") return null;
  const subs = data.subsystems;
  if (subs && typeof subs === "object") {
    return subs;
  }
  const services = data.services;
  if (services && typeof services === "object") {
    const out = {};
    for (const [k, v] of Object.entries(services)) {
      if (v === "connected") out[k] = { status: "ok" };
      else if (v === "not_configured") out[k] = { status: "not_configured" };
      else out[k] = { status: "down" };
    }
    return out;
  }
  return null;
}
function readVersion(body) {
  if (!body || typeof body !== "object") return null;
  const data = body.data;
  if (!data || typeof data !== "object") return null;
  const v = data.version;
  return typeof v === "string" ? v : null;
}
function providerLabel(id) {
  switch (id) {
    case "openai":
      return "OpenAI";
    case "anthropic":
      return "Anthropic (Claude)";
    case "gemini":
      return "Google Gemini";
    case "grok":
      return "xAI (Grok)";
    case "moonshot":
      return "Moonshot (Kimi)";
    case "huggingface":
      return "HuggingFace (HF Inference)";
    case "ollama":
      return "Ollama (local)";
    case "openrouter":
      return "OpenRouter";
    default:
      return id;
  }
}
function runtimeProviderKeyField(runtimeId) {
  switch (runtimeId) {
    case "openai":
      return "openai";
    case "anthropic":
      return "anthropic";
    case "gemini":
      return "gemini";
    case "grok":
      return "xai";
    case "moonshot":
      return "moonshot";
    case "openrouter":
      return "openrouter";
    case "huggingface":
      return "huggingface";
    case "ollama":
      return null;
    default:
      return null;
  }
}
function keysFieldToRuntimeProvider(keysFieldId) {
  switch (keysFieldId) {
    case "openai":
      return "openai";
    case "anthropic":
      return "anthropic";
    case "gemini":
      return "gemini";
    case "xai":
      return "grok";
    case "moonshot":
      return "moonshot";
    case "openrouter":
      return "openrouter";
    case "huggingface":
      return "huggingface";
    default:
      return null;
  }
}
function buildDockerComposeWithKeys(s) {
  const base = buildDockerCompose(
    s.connectorEncryptionKey,
    s.llmEncryptionKey,
    s.embeddingPreset || "gemini"
  );
  const pairs = [
    ["GEMINI_API_KEY", s.llmKeys.gemini],
    ["OPENAI_API_KEY", s.llmKeys.openai],
    ["ANTHROPIC_API_KEY", s.llmKeys.anthropic],
    ["MOONSHOT_API_KEY", s.llmKeys.moonshot],
    ["HF_TOKEN", s.llmKeys.huggingface],
    ["OPENROUTER_API_KEY", s.llmKeys.openrouter],
    ["XAI_API_KEY", s.llmKeys.xai],
    ["COHERE_API_KEY", s.llmKeys.cohere],
    ["JINA_API_KEY", s.llmKeys.jina]
  ];
  let out = base;
  for (const [envName, value] of pairs) {
    if (!value) continue;
    const escaped = envName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped}: )\\$\\{${escaped}:-\\}`, "g");
    out = out.replace(re, `$1"${value.replace(/"/g, '\\"')}"`);
  }
  return out;
}
function restartHint(agentId) {
  switch (agentId) {
    case "claude-desktop":
      return "Restart Claude Desktop to activate.";
    case "claude-code":
      return "Reload Claude Code (or open a new session) to pick up the change.";
    case "cursor":
      return "Restart Cursor to pick up the new MCP server.";
    case "cline":
      return "Reload the VS Code window to refresh Cline's MCP servers.";
    case "windsurf":
      return "Restart Windsurf to pick up the new MCP server.";
    default:
      return "";
  }
}
function parseStatusFromErrorMessage(msg) {
  const m = msg.match(/→ (\d{3}):/);
  return m ? parseInt(m[1], 10) : 0;
}
function parseServerErrorDetail(msg) {
  const m = msg.match(/→ \d{3}: (.*)$/s);
  if (!m) return {};
  try {
    const body = JSON.parse(m[1]);
    return {
      code: body?.error?.code || body?.code,
      message: body?.error?.message || body?.message
    };
  } catch {
    return { message: m[1].slice(0, 240) };
  }
}
function relativeTimestamp(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const ms = Date.now() - t;
  if (ms < 0) return "just now";
  const sec = Math.floor(ms / 1e3);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  return `${Math.floor(month / 12)}y ago`;
}
function maskKey(k) {
  if (!k) return "";
  if (k.length <= 12) return "\xB7".repeat(k.length);
  return `${k.slice(0, 6)}\xB7\xB7\xB7\xB7${k.slice(-4)}`;
}
async function directProviderProbe(provider, apiKey) {
  const headers = { "Authorization": `Bearer ${apiKey}` };
  let url;
  switch (provider) {
    case "gemini":
      url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      delete headers.Authorization;
      break;
    case "openai":
      url = "https://api.openai.com/v1/models";
      break;
    case "anthropic":
      return await probeAnthropic(apiKey);
    case "moonshot":
      url = "https://api.moonshot.ai/v1/models";
      break;
    case "huggingface":
      url = "https://huggingface.co/api/whoami-v2";
      break;
    case "openrouter":
      url = "https://openrouter.ai/api/v1/models";
      break;
    case "xai":
      url = "https://api.x.ai/v1/models";
      break;
    default:
      return false;
  }
  try {
    const res = await (0, import_obsidian9.requestUrl)({ url, method: "GET", headers, throw: false });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}
async function probeAnthropic(apiKey) {
  try {
    const res = await (0, import_obsidian9.requestUrl)({
      url: "https://api.anthropic.com/v1/messages",
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }]
      }),
      throw: false
    });
    return res.status === 200 || res.status === 400;
  } catch {
    return false;
  }
}

// src/services/vault-sync.ts
var import_obsidian10 = require("obsidian");
var INDEX_PATH = ".cortex/index.json";
var ATTACHMENT_RE = /!\[\[([^\]|#]+\.(?:png|jpe?g|gif|webp|svg|pdf|mp3|wav|m4a|mp4|webm))(?:[|#][^\]]*)?\]\]|!\[[^\]]*\]\(([^)]+\.(?:png|jpe?g|gif|webp|svg|pdf|mp3|wav|m4a|mp4|webm))\)/gi;
var MIME_BY_EXT = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  webm: "video/webm"
};
var VaultSync = class {
  constructor(app, client, settings) {
    this.app = app;
    this.client = client;
    this.settings = settings;
    this.index = emptyIndex();
    this.debounceTimers = /* @__PURE__ */ new Map();
    this.indexLoaded = false;
    this.indexWriteQueue = Promise.resolve();
  }
  // ---------- Index I/O ------------------------------------------------
  async loadIndex() {
    if (this.indexLoaded) return;
    try {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(INDEX_PATH)) {
        const raw = JSON.parse(await adapter.read(INDEX_PATH));
        this.index = mergeIndex(raw, this.settings.vaultId);
      } else {
        this.index = emptyIndex(this.settings.vaultId);
      }
    } catch (e) {
      console.warn("[Cortex] Failed to load sync index, starting fresh:", e);
      this.index = emptyIndex(this.settings.vaultId);
    }
    this.indexLoaded = true;
  }
  /** Serialised so concurrent syncFile calls don't clobber each other. */
  async saveIndex() {
    this.indexWriteQueue = this.indexWriteQueue.then(async () => {
      const adapter = this.app.vault.adapter;
      if (!await adapter.exists(".cortex")) {
        await adapter.mkdir(".cortex");
      }
      await adapter.write(INDEX_PATH, JSON.stringify(this.index, null, 2));
    }).catch((e) => {
      console.warn("[Cortex] saveIndex failed", e);
    });
    return this.indexWriteQueue;
  }
  /**
   * Wipe the per-file hash + state index, forcing the next sync to re-push
   * every file. Used when the server-side graph has been reset (e.g. Postgres
   * volume dropped) — the index would otherwise think files are already synced.
   */
  async clearIndex() {
    await this.loadIndex();
    this.index = emptyIndex(this.settings.vaultId);
    await this.saveIndex();
  }
  /**
   * Cheap (in-memory) walk over the vault + index that returns counts of
   * files changed/added/deleted since the last sync. Drives the SyncModal
   * picker stat row — *no* file content is hashed; we use Obsidian's
   * mtime/size to spot likely changes. Exact result requires a full sync.
   */
  async getChangesSinceLastSync() {
    await this.loadIndex();
    const all = this.app.vault.getMarkdownFiles();
    const eligible = all.filter((f) => !this.isExcluded(f.path));
    const known = this.index.files;
    const seen = /* @__PURE__ */ new Set();
    let changed = 0;
    let added = 0;
    let lastSyncedAt = null;
    for (const f of eligible) {
      seen.add(f.path);
      const state = known[f.path];
      if (!state) {
        added++;
        continue;
      }
      if (f.stat.mtime > state.hashedAt) {
        changed++;
      }
      if (state.hashedAt && (!lastSyncedAt || state.hashedAt > lastSyncedAt)) {
        lastSyncedAt = state.hashedAt;
      }
    }
    let deleted = 0;
    for (const path of Object.keys(known)) {
      if (!seen.has(path)) deleted++;
    }
    return { changed, added, deleted, total: eligible.length, lastSyncedAt };
  }
  // ---------- Path filtering ------------------------------------------
  isExcluded(path) {
    const cortexOutputFolders = [
      this.settings.chatExportFolder,
      this.settings.memoryFolder,
      this.settings.graphPullFolder
    ].filter((f) => !!f && f.length > 0);
    if (cortexOutputFolders.some((f) => path.startsWith(f))) return true;
    if (this.settings.excludePatterns.some((p) => p && path.startsWith(p))) return true;
    const includes = this.settings.includeFolders.filter(Boolean);
    if (includes.length > 0 && !includes.some((p) => path.startsWith(p))) return true;
    return false;
  }
  // ---------- Hashing -------------------------------------------------
  async hashContent(content) {
    const buf = new TextEncoder().encode(content);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async hashBytes(bytes) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // ---------- Full sync -----------------------------------------------
  async fullSync(opts) {
    await this.loadIndex();
    const all = this.app.vault.getMarkdownFiles();
    const files = all.filter((f) => !this.isExcluded(f.path));
    const total = files.length;
    const onProgress = opts?.onProgress;
    const signal = opts?.signal;
    const syncJobId = crypto.randomUUID();
    if (signal && !signal.aborted) {
      const onAbort = () => {
        this.client.cancelSyncJob(syncJobId).catch(
          (e) => console.warn("[Cortex] cancelSyncJob failed (non-fatal):", e)
        );
      };
      signal.addEventListener("abort", onAbort, { once: true });
    }
    let synced = 0, skipped = 0, deleted = 0;
    let failed = 0;
    const failedPaths = [];
    const seenPaths = /* @__PURE__ */ new Set();
    const SYNC_CONCURRENCY = 6;
    onProgress?.({ phase: "sync", done: 0, total });
    let cursor = 0;
    let done = 0;
    const worker = async () => {
      while (true) {
        if (signal?.aborted) return;
        const idx = cursor++;
        if (idx >= files.length) return;
        const file = files[idx];
        seenPaths.add(file.path);
        try {
          const result = await this.syncFile(
            file,
            /* persistImmediately */
            false,
            {
              fastMode: opts?.fastMode === true,
              syncJobId
            }
          );
          if (result === "synced") synced++;
          else if (result === "unchanged") skipped++;
        } catch (e) {
          failed++;
          failedPaths.push(file.path);
          console.warn(`[Cortex] Sync failed for ${file.path}:`, e);
        }
        done++;
        onProgress?.({ phase: "sync", done, total, currentPath: file.path });
      }
    };
    const workerCount = Math.min(SYNC_CONCURRENCY, files.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    if (signal?.aborted) {
      this.index.lastFullSyncAt = Date.now();
      await this.saveIndex();
      return { synced, skipped, deleted: 0, failed, failedPaths, paused: "cancelled", syncJobId };
    }
    const known = /* @__PURE__ */ new Set([
      ...Object.keys(this.index.hashes),
      ...Object.keys(this.index.files)
    ]);
    const deletionCandidates = [...known].filter((p) => !seenPaths.has(p) && !this.isExcluded(p));
    onProgress?.({ phase: "delete", done: 0, total: deletionCandidates.length });
    const DELETE_CONCURRENCY = 6;
    let dCursor = 0;
    let dDone = 0;
    const deleteWorker = async () => {
      while (true) {
        if (signal?.aborted) return;
        const idx = dCursor++;
        if (idx >= deletionCandidates.length) return;
        const knownPath = deletionCandidates[idx];
        try {
          await this.client.deleteNote(knownPath);
          delete this.index.hashes[knownPath];
          delete this.index.files[knownPath];
          delete this.index.attachments[knownPath];
          deleted++;
        } catch (e) {
          console.warn(`[Cortex] Delete failed for ${knownPath}:`, e);
        }
        dDone++;
        onProgress?.({ phase: "delete", done: dDone, total: deletionCandidates.length, currentPath: knownPath });
      }
    };
    if (deletionCandidates.length > 0) {
      await Promise.all(Array.from(
        { length: Math.min(DELETE_CONCURRENCY, deletionCandidates.length) },
        () => deleteWorker()
      ));
    }
    this.index.lastFullSyncAt = Date.now();
    await this.saveIndex();
    return { synced, skipped, deleted, failed, failedPaths, syncJobId };
  }
  // ---------- Single-file sync ----------------------------------------
  /**
   * Per-file event handler with debouncing. Triggered from main.ts.
   */
  scheduleFileSync(file) {
    if (!(file instanceof import_obsidian10.TFile) || file.extension !== "md") return;
    if (this.isExcluded(file.path)) return;
    const existing = this.debounceTimers.get(file.path);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
      this.debounceTimers.delete(file.path);
      try {
        await this.syncFile(file);
      } catch (e) {
        console.warn(`[Cortex] Sync failed for ${file.path}:`, e);
      }
    }, this.settings.autoSyncDebounceMs);
    this.debounceTimers.set(file.path, timer);
  }
  /**
   * Compute a four-bucket diff between this vault and the names of Note
   * entities the cortex graph has materialized. Caller fetches the graph
   * names via the cortex client (paginated `exportGraphPage`); this method
   * does the local walk + set algebra, leaving HTTP and rendering to the
   * caller.
   *
   *   vaultOnly  — markdown files in the vault not represented in the graph
   *   graphOnly  — Note entity names in the graph with no local file
   *   drifted    — present in both, but the local file's mtime is newer
   *                than the last-synced timestamp (likely needs re-sync)
   *   inSync     — present in both, mtime ≤ last hashedAt
   *
   * Match key is the file basename (without `.md`), which is what graph-pull
   * uses for `noteName` on Note entities.
   */
  async computeVaultGraphDiff(graphNoteNames) {
    await this.loadIndex();
    const all = this.app.vault.getMarkdownFiles();
    const eligible = all.filter((f) => !this.isExcluded(f.path));
    const vaultOnly = [];
    const drifted = [];
    const inSync = [];
    const matchedGraphNames = /* @__PURE__ */ new Set();
    for (const f of eligible) {
      if (graphNoteNames.has(f.basename)) {
        matchedGraphNames.add(f.basename);
        const state = this.index.files[f.path];
        if (!state) {
          drifted.push(f);
          continue;
        }
        if (f.stat.mtime > state.hashedAt) drifted.push(f);
        else inSync.push(f);
      } else {
        vaultOnly.push(f);
      }
    }
    const graphOnly = [];
    for (const name of graphNoteNames) {
      if (!matchedGraphNames.has(name)) graphOnly.push(name);
    }
    return { vaultOnly, graphOnly, drifted, inSync };
  }
  /**
   * Public single-file sync — for the "Sync current note" command. Bypasses
   * the auto-sync debouncer so the user gets an immediate push. Returns the
   * usual three-way result so the caller can show a Notice based on outcome.
   */
  async syncOneFile(file, opts = {}) {
    return this.syncFile(file, true, opts);
  }
  /**
   * Returns 'synced' | 'unchanged' | 'skipped'. If `persistImmediately` is
   * false, the caller is responsible for calling saveIndex().
   */
  async syncFile(file, persistImmediately = true, opts = {}) {
    await this.loadIndex();
    const content = await this.app.vault.cachedRead(file);
    const body = stripFrontmatter(content).trim();
    if (body.length === 0) return "skipped";
    const hash = await this.hashContent(content);
    const prior = this.getFileState(file.path);
    if (prior && prior.hash === hash) return "unchanged";
    try {
      await this.client.ingestNote(file.path, content, {
        fastMode: opts.fastMode === true,
        syncJobId: opts.syncJobId
      });
    } catch (e) {
      throw e;
    }
    const now = Date.now();
    const next = {
      hash,
      hashedAt: now,
      ingestCount: (prior?.ingestCount ?? 0) + 1,
      lastIngestAt: now
    };
    this.index.files[file.path] = next;
    this.index.hashes[file.path] = hash;
    if (this.settings.syncAttachments) {
      try {
        await this.syncAttachmentsFor(file, content, opts.syncJobId);
      } catch (e) {
        console.warn("[Cortex] attachment sync failed", e);
      }
    }
    if (persistImmediately) await this.saveIndex();
    return "synced";
  }
  async handleDelete(file) {
    if (!(file instanceof import_obsidian10.TFile) || file.extension !== "md") return;
    await this.loadIndex();
    if (!this.index.files[file.path] && !this.index.hashes[file.path]) return;
    try {
      await this.client.deleteNote(file.path);
    } catch (e) {
      console.warn(`[Cortex] Delete failed for ${file.path}:`, e);
      return;
    }
    delete this.index.files[file.path];
    delete this.index.hashes[file.path];
    delete this.index.attachments[file.path];
    await this.saveIndex();
  }
  async handleRename(file, oldPath) {
    if (!(file instanceof import_obsidian10.TFile) || file.extension !== "md") return;
    await this.loadIndex();
    if (this.index.files[oldPath] || this.index.hashes[oldPath]) {
      try {
        await this.client.deleteNote(oldPath);
      } catch {
      }
      delete this.index.files[oldPath];
      delete this.index.hashes[oldPath];
    }
    this.scheduleFileSync(file);
  }
  // ---------- Attachments ---------------------------------------------
  async syncAttachmentsFor(noteFile, content, syncJobId) {
    const refs = extractAttachmentRefs(content);
    if (refs.length === 0) return;
    for (const ref of refs) {
      const target = this.resolveAttachment(noteFile, ref);
      if (!target) continue;
      if (this.isExcluded(target.path)) continue;
      const stat = await this.app.vault.adapter.stat(target.path);
      if (!stat || stat.size === 0) continue;
      if (stat.size > this.settings.attachmentMaxBytes) {
        console.warn(`[Cortex] skipping ${target.path} \u2014 ${stat.size} > attachmentMaxBytes`);
        continue;
      }
      const bytes = await this.app.vault.readBinary(target);
      const hash = await this.hashBytes(bytes);
      const known = this.index.attachments[target.path];
      const fileState = this.index.files[target.path];
      if (known && fileState?.hash === hash) continue;
      const ext = target.extension.toLowerCase();
      const mime = MIME_BY_EXT[ext];
      if (!mime) continue;
      const base64 = arrayBufferToBase64(bytes);
      if (base64.length === 0) continue;
      try {
        await this.client.ingestBinary(target.path, mime, base64, { syncJobId });
        this.index.attachments[target.path] = Date.now();
        this.index.files[target.path] = {
          hash,
          hashedAt: Date.now(),
          ingestCount: (fileState?.ingestCount ?? 0) + 1,
          lastIngestAt: Date.now()
        };
      } catch (e) {
        console.warn(`[Cortex] attachment ingest failed for ${target.path}`, e);
      }
    }
  }
  resolveAttachment(sourceFile, ref) {
    const meta = this.app.metadataCache.getFirstLinkpathDest(ref, sourceFile.path);
    if (meta instanceof import_obsidian10.TFile) return meta;
    const abs = this.app.vault.getAbstractFileByPath(ref);
    if (abs instanceof import_obsidian10.TFile) return abs;
    const sib = this.app.vault.getAbstractFileByPath(
      (0, import_obsidian10.normalizePath)(`${sourceFile.parent?.path ?? ""}/${ref}`)
    );
    return sib instanceof import_obsidian10.TFile ? sib : null;
  }
  // ---------- Misc ----------------------------------------------------
  getFileState(path) {
    const rich = this.index.files[path];
    if (rich) return rich;
    const legacy = this.index.hashes[path];
    if (legacy) {
      return { hash: legacy, hashedAt: 0, ingestCount: 0 };
    }
    return null;
  }
};
function stripFrontmatter(content) {
  if (!content.startsWith("---")) return content;
  const end = content.indexOf("\n---", 3);
  if (end === -1) return content;
  const after = content.slice(end + 4);
  return after.startsWith("\n") ? after.slice(1) : after;
}
function emptyIndex(vaultId = "") {
  return {
    hashes: {},
    files: {},
    attachments: {},
    vaultId
  };
}
function mergeIndex(raw, vaultId) {
  return {
    hashes: raw?.hashes ?? {},
    files: raw?.files ?? {},
    attachments: raw?.attachments ?? {},
    vaultId: raw?.vaultId ?? vaultId,
    lastFullSyncAt: raw?.lastFullSyncAt
  };
}
function extractAttachmentRefs(markdown) {
  const refs = [];
  let m;
  ATTACHMENT_RE.lastIndex = 0;
  while ((m = ATTACHMENT_RE.exec(markdown)) !== null) {
    const ref = (m[1] ?? m[2] ?? "").trim();
    if (ref) refs.push(ref);
  }
  return Array.from(new Set(refs));
}
function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

// src/services/conversation-store.ts
var FILENAME = "conversations.json";
var MAX_CONVERSATIONS = 50;
var ConversationStore = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.cache = {};
    this.loaded = false;
  }
  get filePath() {
    const dir = this.plugin.manifest.dir ?? `.obsidian/plugins/${this.plugin.manifest.id}`;
    return `${dir}/${FILENAME}`;
  }
  async ensureLoaded() {
    if (this.loaded) return;
    const adapter = this.plugin.app.vault.adapter;
    if (await adapter.exists(this.filePath)) {
      try {
        const raw = await adapter.read(this.filePath);
        this.cache = JSON.parse(raw);
      } catch (e) {
        console.warn("[Cortex] Failed to read conversations:", e);
        this.cache = {};
      }
    }
    this.loaded = true;
  }
  async persist() {
    const adapter = this.plugin.app.vault.adapter;
    await adapter.write(this.filePath, JSON.stringify(this.cache));
  }
  async list() {
    await this.ensureLoaded();
    return Object.values(this.cache).sort((a, b) => b.updatedAt - a.updatedAt);
  }
  async get(id) {
    await this.ensureLoaded();
    return this.cache[id];
  }
  async upsert(conversation) {
    await this.ensureLoaded();
    this.cache[conversation.id] = conversation;
    this.pruneIfNeeded();
    await this.persist();
  }
  async delete(id) {
    await this.ensureLoaded();
    delete this.cache[id];
    await this.persist();
  }
  async clear() {
    await this.ensureLoaded();
    this.cache = {};
    await this.persist();
  }
  pruneIfNeeded() {
    const ids = Object.keys(this.cache);
    if (ids.length <= MAX_CONVERSATIONS) return;
    const sorted = ids.map((id) => ({ id, updatedAt: this.cache[id].updatedAt })).sort((a, b) => a.updatedAt - b.updatedAt);
    const drop = sorted.length - MAX_CONVERSATIONS;
    for (let i = 0; i < drop; i++) delete this.cache[sorted[i].id];
  }
};
function deriveConversationTitle(firstUserMessage) {
  const stripped = firstUserMessage.replace(/\s+/g, " ").trim();
  return stripped.length > 60 ? stripped.slice(0, 57) + "\u2026" : stripped;
}
function relativeTime2(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1e3);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(void 0, { month: "short", day: "numeric" });
}

// src/views/related-view.ts
var import_obsidian11 = require("obsidian");
var RELATED_VIEW_TYPE = "cortex-related-view";
var RelatedView = class extends import_obsidian11.ItemView {
  constructor(leaf, client) {
    super(leaf);
    this.client = client;
    this.currentFile = null;
    this.currentEntityId = null;
    this.listEl = null;
  }
  getViewType() {
    return RELATED_VIEW_TYPE;
  }
  getDisplayText() {
    return "HangarX: Related";
  }
  getIcon() {
    return "network";
  }
  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("cortex-related-container");
    container.createEl("h4", { text: "Related notes" });
    this.listEl = container.createEl("div", { cls: "cortex-related-list" });
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.refresh())
    );
    await this.refresh();
  }
  async refresh() {
    if (!this.listEl) return;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian11.MarkdownView);
    if (!view?.file) {
      this.currentFile = null;
      this.currentEntityId = null;
      this.listEl.empty();
      this.listEl.createEl("p", {
        text: "Open a note to see related results.",
        cls: "cortex-empty-state"
      });
      return;
    }
    if (this.currentFile?.path === view.file.path) return;
    this.currentFile = view.file;
    this.currentEntityId = null;
    this.listEl.empty();
    this.listEl.createEl("p", { text: "Loading\u2026", cls: "cortex-loading" });
    try {
      const results = await this.client.related(view.file.basename, 10);
      this.listEl.empty();
      if (results.length === 0) {
        this.listEl.createEl("p", { text: "No related notes found.", cls: "cortex-empty-state" });
        return;
      }
      for (const r of results) this.renderResult(r);
    } catch (e) {
      this.listEl.empty();
      this.listEl.createEl("p", { text: `Error: ${e.message}`, cls: "cortex-error" });
    }
  }
  renderResult(r) {
    if (!this.listEl) return;
    const row = this.listEl.createEl("div", { cls: "cortex-related-row" });
    const header = row.createEl("div", { cls: "cortex-related-header" });
    const link = header.createEl("a", {
      text: r.noteName,
      cls: `cortex-related-link cortex-source-${r.source}`
    });
    link.addEventListener("click", (evt) => {
      evt.preventDefault();
      const target = this.app.metadataCache.getFirstLinkpathDest(r.noteName, "");
      if (target) this.app.workspace.getLeaf(false).openFile(target);
    });
    const sourceBadge = header.createEl("span", {
      text: r.source,
      cls: `cortex-related-badge cortex-source-${r.source}`
    });
    sourceBadge.setAttr("title", `Match source: ${r.source}`);
    const score = header.createEl("span", { text: r.score.toFixed(2), cls: "cortex-related-score" });
    score.setAttr("title", "Relevance score");
    if (r.snippet) row.createEl("p", { text: r.snippet, cls: "cortex-snippet" });
    if (r.entityId) {
      const whyBtn = row.createEl("button", { cls: "cortex-why-btn" });
      const icon = whyBtn.createEl("span", { cls: "cortex-why-icon" });
      (0, import_obsidian11.setIcon)(icon, "route");
      whyBtn.createEl("span", { text: "Why are these related?" });
      const pathEl = row.createEl("div", { cls: "cortex-paths", attr: { "aria-hidden": "true" } });
      pathEl.style.display = "none";
      whyBtn.addEventListener("click", () => this.togglePath(r, whyBtn, pathEl));
    }
  }
  async togglePath(r, btn, pathEl) {
    const isOpen = pathEl.style.display !== "none";
    if (isOpen) {
      pathEl.style.display = "none";
      pathEl.setAttr("aria-hidden", "true");
      return;
    }
    pathEl.style.display = "";
    pathEl.setAttr("aria-hidden", "false");
    if (pathEl.dataset.loaded === "1") return;
    pathEl.empty();
    pathEl.createEl("span", { text: "Tracing graph paths\u2026", cls: "cortex-loading" });
    try {
      const sourceId = await this.resolveSelfEntityId();
      if (!sourceId || !r.entityId) {
        pathEl.empty();
        pathEl.createEl("span", { text: "Cannot resolve graph anchor for this note.", cls: "cortex-error" });
        return;
      }
      const paths = await this.client.findPaths(sourceId, r.entityId, 4);
      pathEl.empty();
      if (paths.length === 0) {
        pathEl.createEl("span", { text: "No direct path found in the graph.", cls: "cortex-empty-state" });
      } else {
        for (const p of paths.slice(0, 3)) this.renderPath(pathEl, p);
      }
      pathEl.dataset.loaded = "1";
      btn.addClass("is-open");
    } catch (e) {
      pathEl.empty();
      pathEl.createEl("span", { text: `Error: ${e.message}`, cls: "cortex-error" });
    }
  }
  renderPath(parent, path) {
    const wrap = parent.createEl("div", { cls: "cortex-path" });
    if (path.steps.length === 0) {
      wrap.createEl("span", { text: "Direct match.", cls: "cortex-empty-state" });
      return;
    }
    wrap.createEl("span", { text: path.steps[0].fromName, cls: "cortex-path-node" });
    for (const s of path.steps) {
      wrap.createEl("span", { text: ` \u2014${humanRel(s.relType)}\u2192 `, cls: "cortex-path-rel" });
      wrap.createEl("span", { text: s.toName, cls: "cortex-path-node" });
    }
  }
  /** Resolve the entity ID for the currently-open note. Cached per refresh. */
  async resolveSelfEntityId() {
    if (this.currentEntityId) return this.currentEntityId;
    if (!this.currentFile) return "";
    const fmId = this.app.metadataCache.getFileCache(this.currentFile)?.frontmatter?.cortex_id;
    if (typeof fmId === "string" && fmId.length > 0) {
      this.currentEntityId = fmId;
      return fmId;
    }
    const name = this.currentFile.basename;
    const hits = await this.client.searchEntitiesByName(name, 5);
    const exact = hits.find((h) => h.name === name) ?? hits[0];
    this.currentEntityId = exact?.id ?? "";
    return this.currentEntityId;
  }
};
function humanRel(rel) {
  return rel.replace(/_/g, " ").toLowerCase();
}

// src/views/chat-view.ts
var import_obsidian13 = require("obsidian");

// src/views/chat-panel.ts
var import_obsidian12 = require("obsidian");
init_vault_writer();
init_error_format();
init_assets();
var SUGGESTED_PROMPTS = [
  {
    icon: "history",
    label: "Catch me up",
    text: "Summarize what I've been working on this week. Group by project, highlight key decisions, and call out anything still open."
  },
  {
    icon: "route",
    label: "Trace connections",
    text: "Find two ideas in my recent notes that seem unrelated but are actually connected through other concepts. Walk me through the path between them."
  },
  {
    icon: "lightbulb",
    label: "Surface decisions",
    text: "What important decisions have I documented in the last month? For each one, give me the decision, the reasoning behind it, and any open questions left unanswered."
  },
  {
    icon: "search",
    label: "Find blind spots",
    text: "What topics or entities appear frequently across my notes but don't have a dedicated note explaining them? Suggest 3-5 candidates worth writing up as MOC (map-of-content) notes."
  }
];
var MAX_ATTACHMENT_CHARS = 1e5;
var TEXT_EXTENSIONS = /* @__PURE__ */ new Set([
  "md",
  "markdown",
  "txt",
  "text",
  "rst",
  "org",
  "json",
  "yaml",
  "yml",
  "toml",
  "ini",
  "env",
  "csv",
  "tsv",
  "js",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "jsx",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "swift",
  "c",
  "cc",
  "cpp",
  "h",
  "hpp",
  "cs",
  "sh",
  "bash",
  "zsh",
  "fish",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "xml",
  "svg",
  "sql",
  "graphql",
  "gql",
  "log"
]);
var ChatPanel = class {
  constructor(app, client, store, settings, host) {
    this.app = app;
    this.client = client;
    this.store = store;
    this.settings = settings;
    this.renderComponent = new import_obsidian12.Component();
    this.historyPopover = null;
    this.hasMessages = false;
    this.currentTurns = [];
    this.currentTitle = "";
    this.currentCreatedAt = 0;
    this.allEntities = [];
    this.allCitations = [];
    this.pendingAttachments = [];
    this.statusPillEl = null;
    this.statusPollTimer = null;
    this.onOutsideClick = (evt) => {
      if (!this.historyPopover) return;
      const target = evt.target;
      if (this.historyPopover.contains(target) || this.historyBtn.contains(target)) return;
      this.closeHistoryPopover();
    };
    this.host = host;
    this.sessionId = crypto.randomUUID();
  }
  mount() {
    this.renderComponent.load();
    const { titleEl, contentEl } = this.host;
    titleEl.empty();
    const title = titleEl.createEl("div", { cls: "cortex-chat-title" });
    title.createEl("span", { cls: "cortex-chat-title-text", text: "Ask your vault" });
    this.statusPillEl = title.createEl("span", { cls: "cortex-chat-mode-pill" });
    this.renderModePill("checking");
    void this.runModeProbe();
    const actions = title.createEl("div", { cls: "cortex-chat-title-actions" });
    this.historyBtn = actions.createEl("button", { cls: "cortex-chat-iconbtn", attr: { "aria-label": "Conversation history" } });
    (0, import_obsidian12.setIcon)(this.historyBtn, "history");
    this.historyBtn.addEventListener("click", (evt) => {
      evt.stopPropagation();
      this.toggleHistoryPopover();
    });
    this.newChatBtn = actions.createEl("button", { cls: "cortex-chat-iconbtn", attr: { "aria-label": "New chat" } });
    (0, import_obsidian12.setIcon)(this.newChatBtn, "plus");
    this.newChatBtn.addEventListener("click", () => this.resetConversation());
    this.exportBtn = actions.createEl("button", { cls: "cortex-chat-iconbtn", attr: { "aria-label": "Export conversation to note" } });
    (0, import_obsidian12.setIcon)(this.exportBtn, "file-down");
    this.exportBtn.addEventListener("click", () => this.exportConversation());
    this.exportBtn.style.display = "none";
    this.outputEl = contentEl.createEl("div", { cls: "cortex-chat-output" });
    this.renderEmptyState();
    const composerWrap = contentEl.createEl("div", { cls: "cortex-chat-composer-wrap" });
    this.attachmentsEl = composerWrap.createEl("div", { cls: "cortex-chat-attachments is-empty" });
    const composer = composerWrap.createEl("div", { cls: "cortex-chat-composer" });
    this.attachBtn = composer.createEl("button", {
      cls: "cortex-chat-attach",
      attr: { "aria-label": "Attach file (text only, ephemeral)", type: "button" }
    });
    (0, import_obsidian12.setIcon)(this.attachBtn, "paperclip");
    this.fileInputEl = composer.createEl("input", {
      cls: "cortex-chat-file-input",
      attr: { type: "file", multiple: "true", style: "display:none" }
    });
    this.attachBtn.addEventListener("click", () => this.fileInputEl.click());
    this.fileInputEl.addEventListener("change", () => {
      const files = Array.from(this.fileInputEl.files ?? []);
      void this.handleAttachedFiles(files);
      this.fileInputEl.value = "";
    });
    this.inputEl = composer.createEl("textarea", {
      cls: "cortex-chat-input",
      attr: { rows: "1", placeholder: "Ask anything about your vault\u2026" }
    });
    this.askBtn = composer.createEl("button", { cls: "cortex-chat-send", attr: { "aria-label": "Send", disabled: "true" } });
    (0, import_obsidian12.setIcon)(this.askBtn, "arrow-up");
    this.askBtn.addEventListener("click", () => this.submit());
    composerWrap.addEventListener("dragover", (evt) => {
      evt.preventDefault();
      composerWrap.addClass("is-drag-target");
    });
    composerWrap.addEventListener("dragleave", () => composerWrap.removeClass("is-drag-target"));
    composerWrap.addEventListener("drop", (evt) => {
      evt.preventDefault();
      composerWrap.removeClass("is-drag-target");
      const files = Array.from(evt.dataTransfer?.files ?? []);
      if (files.length > 0) void this.handleAttachedFiles(files);
    });
    const hint = composerWrap.createEl("div", { cls: "cortex-chat-hint" });
    hint.createEl("span", { text: "\u21B5 to send \xB7 \u21E7\u21B5 for newline \xB7 Esc (empty input) for new chat" });
    this.inputEl.addEventListener("input", () => {
      this.autoResize();
      this.askBtn.toggleAttribute("disabled", this.inputEl.value.trim().length === 0);
    });
    this.inputEl.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey && !evt.isComposing) {
        evt.preventDefault();
        this.submit();
      } else if (evt.key === "Escape" && this.inputEl.value.length === 0 && this.hasMessages) {
        evt.preventDefault();
        this.resetConversation();
      }
    });
    this.inputEl.focus();
  }
  /** Called when the host (Modal/ItemView) tears down. Persists, unloads, clears DOM. */
  dispose() {
    document.removeEventListener("mousedown", this.onOutsideClick, true);
    if (this.statusPollTimer != null) {
      window.clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
    if (this.settings.autoSaveChatToVault && this.currentTurns.length > 0) {
      writeConversationNote(this.app, this.settings.chatExportFolder, {
        title: this.currentTitle || "Untitled Chat",
        turns: this.currentTurns.map((t) => ({ role: t.role, content: t.content })),
        entities: this.allEntities.map((e) => e.name),
        citations: this.allCitations,
        createdAt: this.currentCreatedAt || Date.now()
      }).catch((e) => console.warn("[Cortex] Auto-save chat note failed:", e));
    }
    this.renderComponent.unload();
    this.host.contentEl.empty();
    this.host.titleEl.empty();
  }
  /** Programmatic prefill — used when activating the panel via a command. */
  prefill(text) {
    if (!this.inputEl) return;
    this.populateInput(text);
  }
  renderEmptyState() {
    const empty = this.outputEl.createEl("div", { cls: "cortex-chat-empty" });
    const logo = empty.createEl("div", { cls: "cortex-chat-empty-logo" });
    appendHangarxLogo(logo);
    empty.createEl("h2", { cls: "cortex-chat-empty-title", text: "Ask your vault anything." });
    empty.createEl("p", {
      cls: "cortex-chat-empty-sub",
      text: "Multi-hop search across your notes \u2014 cited, remembered, and shared with every AI agent on your machine."
    });
    const grid = empty.createEl("div", { cls: "cortex-chat-suggestions" });
    for (const s of SUGGESTED_PROMPTS) {
      const card = grid.createEl("div", {
        cls: "cortex-chat-suggestion",
        attr: { role: "button", tabindex: "0" }
      });
      const ic = card.createEl("span", { cls: "cortex-chat-suggestion-icon" });
      (0, import_obsidian12.setIcon)(ic, s.icon);
      const body = card.createEl("div", { cls: "cortex-chat-suggestion-body" });
      body.createEl("div", { cls: "cortex-chat-suggestion-label", text: s.label });
      body.createEl("div", { cls: "cortex-chat-suggestion-text", text: s.text });
      const fill = () => this.populateInput(s.text);
      card.addEventListener("click", fill);
      card.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          fill();
        }
      });
    }
  }
  autoResize() {
    this.inputEl.style.height = "auto";
    this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 200)}px`;
  }
  resetConversation() {
    this.sessionId = crypto.randomUUID();
    this.hasMessages = false;
    this.currentTurns = [];
    this.currentTitle = "";
    this.currentCreatedAt = 0;
    this.allEntities = [];
    this.allCitations = [];
    this.pendingAttachments = [];
    if (this.attachmentsEl) this.renderAttachmentChips();
    this.outputEl.empty();
    this.renderEmptyState();
    this.inputEl.value = "";
    this.autoResize();
    this.askBtn.setAttr("disabled", "true");
    this.exportBtn.style.display = "none";
    this.closeHistoryPopover();
    this.inputEl.focus();
  }
  toggleHistoryPopover() {
    if (this.historyPopover) {
      this.closeHistoryPopover();
      return;
    }
    void this.openHistoryPopover();
  }
  async openHistoryPopover() {
    const parent = this.host.parentEl ?? this.host.contentEl;
    const popover = parent.createEl("div", { cls: "cortex-chat-history-popover" });
    this.historyPopover = popover;
    popover.createEl("div", { cls: "cortex-chat-history-header", text: "Past conversations" });
    const listEl = popover.createEl("div", { cls: "cortex-chat-history-list" });
    listEl.createEl("div", { cls: "cortex-chat-history-empty", text: "Loading\u2026" });
    setTimeout(() => {
      document.addEventListener("mousedown", this.onOutsideClick, true);
    }, 0);
    try {
      const conversations = await this.store.list();
      listEl.empty();
      if (conversations.length === 0) {
        listEl.createEl("div", { cls: "cortex-chat-history-empty", text: "No past conversations yet." });
        return;
      }
      for (const c of conversations) this.renderHistoryRow(listEl, c);
    } catch (e) {
      listEl.empty();
      listEl.createEl("div", { cls: "cortex-chat-history-empty", text: `Error: ${e.message}` });
    }
  }
  closeHistoryPopover() {
    document.removeEventListener("mousedown", this.onOutsideClick, true);
    this.historyPopover?.remove();
    this.historyPopover = null;
  }
  renderHistoryRow(parent, c) {
    const row = parent.createEl("div", { cls: "cortex-chat-history-row" });
    if (c.id === this.sessionId) row.addClass("is-active");
    const main = row.createEl("div", { cls: "cortex-chat-history-main" });
    main.createEl("div", { cls: "cortex-chat-history-title", text: c.title || "(untitled)" });
    const meta = main.createEl("div", { cls: "cortex-chat-history-meta" });
    meta.createEl("span", { text: relativeTime2(c.updatedAt) });
    meta.createEl("span", { cls: "cortex-chat-history-dot", text: "\xB7" });
    const turnCount = c.turns.filter((t) => t.role === "user").length;
    meta.createEl("span", { text: `${turnCount} message${turnCount === 1 ? "" : "s"}` });
    main.addEventListener("click", () => this.loadConversation(c));
    const del = row.createEl("button", { cls: "cortex-chat-history-del", attr: { "aria-label": "Delete conversation" } });
    (0, import_obsidian12.setIcon)(del, "trash-2");
    del.addEventListener("click", async (evt) => {
      evt.stopPropagation();
      await this.store.delete(c.id);
      row.remove();
      if (c.id === this.sessionId) this.resetConversation();
    });
  }
  async loadConversation(c) {
    this.closeHistoryPopover();
    this.sessionId = c.id;
    this.currentTurns = [...c.turns];
    this.currentTitle = c.title;
    this.currentCreatedAt = c.createdAt;
    this.hasMessages = c.turns.length > 0;
    this.outputEl.empty();
    for (const t of c.turns) {
      if (t.role === "user") this.renderUserTurn(t.content);
      else this.renderAiTurnFromPayload(t.content, t.payload);
    }
    this.scrollToBottom();
    this.inputEl.focus();
  }
  renderUserTurn(text, attachmentSummary) {
    const userTurn = this.outputEl.createEl("div", { cls: "cortex-chat-turn cortex-chat-user" });
    const userBubble = userTurn.createEl("div", { cls: "cortex-chat-bubble" });
    userBubble.createEl("div", { cls: "cortex-chat-role", text: "You" });
    userBubble.createEl("div", { cls: "cortex-chat-content", text });
    if (attachmentSummary) {
      userBubble.createEl("div", {
        cls: "cortex-chat-content-attachment",
        text: attachmentSummary
      });
    }
  }
  renderAiTurnFromPayload(answer, payload) {
    const aiTurn = this.outputEl.createEl("div", { cls: "cortex-chat-turn cortex-chat-ai" });
    const aiBubble = aiTurn.createEl("div", { cls: "cortex-chat-bubble" });
    aiBubble.createEl("div", { cls: "cortex-chat-role", text: "HangarX" });
    const bodyEl = aiBubble.createEl("div", { cls: "cortex-chat-body" });
    if (payload) void this.renderResponse(bodyEl, payload);
    else bodyEl.createEl("div", { cls: "cortex-chat-answer", text: answer });
    this.renderTurnActions(aiBubble, answer, payload);
  }
  async persistConversation() {
    if (this.currentTurns.length === 0) return;
    if (this.currentCreatedAt === 0) this.currentCreatedAt = Date.now();
    if (!this.currentTitle) {
      const firstUser = this.currentTurns.find((t) => t.role === "user");
      this.currentTitle = firstUser ? deriveConversationTitle(firstUser.content) : "(untitled)";
    }
    const conversation = {
      id: this.sessionId,
      title: this.currentTitle,
      createdAt: this.currentCreatedAt,
      updatedAt: Date.now(),
      turns: this.currentTurns
    };
    await this.store.upsert(conversation).catch((e) => console.warn("[Cortex] Save chat failed:", e));
  }
  async submit() {
    const query = this.inputEl.value.trim();
    if (!query) return;
    this.inputEl.value = "";
    this.autoResize();
    this.askBtn.setAttr("disabled", "true");
    this.hasMessages = true;
    const emptyState = this.outputEl.querySelector(".cortex-chat-empty");
    emptyState?.remove();
    const urlRegex = /^https?:\/\/\S+$/i;
    if (urlRegex.test(query)) {
      this.renderUserTurn(query);
      this.currentTurns.push({ role: "user", content: query });
      const aiTurn2 = this.outputEl.createEl("div", { cls: "cortex-chat-turn cortex-chat-ai" });
      const aiBubble2 = aiTurn2.createEl("div", { cls: "cortex-chat-bubble" });
      aiBubble2.createEl("div", { cls: "cortex-chat-role", text: "HangarX" });
      const bodyEl2 = aiBubble2.createEl("div", { cls: "cortex-chat-body" });
      const thinkingEl2 = bodyEl2.createEl("div", { cls: "cortex-chat-thinking", text: "Ingesting URL\u2026" });
      this.scrollToBottom();
      try {
        const result = await this.client.ingestUrl(query);
        thinkingEl2.remove();
        const msg = `\u2705 Ingested **${query}** into your knowledge graph. ${result.entityCount ? `Extracted ${result.entityCount} entities.` : ""}`;
        const answerEl = bodyEl2.createEl("div", { cls: "cortex-chat-answer" });
        await import_obsidian12.MarkdownRenderer.render(this.app, msg, answerEl, "", this.renderComponent);
        this.currentTurns.push({ role: "ai", content: msg });
        this.exportBtn.style.display = "";
        void this.persistConversation();
      } catch (e) {
        thinkingEl2.remove();
        this.renderErrorCard(bodyEl2, e, "Couldn't ingest URL", () => {
          this.inputEl.value = query;
          void this.submit();
        });
      }
      this.scrollToBottom();
      return;
    }
    const { promptText, displayText, attachmentSummary } = this.buildAugmentedQuery(query);
    this.pendingAttachments = [];
    this.renderAttachmentChips();
    this.renderUserTurn(displayText, attachmentSummary || void 0);
    this.currentTurns.push({ role: "user", content: displayText });
    const aiTurn = this.outputEl.createEl("div", { cls: "cortex-chat-turn cortex-chat-ai" });
    const aiBubble = aiTurn.createEl("div", { cls: "cortex-chat-bubble" });
    aiBubble.createEl("div", { cls: "cortex-chat-role", text: "HangarX" });
    const bodyEl = aiBubble.createEl("div", { cls: "cortex-chat-body" });
    const thinkingEl = bodyEl.createEl("div", { cls: "cortex-chat-thinking", text: "Thinking\u2026" });
    this.scrollToBottom();
    try {
      const recalled = await this.client.recall(query, 5).catch(() => []);
      const prefix = recalled.length > 0 ? `Relevant prior context (from past sessions):
${recalled.map((m) => `- ${m.content}`).join("\n")}

Question: ` : "";
      const res = await this.client.ask(prefix + promptText, this.sessionId);
      thinkingEl.remove();
      await this.renderResponse(bodyEl, res);
      if (recalled.length > 0) this.renderRecalledMemories(bodyEl, recalled.length);
      if (res.entities?.length) this.allEntities.push(...res.entities);
      if (res.citations?.length) this.allCitations.push(...res.citations);
      this.renderTurnActions(aiBubble, res.answer, res);
      if (this.settings.autoShowAnswerOnGraph && res.entities?.length) {
        void this.showEntitiesOnGraph(res.entities);
      }
      this.currentTurns.push({ role: "ai", content: res.answer, payload: res });
      this.exportBtn.style.display = "";
      void this.persistConversation();
      if (this.settings.autoSaveChatToVault) {
        void this.client.remember(`Q: ${query}
A: ${res.answer.slice(0, 800)}`, "conversation").catch(() => {
        });
      }
    } catch (e) {
      thinkingEl.remove();
      this.renderErrorCard(bodyEl, e, "Couldn't answer your question", () => {
        aiTurn.remove();
        this.currentTurns.pop();
        this.inputEl.value = query;
        void this.submit();
      });
    } finally {
      if (this.inputEl.value.trim().length > 0) this.askBtn.removeAttribute("disabled");
      this.scrollToBottom();
    }
  }
  async renderResponse(parent, res) {
    if (res.confidence > 0) {
      const meta = parent.createEl("div", { cls: "cortex-chat-meta" });
      const conf = meta.createEl("span", { cls: "cortex-chat-pill cortex-chat-pill-confidence" });
      conf.setText(`${Math.round(res.confidence * 100)}% confidence`);
    }
    const answerEl = parent.createEl("div", { cls: "cortex-chat-answer" });
    const answerText = res.answer?.trim() || "_No answer returned._";
    await import_obsidian12.MarkdownRenderer.render(this.app, answerText, answerEl, "", this.renderComponent);
    if (res.confidence > 0 && res.confidence < 0.4) {
      this.renderRetrievalDiagnostic(parent, res);
    }
    if (res.entities.length > 0) this.renderEntities(parent, res.entities);
    if (res.documents.length > 0) this.renderDocuments(parent, res.documents);
    if (res.citations.length > 0) this.renderCitations(parent, res.citations);
    if (res.followUps.length > 0) this.renderFollowUps(parent, res.followUps);
    this.linkifyEntities(answerEl, res.entities);
  }
  /**
   * Render a one-line retrieval-source breakdown when confidence is low. The
   * server returns `meta.retrieval = { entities, chunks, communities, ... }`.
   * Reads the same field via the AskResponse `metadata` pass-through. If the
   * server didn't return retrieval counts (older build), this is a no-op.
   */
  renderRetrievalDiagnostic(parent, res) {
    const retrieval = res.metadata?.retrieval;
    if (!retrieval) return;
    const wrap = parent.createEl("div", { cls: "cortex-chat-retrieval-diag" });
    wrap.createEl("div", {
      cls: "cortex-chat-retrieval-diag-title",
      text: "Why is confidence low?"
    });
    const counts = wrap.createEl("div", { cls: "cortex-chat-retrieval-diag-counts" });
    const entries = [
      ["entities", retrieval.entities ?? 0],
      ["chunks", retrieval.chunks ?? 0],
      ["communities", retrieval.communities ?? 0],
      ["analytics", retrieval.analytics ?? 0],
      ["memories", retrieval.memories ?? 0]
    ];
    for (const [name, count] of entries) {
      const pill = counts.createEl("span", { cls: "cortex-chat-retrieval-pill" });
      if (count === 0) pill.addClass("is-empty");
      pill.createEl("span", { cls: "cortex-chat-retrieval-pill-name", text: name });
      pill.createEl("span", { cls: "cortex-chat-retrieval-pill-count", text: String(count) });
    }
    const hint = wrap.createEl("div", { cls: "cortex-chat-retrieval-diag-hint" });
    if ((retrieval.communities ?? 0) === 0 && (retrieval.entities ?? 0) > 0) {
      hint.createEl("span", {
        text: 'Community-summary retrieval is empty \u2014 broad questions like "themes" need it. '
      });
      const a = hint.createEl("a", {
        cls: "cortex-chat-retrieval-diag-action",
        text: "Rebuild communities + reindex",
        href: "#"
      });
      a.addEventListener("click", (evt) => {
        evt.preventDefault();
        this.app.commands.executeCommandById("hangarx-obsidian:cortex-1c-rebuild-graph");
      });
    } else if ((retrieval.entities ?? 0) === 0 && (retrieval.chunks ?? 0) === 0) {
      hint.createEl("span", {
        text: "No graph content matched this query. The vault may not be synced \u2014 try "
      });
      const a = hint.createEl("a", {
        cls: "cortex-chat-retrieval-diag-action",
        text: "Force re-ingest entire vault",
        href: "#"
      });
      a.addEventListener("click", (evt) => {
        evt.preventDefault();
        this.app.commands.executeCommandById("hangarx-obsidian:cortex-1b-resync-all");
      });
      hint.appendText(".");
    } else {
      hint.createEl("span", {
        text: "Retrieval found content but the model wasn't confident. Try rephrasing to mention specific entities or note titles."
      });
    }
  }
  renderEntities(parent, entities) {
    const section = this.collapsibleSection(parent, `Entities (${entities.length})`, false);
    const grid = section.createEl("div", { cls: "cortex-chat-entities" });
    const byType = /* @__PURE__ */ new Map();
    for (const e of entities) {
      const arr = byType.get(e.type) ?? [];
      arr.push(e);
      byType.set(e.type, arr);
    }
    for (const [type, list] of byType) {
      const group = grid.createEl("div", { cls: "cortex-chat-entity-group" });
      group.createEl("div", { cls: "cortex-chat-entity-type", text: type });
      const chips = group.createEl("div", { cls: "cortex-chat-chips" });
      for (const e of list) {
        const target = this.resolveEntityToFile(e);
        const chip = chips.createEl("a", {
          cls: target ? "cortex-chat-chip is-linked" : "cortex-chat-chip",
          text: prettifyEntityName(e.name),
          href: "#"
        });
        const titleParts = [];
        if (e.description) titleParts.push(e.description);
        if (e.name !== prettifyEntityName(e.name)) titleParts.push(`id: ${e.name}`);
        if (!target) titleParts.push("Not in vault yet \u2014 run a graph pull to materialize.");
        if (titleParts.length) chip.setAttr("title", titleParts.join("\n"));
        chip.addEventListener("click", (evt) => {
          evt.preventDefault();
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.host.onNavigate();
          } else {
            new import_obsidian12.Notice(`"${prettifyEntityName(e.name)}" isn't a file in this vault yet. Pull the graph from settings to materialize it.`);
          }
        });
      }
    }
  }
  /**
   * Try several name variants to find the entity's vault file. The chat
   * returns names in different forms depending on how the entity was
   * extracted; graph-pull writes them as `<name> (<type>).md`. Try the
   * raw name first, then strip any trailing "(Type)" suffix the chat may
   * have appended, then add one if missing — covers both directions.
   */
  resolveEntityToFile(e) {
    const tries = /* @__PURE__ */ new Set();
    if (e.name) tries.add(e.name);
    const stripped = e.name.replace(/\s*\([^)]+\)\s*$/, "").trim();
    if (stripped) tries.add(stripped);
    if (e.type && stripped) tries.add(`${stripped} (${e.type})`);
    for (const name of tries) {
      const f = this.app.metadataCache.getFirstLinkpathDest(name, "");
      if (f) return f;
    }
    return null;
  }
  renderDocuments(parent, documents) {
    const section = this.collapsibleSection(parent, `Documents (${documents.length})`, false);
    const list = section.createEl("div", { cls: "cortex-chat-docs" });
    for (const d of documents) {
      const row = list.createEl("div", { cls: "cortex-chat-doc" });
      const header = row.createEl("div", { cls: "cortex-chat-doc-header" });
      const titleEl = header.createEl(d.url || d.filePath ? "a" : "span", { cls: "cortex-chat-doc-title", text: d.title });
      if (d.url) {
        titleEl.href = d.url;
        titleEl.target = "_blank";
        titleEl.rel = "noopener";
      } else if (d.filePath) {
        titleEl.href = "#";
        titleEl.addEventListener("click", (evt) => {
          evt.preventDefault();
          const file = this.app.vault.getAbstractFileByPath(d.filePath);
          if (file && "extension" in file) {
            this.app.workspace.getLeaf(false).openFile(file);
            this.host.onNavigate();
          }
        });
      }
      if (typeof d.matchPercent === "number") {
        header.createEl("span", { cls: "cortex-chat-pill cortex-chat-pill-match", text: `${d.matchPercent}%` });
      }
      const subParts = [];
      if (d.source) subParts.push(d.source);
      if (d.publishDate) subParts.push(d.publishDate);
      if (subParts.length > 0) row.createEl("div", { cls: "cortex-chat-doc-sub", text: subParts.join(" \xB7 ") });
      if (d.snippet) row.createEl("div", { cls: "cortex-chat-doc-snippet", text: d.snippet });
    }
  }
  renderCitations(parent, citations) {
    const section = this.collapsibleSection(parent, `Sources (${citations.length})`, false);
    section.addClass("cortex-chat-citations");
    const chips = section.createEl("div", { cls: "cortex-chat-chips" });
    for (const c of citations) {
      const target = c.url ? null : this.resolveCitationToFile(c.source);
      const chip = chips.createEl("a", {
        cls: target || c.url ? "cortex-chat-chip is-linked" : "cortex-chat-chip",
        text: prettifyEntityName(c.source),
        href: c.url ?? "#"
      });
      const tooltipParts = [];
      if (c.text) tooltipParts.push(c.text);
      if (c.source !== prettifyEntityName(c.source)) tooltipParts.push(`id: ${c.source}`);
      if (!c.url && !target) tooltipParts.push("Not in vault yet \u2014 pull the graph to materialize.");
      if (tooltipParts.length) chip.setAttr("title", tooltipParts.join("\n"));
      if (c.url) {
        chip.target = "_blank";
        chip.rel = "noopener";
      } else {
        chip.addEventListener("click", (evt) => {
          evt.preventDefault();
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.host.onNavigate();
          } else {
            new import_obsidian12.Notice(`"${prettifyEntityName(c.source)}" isn't a file in this vault yet. Pull the graph from settings to materialize it.`);
          }
        });
      }
    }
  }
  /** Same fuzzy resolution as resolveEntityToFile, for citations which only have a name string. */
  resolveCitationToFile(source) {
    if (!source) return null;
    const tries = /* @__PURE__ */ new Set([source]);
    const stripped = source.replace(/\s*\([^)]+\)\s*$/, "").trim();
    if (stripped) tries.add(stripped);
    for (const name of tries) {
      const f = this.app.metadataCache.getFirstLinkpathDest(name, "");
      if (f) return f;
    }
    return null;
  }
  renderErrorCard(parent, err, headline, onRetry) {
    const fmt = formatError(err, headline);
    const card = parent.createEl("div", { cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createEl("div", { cls: "cortex-error-head" });
    const ic = head.createEl("span", { cls: "cortex-error-icon" });
    (0, import_obsidian12.setIcon)(ic, errorIcon(fmt.kind));
    head.createEl("span", { cls: "cortex-error-headline", text: fmt.headline });
    if (fmt.hint) {
      card.createEl("div", { cls: "cortex-error-hint", text: fmt.hint });
    }
    const detailWrap = card.createEl("details", { cls: "cortex-error-detail-wrap" });
    detailWrap.createEl("summary", { text: "Error details" });
    detailWrap.createEl("pre", { cls: "cortex-error-detail" }).createEl("code", { text: fmt.detail });
    const actions = card.createEl("div", { cls: "cortex-error-actions" });
    if (onRetry) {
      const retryBtn = actions.createEl("button", { text: "Retry", cls: "mod-cta" });
      retryBtn.addEventListener("click", () => onRetry());
    }
    const copyBtn = actions.createEl("button", { text: "Copy details" });
    copyBtn.addEventListener("click", async () => {
      const payload = `${fmt.headline}

${fmt.detail}${fmt.hint ? `

Hint: ${fmt.hint}` : ""}`;
      await navigator.clipboard.writeText(payload);
      copyBtn.setText("Copied");
      setTimeout(() => copyBtn.setText("Copy details"), 1400);
    });
  }
  renderRecalledMemories(parent, count) {
    const note = parent.createEl("div", { cls: "cortex-chat-recalled" });
    const ic = note.createEl("span", { cls: "cortex-chat-recalled-icon" });
    (0, import_obsidian12.setIcon)(ic, "history");
    note.createEl("span", { text: `Used ${count} memor${count === 1 ? "y" : "ies"} from past sessions.` });
  }
  renderFollowUps(parent, followUps) {
    const section = parent.createEl("div", { cls: "cortex-chat-section cortex-chat-followups" });
    section.createEl("div", { cls: "cortex-chat-section-label", text: "Follow up" });
    const list = section.createEl("div", { cls: "cortex-chat-followup-list" });
    for (const q of followUps) {
      const btn = list.createEl("button", { cls: "cortex-chat-followup", text: q });
      btn.addEventListener("click", () => {
        this.populateInput(q);
      });
    }
  }
  async handleAttachedFiles(files) {
    for (const file of files) {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) {
        new import_obsidian12.Notice(`${file.name}: only text files are supported for inline attachment (yet). Use vault sync for ${ext.toUpperCase()} files.`);
        continue;
      }
      if (this.pendingAttachments.some((a) => a.name === file.name)) {
        new import_obsidian12.Notice(`${file.name} is already attached.`);
        continue;
      }
      try {
        let text = await file.text();
        if (text.length > MAX_ATTACHMENT_CHARS) {
          text = text.slice(0, MAX_ATTACHMENT_CHARS) + `

[... truncated to ${MAX_ATTACHMENT_CHARS.toLocaleString()} chars]`;
          new import_obsidian12.Notice(`${file.name} truncated to ${MAX_ATTACHMENT_CHARS.toLocaleString()} chars`);
        }
        this.pendingAttachments.push({ name: file.name, size: file.size, content: text });
      } catch (e) {
        new import_obsidian12.Notice(`Couldn't read ${file.name}: ${e.message}`);
      }
    }
    this.renderAttachmentChips();
  }
  renderAttachmentChips() {
    this.attachmentsEl.empty();
    if (this.pendingAttachments.length === 0) {
      this.attachmentsEl.addClass("is-empty");
      return;
    }
    this.attachmentsEl.removeClass("is-empty");
    for (const att of this.pendingAttachments) {
      const chip = this.attachmentsEl.createEl("div", { cls: "cortex-chat-attachment-chip" });
      const ic = chip.createEl("span", { cls: "cortex-chat-attachment-icon" });
      (0, import_obsidian12.setIcon)(ic, "file-text");
      chip.createEl("span", { cls: "cortex-chat-attachment-name", text: att.name });
      chip.createEl("span", {
        cls: "cortex-chat-attachment-size",
        text: formatBytes(att.size)
      });
      const rm = chip.createEl("button", {
        cls: "cortex-chat-attachment-remove",
        attr: { "aria-label": `Remove ${att.name}` }
      });
      (0, import_obsidian12.setIcon)(rm, "x");
      rm.addEventListener("click", () => {
        this.pendingAttachments = this.pendingAttachments.filter((a) => a.name !== att.name);
        this.renderAttachmentChips();
      });
    }
  }
  buildAugmentedQuery(query) {
    if (this.pendingAttachments.length === 0) {
      return { promptText: query, displayText: query, attachmentSummary: "" };
    }
    const blocks = ["# Attached files (one-shot context for this question)\n"];
    for (const att of this.pendingAttachments) {
      const ext = (att.name.split(".").pop() || "").toLowerCase();
      blocks.push(`## ${att.name}
\`\`\`${ext}
${att.content}
\`\`\`
`);
    }
    blocks.push(`# User question
${query}`);
    const summary = this.pendingAttachments.length === 1 ? `\u{1F4CE} ${this.pendingAttachments[0].name}` : `\u{1F4CE} ${this.pendingAttachments.length} files attached`;
    return {
      promptText: blocks.join("\n"),
      displayText: query,
      attachmentSummary: summary
    };
  }
  populateInput(text) {
    this.inputEl.value = text;
    this.autoResize();
    if (text.trim().length > 0) this.askBtn.removeAttribute("disabled");
    else this.askBtn.setAttr("disabled", "true");
    this.inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    this.inputEl.focus();
    const len = this.inputEl.value.length;
    this.inputEl.setSelectionRange(len, len);
  }
  collapsibleSection(parent, label, openByDefault) {
    const wrap = parent.createEl("details", { cls: "cortex-chat-section cortex-chat-collapsible" });
    if (openByDefault) wrap.setAttr("open", "");
    const summary = wrap.createEl("summary", { cls: "cortex-chat-section-label" });
    summary.setText(label);
    return wrap;
  }
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    });
  }
  renderTurnActions(bubble, answer, payload) {
    const actions = bubble.createEl("div", { cls: "cortex-chat-turn-actions" });
    if (payload?.entities && payload.entities.length > 0) {
      const graphBtn = actions.createEl("button", { cls: "cortex-chat-action-btn", attr: { "aria-label": "Show on graph" } });
      (0, import_obsidian12.setIcon)(graphBtn, "network");
      graphBtn.createEl("span", { text: "Show on graph" });
      graphBtn.addEventListener("click", (evt) => {
        if (evt.shiftKey) {
          this.settings.autoShowAnswerOnGraph = !this.settings.autoShowAnswerOnGraph;
          void this.host.saveSettings?.();
          new import_obsidian12.Notice(
            `Auto-highlight on graph ${this.settings.autoShowAnswerOnGraph ? "enabled" : "disabled"} for future answers.`,
            3e3
          );
        }
        void this.showEntitiesOnGraph(payload.entities);
      });
      const autoBtn = actions.createEl("button", {
        cls: "cortex-chat-action-btn cortex-chat-action-toggle",
        attr: { "aria-label": "Auto-highlight every answer on the graph" }
      });
      const refreshAutoBtn = () => {
        autoBtn.empty();
        const on = this.settings.autoShowAnswerOnGraph;
        autoBtn.toggleClass("is-on", on);
        (0, import_obsidian12.setIcon)(autoBtn, on ? "pin" : "pin-off");
        autoBtn.createEl("span", { text: on ? "Auto: on" : "Auto: off" });
        autoBtn.title = on ? "Every chat answer auto-highlights cited entities on the graph. Click to turn off." : "Click to auto-highlight cited entities on the graph for every chat answer.";
      };
      refreshAutoBtn();
      autoBtn.addEventListener("click", async () => {
        this.settings.autoShowAnswerOnGraph = !this.settings.autoShowAnswerOnGraph;
        await this.host.saveSettings?.();
        refreshAutoBtn();
        if (this.settings.autoShowAnswerOnGraph && payload.entities.length > 0) {
          void this.showEntitiesOnGraph(payload.entities);
        }
      });
    }
    const copyBtn = actions.createEl("button", { cls: "cortex-chat-action-btn", attr: { "aria-label": "Copy answer" } });
    (0, import_obsidian12.setIcon)(copyBtn, "copy");
    copyBtn.createEl("span", { text: "Copy" });
    copyBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(answer);
      copyBtn.empty();
      (0, import_obsidian12.setIcon)(copyBtn, "check");
      copyBtn.createEl("span", { text: "Copied" });
      setTimeout(() => {
        copyBtn.empty();
        (0, import_obsidian12.setIcon)(copyBtn, "copy");
        copyBtn.createEl("span", { text: "Copy" });
      }, 1500);
    });
    const saveBtn = actions.createEl("button", { cls: "cortex-chat-action-btn", attr: { "aria-label": "Save to note" } });
    (0, import_obsidian12.setIcon)(saveBtn, "file-plus");
    saveBtn.createEl("span", { text: "Save to Note" });
    saveBtn.addEventListener("click", async () => {
      try {
        const userTurns = this.currentTurns.filter((t) => t.role === "user");
        const question = userTurns.length > 0 ? userTurns[userTurns.length - 1].content : "HangarX Answer";
        const entities = payload?.entities?.map((e) => e.name);
        const citations = payload?.citations;
        const path = await writeSingleAnswerNote(
          this.app,
          this.settings.chatExportFolder,
          question,
          answer,
          entities,
          citations
        );
        saveBtn.empty();
        (0, import_obsidian12.setIcon)(saveBtn, "check");
        saveBtn.createEl("span", { text: "Saved" });
        new import_obsidian12.Notice(`Saved to ${path}`);
        setTimeout(() => {
          saveBtn.empty();
          (0, import_obsidian12.setIcon)(saveBtn, "file-plus");
          saveBtn.createEl("span", { text: "Save to Note" });
        }, 2e3);
      } catch (e) {
        new import_obsidian12.Notice(`Save failed: ${e.message}`);
      }
    });
  }
  /**
   * Push an OR-joined search filter into Obsidian's native Graph view that
   * matches the entities the chat just returned, so the user can see them
   * highlighted in their existing graph instead of a separate panel.
   *
   * Strategy (with graceful fallbacks):
   *   1. Activate or open the core Graph leaf in the main pane.
   *   2. Try the documented-internal path: set `view.engine.options.search`
   *      and call `view.engine.render()`.
   *   3. If that throws (Obsidian renamed/refactored the engine — has happened
   *      between minor versions), fall back to scraping the filter <input>
   *      out of the controls panel and dispatching an `input` event so the
   *      official UI runs the query.
   *   4. Add a tiny "Showing N entities from chat · Clear" pill on top of
   *      the graph leaf so the user knows where the filter came from.
   */
  async showEntitiesOnGraph(entities) {
    const names = uniqueNames(entities);
    if (names.length === 0) {
      new import_obsidian12.Notice("No entities returned in this answer.");
      return;
    }
    const resolvedBasenames = [];
    const unresolvedNames = [];
    for (const n of names) {
      const file = this.app.metadataCache.getFirstLinkpathDest(n, "");
      if (file?.basename) resolvedBasenames.push(file.basename);
      else unresolvedNames.push(n);
    }
    const allTerms = [...resolvedBasenames, ...unresolvedNames];
    if (allTerms.length === 0) {
      new import_obsidian12.Notice("Couldn't resolve any of the cited entities. Run a graph pull first?");
      return;
    }
    const query = allTerms.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(" OR ");
    const matchedCount = resolvedBasenames.length;
    let leaf = this.app.workspace.getLeavesOfType("graph")[0];
    if (leaf && isGraphEngineCorrupted(leaf)) {
      leaf.detach();
      leaf = null;
    }
    if (!leaf) {
      const newLeaf = this.app.workspace.getLeaf(false);
      if (!newLeaf) {
        new import_obsidian12.Notice("Couldn't open Obsidian's graph view.");
        return;
      }
      await newLeaf.setViewState({ type: "graph", active: true });
      leaf = newLeaf;
    }
    this.app.workspace.revealLeaf(leaf);
    this.host.onNavigate();
    const applied = await this.applyGraphFilter(leaf, query);
    if (!applied) {
      new import_obsidian12.Notice("Couldn't apply the graph filter \u2014 query copied to clipboard, paste it into the Filters panel.");
      void navigator.clipboard.writeText(query);
      return;
    }
    const preview = allTerms.slice(0, 3).map((t) => `"${t}"`).join(", ");
    const more = allTerms.length > 3 ? ` (+${allTerms.length - 3} more)` : "";
    new import_obsidian12.Notice(`Graph filter set to ${preview}${more}. Non-matching nodes should now be dimmed.`, 4e3);
    this.renderGraphFilterPill(leaf, matchedCount, query, names.length);
  }
  /**
   * Push a search query into Obsidian's graph view. The graph filter dims
   * non-matching nodes when its `engine.options.search` changes AND the
   * engine re-renders. Different Obsidian versions name the engine and the
   * re-render method differently, so we try every known surface and verify
   * by reading the DOM input back.
   *
   * Returns true if at least one path took effect.
   */
  async applyGraphFilter(leaf, query) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitFor = async (fn, ms = 2e3) => {
      const start = Date.now();
      while (Date.now() - start < ms) {
        const v = fn();
        if (v) return v;
        await sleep(50);
      }
      return null;
    };
    const view = leaf.view;
    const root = view?.containerEl;
    if (root) {
      const collapsed = root.querySelector(
        ".graph-control-section.is-collapsed > .tree-item-self, .graph-control-section.is-collapsed > .graph-control-section-header, .tree-item.graph-control-section.is-collapsed > .tree-item-self"
      );
      collapsed?.click();
    }
    let engineApplied = false;
    let inputApplied = false;
    if (root) {
      const input = await waitFor(() => findGraphFilterSearchInput(root));
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set;
        if (nativeSetter) nativeSetter.call(input, query);
        else input.value = query;
        input.dispatchEvent(new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: query
        }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        inputApplied = input.value === query;
      }
    }
    return engineApplied || inputApplied;
  }
  /** Render (or replace) the "Showing N of M entities from chat · Clear" pill on a graph leaf. */
  renderGraphFilterPill(leaf, matched, query, totalCited) {
    const root = leaf.view?.containerEl;
    if (!root) return;
    root.querySelectorAll(".cortex-graph-filter-pill").forEach((el) => el.remove());
    const pill = document.createElement("div");
    pill.className = "cortex-graph-filter-pill";
    const label = document.createElement("span");
    label.textContent = matched === totalCited ? `Showing ${matched} ${matched === 1 ? "entity" : "entities"} from chat` : `Showing ${matched} of ${totalCited} entities from chat`;
    pill.appendChild(label);
    if (matched < totalCited) {
      const hint = document.createElement("span");
      hint.className = "cortex-graph-filter-pill-hint";
      hint.textContent = ` \xB7 ${totalCited - matched} not in vault yet`;
      hint.title = "Run a graph pull from settings to materialize the rest as files.";
      pill.appendChild(hint);
    }
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear";
    clearBtn.className = "cortex-graph-filter-pill-clear";
    clearBtn.addEventListener("click", () => {
      void this.applyGraphFilter(leaf, "");
      pill.remove();
    });
    pill.appendChild(clearBtn);
    pill.title = query;
    root.appendChild(pill);
  }
  async exportConversation() {
    if (this.currentTurns.length === 0) {
      new import_obsidian12.Notice("No messages to export.");
      return;
    }
    try {
      const path = await writeConversationNote(this.app, this.settings.chatExportFolder, {
        title: this.currentTitle || "Untitled Chat",
        turns: this.currentTurns.map((t) => ({ role: t.role, content: t.content })),
        entities: this.allEntities.map((e) => e.name),
        citations: this.allCitations,
        createdAt: this.currentCreatedAt || Date.now()
      });
      new import_obsidian12.Notice(`Conversation exported to ${path}`);
    } catch (e) {
      new import_obsidian12.Notice(`Export failed: ${e.message}`);
    }
  }
  linkifyEntities(container, entities) {
    if (!entities?.length) return;
    const entityMap = /* @__PURE__ */ new Map();
    for (const e of entities) {
      if (e.name.length < 3) continue;
      entityMap.set(e.name.toLowerCase(), e);
    }
    if (entityMap.size === 0) return;
    const sorted = [...entityMap.keys()].sort((a, b) => b.length - a.length);
    const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.parentElement?.closest("a, code, pre, .cortex-chat-chip")) continue;
      if (regex.test(node.textContent || "")) textNodes.push(node);
      regex.lastIndex = 0;
    }
    for (const textNode of textNodes) {
      const text = textNode.textContent || "";
      const parts = [];
      let lastIndex = 0;
      regex.lastIndex = 0;
      let match;
      while (match = regex.exec(text)) {
        const matchedName = match[1];
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
        const entity = entityMap.get(matchedName.toLowerCase());
        const link = document.createElement("a");
        link.className = "cortex-chat-inline-link";
        link.textContent = matchedName;
        link.href = "#";
        if (entity?.description) link.title = entity.description;
        link.addEventListener("click", (evt) => {
          evt.preventDefault();
          const target = this.app.metadataCache.getFirstLinkpathDest(matchedName, "");
          if (target) {
            this.app.workspace.getLeaf(false).openFile(target);
            this.host.onNavigate();
          }
        });
        parts.push(link);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < text.length) parts.push(text.slice(lastIndex));
      if (parts.length > 1) {
        const frag = document.createDocumentFragment();
        for (const p of parts) {
          if (typeof p === "string") frag.appendChild(document.createTextNode(p));
          else frag.appendChild(p);
        }
        textNode.replaceWith(frag);
      }
    }
  }
  /**
   * Render the mode/status pill in the chat title bar. Renders one of three
   * states: checking (gray dot), connected (green dot + mode + host), or
   * unreachable (red dot + mode + "offline"). The pill is also click-to-retry.
   */
  renderModePill(state) {
    if (!this.statusPillEl) return;
    this.statusPillEl.empty();
    this.statusPillEl.removeClass("is-checking", "is-connected", "is-offline");
    this.statusPillEl.addClass(`is-${state}`);
    const mode = this.settings.connectionMode === "local" ? "Local" : "Cloud";
    const host = (() => {
      try {
        return new URL(this.settings.apiUrl).host;
      } catch {
        return this.settings.apiUrl;
      }
    })();
    const dot = this.statusPillEl.createSpan({ cls: "cortex-chat-mode-dot" });
    if (state === "checking") {
      this.statusPillEl.createSpan({ text: `${mode} \xB7 checking\u2026` });
      this.statusPillEl.setAttr("aria-label", `${mode} mode, checking connection`);
      this.statusPillEl.setAttr("title", `${mode} mode (${host}) \u2014 checking\u2026`);
    } else if (state === "connected") {
      this.statusPillEl.createSpan({ text: mode });
      this.statusPillEl.setAttr("aria-label", `${mode} mode, connected to ${host}`);
      this.statusPillEl.setAttr("title", `Connected to ${host}. Click to recheck.`);
    } else {
      this.statusPillEl.createSpan({ text: `${mode} \xB7 offline` });
      this.statusPillEl.setAttr("aria-label", `${mode} mode, cannot reach ${host}`);
      this.statusPillEl.setAttr("title", `Cannot reach ${host}. Click to retry.`);
    }
    this.statusPillEl.onclick = () => {
      void this.runModeProbe();
    };
  }
  /**
   * Probe /health on the configured apiUrl and update the pill. Polls every
   * 30s while the panel is mounted. The poll cadence is intentionally lazy —
   * the goal is "did the stack just go down?" not real-time uptime monitoring.
   */
  async runModeProbe() {
    if (!this.statusPillEl) return;
    this.renderModePill("checking");
    const ok = await this.probeHealth();
    this.renderModePill(ok ? "connected" : "offline");
    if (this.statusPollTimer == null) {
      this.statusPollTimer = window.setInterval(() => {
        void this.runModeProbe();
      }, 3e4);
    }
  }
  async probeHealth() {
    const cleanUrl = (this.settings.apiUrl || "").replace(/\/$/, "");
    if (!cleanUrl) return false;
    try {
      const res = await (0, import_obsidian12.requestUrl)({ url: `${cleanUrl}/health`, method: "GET", throw: false });
      return res.status >= 200 && (res.status < 400 || res.status === 503);
    } catch {
      return false;
    }
  }
};
function isGraphEngineCorrupted(leaf) {
  try {
    const view = leaf.view;
    const engine = view?.dataEngine ?? view?.renderer?.engine ?? view?.engine;
    if (!engine) return false;
    const fo = engine.filterOptions;
    if (!fo || typeof fo !== "object") return false;
    return typeof fo.search === "string";
  } catch {
    return false;
  }
}
function findGraphFilterSearchInput(root) {
  const taggedSection = root.querySelector(
    '.graph-control-section[data-section="filter"], .graph-control-section[data-section-id="filter"], .tree-item.graph-control-section.mod-search'
  );
  if (taggedSection) {
    const input = taggedSection.querySelector('input[type="search"], input[type="text"]');
    if (input) return input;
  }
  const byPlaceholder = root.querySelector(
    '.graph-controls input[placeholder*="earch"]'
  );
  if (byPlaceholder) return byPlaceholder;
  const firstSection = root.querySelector(".graph-control-section, .graph-controls");
  return firstSection?.querySelector('input[type="search"], input[type="text"]') ?? null;
}
function uniqueNames(entities) {
  const set = /* @__PURE__ */ new Set();
  for (const e of entities) {
    if (e.name && e.name.length >= 2) set.add(e.name);
  }
  return Array.from(set).sort();
}
function prettifyEntityName(name) {
  if (!name) return "";
  let s = String(name);
  s = s.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/, "");
  if (s.includes("/")) s = s.split("/").filter(Boolean).pop() ?? s;
  s = s.replace(/\.(md|markdown|txt)$/i, "");
  const chatMatch = s.match(/^Cortex_(Chats|Briefs)_(\d{4}-\d{2}-\d{2})(?:_-_(.+))?$/);
  if (chatMatch) {
    const kind = chatMatch[1] === "Chats" ? "Chat" : "Brief";
    const date = chatMatch[2];
    const title = (chatMatch[3] || "").replace(/_/g, " ").trim();
    return title ? `${kind}: ${title} (${date})` : `${kind} ${date}`;
  }
  s = s.replace(/_/g, " ").trim();
  return s || name;
}
function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// src/views/chat-view.ts
var CHAT_VIEW_TYPE = "cortex-chat-view";
var ChatView = class extends import_obsidian13.ItemView {
  constructor(leaf, client, store, settings, plugin) {
    super(leaf);
    this.client = client;
    this.store = store;
    this.settings = settings;
    this.plugin = plugin;
    this.panel = null;
  }
  getViewType() {
    return CHAT_VIEW_TYPE;
  }
  getDisplayText() {
    return "HangarX: Ask your vault";
  }
  getIcon() {
    return "message-circle";
  }
  async onOpen() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("cortex-chat-view");
    this.titleHostEl = root.createDiv({ cls: "cortex-chat-view-title" });
    const body = root.createDiv({ cls: "cortex-chat-view-body" });
    this.panel = new ChatPanel(this.app, this.client, this.store, this.settings, {
      titleEl: this.titleHostEl,
      contentEl: body,
      parentEl: root,
      onNavigate: () => {
      },
      saveSettings: () => this.plugin.saveSettings()
    });
    this.panel.mount();
  }
  async onClose() {
    this.panel?.dispose();
    this.panel = null;
  }
  /** Programmatic prefill — used by Memory Stats drill-in actions. */
  prefill(text) {
    this.panel?.prefill(text);
  }
};

// src/views/chat-modal.ts
var import_obsidian14 = require("obsidian");
var ChatModal = class extends import_obsidian14.Modal {
  constructor(app, client, store, settings, plugin) {
    super(app);
    this.client = client;
    this.store = store;
    this.settings = settings;
    this.plugin = plugin;
    this.panel = null;
  }
  onOpen() {
    this.modalEl.addClass("cortex-chat-modal");
    this.panel = new ChatPanel(this.app, this.client, this.store, this.settings, {
      titleEl: this.titleEl,
      contentEl: this.contentEl,
      parentEl: this.contentEl,
      onNavigate: () => this.close(),
      saveSettings: () => this.plugin.saveSettings()
    });
    this.panel.mount();
  }
  onClose() {
    this.panel?.dispose();
    this.panel = null;
  }
};

// src/views/graph-stats-modal.ts
var import_obsidian15 = require("obsidian");
init_error_format();
var FILE_STRUCTURE_TYPES = /* @__PURE__ */ new Set(["Note", "NoteSection", "Document", "Chunk", "File"]);
var TOP_N_VISIBLE = 5;
var GraphStatsModal = class extends import_obsidian15.Modal {
  constructor(app, client, plugin) {
    super(app);
    this.client = client;
    this.plugin = plugin;
    this.statusPillEl = null;
    this.statusPollTimer = null;
  }
  async onOpen() {
    this.titleEl.setText("HangarX: Knowledge graph stats");
    this.contentEl.empty();
    this.contentEl.addClass("cortex-graph-stats");
    this.renderModePillBar(this.contentEl);
    const status = this.contentEl.createEl("p", {
      cls: "cortex-graph-stats-status",
      text: "Loading\u2026"
    });
    try {
      const startedAt = Date.now();
      const [stats, ragStats] = await Promise.all([
        this.client.getGraphStats(),
        this.client.getGraphRAGStats().catch(() => null)
      ]);
      const elapsedMs = Date.now() - startedAt;
      status.remove();
      this.render(stats, ragStats, elapsedMs);
    } catch (e) {
      status.remove();
      this.renderError(e);
    }
  }
  onClose() {
    if (this.statusPollTimer != null) {
      window.clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
  }
  render(stats, ragStats, elapsedMs) {
    const c = this.contentEl;
    const summary = c.createDiv({ cls: "cortex-graph-stats-summary" });
    this.renderHeroCard(summary, "Entities", formatNumber(stats.totalEntities));
    this.renderHeroCard(summary, "Relationships", formatNumber(stats.totalRelationships));
    const ratio = stats.totalEntities > 0 ? stats.totalRelationships / stats.totalEntities : 0;
    const ratioCard = summary.createDiv({ cls: "cortex-graph-stats-card cortex-graph-stats-card-ratio" });
    ratioCard.createEl("div", { cls: "cortex-graph-stats-card-value", text: ratio.toFixed(2) });
    ratioCard.createEl("div", { cls: "cortex-graph-stats-card-label", text: "Relationships per entity" });
    const ratioHint = ratioCard.createEl("div", { cls: "cortex-graph-stats-card-hint" });
    if (ratio < 1.2) {
      ratioCard.addClass("is-warn");
      ratioHint.textContent = "sparse \u2014 graph is mostly file structure";
    } else if (ratio < 2.5) {
      ratioHint.textContent = "moderate connectivity";
    } else {
      ratioCard.addClass("is-good");
      ratioHint.textContent = "richly connected";
    }
    if (stats.totalEntities === 0) {
      const hint = c.createDiv({ cls: "cortex-graph-stats-hint" });
      hint.createEl("p", {
        text: 'The graph is empty. Run "HangarX: Sync vault to knowledge graph" from the command palette and check the DevTools console for any ingest errors.'
      });
      this.renderFooter(c, stats, ragStats, elapsedMs);
      return;
    }
    const insights = computeInsights(stats, ragStats);
    if (insights.length > 0) {
      const wrap = c.createDiv({ cls: "cortex-graph-stats-insights" });
      wrap.createEl("h4", { text: "Heads up" });
      const list = wrap.createEl("ul");
      for (const i of insights) {
        const li = list.createEl("li");
        li.addClass(`is-${i.severity}`);
        li.createEl("span", { cls: "cortex-graph-stats-insight-icon", text: i.severity === "warn" ? "\u26A0" : "\u24D8" });
        const body = li.createDiv({ cls: "cortex-graph-stats-insight-body" });
        body.createEl("div", { cls: "cortex-graph-stats-insight-headline", text: i.headline });
        body.createEl("div", { cls: "cortex-graph-stats-insight-detail", text: i.detail });
      }
    }
    if (stats.entityTypes.length > 0) {
      const sorted = stats.entityTypes.slice().sort((a, b) => b.count - a.count);
      const max = sorted[0].count || 1;
      const total = stats.totalEntities || 1;
      const section = c.createDiv({ cls: "cortex-graph-stats-section" });
      const headerRow = section.createDiv({ cls: "cortex-graph-stats-section-header" });
      headerRow.createEl("h4", { text: "What's in your graph" });
      headerRow.createEl("span", {
        cls: "cortex-graph-stats-section-caption",
        text: `${sorted.length} ${sorted.length === 1 ? "type" : "types"}`
      });
      const bars = section.createDiv({ cls: "cortex-graph-stats-bars" });
      const visible = sorted.slice(0, TOP_N_VISIBLE);
      const hidden = sorted.slice(TOP_N_VISIBLE);
      for (const et of visible) {
        this.renderBarRow(bars, et.type, et.count, max, total, () => {
          void this.plugin?.askInChat(
            `Show me a few example ${et.type} entities from my notes and what they're connected to.`
          );
          this.close();
        });
      }
      if (hidden.length > 0) {
        const more = section.createEl("details", { cls: "cortex-graph-stats-more" });
        more.createEl("summary", { text: `Show ${hidden.length} more` });
        const moreBars = more.createDiv({ cls: "cortex-graph-stats-bars" });
        for (const et of hidden) {
          this.renderBarRow(moreBars, et.type, et.count, max, total, () => {
            void this.plugin?.askInChat(
              `Show me a few example ${et.type} entities from my notes and what they're connected to.`
            );
            this.close();
          });
        }
      }
    }
    if (stats.relationshipTypes.length > 0) {
      const sorted = stats.relationshipTypes.slice().sort((a, b) => b.count - a.count);
      const max = sorted[0].count || 1;
      const total = stats.totalRelationships || 1;
      const section = c.createDiv({ cls: "cortex-graph-stats-section" });
      const headerRow = section.createDiv({ cls: "cortex-graph-stats-section-header" });
      headerRow.createEl("h4", { text: "How things connect" });
      headerRow.createEl("span", {
        cls: "cortex-graph-stats-section-caption",
        text: `${sorted.length} ${sorted.length === 1 ? "type" : "types"}`
      });
      const bars = section.createDiv({ cls: "cortex-graph-stats-bars" });
      const visible = sorted.slice(0, TOP_N_VISIBLE);
      const hidden = sorted.slice(TOP_N_VISIBLE);
      for (const rt of visible) {
        this.renderBarRow(bars, rt.type, rt.count, max, total, () => {
          void this.plugin?.askInChat(
            `Show me a few examples of ${rt.type} relationships in my notes \u2014 what's connected to what?`
          );
          this.close();
        });
      }
      if (hidden.length > 0) {
        const more = section.createEl("details", { cls: "cortex-graph-stats-more" });
        more.createEl("summary", { text: `Show ${hidden.length} more` });
        const moreBars = more.createDiv({ cls: "cortex-graph-stats-bars" });
        for (const rt of hidden) {
          this.renderBarRow(moreBars, rt.type, rt.count, max, total, () => {
            void this.plugin?.askInChat(
              `Show me a few examples of ${rt.type} relationships in my notes \u2014 what's connected to what?`
            );
            this.close();
          });
        }
      }
    }
    this.renderCommunities(c);
    this.renderTechnicalDetails(c, stats, ragStats);
    this.renderFooter(c, stats, ragStats, elapsedMs);
  }
  /**
   * Communities panel. Local single-user stacks ship with auto-detection
   * disabled because Louvain on every ingest is expensive — instead, this
   * is the on-demand surface: click "Detect now", server runs Louvain +
   * LLM summaries, list refreshes with hierarchy + member counts.
   *
   * Cloud installs that already auto-detect see the same list with no
   * extra clicks needed. Either way, "Detect now" is idempotent — re-run
   * any time the graph has shifted enough to warrant new clustering.
   */
  renderCommunities(parent) {
    const wrap = parent.createDiv({ cls: "cortex-graph-stats-communities" });
    const header = wrap.createDiv({ cls: "cortex-graph-stats-communities-header" });
    header.createEl("h4", { text: "Communities" });
    const detectBtn = header.createEl("button", {
      cls: "cortex-graph-stats-detect-btn",
      text: "Detect now"
    });
    const desc = wrap.createEl("p", { cls: "setting-item-description" });
    desc.setText(
      'Communities cluster densely-connected entities, with an LLM-generated summary per group. Useful for "what topics dominate my vault?" and as retrieval seeds during chat.'
    );
    const listEl = wrap.createDiv({ cls: "cortex-graph-stats-communities-list" });
    listEl.createEl("p", { cls: "cortex-graph-stats-loading", text: "Loading\u2026" });
    const renderList = (communities) => {
      listEl.empty();
      if (communities.length === 0) {
        const empty = listEl.createEl("p", { cls: "cortex-graph-stats-empty" });
        empty.setText('No communities detected yet. Click "Detect now" to run Louvain on the current graph.');
        return;
      }
      const sorted = [...communities].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0));
      for (const c of sorted.slice(0, 20)) {
        const row = listEl.createDiv({ cls: "cortex-graph-stats-community-row" });
        const head = row.createDiv({ cls: "cortex-graph-stats-community-head" });
        head.createEl("strong", { text: c.name || "Unnamed community" });
        const meta = head.createSpan({ cls: "cortex-graph-stats-community-meta" });
        const parts = [];
        if (typeof c.memberCount === "number") parts.push(`${c.memberCount} members`);
        if (typeof c.level === "number") parts.push(`L${c.level}`);
        if (typeof c.density === "number" && c.density > 0) parts.push(`density ${c.density.toFixed(2)}`);
        meta.setText(parts.join(" \xB7 "));
        if (c.summary && c.summary.trim().length > 0) {
          row.createEl("p", { cls: "cortex-graph-stats-community-summary", text: c.summary });
        }
        const keywords = parseStringList(c.keywords);
        if (keywords.length > 0) {
          const kwRow = row.createDiv({ cls: "cortex-graph-stats-community-keywords" });
          for (const kw of keywords.slice(0, 8)) {
            kwRow.createEl("span", { cls: "cortex-graph-stats-community-chip", text: kw });
          }
        }
      }
      if (sorted.length > 20) {
        listEl.createEl("p", {
          cls: "cortex-graph-stats-empty",
          text: `+${sorted.length - 20} more not shown.`
        });
      }
    };
    const loadList = async () => {
      try {
        const communities = await this.client.listCommunities({ limit: 100 });
        renderList(communities);
      } catch (e) {
        listEl.empty();
        const err = listEl.createEl("p", { cls: "cortex-graph-stats-error" });
        err.setText(`Couldn't load communities: ${e.message.slice(0, 200)}`);
      }
    };
    detectBtn.addEventListener("click", async () => {
      detectBtn.setAttr("disabled", "true");
      detectBtn.setText("Detecting\u2026");
      listEl.empty();
      listEl.createEl("p", {
        cls: "cortex-graph-stats-loading",
        text: "Running Louvain + writing LLM summaries \u2014 can take 30\u201390s on large graphs\u2026"
      });
      try {
        const res = await this.client.detectCommunities({ algorithm: "louvain" });
        new import_obsidian15.Notice(
          `Detected ${res.communitiesCreated} communities (${res.levels} levels, modularity ${res.modularity.toFixed(2)})`,
          5e3
        );
        await loadList();
      } catch (e) {
        listEl.empty();
        const err = listEl.createEl("p", { cls: "cortex-graph-stats-error" });
        err.setText(`Detection failed: ${e.message.slice(0, 200)}`);
      } finally {
        detectBtn.removeAttribute("disabled");
        detectBtn.setText("Detect now");
      }
    });
    void loadList();
  }
  /** One horizontal bar row: name on the left, bar in the middle (sized by
   *  count/max), count + percent on the right. The whole row is clickable. */
  renderBarRow(parent, label, count, max, total, onClick) {
    const row = parent.createDiv({ cls: "cortex-graph-stats-bar-row" });
    if (onClick) {
      row.addClass("is-clickable");
      row.setAttr("tabindex", "0");
      row.setAttr("role", "button");
      row.setAttr("aria-label", `${label} \u2014 ${count.toLocaleString()} (click to ask the chat about it)`);
      row.addEventListener("click", onClick);
      row.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter" || evt.key === " ") {
          evt.preventDefault();
          onClick();
        }
      });
    }
    row.createEl("span", { cls: "cortex-graph-stats-bar-label", text: label });
    const track = row.createDiv({ cls: "cortex-graph-stats-bar-track" });
    const fill = track.createDiv({ cls: "cortex-graph-stats-bar-fill" });
    const widthPct = max > 0 ? Math.max(2, Math.round(count / max * 100)) : 0;
    fill.style.width = `${widthPct}%`;
    const right = row.createDiv({ cls: "cortex-graph-stats-bar-meta" });
    right.createEl("span", { cls: "cortex-graph-stats-bar-count", text: formatNumber(count) });
    const percent = total > 0 ? count / total * 100 : 0;
    right.createEl("span", {
      cls: "cortex-graph-stats-bar-percent",
      text: percent < 0.5 ? "<1%" : `${percent.toFixed(0)}%`
    });
  }
  /** Collapsed `<details>` block — sample properties, GraphRAG config (as
   *  toggle chips, not raw JSON), search provider availability. The Save-as-
   *  note flow still includes everything in the markdown report. */
  renderTechnicalDetails(parent, stats, ragStats) {
    const wrap = parent.createEl("details", { cls: "cortex-graph-stats-tech" });
    wrap.createEl("summary", { text: "Show technical details" });
    const body = wrap.createDiv();
    if (stats.entityTypes.length > 0) {
      body.createEl("h5", { text: "Type-specific properties" });
      const table = body.createEl("table", { cls: "cortex-graph-stats-table" });
      const head = table.createEl("thead").createEl("tr");
      head.createEl("th", { text: "Type" });
      head.createEl("th", { text: "Distinguishing properties" });
      const tb = table.createEl("tbody");
      for (const et of stats.entityTypes.slice().sort((a, b) => b.count - a.count)) {
        const distinguishing = (et.sampleProperties ?? []).filter((p) => !isSystemProperty(p));
        const tr = tb.createEl("tr");
        tr.createEl("td", { text: et.type });
        tr.createEl("td", {
          cls: "cortex-graph-stats-props",
          text: distinguishing.length > 0 ? distinguishing.slice(0, 8).join(", ") : "\u2014 (only pipeline metadata)"
        });
      }
    }
    if (ragStats) {
      body.createEl("h5", { text: "GraphRAG orchestrator" });
      const flat = flattenRagStats(ragStats);
      const flags = [];
      const numbers = [];
      const strings = [];
      for (const [k, v] of Object.entries(flat)) {
        if (typeof v === "boolean") flags.push([k, v]);
        else if (typeof v === "number") numbers.push([k, v]);
        else if (typeof v === "string") strings.push([k, v]);
      }
      if (flags.length > 0) {
        body.createEl("div", { cls: "cortex-graph-stats-tech-sublabel", text: "Features" });
        const chipWrap = body.createDiv({ cls: "cortex-graph-stats-chips" });
        for (const [k, v] of flags) {
          const chip = chipWrap.createEl("span", { cls: "cortex-graph-stats-chip" });
          chip.addClass(v ? "is-on" : "is-off");
          chip.createEl("span", { cls: "cortex-graph-stats-chip-mark", text: v ? "\u2713" : "\u2717" });
          chip.createEl("span", { text: humanizeKey(stripPrefix(k, "enable")) });
        }
      }
      if (numbers.length > 0) {
        body.createEl("div", { cls: "cortex-graph-stats-tech-sublabel", text: "Thresholds & metrics" });
        const dl = body.createEl("dl", { cls: "cortex-graph-stats-dl" });
        for (const [k, v] of numbers) {
          dl.createEl("dt", { text: humanizeKey(k) });
          dl.createEl("dd", { text: formatValue(v) });
        }
      }
      if (strings.length > 0) {
        body.createEl("div", { cls: "cortex-graph-stats-tech-sublabel", text: "Models / providers" });
        const dl = body.createEl("dl", { cls: "cortex-graph-stats-dl" });
        for (const [k, v] of strings) {
          dl.createEl("dt", { text: humanizeKey(k) });
          dl.createEl("dd", { text: v });
        }
      }
    }
  }
  renderFooter(parent, stats, ragStats, elapsedMs) {
    const footer = parent.createDiv({ cls: "cortex-graph-stats-footer" });
    footer.createEl("span", {
      cls: "cortex-graph-stats-elapsed",
      text: `Fetched in ${elapsedMs}ms`
    });
    const refreshBtn = footer.createEl("button", { text: "Refresh" });
    refreshBtn.addEventListener("click", async () => {
      this.contentEl.empty();
      await this.onOpen();
    });
    const copyBtn = footer.createEl("button", { text: "Copy as Markdown" });
    copyBtn.addEventListener("click", async () => {
      const md = renderAsMarkdown(stats, ragStats);
      await navigator.clipboard.writeText(md);
      copyBtn.setText("Copied");
      setTimeout(() => copyBtn.setText("Copy as Markdown"), 1400);
    });
    const noteBtn = footer.createEl("button", { text: "Save as note", cls: "mod-cta" });
    noteBtn.addEventListener("click", async () => {
      const md = renderAsMarkdown(stats, ragStats);
      const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:]/g, "-").slice(0, 19);
      const path = `Cortex/Debug/Graph stats - ${stamp}.md`;
      try {
        const dir = path.split("/").slice(0, -1).join("/");
        if (dir && !this.app.vault.getAbstractFileByPath(dir)) {
          await this.app.vault.createFolder(dir).catch(() => {
          });
        }
        const file = await this.app.vault.create(path, md);
        await this.app.workspace.getLeaf(false).openFile(file);
        this.close();
      } catch (e) {
        new import_obsidian15.Notice(`Couldn't save note: ${e.message}`);
      }
    });
  }
  renderHeroCard(parent, label, value) {
    const card = parent.createDiv({ cls: "cortex-graph-stats-card" });
    card.createEl("div", { cls: "cortex-graph-stats-card-value", text: value });
    card.createEl("div", { cls: "cortex-graph-stats-card-label", text: label });
  }
  /** Render the connection-mode pill at the top — same shape as the chat
   *  panel's pill but standalone (modal doesn't share layout). Click to
   *  re-probe; auto-polls every 30s while the modal is open. */
  renderModePillBar(parent) {
    if (!this.plugin) return;
    const bar = parent.createDiv({ cls: "cortex-graph-stats-mode-bar" });
    this.statusPillEl = bar.createEl("span", { cls: "cortex-chat-mode-pill" });
    this.renderModePill("checking");
    void this.runModeProbe();
  }
  renderModePill(state) {
    if (!this.statusPillEl || !this.plugin) return;
    const s = this.plugin.settings;
    this.statusPillEl.empty();
    this.statusPillEl.removeClass("is-checking", "is-connected", "is-offline");
    this.statusPillEl.addClass(`is-${state}`);
    const mode = s.connectionMode === "local" ? "Local" : "Cloud";
    const host = (() => {
      try {
        return new URL(s.apiUrl).host;
      } catch {
        return s.apiUrl;
      }
    })();
    this.statusPillEl.createSpan({ cls: "cortex-chat-mode-dot" });
    if (state === "checking") {
      this.statusPillEl.createSpan({ text: `${mode} \xB7 checking\u2026` });
      this.statusPillEl.setAttr("title", `${mode} mode (${host}) \u2014 checking\u2026`);
    } else if (state === "connected") {
      this.statusPillEl.createSpan({ text: `${mode} \xB7 ${host}` });
      this.statusPillEl.setAttr("title", `Connected to ${host}. Click to recheck.`);
    } else {
      this.statusPillEl.createSpan({ text: `${mode} \xB7 offline` });
      this.statusPillEl.setAttr("title", `Cannot reach ${host}. Click to retry.`);
    }
    this.statusPillEl.onclick = () => {
      void this.runModeProbe();
    };
  }
  async runModeProbe() {
    if (!this.statusPillEl || !this.plugin) return;
    this.renderModePill("checking");
    const ok = await this.probeHealth();
    this.renderModePill(ok ? "connected" : "offline");
    if (this.statusPollTimer == null) {
      this.statusPollTimer = window.setInterval(() => {
        void this.runModeProbe();
      }, 3e4);
    }
  }
  async probeHealth() {
    if (!this.plugin) return false;
    const cleanUrl = (this.plugin.settings.apiUrl || "").replace(/\/$/, "");
    if (!cleanUrl) return false;
    try {
      const res = await (0, import_obsidian15.requestUrl)({ url: `${cleanUrl}/health`, method: "GET", throw: false });
      return res.status >= 200 && (res.status < 400 || res.status === 503);
    } catch {
      return false;
    }
  }
  renderError(err) {
    const fmt = formatError(err, "Couldn't load graph stats");
    const card = this.contentEl.createEl("div", { cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createEl("div", { cls: "cortex-error-head" });
    const ic = head.createEl("span", { cls: "cortex-error-icon" });
    (0, import_obsidian15.setIcon)(ic, errorIcon(fmt.kind));
    head.createEl("span", { cls: "cortex-error-headline", text: fmt.headline });
    if (fmt.hint) card.createEl("div", { cls: "cortex-error-hint", text: fmt.hint });
    const detailWrap = card.createEl("details", { cls: "cortex-error-detail-wrap" });
    detailWrap.createEl("summary", { text: "Error details" });
    detailWrap.createEl("pre", { cls: "cortex-error-detail" }).createEl("code", { text: fmt.detail });
    const actions = card.createEl("div", { cls: "cortex-error-actions" });
    if (this.plugin && fmt.kind === "auth") {
      const openSettings = actions.createEl("button", { text: "Open settings" });
      openSettings.addEventListener("click", () => {
        this.close();
        const setting = this.app.setting;
        setting.open();
        setting.openTabById(this.plugin.manifest.id);
      });
    }
    const retry = actions.createEl("button", { text: "Retry", cls: "mod-cta" });
    retry.addEventListener("click", async () => {
      this.contentEl.empty();
      await this.onOpen();
    });
  }
};
function computeInsights(stats, ragStats) {
  const out = [];
  const structuredCount = stats.entityTypes.filter((et) => !FILE_STRUCTURE_TYPES.has(et.type)).reduce((sum, et) => sum + et.count, 0);
  const totalEntities = stats.totalEntities;
  if (totalEntities > 100 && structuredCount / totalEntities < 0.05) {
    out.push({
      severity: "warn",
      headline: "Most of your graph is file structure, not concepts",
      detail: `Only ${structuredCount} of ${totalEntities.toLocaleString()} entities are conceptual (Person/Concept/Tag/etc). Run "Force re-ingest" with a stronger LLM to extract more meaningful entities.`
    });
  }
  const totalRel = stats.totalRelationships;
  const wikilink = stats.relationshipTypes.find((rt) => rt.type === "WIKILINK");
  if (totalRel > 100 && wikilink && wikilink.count / totalRel > 0.7) {
    out.push({
      severity: "info",
      headline: "WIKILINK dominates your connections",
      detail: `${Math.round(wikilink.count / totalRel * 100)}% of relationships are wikilinks (file-to-file). The LLM hasn't extracted many semantic relationships \u2014 Force re-ingest may help if you want richer "X relates to Y" queries.`
    });
  }
  const reranker = readNested(ragStats, ["advancedSearchStats", "reranker"]);
  if (reranker && typeof reranker === "object") {
    const available = reranker.available;
    if (available === false) {
      out.push({
        severity: "info",
        headline: "Reranker not configured",
        detail: "Search results are returned in raw similarity order. Configure a Cohere or Jina reranker for higher-quality answers."
      });
    }
  }
  const bm25 = readNested(ragStats, ["advancedSearchStats", "bm25"]);
  const gnnCache = readNested(ragStats, ["advancedSearchStats", "gnn", "cacheSize"]);
  if (bm25 == null && (gnnCache === 0 || gnnCache == null)) {
    out.push({
      severity: "info",
      headline: "Search indices are cold",
      detail: "BM25 and GNN caches haven't been populated yet \u2014 they warm up on first use. Your first few queries may be slower than subsequent ones."
    });
  }
  const totalQueries = ragStats?.totalQueries ?? 0;
  const cacheHitRate = ragStats?.cacheHitRate ?? -1;
  if (totalQueries >= 50 && cacheHitRate >= 0 && cacheHitRate < 0.1) {
    out.push({
      severity: "info",
      headline: "Query cache rarely hits",
      detail: `Cache hit rate is ${(cacheHitRate * 100).toFixed(1)}% across ${totalQueries.toLocaleString()} queries. Enable or tune the semantic cache for repeat-query speedups.`
    });
  }
  return out;
}
function readNested(obj, path) {
  let cur = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return void 0;
    cur = cur[key];
  }
  return cur;
}
function flattenRagStats(stats) {
  const out = {};
  for (const [k, v] of Object.entries(stats)) {
    if (v == null) continue;
    if (typeof v === "boolean" || typeof v === "number" || typeof v === "string") {
      out[k] = v;
    } else if (typeof v === "object") {
      for (const [k2, v2] of Object.entries(v)) {
        if (typeof v2 === "boolean" || typeof v2 === "number" || typeof v2 === "string") {
          out[k2] = v2;
        }
      }
    }
  }
  return out;
}
var SYSTEM_PROPS = /* @__PURE__ */ new Set([
  "sourceSystem",
  "sourceId",
  "eventTime",
  "ingestTime",
  "temporalSource",
  "temporalConfidence",
  "version",
  "_uploadedAt",
  "createdAt",
  "updatedAt",
  "workspaceId",
  "organizationId",
  "id",
  "embedding",
  "syncJobId"
]);
function isSystemProperty(name) {
  return SYSTEM_PROPS.has(name) || name.startsWith("_");
}
function stripPrefix(s, prefix) {
  return s.startsWith(prefix) ? s.slice(prefix.length) : s;
}
function formatNumber(n) {
  return n.toLocaleString();
}
function humanizeKey(k) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}
function formatValue(v) {
  if (typeof v === "number") {
    if (v > 0 && v < 1) return `${(v * 100).toFixed(1)}%`;
    return formatNumber(v);
  }
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "yes" : "no";
  return JSON.stringify(v);
}
function renderAsMarkdown(stats, ragStats) {
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  const lines = [];
  lines.push(`# HangarX memory stats`);
  lines.push("");
  lines.push(`_Captured ${ts}_`);
  lines.push("");
  lines.push(`- **Entities:** ${formatNumber(stats.totalEntities)}`);
  lines.push(`- **Relationships:** ${formatNumber(stats.totalRelationships)}`);
  const ratio = stats.totalEntities > 0 ? stats.totalRelationships / stats.totalEntities : 0;
  lines.push(`- **Relationships per entity:** ${ratio.toFixed(2)}`);
  lines.push(`- **Entity types:** ${stats.entityTypes.length}`);
  lines.push(`- **Relationship types:** ${stats.relationshipTypes.length}`);
  lines.push("");
  const insights = computeInsights(stats, ragStats);
  if (insights.length > 0) {
    lines.push(`## Heads up`);
    lines.push("");
    for (const i of insights) {
      lines.push(`- **${i.headline}** \u2014 ${i.detail}`);
    }
    lines.push("");
  }
  if (stats.entityTypes.length > 0) {
    lines.push(`## Entity types`);
    lines.push("");
    lines.push(`| Type | Count | Distinguishing properties |`);
    lines.push(`|---|---:|---|`);
    const sorted = stats.entityTypes.slice().sort((a, b) => b.count - a.count);
    for (const et of sorted) {
      const distinguishing = (et.sampleProperties ?? []).filter((p) => !isSystemProperty(p));
      const props = distinguishing.length > 0 ? distinguishing.slice(0, 8).join(", ") : "\u2014";
      lines.push(`| ${et.type} | ${formatNumber(et.count)} | ${props} |`);
    }
    lines.push("");
  }
  if (stats.relationshipTypes.length > 0) {
    lines.push(`## Relationship types`);
    lines.push("");
    lines.push(`| Type | Count |`);
    lines.push(`|---|---:|`);
    const sorted = stats.relationshipTypes.slice().sort((a, b) => b.count - a.count);
    for (const rt of sorted) {
      lines.push(`| ${rt.type} | ${formatNumber(rt.count)} |`);
    }
    lines.push("");
  }
  if (ragStats) {
    lines.push(`## GraphRAG orchestrator`);
    lines.push("");
    for (const [k, v] of Object.entries(ragStats)) {
      if (v == null) continue;
      lines.push(`- **${humanizeKey(k)}:** ${formatValue(v)}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
function parseStringList(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter((s) => typeof s === "string" && s.length > 0);
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parsed.filter((s) => typeof s === "string" && s.length > 0);
    }
  } catch {
  }
  return input.split(",").map((s) => s.trim()).filter(Boolean);
}

// src/services/graph-pull.ts
var import_obsidian16 = require("obsidian");
var DEFAULT_SEMANTIC_TYPES = [
  "Concept",
  "Person",
  "Organization",
  "Topic",
  "Location",
  "Event",
  "Product",
  "Technology",
  "Framework",
  "Expert",
  "Document",
  "Brand",
  "Platform",
  "Strategy",
  "Category",
  "Campaign",
  "Patent",
  "Country",
  "Sector",
  "Author"
];
var INDEX_PATH_SUFFIX = "_index.json";
var GraphPull = class {
  constructor(app, client, settings) {
    this.app = app;
    this.client = client;
    this.settings = settings;
    this.index = { hashes: {}, paths: {} };
    this.indexLoaded = false;
  }
  /* ── Index persistence ──────────────────────────────────────────── */
  get indexPath() {
    return (0, import_obsidian16.normalizePath)(`${this.settings.graphPullFolder}/${INDEX_PATH_SUFFIX}`);
  }
  async loadIndex() {
    if (this.indexLoaded) return;
    try {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(this.indexPath)) {
        this.index = JSON.parse(await adapter.read(this.indexPath));
      } else {
        this.index = { hashes: {}, paths: {} };
      }
    } catch {
      this.index = { hashes: {}, paths: {} };
    }
    this.indexLoaded = true;
  }
  async saveIndex() {
    const dir = this.settings.graphPullFolder;
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(dir)) await adapter.mkdir(dir);
    await adapter.write(this.indexPath, JSON.stringify(this.index, null, 2));
  }
  /* ── Hash helper (matches vault-sync.ts) ────────────────────────── */
  async hash(content) {
    const buf = new TextEncoder().encode(content);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  /* ── Main pull flow ─────────────────────────────────────────────── */
  async pull(onProgress) {
    await this.loadIndex();
    const result = { created: 0, updated: 0, deleted: 0, enriched: 0, errors: [] };
    const typesToPull = this.resolveTypes();
    onProgress?.({ phase: "fetching", message: "Fetching entities from Cortex\u2026", current: 0, total: 0 });
    const { entities, relationships } = await this.fetchAll(typesToPull, onProgress);
    const entityById = /* @__PURE__ */ new Map();
    for (const e of entities) entityById.set(e.id, e);
    const relsByEntity = /* @__PURE__ */ new Map();
    for (const r of relationships) {
      if (!relsByEntity.has(r.from)) relsByEntity.set(r.from, []);
      relsByEntity.get(r.from).push(r);
      if (!relsByEntity.has(r.to)) relsByEntity.set(r.to, []);
      relsByEntity.get(r.to).push(r);
    }
    const seenIds = /* @__PURE__ */ new Set();
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      seenIds.add(entity.id);
      if (i % 50 === 0) {
        onProgress?.({
          phase: "writing",
          message: `Writing ${entity.name} (${entity.type})\u2026`,
          current: i,
          total: entities.length
        });
      }
      try {
        const rels = relsByEntity.get(entity.id) ?? [];
        const md = this.entityToMarkdown(entity, rels, entityById);
        const contentHash = await this.hash(md);
        if (this.index.hashes[entity.id] === contentHash) continue;
        const filePath = this.entityFilePath(entity);
        await this.ensureDir(filePath);
        const existing = this.app.vault.getAbstractFileByPath(filePath);
        if (existing && existing instanceof import_obsidian16.TFile) {
          await this.app.vault.modify(existing, md);
          result.updated++;
        } else {
          await this.app.vault.create(filePath, md);
          result.created++;
        }
        this.index.hashes[entity.id] = contentHash;
        this.index.paths[entity.id] = filePath;
      } catch (e) {
        result.errors.push(`${entity.name}: ${e.message}`);
      }
    }
    onProgress?.({ phase: "cleanup", message: "Removing stale entities\u2026", current: 0, total: 0 });
    for (const [id, path] of Object.entries(this.index.paths)) {
      if (seenIds.has(id)) continue;
      try {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file) await this.app.vault.delete(file);
        delete this.index.hashes[id];
        delete this.index.paths[id];
        result.deleted++;
      } catch {
        delete this.index.hashes[id];
        delete this.index.paths[id];
      }
    }
    if (this.settings.graphPullEnrichSourceNotes) {
      onProgress?.({ phase: "enriching", message: "Enriching source notes\u2026", current: 0, total: 0 });
      result.enriched = await this.enrichSourceNotes(entities, relationships, entityById, onProgress);
    }
    this.index.lastPulledAt = Date.now();
    await this.saveIndex();
    onProgress?.({ phase: "done", message: "Done", current: 1, total: 1 });
    return result;
  }
  /* ── Summary (cheap, stats-only) ────────────────────────────────── */
  /**
   * Cheap "tell me what's there" path. Hits /v1/graph/stats (one network
   * round-trip) and compares the per-type entity counts against the size of
   * the local pull index. Doesn't fetch a single entity body — answers in
   * ~50ms even on a 10k-entity graph, vs. ~30s+ for the full preview.
   *
   * Returned counts are estimates: "estNew" assumes any cloud entity not
   * already in our local index is missing locally (ignores rename / id
   * churn), and "estUnchanged" is the local-index intersection. Good enough
   * for the picker so users know whether to bother running the full pull.
   */
  async summary() {
    await this.loadIndex();
    const types = new Set(this.resolveTypes());
    const stats = await this.client.getGraphStats();
    const localByType = /* @__PURE__ */ new Map();
    for (const path of Object.values(this.index.paths)) {
      const m = path.match(/\/([^/]+)\/[^/]+\s\(\1\)\.md$/);
      const t = m?.[1] ?? "Unknown";
      localByType.set(t, (localByType.get(t) ?? 0) + 1);
    }
    const perType = [];
    let cloudTotal = 0;
    let localTotal = 0;
    for (const et of stats.entityTypes ?? []) {
      if (!types.has(et.type)) continue;
      const localCount = localByType.get(et.type) ?? 0;
      const cloudCount = et.count;
      cloudTotal += cloudCount;
      localTotal += localCount;
      perType.push({
        type: et.type,
        cloudCount,
        localCount,
        estNew: Math.max(0, cloudCount - localCount)
      });
    }
    let estStale = 0;
    for (const [t, n] of localByType) {
      const matchesCloud = perType.find((p) => p.type === t)?.cloudCount ?? 0;
      if (n > matchesCloud) estStale += n - matchesCloud;
    }
    return {
      perType: perType.sort((a, b) => b.cloudCount - a.cloudCount),
      cloudTotal,
      localTotal,
      estNew: Math.max(0, cloudTotal - localTotal),
      estUnchanged: Math.min(cloudTotal, localTotal) - estStale,
      estStale
    };
  }
  /* ── Preview (dry run) ──────────────────────────────────────────── */
  async preview(onProgress) {
    await this.loadIndex();
    const typesToPull = this.resolveTypes();
    onProgress?.({ phase: "fetching", message: "Fetching entities\u2026", current: 0, total: 0 });
    const { entities, relationships } = await this.fetchAll(typesToPull, onProgress);
    const entityById = /* @__PURE__ */ new Map();
    for (const e of entities) entityById.set(e.id, e);
    const relsByEntity = /* @__PURE__ */ new Map();
    for (const r of relationships) {
      if (!relsByEntity.has(r.from)) relsByEntity.set(r.from, []);
      relsByEntity.get(r.from).push(r);
      if (!relsByEntity.has(r.to)) relsByEntity.set(r.to, []);
      relsByEntity.get(r.to).push(r);
    }
    const toCreate = [];
    const toUpdate = [];
    const seenIds = /* @__PURE__ */ new Set();
    for (const entity of entities) {
      seenIds.add(entity.id);
      const rels = relsByEntity.get(entity.id) ?? [];
      const md = this.entityToMarkdown(entity, rels, entityById);
      const contentHash = await this.hash(md);
      const label = `${entity.name} (${entity.type})`;
      if (!this.index.hashes[entity.id]) {
        toCreate.push(label);
      } else if (this.index.hashes[entity.id] !== contentHash) {
        toUpdate.push(label);
      }
    }
    const toDelete = [];
    for (const [id] of Object.entries(this.index.paths)) {
      if (!seenIds.has(id)) toDelete.push(this.index.paths[id]);
    }
    onProgress?.({ phase: "done", message: "Done", current: 1, total: 1 });
    return { toCreate, toUpdate, toDelete, entityCount: entities.length };
  }
  /* ── Fetch all pages ────────────────────────────────────────────── */
  async fetchAll(entityTypes, onProgress) {
    const allEntities = [];
    const allRelationships = [];
    const batchSize = 500;
    const seenRelKeys = /* @__PURE__ */ new Set();
    for (let t = 0; t < entityTypes.length; t++) {
      const type = entityTypes[t];
      let offset = 0;
      while (true) {
        onProgress?.({
          phase: "fetching",
          message: `Fetching ${type} (${allEntities.length} entities so far)\u2026`,
          current: t,
          total: entityTypes.length
        });
        const page = await this.client.exportGraphPage({
          entityTypes: [type],
          limit: batchSize,
          offset,
          includeRelationships: offset === 0
          // only fetch rels on first page per type
        });
        allEntities.push(...page.entities);
        for (const r of page.relationships) {
          const key = `${r.from}-${r.type}-${r.to}`;
          if (!seenRelKeys.has(key)) {
            seenRelKeys.add(key);
            allRelationships.push(r);
          }
        }
        if (page.entities.length < batchSize) break;
        offset += batchSize;
      }
    }
    return { entities: allEntities, relationships: allRelationships };
  }
  /* ── Type resolution ────────────────────────────────────────────── */
  resolveTypes() {
    if (this.settings.graphPullEntityTypes.length > 0) {
      return this.settings.graphPullEntityTypes;
    }
    return DEFAULT_SEMANTIC_TYPES;
  }
  /* ── Entity → Markdown ──────────────────────────────────────────── */
  entityToMarkdown(entity, relationships, entityById) {
    const lines = [];
    lines.push("---");
    lines.push(`cortex_id: "${entity.id}"`);
    lines.push(`cortex_type: "${entity.type}"`);
    lines.push(`cortex_synced: "${(/* @__PURE__ */ new Date()).toISOString()}"`);
    lines.push("aliases:");
    lines.push(`  - "${this.escapeYaml(entity.name)}"`);
    const relatedNames = this.getRelatedNames(entity, relationships, entityById);
    if (relatedNames.length > 0) {
      lines.push("related:");
      for (const name of relatedNames.slice(0, 20)) {
        lines.push(`  - "[[${this.escapeYaml(name)}]]"`);
      }
    }
    const sourceNotes = this.getSourceNotes(entity, relationships, entityById);
    if (sourceNotes.length > 0) {
      lines.push("mentioned_in:");
      for (const note of sourceNotes) {
        lines.push(`  - "[[${this.escapeYaml(note)}]]"`);
      }
    }
    lines.push("tags:");
    lines.push("  - cortex");
    lines.push(`  - cortex/${entity.type.toLowerCase().replace(/\s+/g, "-")}`);
    lines.push("---");
    lines.push("");
    lines.push(`# ${entity.name}`);
    lines.push("");
    const desc = entity.properties.description;
    if (desc) {
      lines.push(desc);
      lines.push("");
    }
    const grouped = this.groupRelationships(entity, relationships, entityById);
    if (grouped.size > 0) {
      lines.push("## Relationships");
      lines.push("");
      for (const [relType, targets] of grouped) {
        for (const target of targets) {
          lines.push(`- **${this.humanRelType(relType)}** \u2192 [[${target}]]`);
        }
      }
      lines.push("");
    }
    const userProps = this.getUserProperties(entity);
    if (userProps.length > 0) {
      lines.push("## Properties");
      lines.push("");
      for (const [key, value] of userProps) {
        lines.push(`- **${key}**: ${String(value)}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }
  /* ── Relationship helpers ───────────────────────────────────────── */
  getRelatedNames(entity, relationships, entityById) {
    const names = /* @__PURE__ */ new Set();
    for (const r of relationships) {
      const otherId = r.from === entity.id ? r.to : r.from;
      const other = entityById.get(otherId);
      if (other && other.id !== entity.id) {
        names.add(this.entityDisplayName(other));
      }
    }
    return Array.from(names);
  }
  getSourceNotes(entity, relationships, entityById) {
    const notes = [];
    for (const r of relationships) {
      if (r.type !== "MENTIONED_IN" && r.type !== "PART_OF" && r.type !== "DESCRIBED_IN") continue;
      const otherId = r.from === entity.id ? r.to : r.from;
      const other = entityById.get(otherId);
      if (other && (other.type === "Document" || other.type === "Note")) {
        notes.push(other.name);
      }
    }
    return notes;
  }
  groupRelationships(entity, relationships, entityById) {
    const grouped = /* @__PURE__ */ new Map();
    for (const r of relationships) {
      const otherId = r.from === entity.id ? r.to : r.from;
      const other = entityById.get(otherId);
      if (!other || other.id === entity.id) continue;
      const displayName = this.entityDisplayName(other);
      if (!grouped.has(r.type)) grouped.set(r.type, []);
      const list = grouped.get(r.type);
      if (!list.includes(displayName)) list.push(displayName);
    }
    return grouped;
  }
  /* ── File path helpers ──────────────────────────────────────────── */
  entityFilePath(entity) {
    const safeName = this.sanitizeFilename(entity.name);
    const safeType = this.sanitizeFilename(entity.type);
    return (0, import_obsidian16.normalizePath)(
      `${this.settings.graphPullFolder}/${safeType}/${safeName} (${safeType}).md`
    );
  }
  entityDisplayName(entity) {
    return `${entity.name} (${entity.type})`;
  }
  sanitizeFilename(name) {
    return name.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim().slice(0, 100);
  }
  async ensureDir(filePath) {
    const parts = filePath.split("/");
    parts.pop();
    const dir = parts.join("/");
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(dir)) {
      await adapter.mkdir(dir);
    }
  }
  /* ── Source note enrichment ─────────────────────────────────────── */
  async enrichSourceNotes(entities, relationships, entityById, onProgress) {
    const noteEntities = /* @__PURE__ */ new Map();
    for (const r of relationships) {
      if (r.type !== "MENTIONED_IN" && r.type !== "PART_OF") continue;
      const entityId = r.from;
      const noteId = r.to;
      const entity = entityById.get(entityId);
      const note = entityById.get(noteId);
      if (!entity || !note) continue;
      if (note.type !== "Document" && note.type !== "Note") continue;
      const filePath = note.properties.filePath ?? note.name;
      if (!noteEntities.has(filePath)) noteEntities.set(filePath, /* @__PURE__ */ new Set());
      noteEntities.get(filePath).add(entity.name);
    }
    let enriched = 0;
    const entries = Array.from(noteEntities.entries());
    for (let i = 0; i < entries.length; i++) {
      const [filePath, entityNames] = entries[i];
      if (i % 20 === 0) {
        onProgress?.({
          phase: "enriching",
          message: `Enriching ${filePath}\u2026`,
          current: i,
          total: entries.length
        });
      }
      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!file || !(file instanceof import_obsidian16.TFile)) continue;
      try {
        const content = await this.app.vault.read(file);
        const updated = this.upsertFrontmatter(content, "cortex_entities", Array.from(entityNames).sort());
        if (updated !== content) {
          await this.app.vault.modify(file, updated);
          enriched++;
        }
      } catch {
      }
    }
    return enriched;
  }
  /**
   * Insert or update a single frontmatter key without disturbing the rest
   * of the document. Creates frontmatter if none exists.
   */
  upsertFrontmatter(content, key, values) {
    const yamlValue = values.map((v) => `  - "${this.escapeYaml(v)}"`).join("\n");
    const newBlock = `${key}:
${yamlValue}`;
    if (!content.startsWith("---")) {
      return `---
${newBlock}
---

${content}`;
    }
    const endIdx = content.indexOf("---", 3);
    if (endIdx === -1) return content;
    const fm = content.slice(4, endIdx);
    const after = content.slice(endIdx + 3);
    const keyRegex = new RegExp(`^${key}:.*(?:\\n  - .*)*`, "m");
    if (keyRegex.test(fm)) {
      const updatedFm = fm.replace(keyRegex, newBlock);
      return `---
${updatedFm}---${after}`;
    }
    const trimmedFm = fm.trimEnd();
    return `---
${trimmedFm}
${newBlock}
---${after}`;
  }
  /* ── Formatting helpers ─────────────────────────────────────────── */
  humanRelType(rel) {
    return rel.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }
  escapeYaml(s) {
    return s.replace(/"/g, '\\"');
  }
  getUserProperties(entity) {
    const skip = /* @__PURE__ */ new Set([
      "id",
      "name",
      "type",
      "description",
      "embedding",
      "embeddings",
      "organizationId",
      "workspaceId",
      "createdAt",
      "updatedAt",
      "startLine",
      "endLine",
      "lineCount",
      "sizeBytes",
      "isExported",
      "kind",
      "signature",
      "docstring",
      "language"
    ]);
    return Object.entries(entity.properties).filter(([k, v]) => !skip.has(k) && v !== "" && v != null).slice(0, 15);
  }
};

// src/views/graph-pull-modal.ts
var import_obsidian17 = require("obsidian");
init_error_format();
var GraphPullModal = class extends import_obsidian17.Modal {
  constructor(app, graphPull, mode = "pull", opts = {}) {
    super(app);
    this.graphPull = graphPull;
    this.mode = mode;
    this.opts = opts;
    this.cancelled = false;
  }
  async onOpen() {
    this.modalEl.addClass("cortex-pull-modal");
    const baseTitle = this.mode === "pull" ? "Pulling Cortex Graph" : this.mode === "preview" ? "Preview Graph Pull" : "Cortex Graph Summary";
    this.titleEl.setText(baseTitle);
    const content = this.contentEl;
    content.empty();
    const phaseRow = content.createEl("div", { cls: "cortex-pull-phase-row" });
    const phaseIcon = phaseRow.createEl("span", { cls: "cortex-pull-phase-icon" });
    (0, import_obsidian17.setIcon)(phaseIcon, "download-cloud");
    this.phaseEl = phaseRow.createEl("span", {
      cls: "cortex-pull-phase-label",
      text: "Initializing\u2026"
    });
    this.messageEl = content.createEl("div", { cls: "cortex-pull-message" });
    const barWrap = content.createEl("div", { cls: "cortex-pull-bar-wrap" });
    this.barFill = barWrap.createEl("div", { cls: "cortex-pull-bar-fill" });
    this.statsEl = content.createEl("div", { cls: "cortex-pull-stats" });
    const btnRow = content.createEl("div", { cls: "cortex-pull-btn-row" });
    this.cancelBtn = btnRow.createEl("button", { text: "Cancel", cls: "cortex-pull-cancel" });
    this.cancelBtn.addEventListener("click", () => {
      this.cancelled = true;
      this.close();
    });
    try {
      if (this.mode === "pull") {
        await this.runPull();
      } else if (this.mode === "preview") {
        await this.runPreview();
      } else {
        await this.runSummary();
      }
    } catch (e) {
      this.showError(e.message);
    }
  }
  async runSummary() {
    this.phaseEl.setText("Fetching graph stats\u2026");
    this.barFill.addClass("cortex-pull-bar-indeterminate");
    const summary = await this.graphPull.summary();
    if (this.cancelled) return;
    this.barFill.removeClass("cortex-pull-bar-indeterminate");
    this.barFill.addClass("cortex-pull-bar-done");
    this.barFill.style.width = "100%";
    this.phaseEl.setText("Summary");
    this.messageEl.setText("Fast estimate from graph stats \u2014 run Preview for exact counts.");
    this.statsEl.empty();
    const grid = this.statsEl.createEl("div", { cls: "cortex-pull-stat-grid" });
    this.statItem(grid, "database", `${summary.cloudTotal.toLocaleString()} entities in cloud`, "cortex-pull-stat-total");
    this.statItem(grid, "hard-drive", `${summary.localTotal.toLocaleString()} pulled locally`, "cortex-pull-stat-update");
    this.statItem(grid, "plus-circle", `~${summary.estNew.toLocaleString()} would be new`, "cortex-pull-stat-create");
    this.statItem(grid, "trash-2", `~${summary.estStale.toLocaleString()} likely stale`, "cortex-pull-stat-delete");
    if (summary.perType.length > 0) {
      const section = this.statsEl.createEl("details", { cls: "cortex-pull-stat-details" });
      section.setAttr("open", "");
      section.createEl("summary", { text: `Breakdown by type (${summary.perType.length})` });
      const tbl = section.createEl("table", { cls: "cortex-pull-summary-table" });
      const head = tbl.createEl("thead").createEl("tr");
      for (const h of ["Type", "Cloud", "Local", "~New"]) head.createEl("th", { text: h });
      const body = tbl.createEl("tbody");
      for (const row of summary.perType) {
        const tr = body.createEl("tr");
        tr.createEl("td", { text: row.type });
        tr.createEl("td", { text: row.cloudCount.toLocaleString(), cls: "cortex-pull-summary-num" });
        tr.createEl("td", { text: row.localCount.toLocaleString(), cls: "cortex-pull-summary-num" });
        tr.createEl("td", {
          text: row.estNew > 0 ? `+${row.estNew.toLocaleString()}` : "\u2014",
          cls: `cortex-pull-summary-num ${row.estNew > 0 ? "is-new" : ""}`
        });
      }
    }
    this.cancelBtn.setText("Close");
  }
  async runPull() {
    const result = await this.graphPull.pull((p) => this.onProgress(p));
    if (this.cancelled) return;
    this.showResult(result);
    setTimeout(() => {
      if (!this.cancelled) this.close();
    }, 4e3);
  }
  async runPreview() {
    const preview = await this.graphPull.preview((p) => this.onProgress(p));
    if (this.cancelled) return;
    this.phaseEl.setText("Preview complete");
    this.messageEl.setText("");
    this.barFill.style.width = "100%";
    this.barFill.addClass("cortex-pull-bar-done");
    this.statsEl.empty();
    this.statsEl.createEl("div", { cls: "cortex-pull-stat-header", text: "What would happen:" });
    const grid = this.statsEl.createEl("div", { cls: "cortex-pull-stat-grid" });
    this.statItem(grid, "plus-circle", `${preview.toCreate.length} new files`, "cortex-pull-stat-create");
    this.statItem(grid, "edit-3", `${preview.toUpdate.length} updated`, "cortex-pull-stat-update");
    this.statItem(grid, "trash-2", `${preview.toDelete.length} removed`, "cortex-pull-stat-delete");
    this.statItem(grid, "database", `${preview.entityCount} total entities`, "cortex-pull-stat-total");
    if (preview.toCreate.length > 0) {
      const section = this.statsEl.createEl("details", { cls: "cortex-pull-stat-details" });
      section.createEl("summary", { text: `New entities (${preview.toCreate.length})` });
      const list = section.createEl("ul");
      for (const name of preview.toCreate.slice(0, 50)) {
        list.createEl("li", { text: name });
      }
      if (preview.toCreate.length > 50) {
        list.createEl("li", { text: `\u2026 and ${preview.toCreate.length - 50} more`, cls: "cortex-pull-more" });
      }
    }
    this.cancelBtn.setText("Close");
  }
  onProgress(p) {
    if (this.cancelled) return;
    const phaseLabels = {
      fetching: "\u2B07 Fetching",
      writing: "\u270F Writing files",
      enriching: "\u{1F517} Enriching notes",
      cleanup: "\u{1F9F9} Cleaning up",
      done: "\u2713 Done"
    };
    this.phaseEl.setText(phaseLabels[p.phase] ?? p.phase);
    this.messageEl.setText(p.message);
    if (p.total > 0) {
      const pct = Math.min(100, Math.round(p.current / p.total * 100));
      this.barFill.style.width = `${pct}%`;
    } else if (p.phase === "fetching") {
      this.barFill.addClass("cortex-pull-bar-indeterminate");
      this.barFill.style.width = "";
    }
    if (p.phase === "done") {
      this.barFill.removeClass("cortex-pull-bar-indeterminate");
      this.barFill.addClass("cortex-pull-bar-done");
      this.barFill.style.width = "100%";
    }
  }
  showResult(result) {
    this.phaseEl.setText("\u2713 Pull complete");
    this.messageEl.setText("");
    this.cancelBtn.setText("Close");
    this.statsEl.empty();
    const grid = this.statsEl.createEl("div", { cls: "cortex-pull-stat-grid" });
    this.statItem(grid, "plus-circle", `${result.created} created`, "cortex-pull-stat-create");
    this.statItem(grid, "edit-3", `${result.updated} updated`, "cortex-pull-stat-update");
    this.statItem(grid, "trash-2", `${result.deleted} removed`, "cortex-pull-stat-delete");
    if (result.enriched > 0) {
      this.statItem(grid, "link", `${result.enriched} notes enriched`, "cortex-pull-stat-enriched");
    }
    if (result.errors.length > 0) {
      const errSection = this.statsEl.createEl("details", { cls: "cortex-pull-stat-details cortex-pull-errors" });
      errSection.createEl("summary", { text: `${result.errors.length} errors` });
      const list = errSection.createEl("ul");
      for (const err of result.errors.slice(0, 20)) {
        list.createEl("li", { text: err });
      }
    }
    new import_obsidian17.Notice(
      `Cortex graph: ${result.created} created, ${result.updated} updated, ${result.deleted} removed` + (result.enriched > 0 ? `, ${result.enriched} notes enriched` : "")
    );
  }
  showError(rawMessage) {
    const fmt = formatError(rawMessage, "Couldn't pull graph");
    this.phaseEl.setText("Error");
    this.barFill.addClass("cortex-pull-bar-error");
    this.barFill.style.width = "100%";
    this.messageEl.empty();
    this.messageEl.removeClass("cortex-pull-error-msg");
    this.statsEl.empty();
    const card = this.statsEl.createEl("div", { cls: `cortex-error-card cortex-error-${fmt.kind}` });
    const head = card.createEl("div", { cls: "cortex-error-head" });
    const ic = head.createEl("span", { cls: "cortex-error-icon" });
    (0, import_obsidian17.setIcon)(ic, errorIcon(fmt.kind));
    head.createEl("span", { cls: "cortex-error-headline", text: fmt.headline });
    if (fmt.hint) {
      card.createEl("div", { cls: "cortex-error-hint", text: fmt.hint });
    }
    const detailWrap = card.createEl("details", { cls: "cortex-error-detail-wrap" });
    detailWrap.createEl("summary", { text: "Error details" });
    detailWrap.createEl("pre", { cls: "cortex-error-detail" }).createEl("code", { text: fmt.detail });
    const btnRow = card.createEl("div", { cls: "cortex-error-actions" });
    const retryBtn = btnRow.createEl("button", { text: "Retry", cls: "mod-cta" });
    retryBtn.addEventListener("click", async () => {
      this.statsEl.empty();
      this.messageEl.setText("");
      this.barFill.removeClass("cortex-pull-bar-error");
      this.barFill.style.width = "0%";
      this.phaseEl.setText("Initializing\u2026");
      try {
        if (this.mode === "pull") await this.runPull();
        else await this.runPreview();
      } catch (e) {
        this.showError(e.message);
      }
    });
    const copyBtn = btnRow.createEl("button", { text: "Copy details" });
    copyBtn.addEventListener("click", async () => {
      const payload = `${fmt.headline}

${fmt.detail}${fmt.hint ? `

Hint: ${fmt.hint}` : ""}`;
      await navigator.clipboard.writeText(payload);
      copyBtn.setText("Copied");
      setTimeout(() => copyBtn.setText("Copy details"), 1400);
    });
    this.cancelBtn.setText("Close");
  }
  statItem(parent, icon, text, cls) {
    const item = parent.createEl("div", { cls: `cortex-pull-stat ${cls}` });
    const ic = item.createEl("span", { cls: "cortex-pull-stat-icon" });
    (0, import_obsidian17.setIcon)(ic, icon);
    item.createEl("span", { text });
  }
  onClose() {
    this.cancelled = true;
    this.contentEl.empty();
  }
};

// src/main.ts
init_sync_modal();
init_diff_modal();
init_onboarding_modal();

// src/api.ts
function buildPublicApi(client) {
  return {
    async related(noteName, limit = 10) {
      const items = await client.related(noteName, limit);
      return items.map((r) => ({
        noteName: r.noteName,
        score: r.score,
        snippet: r.snippet,
        source: r.source
      }));
    },
    async ask(query) {
      const res = await client.ask(query);
      return res.answer;
    },
    async askExpanded(query) {
      const res = await client.ask(query);
      return {
        answer: res.answer,
        confidence: res.confidence,
        entities: res.entities.map((e) => ({ name: e.name, type: e.type })),
        documents: res.documents.map((d) => ({ title: d.title, url: d.url, matchPercent: d.matchPercent })),
        citations: res.citations.map((c) => ({ source: c.source, url: c.url })),
        followUps: res.followUps
      };
    },
    async suggestLinks(noteName) {
      const items = await client.suggestLinks(noteName);
      return items.map((s) => ({
        targetNote: s.targetNote,
        reason: s.reason,
        confidence: s.confidence
      }));
    },
    async contradictions(limit = 25) {
      const items = await client.findContradictions(limit);
      return items.map((c) => ({
        conflictType: c.conflictType,
        conflictDescription: c.conflictDescription,
        confidence: c.confidence,
        claim1: { text: c.claim1.text, sourceName: c.claim1.sourceName },
        claim2: { text: c.claim2.text, sourceName: c.claim2.sourceName }
      }));
    },
    async searchEntities(name, limit = 5) {
      return client.searchEntitiesByName(name, limit);
    },
    async pathsBetween(fromNoteName, toNoteName, maxHops = 3) {
      const [fromHits, toHits] = await Promise.all([
        client.searchEntitiesByName(fromNoteName, 5),
        client.searchEntitiesByName(toNoteName, 5)
      ]);
      const from = fromHits.find((h) => h.name === fromNoteName) ?? fromHits[0];
      const to = toHits.find((h) => h.name === toNoteName) ?? toHits[0];
      if (!from || !to) return [];
      const paths = await client.findPaths(from.id, to.id, maxHops);
      return paths.map((p) => ({
        steps: p.steps.map((s) => ({ fromName: s.fromName, toName: s.toName, relType: s.relType })),
        length: p.length
      }));
    },
    async recall(query, limit = 5) {
      const items = await client.recall(query, limit);
      return items.map((m) => ({ id: m.id, content: m.content, createdAt: m.createdAt }));
    },
    async remember(content) {
      await client.remember(content);
    }
  };
}

// src/services/inline-suggestions.ts
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var setSuggestion = import_state.StateEffect.define();
var suggestionField = import_state.StateField.define({
  create: () => null,
  update(value, tr) {
    for (const e of tr.effects) if (e.is(setSuggestion)) return e.value;
    if (tr.docChanged && value) {
      return null;
    }
    return value;
  }
});
var GhostWidget = class extends import_view.WidgetType {
  constructor(text) {
    super();
    this.text = text;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cortex-inline-ghost";
    span.textContent = this.text;
    return span;
  }
  ignoreEvent() {
    return true;
  }
};
var ghostDecorations = import_state.StateField.define({
  create: () => import_view.Decoration.none,
  update(value, tr) {
    const sug = tr.state.field(suggestionField);
    if (!sug) return import_view.Decoration.none;
    const ghostText = ` \u2192 [[${sug.target}]]`;
    return import_view.Decoration.set([
      import_view.Decoration.widget({ widget: new GhostWidget(ghostText), side: 1 }).range(sug.to)
    ]);
  },
  provide: (f) => import_view.EditorView.decorations.from(f)
});
var TOKEN_RE = /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})$/;
var MIN_TOKEN_LEN = 3;
function inlineSuggestionsExtension(client, isEnabled) {
  const cache = /* @__PURE__ */ new Map();
  const isSelfReference = (token, view) => {
    const before = view.state.doc.sliceString(Math.max(0, view.state.selection.main.from - 4), view.state.selection.main.from);
    return before.endsWith("[[" + token);
  };
  const fetcher = import_view.ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.view = view;
        this.timer = null;
        this.lastFrom = -1;
      }
      update(u) {
        if (!u.docChanged && !u.selectionSet) return;
        if (!isEnabled()) {
          if (u.state.field(suggestionField, false)) {
            this.view.dispatch({ effects: setSuggestion.of(null) });
          }
          return;
        }
        if (this.timer !== null) window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => this.recompute(), 300);
      }
      destroy() {
        if (this.timer !== null) window.clearTimeout(this.timer);
      }
      async recompute() {
        const view = this.view;
        const sel = view.state.selection.main;
        if (!sel.empty) return this.clear();
        const line = view.state.doc.lineAt(sel.from);
        const before = view.state.doc.sliceString(line.from, sel.from);
        if (/\[\[[^\]]*$/.test(before)) return this.clear();
        const backticks = (before.match(/`/g) || []).length;
        if (backticks % 2 === 1) return this.clear();
        const m = TOKEN_RE.exec(before);
        if (!m) return this.clear();
        const token = m[1];
        if (token.length < MIN_TOKEN_LEN) return this.clear();
        if (isSelfReference(token, view)) return this.clear();
        const tokenStart = line.from + before.length - token.length;
        if (cache.has(token)) {
          const target = cache.get(token);
          if (!target || target === token) return this.clear();
          this.show({ token, target, from: tokenStart, to: tokenStart + token.length });
          return;
        }
        if (this.lastFrom === tokenStart) return;
        this.lastFrom = tokenStart;
        try {
          const hits = await client.searchEntitiesByName(token, 5);
          const exact = hits.find((h) => h.name === token);
          const prefix = hits.find((h) => h.name.toLowerCase().startsWith(token.toLowerCase()) && h.name !== token);
          const best = exact ?? prefix ?? null;
          const target = best?.name ?? null;
          cache.set(token, target);
          if (!target || target === token) return this.clear();
          const nowSel = view.state.selection.main;
          const nowLine = view.state.doc.lineAt(nowSel.from);
          const nowBefore = view.state.doc.sliceString(nowLine.from, nowSel.from);
          const nowMatch = TOKEN_RE.exec(nowBefore);
          if (!nowMatch || nowMatch[1] !== token) return;
          const nowTokenStart = nowLine.from + nowBefore.length - token.length;
          this.show({ token, target, from: nowTokenStart, to: nowTokenStart + token.length });
        } catch {
        }
      }
      show(s) {
        this.view.dispatch({ effects: setSuggestion.of(s) });
      }
      clear() {
        if (this.view.state.field(suggestionField, false)) {
          this.view.dispatch({ effects: setSuggestion.of(null) });
        }
      }
    }
  );
  const suggestionKeymap = import_state.Prec.highest(
    import_view.keymap.of([
      {
        key: "Tab",
        run(view) {
          const sug = view.state.field(suggestionField, false);
          if (!sug) return false;
          view.dispatch({
            changes: { from: sug.from, to: sug.to, insert: `[[${sug.target}]]` },
            selection: { anchor: sug.from + sug.target.length + 4 },
            effects: setSuggestion.of(null)
          });
          return true;
        }
      },
      {
        key: "Escape",
        run(view) {
          const sug = view.state.field(suggestionField, false);
          if (!sug) return false;
          view.dispatch({ effects: setSuggestion.of(null) });
          return true;
        }
      }
    ])
  );
  return [suggestionField, ghostDecorations, fetcher, suggestionKeymap];
}

// src/main.ts
init_mcp_server();
function makeProgressNotice(headline, onCancel) {
  const notice = new import_obsidian18.Notice(headline, 0);
  const root = notice.noticeEl;
  root.addClass("cortex-progress-notice");
  const phaseEl = root.createEl("div", { cls: "cortex-progress-phase", text: "" });
  const bar = root.createEl("progress", { cls: "cortex-progress-bar" });
  bar.max = 100;
  bar.value = 0;
  let cancelBtn = null;
  if (onCancel) {
    cancelBtn = root.createEl("button", {
      cls: "cortex-progress-cancel",
      text: "Cancel"
    });
    cancelBtn.addEventListener("click", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (cancelBtn) {
        cancelBtn.setText("Cancelling\u2026");
        cancelBtn.setAttr("disabled", "true");
      }
      onCancel();
    });
  }
  let lastTick = 0;
  return {
    notice,
    update: ({ phase, done, total, currentPath }) => {
      const pct = total > 0 ? Math.round(done / total * 100) : 0;
      bar.max = total || 1;
      bar.value = done;
      const now = Date.now();
      if (now - lastTick < 100 && done < total) return;
      lastTick = now;
      const verb = phase === "sync" ? "Syncing" : "Removing";
      const where = currentPath ? ` \xB7 ${currentPath.split("/").pop()}` : "";
      phaseEl.setText(`${verb} ${done} / ${total} (${pct}%)${where}`);
    },
    setCancelling: () => {
      if (cancelBtn) {
        cancelBtn.setText("Cancelling\u2026");
        cancelBtn.setAttr("disabled", "true");
      }
    }
  };
}
function promptForText(app, title, placeholder) {
  return new Promise((resolve) => {
    const modal = new class extends import_obsidian18.Modal {
      onOpen() {
        this.titleEl.setText(title);
        const input = this.contentEl.createEl("input", {
          cls: "cortex-prompt-input",
          attr: { type: "text", placeholder, style: "width:100%;padding:8px;margin-bottom:8px;" }
        });
        const btn = this.contentEl.createEl("button", {
          text: "OK",
          attr: { style: "width:100%;" }
        });
        btn.addEventListener("click", () => {
          resolve(input.value.trim() || null);
          this.close();
        });
        input.addEventListener("keydown", (evt) => {
          if (evt.key === "Enter") {
            resolve(input.value.trim() || null);
            this.close();
          }
          if (evt.key === "Escape") {
            resolve(null);
            this.close();
          }
        });
        setTimeout(() => input.focus(), 50);
      }
      onClose() {
        resolve(null);
        this.contentEl.empty();
      }
    }(app);
    modal.open();
  });
}
var CortexPlugin = class extends import_obsidian18.Plugin {
  async onload() {
    await this.loadSettings();
    if (!this.settings.vaultId) {
      this.settings.vaultId = crypto.randomUUID();
      await this.saveSettings();
    }
    if (!this.settings.deviceId) {
      this.settings.deviceId = crypto.randomUUID();
      await this.saveSettings();
    }
    if (!this.settings.deviceName) {
      this.settings.deviceName = defaultDeviceName();
      await this.saveSettings();
    }
    if (!this.settings.connectorEncryptionKey) {
      this.settings.connectorEncryptionKey = generateEncryptionKey();
      await this.saveSettings();
    }
    if (!this.settings.llmEncryptionKey) {
      this.settings.llmEncryptionKey = generateEncryptionKey();
      await this.saveSettings();
    }
    this.client = new CortexClient(this.settings);
    this.sync = new VaultSync(this.app, this.client, this.settings);
    this.conversations = new ConversationStore(this);
    this.graphPull = new GraphPull(this.app, this.client, this.settings);
    this.mcp = new McpServer(this, this.client, this.settings);
    this.api = buildPublicApi(this.client);
    this.registerEditorExtension(
      inlineSuggestionsExtension(this.client, () => this.settings.inlineSuggestionsEnabled)
    );
    this.registerView(RELATED_VIEW_TYPE, (leaf) => new RelatedView(leaf, this.client));
    this.registerView(
      CHAT_VIEW_TYPE,
      (leaf) => new ChatView(leaf, this.client, this.conversations, this.settings, this)
    );
    this.registerObsidianProtocolHandler("hangarx-callback", (params) => {
      void completeSignIn(params);
    });
    this.addRibbonIcon("refresh-cw", "HangarX: Sync", () => {
      new SyncModal(this.app, this).open();
    });
    this.addRibbonIcon("bar-chart-3", "HangarX: Knowledge graph stats", () => {
      new GraphStatsModal(this.app, this.client, this).open();
    });
    this.addCommand({
      id: "cortex-1-sync",
      name: "Sync (open modal)",
      callback: () => new SyncModal(this.app, this).open()
    });
    this.addCommand({
      id: "cortex-1-sync-quick",
      name: "Push vault to knowledge graph (no modal)",
      callback: () => this.runFullSyncWithFeedback()
    });
    this.addCommand({
      id: "cortex-sync-current-note",
      name: "Sync current note to knowledge graph",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(import_obsidian18.MarkdownView);
        if (!view?.file) return false;
        if (checking) return true;
        void this.runSyncCurrentNote(view.file);
        return true;
      }
    });
    this.addCommand({
      id: "cortex-vault-graph-diff",
      name: "Diff vault \u2194 graph (what's out of sync)",
      callback: () => new DiffModal(this.app, this).open()
    });
    this.addCommand({
      id: "cortex-show-onboarding",
      name: "Show onboarding (welcome + setup steps)",
      callback: () => new OnboardingModal(this.app, this).open()
    });
    this.addCommand({
      id: "cortex-1b-resync-all",
      name: "Force re-ingest entire vault (after server reset)",
      callback: () => this.runForceResyncWithFeedback()
    });
    this.addCommand({
      id: "cortex-1c-rebuild-graph",
      name: "Rebuild communities + reindex (after fast re-ingest)",
      callback: () => this.runRebuildCommunitiesAndReindex()
    });
    this.addCommand({
      id: "cortex-2-connect-agents",
      name: "Connect agents (Claude, Cursor)\u2026",
      callback: () => {
        this.app.setting?.open?.();
        this.app.setting?.openTabById?.(this.manifest.id);
      }
    });
    this.addCommand({
      id: "cortex-3-stats",
      name: "Knowledge graph stats",
      callback: () => new GraphStatsModal(this.app, this.client, this).open()
    });
    this.addCommand({
      id: "cortex-ask",
      name: "Ask your vault (side panel)",
      callback: () => void this.activateChatView()
    });
    this.addCommand({
      id: "cortex-ask-modal",
      name: "Ask your vault (modal)",
      callback: () => new ChatModal(this.app, this.client, this.conversations, this.settings, this).open()
    });
    this.addCommand({
      id: "cortex-related-pane",
      name: "Open Related notes pane",
      callback: () => void this.activateRelatedView()
    });
    this.addCommand({
      id: "cortex-graph-pull",
      name: "Import knowledge graph from cloud",
      callback: () => this.runGraphPull()
    });
    this.addCommand({
      id: "cortex-graph-pull-preview",
      name: "Preview knowledge graph import",
      callback: () => this.runGraphPullPreview()
    });
    this.addCommand({
      id: "cortex-graph-pull-summary",
      name: "Knowledge graph summary (fast)",
      callback: () => this.runGraphPullSummary()
    });
    this.addCommand({
      id: "cortex-ingest-url",
      name: "Ingest URL into knowledge graph",
      callback: async () => {
        const url = await promptForText(this.app, "Ingest URL", "Paste a URL to scrape and add to your knowledge graph.");
        if (!url) return;
        const notice = new import_obsidian18.Notice("HangarX: Ingesting URL\u2026", 0);
        try {
          const result = await this.client.ingestUrl(url);
          notice.hide();
          new import_obsidian18.Notice(`\u2705 Ingested! ${result.entityCount ? `${result.entityCount} entities extracted.` : "Processing complete."}`);
        } catch (e) {
          notice.hide();
          new import_obsidian18.Notice(`HangarX ingest failed: ${e.message}`);
        }
      }
    });
    this.addSettingTab(new CortexSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!("extension" in file) || file.extension !== "md") return;
        menu.addItem((item) => {
          item.setTitle("HangarX: Sync to knowledge graph").setIcon("refresh-cw").onClick(() => void this.runSyncCurrentNote(file));
        });
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, _editor, view) => {
        const file = view?.file;
        if (!file || file.extension !== "md") return;
        menu.addItem((item) => {
          item.setTitle("HangarX: Sync this note to knowledge graph").setIcon("refresh-cw").onClick(() => void this.runSyncCurrentNote(file));
        });
      })
    );
    this.app.workspace.onLayoutReady(async () => {
      this.registerEvent(this.app.vault.on("create", (f) => this.sync.scheduleFileSync(f)));
      this.registerEvent(this.app.vault.on("modify", (f) => this.sync.scheduleFileSync(f)));
      this.registerEvent(this.app.vault.on("delete", (f) => this.sync.handleDelete(f)));
      this.registerEvent(this.app.vault.on("rename", (f, old) => this.sync.handleRename(f, old)));
      if (this.settings.syncOnStartup && this.settings.apiKey && this.settings.workspaceId) {
        setTimeout(() => this.sync.fullSync().catch((e) => console.warn("[Cortex] startup sync", e)), 3e3);
      }
      const pane = this.settings.defaultRightPane ?? (this.settings.showRelatedPane ? "related" : "none");
      if (pane === "chat") {
        void this.activateChatView();
      } else if (pane === "related") {
        void this.activateRelatedView();
      }
      if (this.settings.mcpEnabled && this.settings.apiKey && this.settings.workspaceId) {
        setTimeout(() => this.toggleMcpServer(true), 1500);
      }
      if (!this.settings.onboardingShownAt) {
        const isCloud = this.settings.connectionMode === "cloud";
        const looksConnected = isCloud ? !!(this.settings.apiKey && this.settings.workspaceId) : !!this.settings.workspaceId;
        if (!looksConnected) {
          setTimeout(() => new OnboardingModal(this.app, this).open(), 800);
        } else {
          this.settings.onboardingShownAt = Date.now();
          void this.saveSettings();
        }
      }
    });
  }
  async onunload() {
    this.app.workspace.detachLeavesOfType(RELATED_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);
    cancelSignIn();
    await this.mcp?.stop().catch(() => {
    });
  }
  async loadSettings() {
    this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
    if (this.settings.apiUrl === "https://cortex.hangarx.com") {
      this.settings.apiUrl = "https://cortex.hangarx.ai";
      await this.saveData(this.settings);
    }
    if (this.settings.connectionMode === "self-hosted") {
      this.settings.connectionMode = "local";
      await this.saveData(this.settings);
    }
    if (this.settings.embeddingPreset === "openai") {
      this.settings.embeddingPreset = "gemini";
      await this.saveData(this.settings);
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
    if (this.client) this.client = new CortexClient(this.settings);
  }
  /**
   * Toggle the local MCP server. Called from settings on enable/disable.
   */
  async toggleMcpServer(enabled) {
    if (enabled) {
      if (!this.settings.mcpToken) {
        this.settings.mcpToken = generateToken();
        await this.saveSettings();
      }
      try {
        await this.mcp.start();
      } catch (e) {
        new import_obsidian18.Notice(`HangarX MCP: failed to start (${e.message})`);
        this.settings.mcpEnabled = false;
        await this.saveSettings();
      }
    } else {
      await this.mcp.stop();
    }
  }
  async activateRelatedView() {
    const existing = this.app.workspace.getLeavesOfType(RELATED_VIEW_TYPE);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: RELATED_VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }
  /** Open the Graph Pull modal in pull mode. Public so settings buttons + commands share one entry point. */
  runGraphPull() {
    const gp = this.buildCloudGraphPull();
    if (!gp) return;
    new GraphPullModal(this.app, gp, "pull", {
      source: "cloud",
      sourceLabel: new URL(CLOUD_API_URL).host
    }).open();
  }
  /** Open the Graph Pull modal in dry-run mode. */
  runGraphPullPreview() {
    const gp = this.buildCloudGraphPull();
    if (!gp) return;
    new GraphPullModal(this.app, gp, "preview", {
      source: "cloud",
      sourceLabel: new URL(CLOUD_API_URL).host
    }).open();
  }
  /** Open the Graph Pull modal in cheap "summary" mode (one /graph/stats call). */
  runGraphPullSummary() {
    const gp = this.buildCloudGraphPull();
    if (!gp) return;
    new GraphPullModal(this.app, gp, "summary", {
      source: "cloud",
      sourceLabel: new URL(CLOUD_API_URL).host
    }).open();
  }
  /**
   * Graph pull always targets cortex.hangarx.ai with the saved cloud API key
   * + workspace ID, regardless of the plugin's current connection mode. The
   * "import graph into vault" feature is conceptually a cloud-only action —
   * locally there's nothing extra to pull beyond what the user just synced.
   *
   * Returns null after surfacing a Notice if the cloud creds are missing.
   */
  buildCloudGraphPull() {
    if (!this.settings.apiKey) {
      new import_obsidian18.Notice("HangarX: Cloud API key is empty. Open Settings \u2192 Connection details and sign in or paste a key.");
      return null;
    }
    if (!this.settings.workspaceId) {
      new import_obsidian18.Notice("HangarX: Cloud workspace ID is empty. Open Settings \u2192 Connection details.");
      return null;
    }
    const cloudSettings = {
      ...this.settings,
      apiUrl: CLOUD_API_URL,
      connectionMode: "cloud"
    };
    const cloudClient = new CortexClient(cloudSettings);
    return new GraphPull(this.app, cloudClient, cloudSettings);
  }
  async activateChatView() {
    const existing = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: CHAT_VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }
  /**
   * Open the chat side panel (creating it if needed) and prefill the composer
   * with a starter query. Used by Memory Stats "drill in" rows so a user can
   * jump from "1,855 Notes" to a sensible exploratory question in one click.
   */
  async askInChat(text) {
    await this.activateChatView();
    setTimeout(() => {
      const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE);
      const view = leaves[0]?.view;
      view?.prefill(text);
    }, 80);
  }
  /**
   * Wrap fullSync with pre-flight checks + visible error feedback.
   */
  /**
   * Push a single note to the knowledge graph immediately. Bypasses the
   * 2-second auto-sync debounce. Surfaces a Notice so the user knows
   * whether it actually pushed (vs. skipped because the hash matched).
   */
  async runSyncCurrentNote(file) {
    const s = this.settings;
    if (!s.workspaceId) {
      new import_obsidian18.Notice("HangarX: Workspace ID is empty. Open Settings \u2192 Connection.");
      return;
    }
    const notice = new import_obsidian18.Notice(`HangarX: syncing ${file.basename}\u2026`, 0);
    try {
      const result = await this.sync.syncOneFile(file);
      notice.hide();
      switch (result) {
        case "synced":
          new import_obsidian18.Notice(`\u2713 Synced ${file.basename}`, 3e3);
          break;
        case "unchanged":
          new import_obsidian18.Notice(`${file.basename} is already up to date`, 3e3);
          break;
        case "skipped":
          new import_obsidian18.Notice(`Skipped ${file.basename} (empty or excluded by filters)`, 4e3);
          break;
      }
    } catch (e) {
      notice.hide();
      new import_obsidian18.Notice(`HangarX sync failed for ${file.basename}: ${e.message}`, 6e3);
    }
  }
  async runFullSyncWithFeedback() {
    const s = this.settings;
    if (!s.apiKey) {
      new import_obsidian18.Notice("HangarX: API key is empty. Open Settings \u2192 Connection.");
      return;
    }
    if (!s.workspaceId) {
      new import_obsidian18.Notice("HangarX: Workspace ID is empty. Open Settings \u2192 Connection.");
      return;
    }
    const fileCount = this.app.vault.getMarkdownFiles().length;
    if (fileCount === 0) {
      new import_obsidian18.Notice("HangarX: vault has no markdown files to sync.");
      return;
    }
    const abort = new AbortController();
    const progress = makeProgressNotice(
      `HangarX: syncing ${fileCount} files\u2026`,
      () => abort.abort()
    );
    try {
      const result = await this.sync.fullSync({
        onProgress: progress.update,
        signal: abort.signal
      });
      progress.notice.hide();
      const { synced, skipped, deleted, failed = 0, failedPaths = [], paused } = result;
      if (paused === "cancelled") {
        new import_obsidian18.Notice(`\u23F9 HangarX sync cancelled \u2014 ${synced} synced, ${skipped} unchanged so far.`, 5e3);
        return;
      }
      const headline = failed > 0 ? `\u26A0\uFE0F HangarX sync: ${synced} updated, ${skipped} unchanged, ${deleted} removed, ${failed} FAILED` : `\u2705 HangarX sync: ${synced} updated, ${skipped} unchanged, ${deleted} removed`;
      new import_obsidian18.Notice(headline, failed > 0 ? 1e4 : 4e3);
      if (failed > 0) {
        const sample = failedPaths.slice(0, 3).join(", ");
        const more = failedPaths.length > 3 ? ` (+${failedPaths.length - 3} more)` : "";
        new import_obsidian18.Notice(`Failures: ${sample}${more}`, 1e4);
      }
      if (synced === 0 && skipped > 0) {
        try {
          const stats = await this.client.getGraphStats();
          if (stats.totalEntities === 0) {
            new import_obsidian18.Notice(
              `\u26A0\uFE0F Index says ${skipped} files are already synced, but the server graph is empty. Run "Force re-ingest entire vault" from the command palette to re-push everything.`,
              12e3
            );
          }
        } catch {
        }
      } else if (synced === 0 && skipped > 0 && deleted === 0) {
        new import_obsidian18.Notice("Everything was already up to date.");
      }
    } catch (e) {
      progress.notice.hide();
      const msg = e.message || String(e);
      console.error("[Cortex] fullSync failed:", e);
      new import_obsidian18.Notice(`HangarX sync failed: ${truncate(msg, 200)}`, 8e3);
    }
  }
  /**
   * Force-resync: clear the per-file index then run a full sync.
   */
  async runForceResyncWithFeedback() {
    const fileCount = this.app.vault.getMarkdownFiles().length;
    if (fileCount === 0) {
      new import_obsidian18.Notice("HangarX: vault has no markdown files to sync.");
      return;
    }
    const confirmed = confirm(
      `Force-resync ${fileCount} files into the knowledge graph?

This wipes the local sync index and re-pushes every file. Use this after the server-side graph has been reset (e.g. Docker volume wiped). It's safe \u2014 your notes themselves aren't touched.`
    );
    if (!confirmed) return;
    const abort = new AbortController();
    const progress = makeProgressNotice(
      `HangarX: clearing index + re-pushing ${fileCount} files\u2026`,
      () => abort.abort()
    );
    try {
      await this.sync.clearIndex();
      const result = await this.sync.fullSync({
        onProgress: progress.update,
        signal: abort.signal,
        fastMode: true
      });
      progress.notice.hide();
      const { synced, skipped, deleted, paused } = result;
      if (paused === "cancelled") {
        new import_obsidian18.Notice(`\u23F9 Force-resync cancelled \u2014 ${synced} re-ingested so far.`, 5e3);
        return;
      }
      const noticeText = `\u2705 Force-resync done: ${synced} ingested, ${skipped} skipped, ${deleted} removed.
Click here to rebuild communities + reindex (recommended).`;
      const finishNotice = new import_obsidian18.Notice(noticeText, 12e3);
      finishNotice.noticeEl.addClass("cortex-clickable-notice");
      finishNotice.noticeEl.style.cursor = "pointer";
      finishNotice.noticeEl.addEventListener("click", () => {
        finishNotice.hide();
        void this.runRebuildCommunitiesAndReindex();
      });
    } catch (e) {
      progress.notice.hide();
      const msg = e.message || String(e);
      console.error("[Cortex] forceResync failed:", e);
      new import_obsidian18.Notice(`HangarX force-resync failed: ${truncate(msg, 200)}`, 8e3);
    }
  }
  /**
   * Restore the post-ingest steps fastMode skipped: detect graph communities
   * and backfill embeddings for any structured entities without them. Runs
   * the two endpoints sequentially because community detection depends on
   * having entity embeddings; surfaces failures individually so a partial
   * success still tells the user what worked.
   */
  async runRebuildCommunitiesAndReindex() {
    const progress = new import_obsidian18.Notice("HangarX: rebuilding communities + reindexing\u2026", 0);
    let reindexOk = false;
    let detectOk = false;
    let detectStats = null;
    try {
      await this.client.backfillEntityEmbeddings();
      reindexOk = true;
    } catch (e) {
      console.warn("[Cortex] backfillEntityEmbeddings failed:", e);
    }
    try {
      detectStats = await this.client.detectCommunities();
      detectOk = true;
    } catch (e) {
      console.warn("[Cortex] detectCommunities failed:", e);
    }
    progress.hide();
    if (reindexOk && detectOk && detectStats) {
      new import_obsidian18.Notice(
        `\u2705 Reindex done. ${detectStats.communitiesCreated} communities across ${detectStats.levels} levels.`,
        8e3
      );
    } else if (reindexOk || detectOk) {
      const parts = [];
      parts.push(reindexOk ? "\u2713 Embeddings backfilled" : "\u2717 Backfill failed");
      parts.push(detectOk ? "\u2713 Communities detected" : "\u2717 Community detection failed");
      new import_obsidian18.Notice(`HangarX rebuild partial: ${parts.join(" \xB7 ")} (see console)`, 1e4);
    } else {
      new import_obsidian18.Notice("HangarX rebuild failed \u2014 see console for details.", 8e3);
    }
  }
};
function truncate(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "\u2026";
}
