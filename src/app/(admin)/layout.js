'use client';

import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Settings,
  Layers,
  Tag,
  Box,
  Users,
  Cog,
  ClipboardList,
  Navigation,
  DollarSign,
  UserCog,
  Download,
  Menu,
  Globe,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

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
}) => {
  return (
    <div
      className="w-full font-normal hover:font-medium mb-2"
      onMouseEnter={onMouseEnter}
    >
      <Link href={href || '#'}>
        <button
          className={`
            ${
              isActive
                ? 'bg-opacity-50 text-white bg-[#1a2332] font-medium'
                : 'text-gray-400'
            }
            flex flex-col items-center justify-center h-16 w-full
            hover:scale-105 transition-all duration-300 hover:text-white
            ${isCollapsed ? 'px-2' : 'px-4'}
            relative
          `}
        >
          {/* Active Indicator */}
          {isActive && (
            <div className="absolute left-0 h-16 w-1 bg-blue-500" />
          )}

          <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} mb-1`} />
          
          <span className={`${isCollapsed ? 'text-[9px]' : 'text-xs'} text-center leading-tight`}>
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
  onClose,
  position,
}) => {
  const pathname = usePathname();

  if (!hoveredItem || !submenuData) return null;

  return (
    <div
      style={{
        top: position.top,
        left: isCollapsed ? '80px' : '220px',
      }}
      className="transition-all duration-300 select-none p-2 min-w-[300px] max-w-fit z-[9999] bg-[#0f1419] rounded-r-md fixed shadow-2xl border border-gray-800"
      onMouseLeave={onClose}
    >
      <h2 className="font-semibold text-sm mb-2 text-white uppercase">
        {hoveredItem.label}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {submenuData.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            <h4 className="text-[11px] mb-0.5 font-semibold uppercase text-gray-500">
              {section.heading}
            </h4>
            
            <div className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const isActive = pathname.includes(item.href);
                
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    onClick={onClose}
                    className={`
                      block px-2 py-0.5 rounded text-sm
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-[#1a2332] text-white font-semibold'
                          : 'text-gray-400 hover:text-white hover:font-semibold'
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

  const toggleSidebar = () => setIsCollapsed((prev) => !prev);

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
            { label: 'Create category', href: '/catalog/categories/form?createNew=true' },
          ],
        },
        {
          heading: 'Brands',
          items: [
            { label: 'All Brands', href: '/catalog/brands' },
            { label: 'Create Brand', href: '/catalog/brands/form?createNew=true' },
          ],
        },
        {
          heading: 'Products',
          items: [
            { label: 'Products', href: '/catalog/products' },
            { label: 'Create Product', href: '/catalog/products/form?createNew=true' },
          ],
        },
      ],
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

  return (
    <div className="flex min-h-screen bg-gray-50">
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
        <div className="h-16 flex items-center justify-center border-b border-gray-800 relative">
          {isCollapsed ? (
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">EX</span>
            </div>
          ) : (
            <div className="px-4">
              <div className="text-2xl font-bold">
                <span className="text-yellow-500">EX</span>
                <span className="text-blue-500">Factory</span>
              </div>
              <div className="text-[10px] text-gray-500 tracking-wider">
                ALL MATERIALS AND PRODUCTS
              </div>
            </div>
          )}
          
          {/* Collapse Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-[#1a2332] hover:bg-[#2a3442] rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-110 z-[9999]"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          {menuItems.map((item) => {
            const isActive = pathname.includes(item.href);
            
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
                  onMouseEnter={() =>
                    item.hasSubmenu && setHoveredItem(item)
                  }
                />
              </div>
            );
          })}
        </nav>

        {/* Bottom Toggle Button (Alternative) */}
        <div className="border-t border-gray-800 p-4">
          <button
            onClick={toggleSidebar}
            className={`
              w-full h-10 rounded-lg bg-[#1a2332] hover:bg-[#2a3442] 
              text-gray-400 hover:text-white transition-all duration-200
              flex items-center justify-center gap-2
              ${isCollapsed ? 'px-2' : 'px-4'}
            `}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Floating Submenu */}
      {hoveredItem?.hasSubmenu && (
        <FloatingSubmenu
          hoveredItem={hoveredItem}
          isCollapsed={isCollapsed}
          submenuData={hoveredItem.submenuData}
          onClose={() => setHoveredItem(null)}
          position={getSubmenuPosition(hoveredItem.id)}
        />
      )}

      {/* Main Content */}
      <main
        className={`
          flex-1 min-h-screen
          ${isCollapsed ? 'ml-[85px]' : 'ml-[240px]'}
          transition-[margin-left] duration-300
          bg-gray-50
          m-1
          mt-2
        `}
        onMouseEnter={() => hoveredItem && setHoveredItem(null)}
      >
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;