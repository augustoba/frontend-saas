import { Component, Input } from '@angular/core';

/** Set chico de íconos de línea (24x24, stroke=currentColor) para el nav y los headers. */
const PATHS: Record<string, string> = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  fork: 'M8 3v7a2 2 0 0 0 4 0V3M10 10v11M18 3c-1.5 0-3 2-3 5s1.5 5 3 5 3-2 3-5-1.5-5-3-5zM18 13v8',
  card: 'M3 6h18v12H3zM3 10h18',
  dollar: 'M12 2v20M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5S9.2 10 12 10s5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5',
  receipt: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
  chart: 'M4 20V10M11 20V4M18 20v-7',
  pizza: 'M12 3 3 19h18zM12 13v.01M8 15v.01M16 15v.01',
  register: 'M4 8h16v12H4zM8 8V5h8v3M9 13h6M9 17h6',
  users: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 21c0-3.3 2.7-6 6-6s6 2.7 6 6M14 15.5c2.9.3 5 2.7 5 5.5',
  calendar: 'M5 4h14v17H5zM5 9h14M9 2v4M15 2v4',
  truck: 'M2 7h11v9H2zM13 10h5l3 3v3h-8zM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c2.5 2.7 4 6.3 4 10s-1.5 7.3-4 10c-2.5-2.7-4-6.3-4-10s1.5-7.3 4-10z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.5 9a2.5 2.5 0 1 1 3.7 2.2c-.8.5-1.2 1-1.2 1.8v.3M12 17h.01',
  user: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM3 21c0-4.4 4-8 9-8s9 3.6 9 8',
  close: 'M18 6 6 18M6 6l12 12',
  refresh: 'M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15-4l1 1M20 15a9 9 0 0 1-15 4l-1-1',
  chat: 'M4 5h16v11H9l-4 4z',
  flame: 'M12 2c1 3-2 4-2 7a4 4 0 1 0 8 0c0-2-1-4-2-5 .3 2-1 2.5-1.5 1.5-.5-1 .2-2.5-2.5-3.5zM9 16a3 3 0 0 0 6 0',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      [attr.stroke]="'currentColor'"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path [attr.d]="path" />
    </svg>
  `,
})
export class IconComponent {
  @Input() name = 'grid';
  @Input() size = 20;

  get path(): string {
    return PATHS[this.name] ?? PATHS['grid'];
  }
}
