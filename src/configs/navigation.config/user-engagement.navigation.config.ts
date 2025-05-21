import { USER_ENGAGEMENT_ROUTE } from '@/constants/route.constant';
import { NAV_ITEM_TYPE_ITEM, NAV_ITEM_TYPE_COLLAPSE } from '@/constants/navigation.constant';
import { ADMIN, USER } from '@/constants/roles.constant';
import type { NavigationTree } from '@/@types/navigation';

const userengagementNavigationConfig: NavigationTree[] = [
    {
            key: 'userengagement',
            path: '',
            title: 'User Engagement',
            translateKey: 'nav.userengagement',
            icon: 'customerDetails',
            type: NAV_ITEM_TYPE_COLLAPSE,
            authority: [ADMIN, USER],
            meta: {
                horizontalMenu: {
                    layout: 'columns',
                    columns: 2,
                },
            },
            subMenu: [
              {
                              key: 'userengagement.subscriber',
                              path: `${USER_ENGAGEMENT_ROUTE}/subscriber`,
                              title: 'Subscriber',
                              translateKey: 'nav.userengagement.subscriber',
                              icon: 'subscriber',
                              type: NAV_ITEM_TYPE_ITEM,
                              authority: [ADMIN, USER],
                              meta: {
                                  description: {
                                      translateKey: 'nav.userengagement.subscriberDesc',
                                      label: 'Manage subscribers',
                                  },
                              },
                              subMenu: [],
                          },
                          {
                              key: 'userengagement.requestFeedback',
                              path: `${USER_ENGAGEMENT_ROUTE}/request-feedback`,
                              title: 'Request & Feedback',
                              translateKey: 'nav.userengagement.requestFeedback',
                              icon: 'requestFeedback',
                              type: NAV_ITEM_TYPE_ITEM,
                              authority: [ADMIN, USER],
                              meta: {
                                  description: {
                                      translateKey: 'nav.userengagement.requestFeedbackDesc',
                                      label: 'Handle requests and feedback',
                                  },
                              },
                              subMenu: [],
                          },  
            ],
        },
        
];

export default userengagementNavigationConfig;