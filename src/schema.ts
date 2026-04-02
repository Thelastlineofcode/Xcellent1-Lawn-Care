export interface LocalBusinessSchema {
  "@context": "https://schema.org";
  "@type": "LawnCareService" | "LocalBusiness";
  name: string;
  image: string;
  url: string;
  telephone: string;
  address: {
    "@type": "PostalAddress";
    streetAddress?: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
  areaServed: string[];
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string[] | string;
    opens: string;
    closes: string;
  }[];
  priceRange: string;
  sameAs: string[];
}

export interface FAQQuestion {
  "@type": "Question";
  name: string;
  acceptedAnswer: {
    "@type": "Answer";
    text: string;
  };
}

export interface FAQPageSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: FAQQuestion[];
}

export const BUSINESS_INFO = {
  name: "Xcellent1 Lawn Care",
  phone: "+1-504-875-8079",
  email: "info@xcellent1lawn.com",
  address: {
    streetAddress: "",
    locality: "LaPlace",
    region: "LA",
    postalCode: "70068",
    country: "US",
  },
  geo: {
    latitude: 30.0655,
    longitude: -90.4682,
  },
  website: "https://xcellent1lawncare.com",
  logoUrl: "https://xcellent1lawncare.com/static/images/xcellent1-logo-transparent.png",
  gbpUrl: "https://g.page/r/CZbYqiFFQ57SEBM",
  yelpUrl: "https://www.yelp.com/biz/xcellent1-lawn-care-laplace",
  facebookUrl: "",
} as const;

export const SERVICE_AREAS = [
  "LaPlace, LA",
  "Norco, LA",
  "Destrehan, LA",
  "Luling, LA",
  "St. Rose, LA",
] as const;

export function getLocalBusinessSchema(): LocalBusinessSchema {
  const sameAs = [BUSINESS_INFO.gbpUrl];
  if (BUSINESS_INFO.yelpUrl) sameAs.push(BUSINESS_INFO.yelpUrl);
  if (BUSINESS_INFO.facebookUrl) sameAs.push(BUSINESS_INFO.facebookUrl);

  return {
    "@context": "https://schema.org",
    "@type": "LawnCareService",
    name: BUSINESS_INFO.name,
    image: BUSINESS_INFO.logoUrl,
    url: BUSINESS_INFO.website,
    telephone: BUSINESS_INFO.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS_INFO.address.streetAddress || undefined,
      addressLocality: BUSINESS_INFO.address.locality,
      addressRegion: BUSINESS_INFO.address.region,
      postalCode: BUSINESS_INFO.address.postalCode,
      addressCountry: BUSINESS_INFO.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS_INFO.geo.latitude,
      longitude: BUSINESS_INFO.geo.longitude,
    },
    areaServed: [...SERVICE_AREAS],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "07:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "07:00",
        closes: "14:00",
      },
    ],
    priceRange: "$$",
    sameAs,
  };
}

export function getFAQPageSchema(): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Who does lawn care near me in LaPlace Louisiana?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Xcellent1 Lawn Care serves LaPlace, Norco, Destrehan, Luling, and St. Rose. Call or book online for a free quote.",
        },
      },
      {
        "@type": "Question",
        name: "How much does lawn mowing cost in LaPlace LA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Xcellent1 Lawn Care offers competitive rates for residential and commercial lawn mowing in the LaPlace area. Request a free quote online.",
        },
      },
      {
        "@type": "Question",
        name: "Is Xcellent1 Lawn Care available on weekends?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Xcellent1 Lawn Care serves clients Monday through Saturday in LaPlace and surrounding areas.",
        },
      },
      {
        "@type": "Question",
        name: "Does Xcellent1 offer fertilization and aeration in Louisiana?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Xcellent1 provides fertilization, aeration, and full lawn care services tuned to Louisiana's warm-season grass types including St. Augustine, Bermuda, and Zoysia.",
        },
      },
      {
        "@type": "Question",
        name: "How do I book a lawn care service in Norco or Destrehan LA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Book online at ${BUSINESS_INFO.website} or call ${BUSINESS_INFO.phone}. Xcellent1 serves Norco, Destrehan, LaPlace, and surrounding St. John and St. Charles Parish communities.`,
        },
      },
    ],
  };
}

export function getSchemaScripts(): string {
  const localBusiness = getLocalBusinessSchema();
  const faqPage = getFAQPageSchema();
  
  return `
    <script type="application/ld+json">
    ${JSON.stringify(localBusiness, null, 2)}
    </script>
    <script type="application/ld+json">
    ${JSON.stringify(faqPage, null, 2)}
    </script>
  `.trim();
}
