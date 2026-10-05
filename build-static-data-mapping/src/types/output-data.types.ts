import { type ReactNode } from 'react';

// todo Stas - all these types should be shared with web-gpi progect

export type NgfTooltipTableColumn = {
  key: string;
  title: string;
  dataIndex: string;
};

export type NgfTooltipTableRowData = {
  [key: string]: string | number;
};

export type NgfTooltipTableRow = {
  cells: NgfTooltipTableRowData;
  color?: string | null;
};

export type TooltipStructureTags = {
  type: 'tags';
  value: { name: string; icon?: string; color?: string; backgroundColor?: string }[];
};

export type TooltipText = { text: ReactNode; color?: string };

// `columns` renders one row split across the full width, the last column is aligned to the right edge
export type TooltipStructureBulletListItem = {
  listStyleImageUrl?: string;
  color?: string;
} & ({ title: ReactNode } | { columns: TooltipText[] });

export type TooltipStructureBulletList = {
  type: 'bullet-list';
  // 'none' hides the bullet markers
  listStyle?: string;
  header?: ReactNode;
  color?: string;
  value: TooltipStructureBulletListItem[];
};

export type TooltipStructureTable = {
  type: 'table';
  color?: string;
  // a row is either flat cells keyed by `dataIndex`, or `{ cells, color }` to color that row
  value: { columns: NgfTooltipTableColumn[]; data: (NgfTooltipTableRowData | NgfTooltipTableRow)[] };
};

export type TooltipStructureStats = {
  type: 'stats';
  value: { name: ReactNode; value: ReactNode; labelFirst?: boolean; nameColor?: string; valueColor?: string }[];
};
export type TooltipStructureDescription = { type: 'description'; value: string; color?: string };
export type TooltipDivider = { type: 'divider' };
export type TooltipStructureFlavor = { type: 'flavor'; value: string; color?: string };
export type TooltipStructureDataList = {
  type: 'data-list';
  value: { icon?: string; name: string; description: string; nameColor?: string; descriptionColor?: string }[];
};
export type TooltipStructureImageList = { type: 'image-list'; value: { imageUrl: string; name?: string }[] };

export type StaticDataInfoContent =
  | TooltipStructureTags
  | TooltipStructureBulletList
  | TooltipStructureTable
  | TooltipStructureStats
  | TooltipStructureDescription
  | TooltipStructureFlavor
  | TooltipStructureDataList
  | TooltipStructureImageList
  | TooltipDivider;

export type StaticDataInfo = {
  slug: string;
  type: string;
  groupName: string;
  // tints the top of the tooltip with a gradient overlay; use titleColor to color the title text
  color?: string | null;
  backgroundImage?: string | null;
  // 'top' (default) anchors the image to the top at full width; 'cover' fills the whole tooltip
  backgroundSize?: 'top' | 'cover' | null;
  isTooltipDisabled?: boolean;
  icon: string | null;
  iconStyle: 'square' | 'square-rounded' | 'circle';
  title: string;
  titleColor?: string | null;
  subTitle?: string | null;
  subTitleColor?: string | null;
  hotkey?: string | null;
  content?: StaticDataInfoContent[] | null;
};
