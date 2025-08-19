export interface ServiceData {
  id: string;
  name: string;
  icon_url?: string;
  category: string;
  color?: string; // Used to generate background color for initial icons
}

// Simple Icons CDN base URL
const SIMPLE_ICONS_CDN = 'https://cdn.jsdelivr.net/npm/simple-icons@v10/icons';

export const PREDEFINED_SERVICES: ServiceData[] = [
  // Entertainment
  { id: 'netflix', name: 'Netflix', icon_url: `${SIMPLE_ICONS_CDN}/netflix.svg`, category: 'Entertainment', color: '#E50914' },
  { id: 'spotify', name: 'Spotify', icon_url: `${SIMPLE_ICONS_CDN}/spotify.svg`, category: 'Entertainment', color: '#1DB954' },
  { id: 'youtube-premium', name: 'YouTube Premium', icon_url: `${SIMPLE_ICONS_CDN}/youtube.svg`, category: 'Entertainment', color: '#FF0000' },
  { id: 'disney-plus', name: 'Disney+', icon_url: `${SIMPLE_ICONS_CDN}/disneyplus.svg`, category: 'Entertainment', color: '#113CCF' },
  { id: 'hulu', name: 'Hulu', icon_url: `${SIMPLE_ICONS_CDN}/hulu.svg`, category: 'Entertainment', color: '#1CE783' },
  { id: 'amazon-prime', name: 'Amazon Prime Video', icon_url: `${SIMPLE_ICONS_CDN}/amazonprime.svg`, category: 'Entertainment', color: '#00A8E1' },
  { id: 'apple-tv', name: 'Apple TV+', icon_url: `${SIMPLE_ICONS_CDN}/appletv.svg`, category: 'Entertainment', color: '#000000' },
  { id: 'hbo-max', name: 'HBO Max', icon_url: `${SIMPLE_ICONS_CDN}/hbo.svg`, category: 'Entertainment', color: '#8B5CF6' },
  { id: 'twitch', name: 'Twitch', icon_url: `${SIMPLE_ICONS_CDN}/twitch.svg`, category: 'Entertainment', color: '#9146FF' },
  
  // Development Tools
  { id: 'github', name: 'GitHub', icon_url: `${SIMPLE_ICONS_CDN}/github.svg`, category: 'Development', color: '#24292e' },
  { id: 'gitlab', name: 'GitLab', icon_url: `${SIMPLE_ICONS_CDN}/gitlab.svg`, category: 'Development', color: '#FC6D26' },
  { id: 'jetbrains', name: 'JetBrains', icon_url: `${SIMPLE_ICONS_CDN}/jetbrains.svg`, category: 'Development', color: '#000000' },
  { id: 'vscode', name: 'Visual Studio Code', icon_url: `${SIMPLE_ICONS_CDN}/visualstudiocode.svg`, category: 'Development', color: '#007ACC' },
  { id: 'figma', name: 'Figma', icon_url: `${SIMPLE_ICONS_CDN}/figma.svg`, category: 'Development', color: '#F24E1E' },
  { id: 'sketch', name: 'Sketch', icon_url: `${SIMPLE_ICONS_CDN}/sketch.svg`, category: 'Development', color: '#F7B500' },
  { id: 'adobe-cc', name: 'Adobe Creative Cloud', icon_url: `${SIMPLE_ICONS_CDN}/adobe.svg`, category: 'Development', color: '#FF0000' },
  
  // Cloud Services
  { id: 'aws', name: 'Amazon Web Services', icon_url: `${SIMPLE_ICONS_CDN}/amazonwebservices.svg`, category: 'Cloud', color: '#FF9900' },
  { id: 'google-cloud', name: 'Google Cloud', icon_url: `${SIMPLE_ICONS_CDN}/googlecloud.svg`, category: 'Cloud', color: '#4285F4' },
  { id: 'azure', name: 'Microsoft Azure', icon_url: `${SIMPLE_ICONS_CDN}/microsoftazure.svg`, category: 'Cloud', color: '#0078D4' },
  { id: 'digitalocean', name: 'DigitalOcean', icon_url: `${SIMPLE_ICONS_CDN}/digitalocean.svg`, category: 'Cloud', color: '#0080FF' },
  { id: 'heroku', name: 'Heroku', icon_url: `${SIMPLE_ICONS_CDN}/heroku.svg`, category: 'Cloud', color: '#430098' },
  { id: 'vercel', name: 'Vercel', icon_url: `${SIMPLE_ICONS_CDN}/vercel.svg`, category: 'Cloud', color: '#000000' },
  { id: 'netlify', name: 'Netlify', icon_url: `${SIMPLE_ICONS_CDN}/netlify.svg`, category: 'Cloud', color: '#00C7B7' },
  
  // Productivity Tools
  { id: 'slack', name: 'Slack', icon_url: `${SIMPLE_ICONS_CDN}/slack.svg`, category: 'Productivity', color: '#4A154B' },
  { id: 'discord', name: 'Discord', icon_url: `${SIMPLE_ICONS_CDN}/discord.svg`, category: 'Productivity', color: '#5865F2' },
  { id: 'zoom', name: 'Zoom', icon_url: `${SIMPLE_ICONS_CDN}/zoom.svg`, category: 'Productivity', color: '#2D8CFF' },
  { id: 'notion', name: 'Notion', icon_url: `${SIMPLE_ICONS_CDN}/notion.svg`, category: 'Productivity', color: '#000000' },
  { id: 'microsoft-365', name: 'Microsoft 365', icon_url: `${SIMPLE_ICONS_CDN}/microsoft365.svg`, category: 'Productivity', color: '#D83B01' },
  { id: 'google-workspace', name: 'Google Workspace', icon_url: `${SIMPLE_ICONS_CDN}/googleworkspace.svg`, category: 'Productivity', color: '#4285F4' },
  { id: 'dropbox', name: 'Dropbox', icon_url: `${SIMPLE_ICONS_CDN}/dropbox.svg`, category: 'Productivity', color: '#0061FF' },
  { id: 'icloud', name: 'iCloud', icon_url: `${SIMPLE_ICONS_CDN}/icloud.svg`, category: 'Productivity', color: '#007AFF' },
  
  // Social Media
  { id: 'twitter', name: 'Twitter/X Premium', icon_url: `${SIMPLE_ICONS_CDN}/x.svg`, category: 'Social', color: '#000000' },
  { id: 'linkedin', name: 'LinkedIn Premium', icon_url: `${SIMPLE_ICONS_CDN}/linkedin.svg`, category: 'Social', color: '#0077B5' },
  { id: 'instagram', name: 'Instagram', icon_url: `${SIMPLE_ICONS_CDN}/instagram.svg`, category: 'Social', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon_url: `${SIMPLE_ICONS_CDN}/tiktok.svg`, category: 'Social', color: '#000000' },
  
  // Learning & Education
  { id: 'coursera', name: 'Coursera', icon_url: `${SIMPLE_ICONS_CDN}/coursera.svg`, category: 'Education', color: '#0056D3' },
  { id: 'udemy', name: 'Udemy', icon_url: `${SIMPLE_ICONS_CDN}/udemy.svg`, category: 'Education', color: '#A435F0' },
  { id: 'duolingo', name: 'Duolingo', icon_url: `${SIMPLE_ICONS_CDN}/duolingo.svg`, category: 'Education', color: '#58CC02' },
  { id: 'skillshare', name: 'Skillshare', icon_url: `${SIMPLE_ICONS_CDN}/skillshare.svg`, category: 'Education', color: '#00FF88' },
  
  // News & Information
  { id: 'medium', name: 'Medium', icon_url: `${SIMPLE_ICONS_CDN}/medium.svg`, category: 'News', color: '#000000' },
  { id: 'new-york-times', name: 'The New York Times', icon_url: `${SIMPLE_ICONS_CDN}/nytimes.svg`, category: 'News', color: '#000000' },
  { id: 'wall-street-journal', name: 'Wall Street Journal', icon_url: `${SIMPLE_ICONS_CDN}/thewallstreetjournal.svg`, category: 'News', color: '#0274B6' },
  
  // Gaming
  { id: 'steam', name: 'Steam', icon_url: `${SIMPLE_ICONS_CDN}/steam.svg`, category: 'Gaming', color: '#000000' },
  { id: 'xbox-game-pass', name: 'Xbox Game Pass', icon_url: `${SIMPLE_ICONS_CDN}/xbox.svg`, category: 'Gaming', color: '#107C10' },
  { id: 'playstation-plus', name: 'PlayStation Plus', icon_url: `${SIMPLE_ICONS_CDN}/playstation.svg`, category: 'Gaming', color: '#003791' },
  { id: 'nintendo-switch-online', name: 'Nintendo Switch Online', icon_url: `${SIMPLE_ICONS_CDN}/nintendoswitch.svg`, category: 'Gaming', color: '#E60012' },
  
  // Health & Fitness
  { id: 'apple-fitness', name: 'Apple Fitness+', icon_url: `${SIMPLE_ICONS_CDN}/apple.svg`, category: 'Health', color: '#000000' },
  { id: 'peloton', name: 'Peloton', icon_url: `${SIMPLE_ICONS_CDN}/peloton.svg`, category: 'Health', color: '#000000' },
  { id: 'headspace', name: 'Headspace', icon_url: `${SIMPLE_ICONS_CDN}/headspace.svg`, category: 'Health', color: '#F47068' },
  
  // Finance
  { id: 'robinhood', name: 'Robinhood Gold', icon_url: `${SIMPLE_ICONS_CDN}/robinhood.svg`, category: 'Finance', color: '#00C805' },
  { id: 'mint', name: 'Mint', icon_url: `${SIMPLE_ICONS_CDN}/mint.svg`, category: 'Finance', color: '#00A86B' },
  { id: 'ynab', name: 'YNAB', icon_url: `${SIMPLE_ICONS_CDN}/ynab.svg`, category: 'Finance', color: '#418FDE' },
  
  // Chinese Services (Most Chinese services may not be available in Simple Icons, use generic icons or initial icons)
  { id: 'iqiyi', name: 'iQiyi', category: 'Entertainment', color: '#00BE06' },
  { id: 'tencent-video', name: 'Tencent Video', category: 'Entertainment', color: '#FF6600' },
  { id: 'youku', name: 'Youku', category: 'Entertainment', color: '#3FABD9' },
  { id: 'bilibili', name: 'Bilibili', icon_url: `${SIMPLE_ICONS_CDN}/bilibili.svg`, category: 'Entertainment', color: '#00A1D6' },
  { id: 'netease-music', name: 'NetEase Music', category: 'Entertainment', color: '#C20C0C' },
  { id: 'qq-music', name: 'QQ Music', category: 'Entertainment', color: '#31C27C' },
  { id: 'aliyun', name: 'Alibaba Cloud', icon_url: `${SIMPLE_ICONS_CDN}/alibabacloud.svg`, category: 'Cloud', color: '#FF6A00' },
  { id: 'tencent-cloud', name: 'Tencent Cloud', icon_url: `${SIMPLE_ICONS_CDN}/tencentqq.svg`, category: 'Cloud', color: '#006EFF' },
  { id: 'wechat-work', name: 'WeChat Work', icon_url: `${SIMPLE_ICONS_CDN}/wechat.svg`, category: 'Productivity', color: '#07C160' },
  { id: 'dingtalk', name: 'DingTalk', category: 'Productivity', color: '#2EABFF' },
];

