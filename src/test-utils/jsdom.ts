import { JSDOM } from 'jsdom';

export function setupJSDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
  
  // Set up global variables that jsdom doesn't provide by default
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  
  // Add other globals that might be needed
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLButtonElement = dom.window.HTMLButtonElement;
  global.MouseEvent = dom.window.MouseEvent;
  
  return dom;
} 