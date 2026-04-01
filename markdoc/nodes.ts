import { Node, Tag } from '@markdoc/markdoc';

/**
 * Custom Markdoc node overrides for Xcellent1 Lawn Care
 * Extends default rendering with Xcellent1 brand styles
 */

export const heading = {
  render: 'Heading',
  children: ['inline'],
  attributes: {
    id: { type: String },
    level: { type: Number, required: true, default: 1 },
  },
  transform(node: Node, config: any) {
    const attributes = node.transformAttributes(config);
    const children = node.transformChildren(config);
    const id = attributes.id ??
      children
        .filter((c: any) => typeof c === 'string')
        .join(' ')
        .toLowerCase()
        .replace(/[^\w]+/g, '-');
    return new Tag(this.render, { ...attributes, id }, children);
  },
};

export const paragraph = {
  render: 'Paragraph',
  children: ['inline'],
  attributes: {},
};

export const fence = {
  render: 'CodeBlock',
  attributes: {
    language: { type: String },
    content: { type: String, render: false },
    process: { type: Boolean, render: false, default: false },
  },
};

export const code = {
  render: 'Code',
  attributes: {
    content: { type: String, render: false },
  },
};

export const link = {
  render: 'Link',
  children: ['strong', 'em', 's', 'code', 'text', 'tag', 'image'],
  attributes: {
    href: { type: String, required: true },
    title: { type: String },
  },
};

export const image = {
  render: 'Image',
  attributes: {
    src: { type: String, required: true },
    alt: { type: String },
    title: { type: String },
    width: { type: Number },
    height: { type: Number },
  },
};

export const list = {
  render: 'List',
  children: ['item'],
  attributes: {
    ordered: { type: Boolean, required: true, default: false },
  },
};

export const item = {
  render: 'ListItem',
  children: ['inline', 'heading', 'paragraph', 'image', 'table', 'list'],
  attributes: {},
};

export const strong = {
  render: 'Strong',
  children: ['inline'],
  attributes: {},
};

export const em = {
  render: 'Em',
  children: ['inline'],
  attributes: {},
};

export const hr = {
  render: 'HorizontalRule',
  attributes: {},
  selfClosing: true,
};

export const blockquote = {
  render: 'Blockquote',
  children: [
    'heading',
    'paragraph',
    'image',
    'table',
    'tag',
    'fence',
    'list',
  ],
  attributes: {},
};

export const nodes = {
  heading,
  paragraph,
  fence,
  code,
  link,
  image,
  list,
  item,
  strong,
  em,
  hr,
  blockquote,
};
