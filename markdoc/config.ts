import { nodes } from './nodes';
import { tags } from './tags';

/**
 * Markdoc configuration for Xcellent1 Lawn Care
 * Stripe-style docs with custom nodes and tags
 *
 * Business: Xcellent1 Lawn Care
 * Location: LaPlace, LA / Houston, TX metro
 */

export { nodes, tags };

export const config = {
  nodes,
  tags,
  variables: {
    company: {
      name: 'Xcellent1 Lawn Care',
      phone: '(985) 000-0000',
      email: 'info@xcellent1.com',
      locations: ['LaPlace, LA', 'Houston, TX'],
      erc_phases: ['empathize', 'realize', 'conceptualize', 'blocked'],
    },
    services: {
      residential: [
        'lawn-mowing',
        'edging',
        'weed-control',
        'fertilization',
        'leaf-removal',
        'aeration',
      ],
      commercial: [
        'property-maintenance',
        'landscape-design',
        'irrigation',
        'snow-removal',
      ],
    },
  },
};

export default config;
