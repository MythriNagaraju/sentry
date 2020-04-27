import React from 'react';
import styled from '@emotion/styled';

import {IconProps} from 'app/types/iconProps';
import space from 'app/styles/space';
import CheckboxFancy from 'app/components/checkboxFancy/checkboxFancy';

import {BreadCrumbIconWrapper} from '../styles';
import {FilterGroupLevel, FilterGroupType, BreadcrumbDetails} from './types';

type Props = {
  groupHeaderTitle: string;
  data: Array<FilterGroupLevel | FilterGroupType>;
  onClick: (
    type: FilterGroupLevel['type'] | FilterGroupType['type'],
    groupType: FilterGroupLevel['groupType'] | FilterGroupType['groupType']
  ) => void;
};

const BreadcrumbFilterGroup = ({groupHeaderTitle, data, onClick}: Props) => {
  const handleClick = (
    type: FilterGroupLevel['type'] | FilterGroupType['type'],
    groupType: FilterGroupLevel['groupType'] | FilterGroupType['groupType']
  ) => (event: React.MouseEvent<HTMLLIElement>) => {
    event.stopPropagation();
    onClick(type, groupType);
  };

  const renderIcon = ({
    icon,
    color,
    borderColor,
  }: Omit<BreadcrumbDetails, 'description'>) => {
    if (!icon) return null;

    const Icon = icon as React.ComponentType<IconProps>;

    return (
      <BreadCrumbIconWrapper color={color} borderColor={borderColor} size={20}>
        <Icon size="xs" />
      </BreadCrumbIconWrapper>
    );
  };
  return (
    <div>
      <FilterGroupHeader>{groupHeaderTitle}</FilterGroupHeader>
      <FilterGroupList>
        {data.map(
          ({type, groupType, description, isChecked, icon, color, borderColor}) => (
            <FilterGroupListItem
              key={type}
              isChecked={isChecked}
              onClick={handleClick(type, groupType)}
            >
              <ListItemDescription>
                {renderIcon({icon, color, borderColor})}
                <span>{description}</span>
              </ListItemDescription>
              <CheckboxFancy isChecked={isChecked} />
            </FilterGroupListItem>
          )
        )}
      </FilterGroupList>
    </div>
  );
};

export default BreadcrumbFilterGroup;

const FilterGroupHeader = styled('div')`
  display: flex;
  align-items: center;
  background-color: ${p => p.theme.offWhite};
  color: ${p => p.theme.gray2};
  font-weight: normal;
  font-size: ${p => p.theme.fontSizeMedium};
  margin: 0;
  padding: ${space(1)} ${space(2)};
  border-bottom: 1px solid ${p => p.theme.borderDark};
`;

const FilterGroupList = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const FilterGroupListItem = styled('li')<{isChecked?: boolean}>`
  display: grid;
  grid-template-columns: 1fr 16px;
  grid-column-gap: ${space(1)};
  align-items: center;
  padding: ${space(1)} ${space(2)};
  border-bottom: 1px solid ${p => p.theme.borderDark};
  cursor: pointer;
  :hover {
    background-color: ${p => p.theme.offWhite};
  }
  ${CheckboxFancy} {
    opacity: ${p => (p.isChecked ? 1 : 0.3)};
  }

  &:hover ${CheckboxFancy} {
    opacity: 1;
  }

  &:hover span {
    color: ${p => p.theme.blue};
    text-decoration: underline;
  }
`;

const ListItemDescription = styled('div')`
  display: grid;
  grid-template-columns: 20px 1fr;
  grid-column-gap: ${space(1)};
  align-items: center;
  font-size: ${p => p.theme.fontSizeMedium};
`;
