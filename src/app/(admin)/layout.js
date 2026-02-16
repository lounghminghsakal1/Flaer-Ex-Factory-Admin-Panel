'use client';

import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* ---------------- Sidebar Item ---------------- */
const SidebarItem = ({
  icon: Icon,
  label,
  shortName,
  isCollapsed,
  hasSubmenu = false,
  href,
  isActive,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      className="w-full mb-1"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link href={href || '#'}>
        <button
          className={`
            ${
              isActive
                ? 'bg-[#1a2332] text-white font-semibold border-l-4 border-blue-500'
                : 'text-gray-400 border-l-4 border-transparent'
            }
            ${
              isCollapsed
                ? 'flex flex-col items-center justify-center h-16 px-2'
                : 'flex flex-row items-center h-12 px-4 gap-3'
            }
            w-full
            hover:bg-[#1a2332] hover:text-white hover:border-l-4 hover:border-blue-400
            transition-all duration-200
            relative
            group
          `}
        >
          <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isCollapsed ? 'mb-1' : ''} flex-shrink-0`} />
          
          <span
            className={`
              ${isCollapsed ? 'text-[9px] text-center leading-tight' : 'text-sm flex-1 text-left'}
              group-hover:font-medium
            `}
          >
            {isCollapsed ? shortName || label : label}
          </span>
        </button>
      </Link>
    </div>
  );
};

/* ---------------- Floating Submenu ---------------- */
const FloatingSubmenu = ({
  hoveredItem,
  isCollapsed,
  submenuData,
  onMouseEnter,
  onMouseLeave,
  position,
  onLinkClick,
}) => {
  const pathname = usePathname();

  if (!hoveredItem || !submenuData) return null;

  return (
    <div
      style={{
        top: position.top,
        left: isCollapsed ? '80px' : '220px',
      }}
      className="transition-all duration-200 select-none p-1 min-w-[280px] max-w-fit z-[9999] bg-[#0f1419] rounded-r-md fixed shadow-2xl border border-gray-700"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <h2 className="font-semibold text-xs mb-1 px-1 text-white uppercase tracking-wide">
        {hoveredItem.label}
      </h2>

      <div className="grid grid-cols-2 gap-1">
        {submenuData.map((section, sectionIdx) => (
          <div key={sectionIdx} className="p-1">
            <h4 className="text-[10px] mb-1 font-semibold uppercase text-gray-500 px-1">
              {section.heading}
            </h4>
            
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => {
                // Check if this exact path or a child path matches
                // But prioritize exact matches over parent paths
                const isExactMatch = pathname === item.href;
                const isChildRoute = pathname.startsWith(item.href + '/');
                
                // If it's a child route, only mark as active if no other item in the same section is an exact match
                let isActive = false;
                if (isExactMatch) {
                  isActive = true;
                } else if (isChildRoute) {
                  // Check if any other item in this section is an exact match
                  const hasExactMatch = section.items.some(otherItem => pathname === otherItem.href);
                  isActive = !hasExactMatch;
                }
                
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    onClick={onLinkClick}
                    className={`
                      block px-1 py-0.5 rounded text-xs
                      transition-all duration-150
                      ${
                        isActive
                          ? 'bg-[#1a2332] text-white font-semibold border-l-2 border-blue-500'
                          : 'text-gray-400 hover:bg-[#1a2332] hover:text-white hover:font-medium hover:border-l-2 hover:border-blue-400 border-l-2 border-transparent'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------- Layout ---------------- */
const SidebarLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const itemRefs = useRef({});
  const pathname = usePathname();
  const hoverTimeoutRef = useRef(null);

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

  const handleMouseEnter = (item) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Only show submenu if this specific item has a submenu
    if (item.hasSubmenu) {
      setHoveredItem(item);
    } else {
      setHoveredItem(null);
    }
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 150);
  };

  const handleSubmenuMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleSubmenuMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 150);
  };

  const handleSubmenuLinkClick = () => {
    // Close submenu immediately when a link is clicked
    setHoveredItem(null);
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Home Dashboard',
      shortName: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      id: 'catalog',
      label: 'Catalog',
      shortName: 'Catalog',
      icon: Package,
      hasSubmenu: true,
      href: '/catalog/categories',
      submenuData: [
        {
          heading: 'Categories',
          items: [
            { label: 'Categories', href: '/catalog/categories' },
            { label: 'Create category', href: '/catalog/categories/form' },
          ],
        },
        {
          heading: 'Brands',
          items: [
            { label: 'Brands', href: '/catalog/brands' },
            { label: 'Create Brand', href: '/catalog/brands/form' },
          ],
        },
        {
          heading: 'Products',
          items: [
            { label: 'Products', href: '/catalog/products' },
            { label: 'Create Product', href: '/catalog/products/form' },
          ],
        },
      ],
    },
    {
      id: 'collections',
      label: 'Collections',
      shortName: 'Collections',
      icon: Layers,
      href: '/collections',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      shortName: 'Inventory',
      icon: Warehouse,
      href: '/dashboard/inventory',
    },
  ];

  const getSubmenuPosition = (itemId) => {
    const ref = itemRefs.current[itemId];
    if (!ref) return { top: '0px' };
    
    const rect = ref.getBoundingClientRect();
    return { top: `${rect.top}px` };
  };

  // Check if current path matches any submenu item
  const isSubmenuItemActive = (item) => {
    if (!item.hasSubmenu || !item.submenuData) return false;
    
    return item.submenuData.some(section =>
      section.items.some(subItem => 
        pathname === subItem.href || pathname.startsWith(subItem.href + '/')
      )
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
          ${isCollapsed ? 'w-[75px]' : 'w-[220px]'}
          min-h-screen bg-[#0f1419] text-gray-400
          fixed top-0 left-0 z-[9998]
          transition-all duration-300 shadow-xl
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between border-b border-gray-800 px-4">
          {isCollapsed ? (
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 bg-[#1a2332] hover:bg-[#2a3442] rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 mx-auto"
              title="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <>
              <div className="flex-1">
                <div className="text-2xl font-bold">
                  <span className="text-yellow-500">EX</span>
                  <span className="text-blue-500">Factory</span>
                </div>
                <div className="text-[10px] text-gray-500 tracking-wider">
                  ALL MATERIALS AND PRODUCTS
                </div>
              </div>
              
              <button
                onClick={toggleSidebar}
                className="w-8 h-8 bg-[#1a2332] hover:bg-[#2a3442] rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-110"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
                           pathname.startsWith(item.href + '/') || 
                           isSubmenuItemActive(item);
            
            return (
              <div
                key={item.id}
                ref={(el) => (itemRefs.current[item.id] = el)}
              >
                <SidebarItem
                  icon={item.icon}
                  label={item.label}
                  shortName={item.shortName}
                  isCollapsed={isCollapsed}
                  hasSubmenu={item.hasSubmenu}
                  href={item.href}
                  isActive={isActive}
                  onMouseEnter={() => handleMouseEnter(item)}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Floating Submenu */}
      {hoveredItem?.hasSubmenu && (
        <FloatingSubmenu
          hoveredItem={hoveredItem}
          isCollapsed={isCollapsed}
          submenuData={hoveredItem.submenuData}
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
          onLinkClick={handleSubmenuLinkClick}
          position={getSubmenuPosition(hoveredItem.id)}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          flex-1 min-h-screen
          ${isCollapsed ? 'ml-[85px]' : 'ml-[240px]'}
          transition-[margin-left] duration-300
          bg-gray-100
          m-1
          mt-2 
        `}
        onMouseEnter={handleMouseLeave}
      >
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;