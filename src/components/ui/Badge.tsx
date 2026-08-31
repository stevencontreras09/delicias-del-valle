import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'frambuesa' | 'chocolate' | 'trigo' | 'crema' | 'success' | 'warning' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'frambuesa',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    frambuesa: 'bg-frambuesa-50 text-frambuesa-700 border-frambuesa-200',
    chocolate: 'bg-chocolate-50 text-chocolate-800 border-chocolate-200',
    trigo: 'bg-trigo-100 text-trigo-800 border-trigo-300',
    crema: 'bg-crema text-chocolate-700 border-trigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  }[variant];

  const dotColors = {
    frambuesa: 'bg-frambuesa-500',
    chocolate: 'bg-chocolate-600',
    trigo: 'bg-trigo-600',
    crema: 'bg-chocolate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
    gray: 'bg-gray-400',
  }[variant];

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium rounded-full',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-full',
    lg: 'text-sm px-3.5 py-1.5 font-semibold rounded-xl',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 border shadow-sm ${variantStyles} ${sizeStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors}`} />}
      {children}
    </span>
  );
};
