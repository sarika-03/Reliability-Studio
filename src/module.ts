import { AppPlugin } from '@grafana/data';
import { App } from './app/App';

// Grafana App Plugin entrypoint for Reliability Studio.
// This is what Grafana looks for when it loads dist/module.js.
// The AppPlugin runtime does support addRootPage in Grafana, but the
// TypeScript typings may not expose it yet, so we cast to any.
export const plugin = (new AppPlugin() as any).addRootPage({
  id: 'reliability-studio-root',
  name: 'Reliability Studio',
  component: App,
});
