// components/Navigator.tsx (For MemberForm - matching CompanyForm's Navigator style)

import classNames from "classnames";

// Member Form specific navigation items
export const navigationList = [
  { label: "Personal Details", link: "personalDetails" }, // Consider shorter labels like "Personal" if space is an issue
  { label: "Contact Info", link: "socialContactInformation" }, // Shorter
  { label: "Member Profile", link: "memberProfile" }, // Shorter
  { label: "Accessibilities", link: "memberAccessibility" }, // Shorter
  { label: "Membership Details", link: "membershipPlanDetails" }, // Shorter
  { label: "Feedback / Requests", link: "requestAndFeedbacks" }, // Shorter
];

export type NavigationItem = (typeof navigationList)[0];

type NavigatorProps = {
  activeSection: string;
  onNavigate: (sectionKey: string) => void;
};

const Navigator = (props: NavigatorProps) => {
  const { activeSection, onNavigate } = props;

  return (
    // Copied directly from CompanyForm's Navigator container style
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-hidden">
      {navigationList.map((nav) => (
        <button
          type="button"
          key={nav.link}
          className={classNames(
            // Copied directly from CompanyForm's Navigator button style
            "cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0",
            "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none",
            {
              // Copied directly from CompanyForm's Navigator active/inactive style
              "bg-indigo-50 dark:bg-indigo-700/60 text-[#2a85ff] dark:text-indigo-200 font-semibold":
                activeSection === nav.link,
              "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200":
                activeSection !== nav.link,
            }
          )}
          onClick={() => onNavigate(nav.link)}
          title={nav.label} // Shows full label on hover
        >
          {/* Copied directly from CompanyForm's Navigator text span style */}
          <span className="font-medium text-[10px] xxs:text-xs sm:text-sm truncate">
            {nav.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default Navigator;
