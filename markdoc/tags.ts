import { Tag } from '@markdoc/markdoc';

/**
 * Xcellent1 Lawn Care — Markdoc Custom Tags
 * WFD Pillar 5: Stripe Docs Mindset
 * Docs: https://markdoc.dev/docs/tags
 */

export const callout = {
  render: 'Callout',
  description: 'Display a callout box (info, warning, danger)',
  children: ['paragraph', 'tag', 'list'],
  attributes: {
    type: {
      type: String,
      default: 'info',
      matches: ['info', 'warning', 'danger', 'success'],
      description: 'Callout severity level',
    },
    title: {
      type: String,
      description: 'Optional callout heading',
    },
  },
};

export const figure = {
  render: 'Figure',
  description: 'Image with optional caption',
  selfClosing: true,
  attributes: {
    src: { type: String, required: true },
    alt: { type: String, required: true },
    caption: { type: String },
  },
};

export const table = {
  render: 'Table',
  description: 'Responsive data table',
  children: ['thead', 'tbody'],
  attributes: {
    caption: { type: String },
  },
};

export const tabs = {
  render: 'Tabs',
  description: 'Tabbed content container',
  children: ['tab'],
  attributes: {},
};

export const tab = {
  render: 'Tab',
  description: 'Individual tab panel',
  children: ['paragraph', 'tag', 'list', 'fence'],
  attributes: {
    label: { type: String, required: true },
  },
};

export const erc_status = {
  render: 'ErcStatus',
  description: 'ERC phase status badge (empathize, realize, conceptualize, blocked)',
  selfClosing: true,
  attributes: {
    phase: {
      type: String,
      required: true,
      matches: ['empathize', 'realize', 'conceptualize', 'blocked'],
    },
    issue: { type: String, description: 'GitHub issue number e.g. X1-42' },
  },
};
