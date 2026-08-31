import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGlobe, FaFolder, FaStar, FaClock, FaPlus, FaExternalLinkAlt } from 'react-icons/fa';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { useToast } from '../../context/ToastContext';
import categoryService from '../../services/categoryService';
import websiteService from '../../services/websiteService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import CategoryForm from '../../components/forms/CategoryForm';
import WebsiteForm from '../../components/forms/WebsiteForm';

const Dashboard = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Data states
  const [stats, setStats] = useState({
    totalWebsites: 0,
    totalCategories: 0,
    totalFavorites: 0,
    recentCount: 0,
  });
  const [categories, setCategories] = useState([]);
  const [recentWebsites, setRecentWebsites] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Loader states
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsError(false);
      // Fetch categories (contains dynamic websiteCount in each)
      const catRes = await categoryService.getCategories();
      const categoriesData = catRes.data || [];
      setCategories(categoriesData);

      // Fetch total websites (limit 1 to get meta total)
      const webRes = await websiteService.getWebsites({ limit: 1 });
      const totalWebsites = webRes.total || 0;

      // Fetch favorites (limit 1 to get meta total)
      const favRes = await websiteService.getWebsites({ favorite: true, limit: 1 });
      const totalFavorites = favRes.total || 0;

      // Fetch recently added websites (limit 8, sorted by date)
      const recentRes = await websiteService.getWebsites({
        limit: 8,
        sort: 'createdAt',
        order: 'desc',
      });
      const recentData = recentRes.data || [];
      setRecentWebsites(recentData);

      // Set stats object
      setStats({
        totalWebsites,
        totalCategories: categoriesData.length,
        totalFavorites,
        recentCount: recentData.length,
      });

      // Prepare category distribution chart data (only categories with > 0 websites)
      const dist = categoriesData
        .map((cat) => ({
          name: cat.name,
          websites: cat.websiteCount || 0,
          color: cat.color || '#4F46E5',
        }))
        .filter((cat) => cat.websites > 0);
      setChartData(dist);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Quick Category Create
  const handleCategoryCreate = async (formData) => {
    setFormSubmitting(true);
    try {
      const res = await categoryService.createCategory(formData);
      if (res.success) {
        success('Category created successfully!');
        setIsCategoryModalOpen(false);
        fetchDashboardData(); // Refresh stats and lists
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Quick Website Create
  const handleWebsiteCreate = async (formData) => {
    setFormSubmitting(true);
    try {
      const res = await websiteService.createWebsite(formData);
      if (res.success) {
        success('Website bookmarked successfully!');
        setIsWebsiteModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to bookmark website');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Format date helper
  const formatDateAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <LoadingSpinner message="Assembling your dashboard..." />;
  }

  if (isError) {
    return <ErrorState message="Could not compile dashboard. Please verify API connection." onRetry={fetchDashboardData} />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Websites */}
        <div className="bg-card border border-border/40 p-4 md:p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <FaGlobe size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-heading">{stats.totalWebsites}</p>
            <p className="text-xs font-semibold text-secondary-text mt-0.5">Total Websites</p>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-card border border-border/40 p-4 md:p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600">
            <FaFolder size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-heading">{stats.totalCategories}</p>
            <p className="text-xs font-semibold text-secondary-text mt-0.5">Categories</p>
          </div>
        </div>

        {/* Favorites */}
        <div className="bg-card border border-border/40 p-4 md:p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
            <FaStar size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-heading">{stats.totalFavorites}</p>
            <p className="text-xs font-semibold text-secondary-text mt-0.5">Favorites</p>
          </div>
        </div>

        {/* Recent Count */}
        <div className="bg-card border border-border/40 p-4 md:p-6 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <FaClock size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-heading">{stats.recentCount}</p>
            <p className="text-xs font-semibold text-secondary-text mt-0.5">Recent Websites</p>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setIsWebsiteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs md:text-sm shadow-md shadow-primary/20 transition-all duration-200"
        >
          <FaPlus size={12} />
          Add Website
        </button>
        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-border text-heading font-bold text-xs md:text-sm transition-all duration-200"
        >
          <FaPlus size={12} />
          Add Category
        </button>
      </div>

      {/* 3. Main Content: Chart & Recent Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Category Distribution Chart */}
        <div className="lg:col-span-2 bg-card border border-border/40 p-5 rounded-2xl shadow-sm flex flex-col min-h-[350px]">
          <h3 className="text-sm font-bold text-heading mb-4">Category Distribution</h3>
          {chartData.length > 0 ? (
            <div className="flex-1 min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: '#F1F5F9', opacity: 0.5 }}
                  />
                  <Bar dataKey="websites" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-center p-6 border-2 border-dashed border-border/40 rounded-xl">
              <p className="text-xs text-secondary-text font-medium">
                No bookmark statistics available. Populate some websites first!
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Recently Added Websites */}
        <div className="bg-card border border-border/40 p-5 rounded-2xl shadow-sm flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-heading">Recently Added</h3>
            <button
              onClick={() => navigate('/websites')}
              className="text-[10px] font-bold text-primary hover:text-primary-dark hover:underline"
            >
              View All
            </button>
          </div>

          {recentWebsites.length > 0 ? (
            <div className="space-y-3.5 overflow-y-auto max-h-[300px] flex-grow pr-1">
              {recentWebsites.map((web) => (
                <div
                  key={web._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-1.5">
                      {web.favorite && <FaStar className="text-amber-400 text-xs flex-shrink-0" />}
                      <h4 className="text-xs font-bold text-heading truncate">{web.name}</h4>
                    </div>
                    
                    {/* Category tag */}
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: web.category?.color || '#6B7280' }}
                      />
                      <span className="text-[10px] text-secondary-text font-semibold truncate">
                        {web.category?.name || 'Uncategorized'}
                      </span>
                      <span className="text-[9px] text-gray-400 font-semibold">•</span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {formatDateAgo(web.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Open Link */}
                  <a
                    href={web.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-secondary-text hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    title={`Open ${web.name}`}
                  >
                    <FaExternalLinkAlt size={12} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-center p-6 border-2 border-dashed border-border/40 rounded-xl">
              <p className="text-xs text-secondary-text font-medium">
                No recent bookmarks.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODALS FOR QUICK ACTIONS */}
      
      {/* Category Creation Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Category"
      >
        <CategoryForm
          onSubmit={handleCategoryCreate}
          isLoading={formSubmitting}
          onCancel={() => setIsCategoryModalOpen(false)}
        />
      </Modal>

      {/* Website Creation Modal */}
      <Modal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        title="Add Website"
        size="lg"
      >
        {categories.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-secondary-text mb-4">
              Please create at least one category before adding a website bookmark.
            </p>
            <Button
              onClick={() => {
                setIsWebsiteModalOpen(false);
                setIsCategoryModalOpen(true);
              }}
            >
              Create a Category
            </Button>
          </div>
        ) : (
          <WebsiteForm
            categories={categories}
            onSubmit={handleWebsiteCreate}
            isLoading={formSubmitting}
            onCancel={() => setIsWebsiteModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
