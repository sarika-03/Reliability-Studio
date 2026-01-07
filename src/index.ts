import { AppPlugin } from '@grafana/data';
import { App } from './app/App';

export const plugin = new AppPlugin().setRootPage(App);
