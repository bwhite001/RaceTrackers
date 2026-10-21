import React from 'react';
import { cn } from '../../utils/classNames';

const VARIANTS = {
  onNavy: 'bg-white/[0.08] text-white',
  gold: 'bg-vk-gold text-vk-ink',
  card: 'bg-white border border-vk-border text-vk-ink dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100',
};

const LABEL = {
  onNavy: 'text-vk-on-navy font-semibold',
  gold: 'font-bold',
  card: 'text-vk-muted font-semibold dark:text-gray-400',
};

/** Montserrat 800 number + 11px label. Gold variant for "To call in". */
const StatTile = ({ value, label, variant = 'card', valueClassName = '', className = '' }) => (
  <div className={cn('rounded-btn px-2.5 py-2 flex flex-col gap-0.5', VARIANTS[variant], className)}>
    <div className={cn('font-display font-extrabold text-[22px] leading-tight tabular-nums', valueClassName)}>{value}</div>
    <div className={cn('text-[11px]', LABEL[variant])}>{label}</div>
  </div>
);

export default StatTile;
