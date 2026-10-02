import { type ReactNode } from 'react';
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
    value: {
        name: string;
        icon?: string;
        color?: string;
        backgroundColor?: string;
    }[];
};
export type TooltipStructureBulletList = {
    type: 'bullet-list';
    listStyle?: string;
    header?: ReactNode;
    color?: string;
    value: {
        title: ReactNode;
        listStyleImageUrl?: string;
        color?: string;
        right?: ReactNode;
        rightColor?: string;
    }[];
};
export type TooltipStructureTable = {
    type: 'table';
    color?: string;
    value: {
        columns: NgfTooltipTableColumn[];
        data: (NgfTooltipTableRowData | NgfTooltipTableRow)[];
    };
};
export type TooltipStructureStats = {
    type: 'stats';
    value: {
        name: ReactNode;
        value: ReactNode;
        labelFirst?: boolean;
        nameColor?: string;
        valueColor?: string;
    }[];
};
export type TooltipStructureDescription = {
    type: 'description';
    value: string;
    color?: string;
};
export type TooltipDivider = {
    type: 'divider';
};
export type TooltipStructureFlavor = {
    type: 'flavor';
    value: string;
    color?: string;
};
export type TooltipStructureDataList = {
    type: 'data-list';
    value: {
        icon?: string;
        name: string;
        description: string;
        nameColor?: string;
        descriptionColor?: string;
    }[];
};
export type TooltipStructureImageList = {
    type: 'image-list';
    value: {
        imageUrl: string;
        name?: string;
    }[];
};
export type StaticDataInfoContent = TooltipStructureTags | TooltipStructureBulletList | TooltipStructureTable | TooltipStructureStats | TooltipStructureDescription | TooltipStructureFlavor | TooltipStructureDataList | TooltipStructureImageList | TooltipDivider;
export type StaticDataInfo = {
    slug: string;
    type: string;
    groupName: string;
    color?: string | null;
    backgroundImage?: string | null;
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
//# sourceMappingURL=output-data.types.d.ts.map