// Generate initial icon based on service name
export const generateInitialIcon = (serviceName: string, color?: string): string => {
  const initial = serviceName.charAt(0).toUpperCase();
  const bgColor = color || getRandomColor(serviceName);
  const textColor = getContrastColor(bgColor);
  
  // Create SVG string and encode as data URL
  const svg = `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="${bgColor}"/><text x="20" y="26" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="${textColor}">${initial}</text></svg>`;
  
  // Use URL encoding instead of base64, safer
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// Generate fixed color based on string
export const getRandomColor = (str: string): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
    '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#F472B6',
    '#22C55E', '#A855F7', '#0EA5E9', '#EAB308', '#DC2626', '#059669'
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Calculate contrast color based on background color
export const getContrastColor = (hexColor: string): string => {
  // Remove # symbol
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

// Find predefined service by name
export const findServiceByName = (name: string): ServiceData | undefined => {
  return PREDEFINED_SERVICES.find(
    service => service.name.toLowerCase() === name.toLowerCase()
  );
};

// Get service icon URL, generate initial icon if not predefined
export const getServiceIcon = (name: string, fallbackColor?: string): string => {
  const predefinedService = findServiceByName(name);
  
  if (predefinedService?.icon_url) {
    return predefinedService.icon_url;
  }
  
  return generateInitialIcon(name, predefinedService?.color || fallbackColor);
};