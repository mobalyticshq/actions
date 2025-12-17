import { type StaticDataInfoContent, type StaticDataInfo } from '../types/generic-static-data.type';

export function processNocturnalAspects(value: Hades2StaticDataNocturnalAspectsFragment): StaticDataInfo {
  const color = '#1D4A7C';
  const tooltipColor = '#B63AE9';

  const content: StaticDataInfoContent[] = [];

  // Add cost requirements section
  const costRequirements = value.cost?.map(cost => `Rank ${cost.rank}: ${cost.value}`).filter(Boolean) || [];

  content.push([
    {
      type: 'description',
      value: 'Requirement',
    },
    {
      type: 'bullet-list',
      value: costRequirements.map(item => ({ title: item })),
    },
  ]);

  // Add main description
  if (value.aspectDescription) {
    content.push({
      type: 'description',
      value: value.aspectDescription,
    });
  }

  // Add flavor text
  if (value.flavorText) {
    content.push({
      type: 'flavor',
      value: value.flavorText,
    });
  }

  return {
    slug: value.slug,
    title: value.name,
    subTitle: value.weapon?.name ?? '',
    icon: value.iconUrl || '',
    color,
    type: 'nocturnalAspects',
    groupName: 'Nocturnal Aspects',
    iconStyle: 'square-rounded',
    content,
  };
}
