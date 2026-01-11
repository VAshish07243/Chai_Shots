// utility to create placeholder images using data URIs (always works)
export const createPlaceholderImage = (width, height, text = 'No Image', color = '#4a90e2') => {
  // Clean text - remove extra spaces, limit length, split into lines if needed
  const cleanText = (text || 'No Image').trim().substring(0, 25).replace(/\s+/g, ' ');
  const fontSize = Math.min(width / 7, 18);
  
  // Create unique gradient ID to avoid conflicts
  const gradId = 'grad' + Math.random().toString(36).substr(2, 9);
  
  // Escape text for XML (not URL encoding!)
  const escapedText = cleanText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:0.9" />
        <stop offset="100%" style="stop-color:${color};stop-opacity:0.7" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#${gradId})"/>
    <text x="50%" y="50%" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${escapedText}</text>
  </svg>`;
  
  // Encode the whole SVG for data URI
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const getPosterFallback = (programTitle = 'Program') => {
  // Use different colors based on title hash for variety
  const colors = ['#4a90e2', '#50c878', '#ff6b6b', '#ffa500', '#9b59b6', '#e74c3c'];
  const colorIndex = (programTitle || '').length % colors.length;
  const color = colors[colorIndex];
  const displayText = (programTitle || 'Program').trim();
  
  // For posters (200x300), limit text length to fit in width
  // Split long text into multiple lines if needed
  const maxCharsPerLine = 15; // Approx chars that fit in 200px at 14px font
  const words = displayText.split(' ');
  let lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= maxCharsPerLine && currentLine.length > 0) {
      currentLine += ' ' + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  
  // Limit to 2 lines max
  if (lines.length > 2) {
    lines = [lines[0], lines.slice(1).join(' ').substring(0, maxCharsPerLine) + '...'];
  }
  
  const fontSize = 14; // Smaller font that fits better
  const lineHeight = 18;
  const startY = 150 - ((lines.length - 1) * lineHeight / 2);
  
  // Create unique gradient ID
  const gradId = 'grad' + Math.random().toString(36).substr(2, 9);
  
  // Create text elements for each line
  const textElements = lines.map((line, index) => {
    const escapedText = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    const y = startY + (index * lineHeight);
    return `<text x="100" y="${y}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${escapedText}</text>`;
  }).join('');
  
  const svg = `<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:0.9" />
        <stop offset="100%" style="stop-color:${color};stop-opacity:0.7" />
      </linearGradient>
    </defs>
    <rect width="200" height="300" fill="url(#${gradId})"/>
    ${textElements}
  </svg>`;
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const getThumbnailFallback = (lessonTitle = 'Lesson') => {
  const colors = ['#4a90e2', '#50c878', '#ff6b6b', '#ffa500', '#9b59b6', '#e74c3c'];
  const colorIndex = (lessonTitle || '').length % colors.length;
  const color = colors[colorIndex];
  const displayText = lessonTitle || 'Lesson';
  return createPlaceholderImage(300, 400, displayText, color);
};
