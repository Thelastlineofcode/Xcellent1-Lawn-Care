/**
 * Markdoc schema for Xcellent1 Lawn Care job/work-order documents
 * Defines frontmatter and content structure for job docs
 * Integrates with ERC phase tracking from RicksGarage framework
 */

export type ErcPhase = 'empathize' | 'realize' | 'conceptualize' | 'blocked';

export interface JobFrontmatter {
  title: string;
  job_id: string;
  customer: string;
  address: string;
  city: string;
  state: 'LA' | 'TX';
  service_type: string;
  assigned_to?: string;
  scheduled_date?: string;
  completed_date?: string;
  status: 'pending' | 'scheduled' | 'in-progress' | 'complete' | 'cancelled';
  erc_phase: ErcPhase;
  notes?: string;
  before_image?: string;
  after_image?: string;
  invoice_id?: string;
  tags?: string[];
}

export const jobSchema = {
  frontmatter: {
    title: { type: String, required: true },
    job_id: { type: String, required: true },
    customer: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: {
      type: String,
      required: true,
      matches: ['LA', 'TX'],
    },
    service_type: { type: String, required: true },
    assigned_to: { type: String },
    scheduled_date: { type: String },
    completed_date: { type: String },
    status: {
      type: String,
      required: true,
      matches: ['pending', 'scheduled', 'in-progress', 'complete', 'cancelled'],
    },
    erc_phase: {
      type: String,
      required: true,
      matches: ['empathize', 'realize', 'conceptualize', 'blocked'],
    },
    notes: { type: String },
    before_image: { type: String },
    after_image: { type: String },
    invoice_id: { type: String },
    tags: { type: Array },
  },
};

export default jobSchema;
