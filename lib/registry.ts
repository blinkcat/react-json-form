import React from 'react';

// widget
const widgetRegistry: Map<string, React.ComponentType<any>> = new Map();

export function registerWidget(name: string, comp: React.ComponentType<any>) {
  widgetRegistry.set(name, comp);
}

export function findWidget(name: string) {
  return widgetRegistry.get(name);
}

// wrapper
const wrapperRegistry: Map<string, React.ComponentType<any>> = new Map();

export function registerWrapper(name: string, comp: React.ComponentType<any>) {
  wrapperRegistry.set(name, comp);
}

export function findWrapper(name: string) {
  return wrapperRegistry.get(name);
}
