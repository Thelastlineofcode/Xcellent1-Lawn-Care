/**
 * squanchy/gbp-weekly-post.ts
 * 
 * Google Business Profile weekly post generation agent.
 * Runs every Monday at 8am CT via cron.
 * 
 * Content rotation:
 * 1. Seasonal lawn care tip
 * 2. Service highlight
 * 3. Customer review request
 * 4. Before/after photo prompt
 * 
 * Usage:
 *   deno run --allow-net --allow-env agents/squanchy/gbp-weekly-post.ts
 * 
 * Cron (Fly.io):
 *   flyctl machine run --schedule "0 8 * * 1" ./target/release/xcellent1 squanchy gbp-weekly-post
 */

const BUSINESS = {
  name: "Xcellent1 Lawn Care",
  phone: "+1-504-875-8079",
  website: "https://xcellent1lawncare.com",
  gbpUrl: "https://g.page/r/CZbYqiFFQ57SEBM",
  serviceAreas: ["LaPlace", "Norco", "Destrehan", "Luling", "St. Rose"],
} as const;

interface GBPPhoto {
  sourceUrl: string;
  caption: string;
}

interface GBPPost {
  summary: string;
  callToAction: {
    actionType: "LEARN_MORE" | "BOOK" | "SIGN_UP" | "CALL";
    url?: string;
    phoneNumber?: string;
  };
  media?: {
    photoData: {
      sourceUrl: string;
      caption: string;
    }[];
  };
}

type ContentType = "seasonal_tip" | "service_highlight" | "review_request" | "before_after";

function getSeasonalTip(): { summary: string; photo?: GBPPhoto } {
  const month = new Date().getMonth();
  
  const tips: Record<number, { summary: string; photoCaption: string }> = {
    0: { summary: "Start your year right! January is the perfect time to plan your spring lawn care. Contact us for a free consultation.", photoCaption: "Planning for spring" },
    1: { summary: "February prep: Rake up debris and plan your fertilization schedule. We're booking spring appointments now!", photoCaption: "Spring preparation" },
    2: { summary: "March is here! Time to dethatch and aerate. Schedule your spring lawn service before we're booked out.", photoCaption: "Spring lawn prep" },
    3: { summary: "Keep up with weekly mowing as your St. Augustine grass wakes up. We offer flexible weekly schedules.", photoCaption: "Weekly mowing service" },
    4: { summary: "Memorial Day lawn check! Make sure your yard is ready for summer gatherings. We offer same-week availability.", photoCaption: "Summer lawn ready" },
    5: { summary: "Beat the heat! Raise your mowing height to 3-4 inches to help your grass survive Louisiana summer.", photoCaption: "Summer lawn care" },
    6: { summary: "Stay ahead of chinch bugs! Regular monitoring and treatment keep your lawn green all summer.", photoCaption: "Pest control" },
    7: { summary: "Back to school lawn prep! Get your yard ready for fall with our comprehensive maintenance plans.", photoCaption: "Fall lawn prep" },
    8: { summary: "Fall aeration time! Core aeration helps your lawn absorb nutrients before winter dormancy.", photoCaption: "Fall aeration" },
    9: { summary: "October is the perfect time for overseeding. Contact us for fall lawn renovation services.", photoCaption: "Fall seeding" },
    10: { summary: "Prep your irrigation for winter shutdown. We offer system winterization services.", photoCaption: "Winter prep" },
    11: { summary: "Year-round care matters! We're here through the winter for cleanup and planning. Book your 2025 service now.", photoCaption: "Year-round care" },
  };
  
  const tip = tips[month] || tips[0];
  return {
    summary: tip.summary,
    photo: {
      sourceUrl: "https://xcellent1lawncare.com/static/images/lawn-care-seasonal.jpg",
      caption: tip.photoCaption,
    },
  };
}

function getServiceHighlight(): { summary: string; photo: GBPPhoto } {
  const services = [
    {
      name: "Core Aeration",
      description: "Improve water and nutrient absorption with professional core aeration. Perfect for compacted Louisiana clay soil.",
      photoCaption: "Core aeration service",
    },
    {
      name: "Weekly Mowing",
      description: "Consistent weekly mowing keeps your lawn healthy and your HOA happy. We offer flexible scheduling.",
      photoCaption: "Professional mowing",
    },
    {
      name: "Fertilization Programs",
      description: "Custom fertilization plans for St. Augustine, Bermuda, and Zoysia grasses. Ask about our 4-season programs.",
      photoCaption: "Professional fertilization",
    },
    {
      name: "Weed Control",
      description: "Say goodbye to crabgrass and clover! Our pre-emergent and post-emergent treatments keep weeds at bay.",
      photoCaption: "Weed control results",
    },
    {
      name: "Bush Hogging",
      description: "Large properties need love too! We handle rural lots, acreage, and commercial properties.",
      photoCaption: "Bush hogging service",
    },
    {
      name: "Landscape Design",
      description: "Transform your yard with our landscape design services. From flower beds to full outdoor living spaces.",
      photoCaption: "Landscape design project",
    },
  ];
  
  const service = services[new Date().getDate() % services.length];
  
  return {
    summary: `This week we're highlighting: ${service.name}!\n\n${service.description}\n\nContact us at ${BUSINESS.phone} for a free quote!`,
    photo: {
      sourceUrl: "https://xcellent1lawncare.com/static/images/service-highlight.jpg",
      caption: service.photoCaption,
    },
  };
}

