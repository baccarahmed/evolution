import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Target, 
  TrendingUp, 
  Image, 
  Link as LinkIcon, 
  BarChart2, 
  ThumbsUp, 
  Share2,
  MoreHorizontal,
  Search,
  PlusCircle,
  Hash,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Clock,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { communityApi, adminApi } from '../api';
import './Community.css';

const Community = () => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [newPostContent, setNewPostContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModeration, setShowModeration] = useState(false);
  const [postType, setPostType] = useState('discussion');
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [commentingOn, setCommentingOn] = useState(null);
  const [newComment, setNewComment] = useState('');

  const [communityStats, setCommunityStats] = useState({
    totalMembers: 0,
    dailyMessages: 0,
    onlineNow: 0
  });

  const fetchStats = async () => {
    try {
      const response = await communityApi.getStats();
      setCommunityStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchStats();
    if (isAdmin) {
      fetchPendingPosts();
    }
    
    // Refresh stats every 30 seconds for real-time feel
    const statsInterval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(statsInterval);
  }, [isAdmin]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await communityApi.getPosts();
      setPosts(response.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      const response = await adminApi.getPendingPosts();
      setPendingPosts(response.data);
    } catch (err) {
      console.error("Error fetching pending posts:", err);
    }
  };

  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      alert("Vous devez être connecté pour publier.");
      return;
    }
    if (!newPostContent.trim()) return;

    try {
      await communityApi.createPost(newPostContent, postType);
      setNewPostContent('');
      setMessage({ type: 'success', text: 'Votre post a été envoyé pour approbation par l\'administrateur.' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      alert("Erreur lors de la création du post.");
    }
  };

  const handleLikePost = async (postId) => {
    if (!isAuthenticated) {
      alert("Vous devez être connecté pour aimer un post.");
      return;
    }
    try {
      const response = await communityApi.likePost(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, likes_count: response.data.likes } : p));
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleSharePost = async (postId) => {
    if (!isAuthenticated) {
      alert("Vous devez être connecté pour partager un post.");
      return;
    }
    try {
      const response = await communityApi.sharePost(postId);
      setPosts(posts.map(p => p.id === postId ? { ...p, shares_count: response.data.shares } : p));
      setMessage({ type: 'success', text: 'Post partagé avec succès !' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Error sharing post:", err);
    }
  };

  const handleApprovePost = async (postId, approve = true) => {
    try {
      await adminApi.approvePost(postId, approve);
      setPendingPosts(pendingPosts.filter(p => p.id !== postId));
      if (approve) {
        fetchPosts(); // Refresh feed
      }
    } catch (err) {
      alert("Erreur lors de la modération.");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce post ?")) return;
    try {
      await adminApi.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
    try {
      await adminApi.deleteComment(commentId);
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments_count: p.comments_count - 1,
            comments: p.comments.filter(c => c.id !== commentId)
          };
        }
        return p;
      }));
    } catch (err) {
      alert("Erreur lors de la suppression du commentaire.");
    }
  };

  const handleAddComment = async (postId) => {
    if (!isAuthenticated) {
      alert("Vous devez être connecté pour commenter.");
      return;
    }
    if (!newComment.trim()) return;

    try {
      const response = await communityApi.commentPost(postId, newComment);
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments_count: (p.comments_count || 0) + 1,
            comments: [...(p.comments || []), response.data]
          };
        }
        return p;
      }));
      setNewComment('');
      setCommentingOn(null);
    } catch (err) {
      alert("Erreur lors de l'ajout du commentaire.");
    }
  };

  // Helper to get display label for post types
  const getPostTypeLabel = (type) => {
    const labels = {
      signal: "Trade Signal",
      analysis: "Market Analysis",
      discussion: "Discussion",
      question: "Question"
    };
    return labels[type] || type;
  };

  const filteredPosts = posts.filter(post => {
    // Map UI filter values to actual post types in the database
    let targetType = activeFilter;
    if (activeFilter === "trades") targetType = "signal";
    if (activeFilter === "discussions") targetType = "discussion";
    if (activeFilter === "questions") targetType = "question";
    
    const matchesFilter = activeFilter === "all" || post.type === targetType;
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const [trendingTopics] = useState([
    { id: 1, tag: 'EURUSD', posts: 24 },
    { id: 2, tag: 'Bitcoin', posts: 18 },
    { id: 3, tag: 'RiskManagement', posts: 15 },
    { id: 4, tag: 'ForexAnalysis', posts: 12 },
    { id: 5, tag: 'CryptoNews', posts: 9 }
  ]);

  const [onlineUsers] = useState([
    { id: 1, name: 'Marc Trading', avatar: '🧑‍💼', status: 'Analyse EUR/USD' },
    { id: 2, name: 'Sophie Analyst', avatar: '👩‍💼', status: 'Dispo pour questions' },
    { id: 3, name: 'David Risk', avatar: '🧑‍💻', status: 'En formation' },
    { id: 4, name: 'Alex Crypto', avatar: '👨‍💼', status: 'Trading BTC' }
  ]);

  return (
    <div className="community-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Work+Sans:wght@300;400;500;600;700&display=swap');
      `}} />

      <motion.section 
        className="community-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-glow"></div>
        <div className="container">
          <motion.div 
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Users size={14} className="text-[#a020f0]" />
            <span>Join the Evolution</span>
          </motion.div>
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Social <span className="text-[#a020f0]">Trading</span> Evolution
          </motion.h1>
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Connect, share, and evolve with 2,000+ expert traders worldwide.
          </motion.p>
        </div>
      </motion.section>

      <section className="stats-section">
        <div className="container">
          <motion.div 
            className="stats-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { label: 'Total Members', value: communityStats.totalMembers, icon: <Users />, color: 'purple' },
              { label: 'Daily Signals', value: communityStats.dailyMessages, icon: <TrendingUp />, color: 'green' },
              { label: 'Traders Online', value: communityStats.onlineNow, icon: <Target />, color: 'blue' }
            ].map((stat, i) => (
              <motion.div key={i} className={`stat-card ${stat.color}`} variants={itemVariants}>
                <div className="stat-icon-wrapper">{stat.icon}</div>
                <div className="stat-info">
                  <div className="stat-value">{stat.value.toLocaleString()}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
                <div className="stat-trend">+12% this week</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="community-main">
        <div className="container">
          <div className="community-layout">
            <aside className="community-sidebar left">
              <div className="sidebar-widget search-widget">
                <div className="search-box">
                  <Search size={18} className="text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search community..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="sidebar-widget">
                <h3 className="widget-title">Categories</h3>
                <div className="category-list">
                  {[
                    { id: 'all', label: 'All Posts' },
                    { id: 'trades', label: 'Trading Signals' },
                    { id: 'analysis', label: 'Market Analysis' },
                    { id: 'discussions', label: 'Discussions' },
                    { id: 'questions', label: 'Questions' }
                  ].map((cat) => (
                    <button 
                      key={cat.id} 
                      className={`category-item ${activeFilter === cat.id ? 'active' : ''}`}
                      onClick={() => setActiveFilter(cat.id)}
                    >
                      <Hash size={16} />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sidebar-widget">
                <h3 className="widget-title">Trending Topics</h3>
                <div className="topics-cloud">
                  {trendingTopics.map(topic => (
                    <button 
                      key={topic.id} 
                      className="topic-tag"
                      onClick={() => {
                        setSearchQuery(topic.tag);
                        // Trigger search logic if implemented
                      }}
                    >
                      #{topic.tag}
                      <span className="topic-count">{topic.posts}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <main className="community-feed-area">
              <div className="feed-controls">
                <div className="filter-tabs">
                  {[
                    { id: 'all', label: 'Activity' },
                    { id: 'trades', label: 'Trades' },
                    { id: 'analysis', label: 'Analysis' },
                    { id: 'discussions', label: 'Discussions' },
                    { id: 'questions', label: 'Questions' }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      className={`tab-btn ${activeFilter === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveFilter(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                  {isAdmin && (
                    <button 
                      className={`tab-btn moderation-tab ${showModeration ? 'active' : ''}`}
                      onClick={() => setShowModeration(!showModeration)}
                    >
                      <ShieldAlert size={14} className="mr-2 inline" />
                      Pending ({pendingPosts.length})
                    </button>
                  )}
                </div>
                {isAuthenticated && (
                  <button className="create-post-btn" onClick={() => document.getElementById('composer').scrollIntoView({ behavior: 'smooth' })}>
                    <PlusCircle size={18} />
                    <span>New Post</span>
                  </button>
                )}
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`message-alert ${message.type}`}
                  >
                    {message.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
                    <span>{message.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {isAuthenticated ? (
                <motion.div id="composer" className="composer-card" variants={itemVariants} initial="hidden" animate="visible">
                  <div className="composer-header">
                    <div className="user-avatar-small">
                      {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <textarea 
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share your market vision..."
                    />
                  </div>
                  <div className="composer-footer">
                    <div className="composer-tools">
                      <select 
                        value={postType} 
                        onChange={(e) => setPostType(e.target.value)}
                        className="post-type-select"
                      >
                        <option value="discussion">Discussion</option>
                        <option value="signal">Trade Signal</option>
                        <option value="analysis">Market Analysis</option>
                        <option value="question">Question</option>
                      </select>
                      <button className="tool-btn" onClick={() => setMessage({ type: 'success', text: 'Fonctionnalité Image à venir bientôt !' })}><Image size={18} /></button>
                      <button className="tool-btn" onClick={() => setMessage({ type: 'success', text: 'Fonctionnalité Graphique à venir bientôt !' })}><BarChart2 size={18} /></button>
                    </div>
                    <button 
                      className="publish-btn"
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim()}
                    >
                      Post Evolution
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="login-prompt-card">
                  <ShieldAlert size={40} className="text-[#a020f0] mb-4" />
                  <h3>Connect to the Community</h3>
                  <p>Join the evolution. Log in to share your vision and interact with other traders.</p>
                  <button className="login-btn" onClick={() => window.location.href='/login'}>Login to Post</button>
                </div>
              )}

              {showModeration && isAdmin && (
                <div className="moderation-queue">
                  <h2 className="section-title flex items-center gap-2 mb-6">
                    <ShieldAlert className="text-[#a020f0]" />
                    Moderation Queue
                  </h2>
                  {pendingPosts.length === 0 ? (
                    <div className="empty-state">No pending posts to review.</div>
                  ) : (
                    pendingPosts.map(post => (
                      <div key={post.id} className="evolution-post pending">
                        <div className="post-header-evolution">
                          <div className="author-info-evolution">
                            <span className="author-name-evolution">{post.author_name}</span>
                            <span className="post-badge-evolution pending">Pending Approval</span>
                          </div>
                          <div className="moderation-actions">
                            <button onClick={() => handleApprovePost(post.id, true)} className="mod-btn approve">
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={() => handleApprovePost(post.id, false)} className="mod-btn reject">
                              <XCircle size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="post-content-evolution">{post.content}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="posts-container">
                {loading ? (
                  <div className="loading-posts">Loading Evolution...</div>
                ) : filteredPosts.length === 0 ? (
                  <div className="empty-state">No posts found in this category.</div>
                ) : (
                  filteredPosts.map(post => (
                    <motion.div 
                      key={post.id} 
                      className="evolution-post"
                      variants={itemVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                    >
                      <div className="post-main">
                        <div className="post-sidebar">
                          <div className="author-avatar-evolution">
                            {post.author_name?.charAt(0)}
                            <div className="online-indicator"></div>
                          </div>
                        </div>
                        <div className="post-body">
                          <div className="post-header-evolution">
                            <div className="author-info-evolution">
                              <span className="author-name-evolution">{post.author_name}</span>
                              <span className={`post-badge-evolution ${post.type}`}>{getPostTypeLabel(post.type)}</span>
                              <span className="post-time-evolution flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(post.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            {isAdmin && (
                              <button className="post-options-btn text-red-500" onClick={() => handleDeletePost(post.id)}>
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                          <div className="post-content-evolution">
                            {post.content}
                          </div>
                          <div className="post-actions-evolution">
                            <button className="post-action-btn like" onClick={() => handleLikePost(post.id)}>
                              <ThumbsUp size={16} />
                              <span>{post.likes_count}</span>
                            </button>
                            <button 
                              className={`post-action-btn comment ${commentingOn === post.id ? 'active' : ''}`}
                              onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                            >
                              <MessageSquare size={16} />
                              <span>{post.comments_count}</span>
                            </button>
                            <button className="post-action-btn share" onClick={() => handleSharePost(post.id)}>
                              <Share2 size={16} />
                              <span>{post.shares_count}</span>
                            </button>
                          </div>

                          {/* Comment Input */}
                          {commentingOn === post.id && (
                            <div className="comment-composer mt-4">
                              <textarea 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#a020f0]"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button 
                                  onClick={() => setCommentingOn(null)}
                                  className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={!newComment.trim()}
                                  className="px-3 py-1 text-xs bg-[#a020f0] text-white rounded hover:bg-[#8a1bd0] disabled:opacity-50"
                                >
                                  Comment
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Comments Section */}
                          {post.comments && post.comments.length > 0 && (
                            <div className="comments-area mt-4 pt-4 border-t border-white/5">
                              {post.comments.map(comment => (
                                <div key={comment.id} className="comment-item flex justify-between items-start mb-2">
                                  <div>
                                    <span className="comment-author font-bold text-xs mr-2">{comment.author_name}:</span>
                                    <span className="comment-text text-xs text-zinc-400">{comment.content}</span>
                                  </div>
                                  {isAdmin && (
                                    <button onClick={() => handleDeleteComment(comment.id, post.id)} className="text-red-500 opacity-50 hover:opacity-100">
                                      <XCircle size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </main>

            <aside className="community-sidebar right">
              <div className="sidebar-widget">
                <h3 className="widget-title">Active Traders</h3>
                <div className="online-users-list">
                  {onlineUsers.map(user => (
                    <div key={user.id} className="online-user-item">
                      <div className="user-avatar-mini">{user.avatar}</div>
                      <div className="user-status-info">
                        <div className="user-name-mini">{user.name}</div>
                        <div className="user-status-text">{user.status}</div>
                      </div>
                      <div className="status-dot"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar-widget upgrade-widget">
                <div className="upgrade-content">
                  <div className="upgrade-icon">🚀</div>
                  <h4>Elite Circle</h4>
                  <p>Get exclusive signals and professional mentoring.</p>
                  <button className="upgrade-btn" onClick={() => window.location.href='/#plans'}>Go Pro Now</button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Community;
