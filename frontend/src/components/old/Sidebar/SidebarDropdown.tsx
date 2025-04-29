import { usePathname } from "next/navigation";
import Link from "next/link";

interface DropdownItem {
  icon?: React.ReactNode;
  label: string;
  route: string;
  children?: DropdownItem[];
}

interface SidebarDropdownProps {
  item: DropdownItem[];
  parentLabel?: string;
}

const SidebarDropdown = ({ item, parentLabel = '' }: SidebarDropdownProps) => {
  const pathname = usePathname();
  const isFTTHParent = parentLabel.includes('FTTH') || parentLabel.includes('Phase');

  return (
    <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
      {item.map((menu, key) => {
        const isActive = menu.route === pathname;
        const isFTTHItem = 
          isFTTHParent || 
          menu.label.includes('Inspections') || 
          menu.label.includes('Operations') ||
          menu.label.includes('Technical') ||
          menu.label.includes('Earthworks') ||
          menu.label.includes('Blowing') ||
          menu.label.includes('Construction');

        return (
          <li key={key}>
            {menu.children ? (
              <SidebarDropdown 
                item={menu.children} 
                parentLabel={menu.label}
              />
            ) : (
              <Link
                href={menu.route}
                className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                  isActive ? "text-white dark:text-white" : "text-bodydark2"
                }`}
              >
                {menu.icon}
                <span className={isFTTHItem ? 'font-bold' : ''}>{menu.label}</span>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default SidebarDropdown;