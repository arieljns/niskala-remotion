/** Line icons drawn for this kit on a 24 grid, in SF Symbols-like proportions. */
type IconProps = { size?: number; color?: string; stroke?: number; fill?: string; style?: React.CSSProperties };

const icon =
  (paths: React.ReactNode, defaultStroke = 1.8): React.FC<IconProps> =>
  ({ size = 24, color = "currentColor", stroke = defaultStroke, fill = "none", style }) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {paths}
    </svg>
  );

export const Heart = icon(<path d="M12 20.3S3.5 15.4 3.5 9.2A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.5 2.7c0 6.2-8.5 11.1-8.5 11.1Z" />);
export const Comment = icon(<path d="M20.6 11.6a8.6 8.6 0 0 1-12.7 7.6L3.6 20.4l1.2-4.1a8.6 8.6 0 1 1 15.8-4.7Z" />);
export const Plane = icon(<><path d="M21 3.5 3 10.2l7 3 3 7.3L21 3.5Z" /><path d="m10 13.2 5.2-4.4" /></>);
export const Bookmark = icon(<path d="M6 3.5h12v17.2l-6-4.7-6 4.7V3.5Z" />);
export const Camera = icon(<><path d="M3.5 8.5a2 2 0 0 1 2-2h2.3l1.6-2.5h5.2l1.6 2.5h2.3a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V8.5Z" /><circle cx="12" cy="12.8" r="3.8" /></>);
export const Bag = icon(<><path d="M5.2 8h13.6l1 12.5H4.2L5.2 8Z" /><path d="M8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5" /></>);
export const Share = icon(<><path d="M12 15V3.5M7.8 7.4 12 3.3l4.2 4.1" /><path d="M8 10.5H5.5v10h13v-10H16" /></>);
export const ChevronLeft = icon(<path d="M15 4 7 12l8 8" />, 2);
export const ChevronRight = icon(<path d="m9 4 8 8-8 8" />, 2);
export const ChevronDown = icon(<path d="m5 9 7 7 7-7" />, 2);
export const Xmark = icon(<path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />, 2);
export const Cart = icon(<><path d="M2.5 3.5h2.8l2.3 12h10.6l2.1-9H6" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17.3" cy="19.5" r="1.3" /></>);
export const Menu = icon(<path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />);
export const Music = icon(<><path d="M9 18V5.5l11-2v12.2" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="15.7" r="2.5" /></>);
export const Check = icon(<path d="m4.5 12.5 5 5 10-11" />, 2.4);
export const Plus = icon(<path d="M12 5v14M5 12h14" />);
export const Minus = icon(<path d="M5 12h14" />);
export const Grid = icon(<path d="M3.5 3.5h17v17h-17zM3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" />, 1.6);
export const PlayBox = icon(<><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><path d="m10 8.5 5.5 3.5-5.5 3.5v-7Z" /></>);
export const Home = icon(<path d="m3.5 11 8.5-7.5 8.5 7.5v9.5h-5.8v-6H9.3v6H3.5V11Z" />);
export const Search = icon(<><circle cx="10.8" cy="10.8" r="6.8" /><path d="m20.5 20.5-4.9-4.9" /></>);
export const PersonPlus = icon(<><circle cx="10" cy="8" r="4" /><path d="M2.8 20.5c.6-3.9 3.5-6 7.2-6s6.6 2.1 7.2 6M19 7.5v6M16 10.5h6" /></>);
export const Person = icon(<><circle cx="12" cy="8" r="4.5" /><path d="M4 20.5c.7-3.9 4-6 8-6s7.3 2.1 8 6" /></>);
export const Lightning = icon(<path d="M13.5 2.5 5 13.5h6l-1 8 9-11.5h-6.5l.5-7.5Z" />);
export const Truck = icon(<><path d="M2.5 6h11.5v10.5H2.5zM14 10h4l3.5 3.5v3H14" /><circle cx="7" cy="17.5" r="2" /><circle cx="17.5" cy="17.5" r="2" /></>);
export const Ticket = icon(<path d="M3 7.5h18v3a1.8 1.8 0 0 0 0 3.5v3H3v-3a1.8 1.8 0 0 0 0-3.5v-3Z" />);
export const Reload = icon(<><path d="M19.5 12a7.5 7.5 0 1 1-2.3-5.4" /><path d="M19.8 3.5v4.2h-4.2" /></>);

export const Lock: React.FC<{ size?: number; color?: string }> = ({ size = 12, color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
    <path
      fill={color}
      d="M6 10V7.5a6 6 0 0 1 12 0V10h.5A2.5 2.5 0 0 1 21 12.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5v-7A2.5 2.5 0 0 1 5.5 10H6Zm2.6 0h6.8V7.5a3.4 3.4 0 0 0-6.8 0V10Z"
    />
  </svg>
);

export const Ellipsis: React.FC<{ size?: number; color?: string; vertical?: boolean }> = ({
  size = 24,
  color = "currentColor",
  vertical,
}) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", flexShrink: 0, rotate: vertical ? "90deg" : undefined }}>
    <circle cx="5" cy="12" r="1.9" fill={color} />
    <circle cx="12" cy="12" r="1.9" fill={color} />
    <circle cx="19" cy="12" r="1.9" fill={color} />
  </svg>
);

export const Star: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = "#FF9F0A" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
    <path fill={color} d="m12 2.8 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.7l-5.9 3.1 1.2-6.5L2.5 9.7l6.6-.9 2.9-6Z" />
  </svg>
);

export const PlayFill: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = "#fff" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
    <path fill={color} d="M7 4.5c0-.9 1-1.5 1.8-1l11 7.4c.7.5.7 1.6 0 2.1l-11 7.4c-.8.5-1.8-.1-1.8-1V4.5Z" />
  </svg>
);
