import React from 'react';
import styled from '@emotion/styled';

import EventDataSection from 'app/components/events/eventDataSection';
import GuideAnchor from 'app/components/assistant/guideAnchor';
import EmptyStateWarning from 'app/components/emptyStateWarning';
import {t} from 'app/locale';
import {Event} from 'app/types';
import space from 'app/styles/space';
import SearchBar from 'app/components/searchBar';
import {IconProps} from 'app/types/iconProps';

import {PlatformContextProvider} from './platformContext';
import BreadcrumbTime from './breadcrumbTime';
import BreadcrumbCollapsed from './breadcrumbCollapsed';
import BreadcrumbRenderer from './breadcrumbRenderer';
import convertBreadcrumbType from './convertBreadcrumbType';
import getBreadcrumbDetails from './getBreadcrumbDetails';
import BreadcrumbFilter from './breadcrumbFilter/breadcrumbFilter';
import {FilterGroupLevel, FilterGroupType} from './breadcrumbFilter/types';
import {Breadcrumb, BreadcrumbDetails} from './types';
import {BreadCrumb, BreadCrumbIconWrapper} from './styles';

const MAX_CRUMBS_WHEN_COLLAPSED = 10;

type BreadcrumbWithDetails = Breadcrumb & BreadcrumbDetails & {id: number};
type BreadcrumbFilterGroups = React.ComponentProps<
  typeof BreadcrumbFilter
>['filterGroups'];

type State = {
  isCollapsed: boolean;
  searchTerm: string;
  breadcrumbs: Array<BreadcrumbWithDetails>;
  filteredBreadcrumbsByCustomSearch: Array<BreadcrumbWithDetails>;
  filteredBreadcrumbs: Array<BreadcrumbWithDetails>;
  breadcrumbFilterGroups: BreadcrumbFilterGroups;
};

type Props = {
  event: Event;
  type: string;
  data: {
    values: Array<Breadcrumb>;
  };
};

class BreadcrumbsContainer extends React.Component<Props, State> {
  state: State = {
    isCollapsed: true,
    searchTerm: '',
    breadcrumbs: [],
    filteredBreadcrumbsByCustomSearch: [],
    filteredBreadcrumbs: [],
    breadcrumbFilterGroups: [],
  };

  componentDidMount() {
    this.loadBreadcrumbs();
  }

  loadBreadcrumbs = () => {
    const {data} = this.props;
    let breadcrumbs = data.values;

    // Add the error event as the final (virtual) breadcrumb
    const virtualCrumb = this.getVirtualCrumb();
    if (virtualCrumb) {
      breadcrumbs = [...breadcrumbs, virtualCrumb];
    }

    const breadcrumbTypes: Array<FilterGroupType> = [];
    //const breadcrumbLevels: Array<FilterGroupLevel> = [];

    const convertedBreadcrumbs = breadcrumbs.map((breadcrumb, index) => {
      const convertedBreadcrumb = convertBreadcrumbType(breadcrumb);
      const breadcrumbDetails = getBreadcrumbDetails(convertedBreadcrumb.type);

      // if (
      //   convertedBreadcrumb?.level &&
      //   !breadcrumbLevels.find(
      //     breadcrumbLevel => breadcrumbLevel.type === convertedBreadcrumb?.level
      //   )
      // ) {
      //   breadcrumbLevels.push({
      //     groupType: 'level',
      //     type: convertedBreadcrumb?.level,
      //     isChecked: true,
      //     description: 'X',
      //   });
      // }

      if (!breadcrumbTypes.find(b => b.type === convertedBreadcrumb.type)) {
        !breadcrumbTypes.push({
          groupType: 'type',
          type: convertedBreadcrumb.type,
          ...breadcrumbDetails,
          isChecked: true,
        });
      }

      return {
        id: index,
        ...convertedBreadcrumb,
        ...breadcrumbDetails,
      };
    });

    this.setState({
      breadcrumbs: convertedBreadcrumbs,
      filteredBreadcrumbs: convertedBreadcrumbs,
      filteredBreadcrumbsByCustomSearch: convertedBreadcrumbs,
      breadcrumbFilterGroups: [...breadcrumbTypes],
    });
  };

  moduleToCategory = (module: any) => {
    if (!module) {
      return undefined;
    }
    const match = module.match(/^.*\/(.*?)(:\d+)/);
    if (!match) {
      return module.split(/./)[0];
    }
    return match[1];
  };

  getVirtualCrumb = (): Breadcrumb | undefined => {
    const {event} = this.props;

    const exception = event.entries.find(entry => entry.type === 'exception');

    if (!exception && !event.message) {
      return undefined;
    }

    if (exception) {
      const {type, value, module: mdl} = exception.data.values[0];
      return {
        type: 'error',
        level: 'error',
        category: this.moduleToCategory(mdl) || 'exception',
        data: {
          type,
          value,
        },
        timestamp: event.dateCreated,
      };
    }

    const levelTag = (event.tags || []).find(tag => tag.key === 'level');

    return {
      type: 'message',
      level: levelTag?.value as Breadcrumb['level'],
      category: 'message',
      message: event.message,
      timestamp: event.dateCreated,
    };
  };

