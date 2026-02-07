'use client';

import React, { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  Tag,
  Box,
  Boxes,
  Percent
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ---------------- Sidebar Item ---------------- */
const SidebarItem = ({
  icon: Icon,
  label,
  isCollapsed,
  hasSubmenu = false,
  submenuItems = [],
  defaultHref
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const itemRef = useRef(null);
  const router = useRouter();

  const handleClick = () => {
    if (hasSubmenu && defaultHref) {
      router.push(defaultHref); 
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => hasSubmenu && setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Parent Item */}
      <div
        ref={itemRef}
        className={`
          flex items-center gap-2 mx-2 rounded-lg cursor-pointer
          transition-all duration-200 ease-out
          overflow-hidden
          ${isCollapsed ? 'flex-col py-3 px-2' : 'px-4 py-2.5'}

          ${isOpen
            ? 'bg-blue-500/15 text-white scale-[1.03]'
            : 'text-gray-300 hover:bg-gray-800/70 hover:text-white hover:scale-[1.03]'
          }
        `}
        onClick={handleClick}
      >
        <Icon
          className={`
            shrink-0 transition-all duration-200
            ${isCollapsed ? 'w-4 h-4' : 'w-5 h-5'}
          `}
        />

        <span
          className={`
            font-medium transition-all duration-200
            ${isCollapsed ? 'text-[10px] text-center' : 'text-xs'}
          `}
        >
          {label}
        </span>

        {!isCollapsed && hasSubmenu && (
          <ChevronRight
            className={`w-3.5 h-3.5 ml-auto transition-transform ${isOpen ? 'rotate-90 opacity-100' : 'opacity-60'
              }`}
          />
        )}
      </div>

      {/* Flyout */}
      {hasSubmenu && isOpen && (
        <div
          className={`
            fixed z-30
            ${isCollapsed ? 'left-20' : 'left-64'}
            bg-linear-to-br from-gray-900 to-gray-800
            border border-gray-700/50 rounded-xl shadow-2xl
            min-w-56 py-2
            animate-in fade-in slide-in-from-left-2 duration-150
          `}
          style={{
            top: itemRef.current
              ? `${itemRef.current.getBoundingClientRect().top}px`
              : '0px',
          }}
        >
          <div className="px-4 py-1 text-[10px] font-semibold text-gray-400 uppercase">
            {label}
          </div>

          <div className="border-t border-gray-700/50 my-1" />

          {submenuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <div
                className="
                  flex items-center gap-3 px-4 py-2 text-xs text-gray-300
                  transition-all duration-200 ease-out
                  hover:bg-gray-800/70 hover:text-white hover:scale-[1.03]
                "
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};


/* ---------------- Layout ---------------- */

const SidebarLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'Catalog',
      icon: Package,
      hasSubmenu: true,
      defaultHref: '/catalog/categories',
      submenuItems: [
        { label: 'Categories', icon: Layers, href: '/catalog/categories' },
        { label: 'Brands', icon: Tag, href: '/catalog/brands' },
        { label: 'Products', icon: Box, href: '/catalog/products' },
      ],
    },
    {
      label: 'Orders',
      icon: ShoppingCart,
      href: '/orders',
    },
    {
      label: 'Inventory',
      icon: Warehouse,
      href: '/inventory',
    },
    {
      label: 'Pricing & Tax',
      icon: Percent,
      href: '/pricing',
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside
        className={`
          fixed h-full flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
          bg-linear-to-b from-gray-900 to-gray-950
          border-r border-gray-800/50
           transition-[width] duration-450 ease-in-out  
        `}
      >

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
          {!isCollapsed ? (
            <span className="text-white font-semibold text-base">Ex Factory</span>
          ) : (
            <span className="text-white font-bold text-sm mx-auto">EF</span>
          )}
        </div>

        {/* Collapse toggle */}
        <div className="px-4 py-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              ${isCollapsed ? 'mx-auto' : 'ml-auto'}
              p-1.5 rounded-lg bg-gray-800/50
              text-gray-400 hover:text-white hover:bg-gray-700/50
              transition-all
            `}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item, index) =>
            item.hasSubmenu ? (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                isCollapsed={isCollapsed}
                hasSubmenu
                submenuItems={item.submenuItems}
                defaultHref={item.defaultHref}
              />
            ) : (
              <Link key={index} href={item.href}>
                <SidebarItem
                  icon={item.icon}
                  label={item.label}
                  isCollapsed={isCollapsed}
                />
              </Link>
            )
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`
          flex-1 min-h-screen
          ${isCollapsed ? 'ml-20' : 'ml-64'}
          transition-[margin-left] duration-450 ease-in-out
          bg-gray-50 text-gray-900
          p-4
          overflow-x-hidden   
        `}
      >

        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
