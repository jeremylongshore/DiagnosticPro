import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://diagnosticpro.io";

const EQUIPMENT_LABELS: Record<string, string> = {
  automotive: "Cars and Automotive Equipment",
  "gas-trucks": "Gas Trucks",
  "diesel-trucks": "Diesel Trucks",
  "semi-trucks": "Semi Trucks",
  motorcycles: "Motorcycles",
  "atvs-utvs": "ATVs and UTVs",
  rvs: "RVs",
  marine: "Boats and Marine Equipment",
  "farm-ag": "Farm and Agricultural Equipment",
  "compact-equipment": "Compact Equipment",
  "lawn-garden": "Lawn and Garden Equipment",
  "power-tools": "Power Tools",
  hvac: "HVAC Equipment",
  "golf-carts": "Golf Carts",
  electronics: "Electronics",
};

const EQUIPMENT_ALIASES: Record<string, string> = {
  cars: "automotive",
  boats: "marine",
  farm: "farm-ag",
};

const PUBLIC_METADATA = {
  "/": {
    title: "AI Equipment Diagnostic Second Opinion | DiagnosticPro",
    description:
      "Know what is wrong before you authorize repairs. Get an AI-assisted second opinion for cars, trucks, boats, HVAC, farm equipment, and more for $4.99.",
  },
  "/terms": {
    title: "Terms of Service | DiagnosticPro",
    description:
      "Read the DiagnosticPro Terms of Service for AI-assisted equipment diagnostic reports.",
  },
  "/privacy": {
    title: "Privacy Policy | DiagnosticPro",
    description:
      "Read how DiagnosticPro handles diagnostic submissions, payments, and optional photo evidence.",
  },
  "/acceptable-use": {
    title: "Acceptable Use Policy | DiagnosticPro",
    description:
      "Read the DiagnosticPro Acceptable Use Policy for diagnostic requests and report access.",
  },
};

const PRIVATE_PATHS = ["/auth/", "/report/", "/success", "/payment-success", "/test-monitor"];

function upsertMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

function normalizePath(pathname: string) {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}

function metadataForPath(pathname: string) {
  const normalizedPath = normalizePath(pathname);
  const equipmentMatch = normalizedPath.match(/^\/equipment\/([^/]+)$/);

  if (equipmentMatch) {
    const requestedSlug = equipmentMatch[1].toLowerCase();
    const canonicalSlug = EQUIPMENT_ALIASES[requestedSlug] ?? requestedSlug;
    const label = EQUIPMENT_LABELS[canonicalSlug];

    if (label) {
      return {
        title: `${label} Diagnostic Second Opinion | DiagnosticPro`,
        description: `Get an AI-assisted second opinion before authorizing repairs on ${label.toLowerCase()}. DiagnosticPro helps identify likely causes, fair price ranges, and questions to ask your shop.`,
        robots: "index,follow",
        canonicalPath: `/equipment/${canonicalSlug}`,
      };
    }
  }

  const publicMetadata = PUBLIC_METADATA[normalizedPath as keyof typeof PUBLIC_METADATA];
  if (publicMetadata) {
    return {
      ...publicMetadata,
      robots: "index,follow",
      canonicalPath: normalizedPath,
    };
  }

  const isPrivate = PRIVATE_PATHS.some((prefix) => normalizedPath.startsWith(prefix));
  return {
    title: isPrivate ? "DiagnosticPro" : "Page not found | DiagnosticPro",
    description: isPrivate
      ? "DiagnosticPro customer and transaction page."
      : "The requested DiagnosticPro page could not be found.",
    robots: "noindex,nofollow",
    canonicalPath: "/",
  };
}

export const RouteSeo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = metadataForPath(pathname);
    document.title = metadata.title;
    upsertMeta("description", metadata.description);
    upsertMeta("robots", metadata.robots);
    upsertCanonical(`${SITE_URL}${metadata.canonicalPath}`);
  }, [pathname]);

  return null;
};
