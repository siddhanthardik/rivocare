import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, ArrowRight, Mail } from 'lucide-react';

const categories = ['All Articles', 'Elder Care', 'Home Healthcare', 'Recovery', 'Health Tips', 'Caregiver Guide', 'News & Updates'];

const posts = [
  {
    id: 1,
    category: 'Elder Care',
    categoryColor: 'bg-blue-100 text-blue-700',
    date: 'May 20, 2024',
    title: 'How to Take Better Care of Elderly Parents at Home',
    excerpt: 'Simple tips and daily practices that can make a big difference in your loved ones\' lives.',
    image: '/images/blog-post1.png',
    readTime: '5 min read',
  },
  {
    id: 2,
    category: 'Home Healthcare',
    categoryColor: 'bg-green-100 text-green-700',
    date: 'May 18, 2024',
    title: 'Benefits of Home Nursing Care for Faster Recovery',
    excerpt: 'Home nursing care ensures comfort, personalized attention and better health outcomes.',
    image: '/images/blog-post2.png',
    readTime: '4 min read',
  },
  {
    id: 3,
    category: 'Health Tips',
    categoryColor: 'bg-orange-100 text-orange-700',
    date: 'May 15, 2024',
    title: '5 Essential Health Tips for a Stronger Immune System',
    excerpt: 'Boost your immunity naturally with these expert-recommended tips and habits.',
    image: '/images/blog-post3.png',
    readTime: '6 min read',
  },
  {
    id: 4,
    category: 'News & Updates',
    categoryColor: 'bg-purple-100 text-purple-700',
    date: 'May 10, 2024',
    title: 'Rivo Care Expands to 20+ Cities Across India',
    excerpt: 'We\'re excited to bring our trusted healthcare services to more families across the country.',
    image: '/images/about-hero.png',
    readTime: '3 min read',
  },
  {
    id: 5,
    category: 'Recovery',
    categoryColor: 'bg-teal-100 text-teal-700',
    date: 'May 08, 2024',
    title: 'Post-Surgery Recovery at Home: A Complete Guide',
    excerpt: 'Everything you need to know to recover safely and comfortably at home after surgery.',
    image: '/images/service-nursing.png',
    readTime: '8 min read',
  },
  {
    id: 6,
    category: 'Caregiver Guide',
    categoryColor: 'bg-pink-100 text-pink-700',
    date: 'May 05, 2024',
    title: 'How to Choose the Right Caregiver for Your Loved One',
    excerpt: 'Key qualities to look for when hiring a home caregiver for elderly or bedridden patients.',
    image: '/images/service-eldercare.png',
    readTime: '5 min read',
  },
  {
    id: 7,
    category: 'Home Healthcare',
    categoryColor: 'bg-green-100 text-green-700',
    date: 'May 03, 2024',
    title: 'Understanding ICU at Home: Everything You Need to Know',
    excerpt: 'How home ICU care works and when it can be a safe alternative to hospital admission.',
    image: '/images/service-doctor.png',
    readTime: '7 min read',
  },
  {
    id: 8,
    category: 'Health Tips',
    categoryColor: 'bg-orange-100 text-orange-700',
    date: 'May 01, 2024',
    title: 'Physiotherapy at Home: Benefits and What to Expect',
    excerpt: 'Understanding what home physiotherapy sessions look like and how they benefit patients.',
    image: '/images/service-physio.png',
    readTime: '5 min read',
  },
];

const popularPosts = [
  { title: 'Post-Surgery Care Tips for a Smooth Recovery', date: 'May 22, 2024', image: '/images/service-nursing.png' },
  { title: 'Understanding ICU at Home: Everything You Need to Know', date: 'May 18, 2024', image: '/images/service-doctor.png' },
  { title: 'Physiotherapy at Home: Benefits and What to Expect', date: 'May 12, 2024', image: '/images/service-physio.png' },
];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All Articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');

  const filtered = posts.filter((p) => {
    const matchCat = activeCategory === 'All Articles' || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="bg-white min-h-screen font-sans">

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-blue-50 border-b border-blue-100">
        <div className="absolute inset-0 opacity-20">
          <img src="/images/blog-hero.png" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Poppins,sans-serif' }}>
              Rivo Care Blog
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-md">
              Health tips, expert advice and resources to help you and your loved ones live healthier every day.
            </p>
          </div>
          <div className="hidden lg:block">
            <img src="/images/blog-hero.png" alt="Rivo Blog" className="w-full h-48 object-cover rounded-2xl shadow-lg" />
          </div>
        </div>
      </section>

      {/* Category Filter + Search */}
      <section className="border-b border-slate-200 bg-white sticky top-[84px] z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-[1fr_280px] gap-10">

          {/* Posts Grid */}
          <div>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <p className="text-lg font-medium">No articles found.</p>
                <p className="text-sm mt-1">Try a different category or search term.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {filtered.map((post) => (
                  <article key={post.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group">
                    <div className="relative overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className={`absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full ${post.categoryColor}`}>
                        {post.category}
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-slate-400 mb-2">{post.date} · {post.readTime}</p>
                      <h2 className="font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2" style={{ fontFamily: 'Poppins,sans-serif' }}>
                        {post.title}
                      </h2>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                      <Link to={`/blog/${post.id}`} className="inline-flex items-center gap-1 text-blue-600 text-sm font-semibold hover:gap-2 transition-all">
                        Read More <ArrowRight size={13} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Popular Articles */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 text-sm" style={{ fontFamily: 'Poppins,sans-serif' }}>Popular Articles</h3>
              <div className="space-y-4">
                {popularPosts.map((p) => (
                  <div key={p.title} className="flex gap-3 group cursor-pointer">
                    <img src={p.image} alt={p.title} className="w-16 h-14 object-cover rounded-xl shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition line-clamp-2">{p.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{p.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 text-sm" style={{ fontFamily: 'Poppins,sans-serif' }}>Categories</h3>
              <ul className="space-y-2">
                {categories.filter(c => c !== 'All Articles').map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => setActiveCategory(cat)}
                      className={`text-sm hover:text-blue-600 transition w-full text-left flex items-center gap-2 ${activeCategory === cat ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}
                    >
                      <ChevronRight size={13} /> {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-blue-600 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Mail size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg" style={{ fontFamily: 'Poppins,sans-serif' }}>Stay Updated with Rivo Care</h3>
                <p className="text-blue-100 text-sm">Subscribe to our newsletter for the latest health tips and updates.</p>
              </div>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); alert(`Subscribed with ${email}`); setEmail(''); }}
              className="flex gap-3 w-full"
            >
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-4 py-3 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="shrink-0 bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition text-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
