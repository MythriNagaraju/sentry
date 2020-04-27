import {BreadcrumbDetails, BreadcrumbType, BreadcrumbLevel} from '../types';

type FilterGroupBase = {
  isChecked: boolean;
} & BreadcrumbDetails;

export type FilterGroupType = {
  groupType: 'type';
  type: BreadcrumbType;
} & FilterGroupBase;

export type FilterGroupLevel = {
  groupType: 'level';
  type: BreadcrumbLevel;
} & FilterGroupBase;

export {BreadcrumbDetails};
