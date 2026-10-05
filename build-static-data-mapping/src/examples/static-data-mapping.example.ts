import { type StaticDataInfoContent, type StaticDataInfo } from '../types/output-data.types';

export function processNocturnalAspects(value: Hades2StaticDataNocturnalAspectsFragment): StaticDataInfo {
  const titleColor = '#B63AE9';

  const content: StaticDataInfoContent[] = [];

  // Add cost requirements section
  const costRequirements = value.cost?.map(cost => ({ rank: `Rank ${cost.rank}`, cost: `${cost.value}` })) || [];

  if (costRequirements.length) {
    content.push(
      {
        type: 'description',
        value: 'Requirement',
        color: '#E6CC80',
      },
      {
        type: 'bullet-list',
        listStyle: 'none',
        value: [
          // plain row: a single text
          { title: 'Unlock cost per rank', color: '#FFFFFF' },
          // two-column rows: the last column is aligned to the right edge
          ...costRequirements.map(item => ({
            columns: [{ text: item.rank, color: '#FFFFFF' }, { text: item.cost, color: '#FFD100' }],
          })),
        ],
      },
    );
  }

  // Add main description
  if (value.aspectDescription) {
    content.push({
      type: 'description',
      value: value.aspectDescription,
    });
  }

  // Add flavor text
  if (value.flavorText) {
    content.push({ type: 'divider' });
    content.push({
      type: 'flavor',
      value: value.flavorText,
      color: '#C8A2E8',
    });
  }

  return {
    slug: value.slug,
    title: value.name,
    titleColor,
    subTitle: value.weapon?.name ?? '',
    icon: value.iconUrl || '',
    type: 'nocturnalAspects',
    groupName: 'Nocturnal Aspects',
    iconStyle: 'square-rounded',
    content,
  };
}
