'use client';

import { useEffect, useMemo, useState } from 'react';
import { StoreSettings } from './types';

export interface StoreAvailability {
  isResting: boolean;
  statusLabel: string;
  reopensLabel: string;
  remainingLabel: string;
}

const toSeconds = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60 + minutes) * 60;
};

const formatRemaining = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours ? `${hours} giờ` : '', `${minutes} phút`, `${rest} giây`].filter(Boolean).join(' ');
};

export function getStoreAvailability(settings: StoreSettings, now = new Date()): StoreAvailability {
  if (!settings.businessHoursEnabled) {
    return { isResting: false, statusLabel: 'Hệ thống đang online', reopensLabel: '', remainingLabel: '' };
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: settings.timeZone || 'Asia/Ho_Chi_Minh',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
  const current = read('hour') * 3600 + read('minute') * 60 + read('second');
  const start = toSeconds(settings.restStart);
  const end = toSeconds(settings.restEnd);
  const isOvernight = start > end;
  const isResting = isOvernight ? current >= start || current < end : current >= start && current < end;
  if (!isResting) {
    return { isResting: false, statusLabel: 'Hệ thống đang online', reopensLabel: '', remainingLabel: '' };
  }
  const remaining = current < end ? end - current : 24 * 3600 - current + end;
  return {
    isResting: true,
    statusLabel: 'Hệ thống đang tạm nghỉ',
    reopensLabel: `Mở lại lúc ${settings.restEnd}`,
    remainingLabel: formatRemaining(remaining),
  };
}

export function useStoreAvailability(settings: StoreSettings) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return useMemo(() => getStoreAvailability(settings, now), [settings, now]);
}
