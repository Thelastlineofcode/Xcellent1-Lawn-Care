/**
 * Markdoc schema for Xcellent1 Lawn Care service pages
 * Defines frontmatter and content structure for service docs
 */

export interface ServiceFrontmatter {
  title: string;
  description: string;
  slug: string;
  category: 'residential' | 'commercial';
  tags?: string[];
  erc_phase?: 'empathize' | 'realize' | 'conceptualize' | 'blocked';
  price_range?: string;
  duration_estimate?: string;
  locations?: string[];
  image?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export const serviceSchema = {
  frontmatter: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true },
    category: {
      type: String,
      required: true,
      matches: ['residential', 'commercial'],
    },
    tags: { type: Array },
    erc_phase: {
      type: String,
      matches: ['empathize', 'realize', 'conceptualize', 'blocked'],
    },
    price_range: { type: String },
    duration_estimate: { type: String },
    locations: { type: Array },
    image: { type: String },
    seo: { type: Object },
  },
};

export default serviceSchema;
