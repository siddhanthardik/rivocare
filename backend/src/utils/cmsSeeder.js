require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const connectDB = require('../config/db');
const Page = require('../models/Page');
const Blog = require('../models/Blog');

const seed = async () => {
  await connectDB();

  const pagesCount = await Page.countDocuments();
  const blogsCount = await Blog.countDocuments();

  if (pagesCount === 0) {
    await Page.create([
      { title: 'Home', slug: 'home', content: '<p>Welcome to RIVO</p>', meta: { title: 'Home' }, isActive: true },
      { title: 'About Us', slug: 'about-us', content: '<p>About our company</p>', meta: { title: 'About Us' }, isActive: true },
    ]);
    console.log('Seeded sample Pages');
  } else console.log('Pages already present, skipping');

  if (blogsCount === 0) {
    await Blog.create([
      { title: 'Welcome to our Blog', slug: 'welcome', excerpt: 'Intro', content: '<p>First post</p>', status: 'PUBLISHED', publishedAt: new Date() },
    ]);
    console.log('Seeded sample Blogs');
  } else console.log('Blogs already present, skipping');

  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
