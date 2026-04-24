exports.generateSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'https://rivocare.in';
    const currentDate = new Date().toISOString();

    const staticRoutes = [
      '/',
      '/join',
      '/about-us',
      '/contact-us',
      '/careers',
      '/sitemap',
      '/terms-of-service',
      '/privacy-policy',
      '/login',
      '/register',
      '/services/nursing-care',
      '/services/physiotherapy',
      '/services/doctor-at-home',
      '/services/elder-care'
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static routes
    staticRoutes.forEach(route => {
      xml += '  <url>\n';
      // Format URL correctly removing double slashes if any
      const fullUrl = `${baseUrl}${route}`;
      xml += `    <loc>${fullUrl}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>${route === '/' ? 'daily' : 'weekly'}</changefreq>\n`;
      xml += `    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    res.status(500).send('Error generating sitemap');
  }
};