  getCollapsedCrumbQuantity = (): {
    filteredCollapsedBreadcrumbs: Array<BreadcrumbWithDetails>;
    collapsedQuantity: number;
  } => {
    const {isCollapsed, filteredBreadcrumbs} = this.state;

    let filteredCollapsedBreadcrumbs = filteredBreadcrumbs;

    if (isCollapsed && filteredCollapsedBreadcrumbs.length > MAX_CRUMBS_WHEN_COLLAPSED) {
      filteredCollapsedBreadcrumbs = filteredCollapsedBreadcrumbs.slice(
        -MAX_CRUMBS_WHEN_COLLAPSED
      );
    }

    return {
      filteredCollapsedBreadcrumbs,
      collapsedQuantity: filteredBreadcrumbs.length - filteredCollapsedBreadcrumbs.length,
    };
  };

  handleFilter = (breadcrumbFilterGroups: BreadcrumbFilterGroups) => () => {
    //types
    const breadcrumbFilterGroupTypes = breadcrumbFilterGroups.filter(
      breadcrumbFilterGroup => breadcrumbFilterGroup.groupType === 'type'
    );

    //levels
    const breadcrumbFilterGroupLevels = breadcrumbFilterGroups
      .filter(breadcrumbFilterGroup => breadcrumbFilterGroup.groupType === 'level')
      .map(breadcrumbFilterGroup => breadcrumbFilterGroup.type);

    this.setState({
      filteredBreadcrumbs: this.state.breadcrumbs.filter(breadcrumb => {
        const foundBreadcrumbFilterData = breadcrumbFilterGroupTypes.find(
          crumbFilterData => crumbFilterData.type === breadcrumb.type
        );
        if (foundBreadcrumbFilterData) {
          return foundBreadcrumbFilterData.isChecked;
        }

        return false;
      }),
      breadcrumbFilterGroups,
    });
  };

  handleFilterBySearchTerm = (value: string) => {
    const {filteredBreadcrumbsByCustomSearch} = this.state;

    const searchTerm = value.toLocaleLowerCase();

    const filteredBreadcrumbs = filteredBreadcrumbsByCustomSearch.filter(
      item =>
        !!['category', 'message', 'level', 'timestamp'].find(prop => {
          const searchValue = item[prop];
          if (searchValue) {
            return searchValue.toLowerCase().indexOf(searchTerm) !== -1;
          }
          return false;
        })
    );

    this.setState({
      searchTerm,
      filteredBreadcrumbs,
    });
  };

  handleCollapseToggle = () => {
    this.setState(prevState => ({
      isCollapsed: !prevState.isCollapsed,
    }));
  };

  handleCleanSearch = () => {
    this.setState({
      searchTerm: '',
      isCollapsed: true,
    });
  };

  render() {
    const {event, type} = this.props;
    const {breadcrumbFilterGroups, searchTerm} = this.state;

    const {
      collapsedQuantity,
      filteredCollapsedBreadcrumbs,
    } = this.getCollapsedCrumbQuantity();

    return (
      <EventDataSection
        type={type}
        title={
          <h3>
            <GuideAnchor target="breadcrumbs" position="bottom">
              {t('Breadcrumbs')}
            </GuideAnchor>
          </h3>
        }
        actions={
          <Search>
            <BreadcrumbFilter
              onFilter={this.handleFilter}
              filterGroups={breadcrumbFilterGroups}
            />
            <StyledSearchBar
              placeholder={t('Search breadcrumbs...')}
              onSearch={this.handleFilterBySearchTerm}
              query={searchTerm}
            />
          </Search>
        }
        wrapTitle={false}
      >
        <Content>
          {filteredCollapsedBreadcrumbs.length > 0 ? (
            <PlatformContextProvider value={{platform: event.platform}}>
              <BreadCrumbs className="crumbs">
                {collapsedQuantity > 0 && (
                  <BreadcrumbCollapsed
                    onClick={this.handleCollapseToggle}
                    quantity={collapsedQuantity}
                  />
                )}
                {filteredCollapsedBreadcrumbs.map(
                  ({color, borderColor, icon, ...crumb}, idx) => {
                    const Icon = icon as React.ComponentType<IconProps>;
                    return (
                      <BreadCrumb
                        data-test-id="breadcrumb"
                        key={idx}
                        hasError={crumb.type === 'message' || crumb.type === 'error'}
                      >
                        <BreadCrumbIconWrapper color={color} borderColor={borderColor}>
                          <Icon />
                        </BreadCrumbIconWrapper>
                        <BreadcrumbRenderer breadcrumb={crumb as Breadcrumb} />
                        <BreadcrumbTime timestamp={crumb.timestamp} />
                      </BreadCrumb>
                    );
                  }
                )}
              </BreadCrumbs>
            </PlatformContextProvider>
          ) : (
            <EmptyStateWarning small>
              {t('Sorry, no breadcrumbs match your search query.')}
            </EmptyStateWarning>
          )}
        </Content>
      </EventDataSection>
    );
  }
}

export default BreadcrumbsContainer;

const BreadCrumbs = styled('ul')`
  padding-left: 0;
  list-style: none;
  margin-bottom: 0;
`;

const Content = styled('div')`
  border: 1px solid ${p => p.theme.borderLight};
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  margin-bottom: ${space(3)};
`;

const Search = styled('div')`
  display: flex;
  width: 600px;
`;

const StyledSearchBar = styled(SearchBar)`
  width: 100%;
  .search-input,
  .search-input:focus {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;
