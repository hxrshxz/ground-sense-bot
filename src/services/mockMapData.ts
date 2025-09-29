// Enhanced mock for demo - creates a realistic-looking INGRES map
export const createMockMapImage = (): string => {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    // Fallback: simple 1x1 transparent PNG
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  }
  
  // Create a realistic map background
  const gradient = ctx.createRadialGradient(600, 400, 100, 600, 400, 500);
  gradient.addColorStop(0, '#4CAF50');
  gradient.addColorStop(0.3, '#8BC34A');
  gradient.addColorStop(0.6, '#CDDC39');
  gradient.addColorStop(0.8, '#FFEB3B');
  gradient.addColorStop(1, '#FF9800');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 800);

  // Add state boundaries (simulating India map)
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  // Draw some realistic state-like boundaries
  ctx.moveTo(100, 100);
  ctx.lineTo(300, 150);
  ctx.lineTo(500, 120);
  ctx.lineTo(700, 180);
  ctx.lineTo(900, 160);
  ctx.lineTo(1100, 200);
  
  ctx.moveTo(150, 200);
  ctx.lineTo(350, 280);
  ctx.lineTo(550, 250);
  ctx.lineTo(750, 300);
  ctx.lineTo(950, 280);
  
  ctx.moveTo(200, 350);
  ctx.lineTo(400, 420);
  ctx.lineTo(600, 400);
  ctx.lineTo(800, 450);
  ctx.lineTo(1000, 430);
  
  ctx.stroke();

  // Add groundwater level indicators
  const colors = ['#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800'];
  
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 1100 + 50;
    const y = Math.random() * 700 + 50;
    const radius = Math.random() * 15 + 5;
    
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Add INGRES-style header
  ctx.fillStyle = '#1565C0';
  ctx.fillRect(0, 0, 1200, 80);
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('🎭 INGRES Map - Playwright Automation Demo', 20, 50);
  
  // Add legend
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(20, 100, 300, 200);
  
  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('Groundwater Levels', 30, 125);
  
  ctx.font = '14px Arial';
  const legendItems = [
    { color: '#2196F3', text: 'Very High (>20m)' },
    { color: '#4CAF50', text: 'High (15-20m)' },
    { color: '#CDDC39', text: 'Moderate (10-15m)' },
    { color: '#FF9800', text: 'Low (<10m)' }
  ];
  
  legendItems.forEach((item, index) => {
    const y = 150 + index * 25;
    ctx.fillStyle = item.color;
    ctx.fillRect(35, y - 10, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText(item.text, 60, y);
  });

  // Add timestamp
  ctx.fillStyle = '#666';
  ctx.font = '14px Arial';
  ctx.fillText(`Generated at: ${new Date().toLocaleString()}`, 20, 780);
  ctx.fillText('🤖 Powered by Playwright Automation', 350, 780);

  // Convert to base64
  return canvas.toDataURL('image/png').split(',')[1];
};