function getReviewRequest(): { summary: string } {
  const templates = [
    "Happy Monday! If we've had the pleasure of serving your lawn this season, we'd love to hear from you. Your reviews help other local homeowners discover quality lawn care. Link in bio! 🌿",
    "Have you been loving your lawn lately? We'd appreciate it if you could share your experience on Google. Your feedback helps small businesses like ours grow! Link: https://g.page/r/CZbYqiFFQ57SEBM/review",
    "Thank you for trusting Xcellent1 Lawn Care with your property! If you've been happy with our service, we'd be grateful for a quick Google review. Every review helps us serve more LaPlace families!",
  ];
  
  return {
    summary: templates[new Date().getDate() % templates.length],
  };
}

function getBeforeAfterPrompt(): { summary: string; photo: GBPPhoto } {
  return {
    summary: "Have before/after photos from our service? Share them with us! Tag @xcellent1lawncare and use #Xcellent1LaPlace for a chance to be featured. We love showcasing the transformations we create together!",
    photo: {
      sourceUrl: "https://xcellent1lawncare.com/static/images/before-after-example.jpg",
      caption: "Your lawn could look like this!",
    },
  };
}

function generatePost(): GBPPost {
  const contentTypes: ContentType[] = ["seasonal_tip", "service_highlight", "review_request", "before_after"];
  const dayOfWeek = new Date().getDay();
  const contentIndex = (dayOfWeek + new Date().getDate()) % 4;
  const contentType = contentTypes[contentIndex];
  
  switch (contentType) {
    case "seasonal_tip": {
      const tip = getSeasonalTip();
      return {
        summary: `${BUSINESS.name} Lawn Care Tip:\n\n${tip.summary}\n\nServing ${BUSINESS.serviceAreas.join(", ")}`,
        callToAction: {
          actionType: "LEARN_MORE",
          url: BUSINESS.website,
        },
        media: tip.photo ? { photoData: [tip.photo] } : undefined,
      };
    }
    
    case "service_highlight": {
      const highlight = getServiceHighlight();
      return {
        summary: `${highlight.summary}\n\nServing ${BUSINESS.serviceAreas.join(", ")}`,
        callToAction: {
          actionType: "CALL",
          phoneNumber: BUSINESS.phone,
        },
        media: { photoData: [highlight.photo] },
      };
    }
    
    case "review_request": {
      const request = getReviewRequest();
      return {
        summary: request.summary,
        callToAction: {
          actionType: "LEARN_MORE",
          url: BUSINESS.gbpUrl,
        },
      };
    }
    
    case "before_after": {
      const prompt = getBeforeAfterPrompt();
      return {
        summary: prompt.summary,
        callToAction: {
          actionType: "LEARN_MORE",
          url: BUSINESS.website,
        },
        media: { photoData: [prompt.photo] },
      };
    }
  }
}

async function postToGBP(post: GBPPost): Promise<void> {
  console.log("📝 Generated GBP Post:");
  console.log(`   Summary: ${post.summary.substring(0, 100)}...`);
  console.log(`   CTA: ${post.callToAction.actionType}`);
  
  const GMB_API_KEY = Deno.env.get("GOOGLE_MY_BUSINESS_API_KEY");
  
  if (!GMB_API_KEY) {
    console.log("⚠️  GOOGLE_MY_BUSINESS_API_KEY not set. Skipping live post.");
    console.log("   In production, this would POST to:");
    console.log("   https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations/{locationId}/localPosts");
    return;
  }
  
  const locationId = Deno.env.get("GOOGLE_BUSINESS_LOCATION_ID");
  const accountId = Deno.env.get("GOOGLE_BUSINESS_ACCOUNT_ID");
  
  if (!locationId || !accountId) {
    throw new Error("Missing GOOGLE_BUSINESS_LOCATION_ID or GOOGLE_BUSINESS_ACCOUNT_ID");
  }
  
  const response = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations/${locationId}/localPosts`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GMB_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(post),
    },
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GBP API error: ${response.status} - ${error}`);
  }
  
  const result = await response.json();
  console.log("✅ Posted to Google Business Profile:", result.name);
}

async function main() {
  console.log(`🚀 squanchy/gbp-weekly-post starting...`);
  console.log(`   Business: ${BUSINESS.name}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  
  const post = generatePost();
  await postToGBP(post);
  
  console.log("✨ Done!");
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("❌ Error:", err);
    Deno.exit(1);
  });
}
