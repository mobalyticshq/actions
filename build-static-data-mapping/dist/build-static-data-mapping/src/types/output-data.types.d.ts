import { type ReactNode } from 'react';
export type NgfTooltipTableColumn = {
    key: string;
    title: string;
    dataIndex: string;
};
export type NgfTooltipTableRowData = {
    [key: string]: string | number;
};
export type TooltipStructureTags = {
    type: 'tags';
    value: {
        name: string;
        icon?: string;
    }[];
};
export type TooltipStructureBulletList = {
    type: 'bullet-list';
    value: {
        title: ReactNode;
        listStyleImageUrl?: string;
        color?: string;
    }[];
};
export type TooltipStructureTable = {
    type: 'table';
    value: {
        columns: NgfTooltipTableColumn[];
        data: NgfTooltipTableRowData[];
    };
};
export type TooltipStructureStats = {
    type: 'stats';
    value: {
        name: ReactNode;
        value: ReactNode;
        labelFirst?: boolean;
    }[];
};
export type TooltipStructureDescription = {
    type: 'description';
    value: string;
};
export type TooltipStructureFlavor = {
    type: 'flavor';
    value: string;
};
export type TooltipStructureDataList = {
    type: 'data-list';
    value: {
        icon?: string;
        name: string;
        description: string;
    }[];
};
export type TooltipStructureImageList = {
    type: 'image-list';
    value: {
        imageUrl: string;
        name?: string;
    }[];
};
export type StaticDataInfoContent = TooltipStructureTags | TooltipStructureBulletList | TooltipStructureTable | TooltipStructureStats | TooltipStructureDescription | TooltipStructureFlavor | TooltipStructureDataList | TooltipStructureImageList;
export type StaticDataInfo = {
    slug: string;
    type: string;
    groupName: string;
    color?: string | null;
    backgroundImage?: string | null;
    tooltipColor?: string | null;
    isTooltipDisabled?: boolean;
    icon: string | null;
    iconStyle: 'square' | 'square-rounded' | 'circle';
    title: string;
    subTitle?: string | null;
    hotkey?: string | null;
    content?: StaticDataInfoContent[] | null;
};
//# sourceMappingURL=output-data.types.d.ts.map