import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import SignUp from './SignUp';
import ForgotPassword from './ForgotPassword';
import ProfileSettings from './ProfileSettings';
import PricingPage from './PricingPage';
import imageCompression from 'browser-image-compression';
import './App.css';

function MainApp() {
  const { user, userEmail, userTier, logout } = useAuth();
  const navigate = useNavigate();
  
  const [image, setImage] = useState(null);
  const [images, setImages] = useState([]);
  const [occasion, setOccasion] = useState('casual');
  const [mode, setMode] = useState('helpful');
  const [rating, setRating] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [ratingsToday, setRatingsToday] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOccasion, setFilterOccasion] = useState('all');

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchRatingsToday();
      fetchHistory();
      fetchSavedOutfits();
    }
  }, [user]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const fetchRatingsToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('outfit_history')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today);
    
    if (!error) setRatingsToday(data.length);
  };

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('outfit_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!error) setHistory(data);
  };

  const fetchSavedOutfits = async () => {
    const { data, error } = await supabase
      .from('saved_outfits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error) setSavedOutfits(data);
  };

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Compression error:', error);
      return file;
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const compressed = await compressImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (comparisonMode) {
        if (images.length < 5) {
          setImages([...images, reader.result]);
        } else {
          alert('Maximum 5 outfits for comparison');
        }
      } else {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(compressed);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (userTier === 'free' && ratingsToday >= 3) {
      alert('Daily limit reached! Upgrade to Premium for unlimited ratings.');
      return;
    }

    if (comparisonMode && images.length < 2) {
      alert('Please upload at least 2 outfits to compare');
      return;
    }

    if (!comparisonMode && !image) {
      alert('Please upload an outfit image');
      return;
    }

    setLoading(true);
    setRating(null);
    setFeedback('');
    setComparisonResults(null);

    try {
      if (comparisonMode) {
        const response = await fetch('/api/compare-outfits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images,
            occasion,
            userId: user.id
          })
        });

        const data = await response.json();
        setComparisonResults(data);
      } else {
        const response = await fetch('/api/rate-outfit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image,
            occasion,
            mode: userTier === 'premium' ? mode : 'helpful',
            userId: user.id
          })
        });

        const data = await response.json();
        setRating(data.rating);
        setFeedback(data.feedback);

        await supabase.from('outfit_history').insert({
          user_id: user.id,
          rating: data.rating,
          feedback: data.feedback,
          occasion
        });
      }

      fetchRatingsToday();
      fetchHistory();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to rate outfit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveOutfit = async () => {
    if (!rating || !image) return;

    const maxSaves = userTier === 'premium' ? 999 : 10;
    if (savedOutfits.length >= maxSaves) {
      alert(`Maximum ${maxSaves} saved outfits reached. ${userTier === 'free' ? 'Upgrade to Premium for unlimited saves!' : ''}`);
      return;
    }

    const { error } = await supabase.from('saved_outfits').insert({
      user_id: user.id,
      name: `Outfit ${savedOutfits.length + 1}`,
      image_data: image,
      rating,
      feedback,
      occasion
    });

    if (!error) {
      alert('Outfit saved successfully!');
      fetchSavedOutfits();
    }
  };

  const deleteOutfit = async (id) => {
    if (!confirm('Delete this outfit?')) return;
    
    const { error } = await supabase
      .from('saved_outfits')
      .delete()
      .eq('id', id);

    if (!error) fetchSavedOutfits();
  };

  const getRatingColor = (rating) => {
    if (rating >= 8) return '#a855f7';
    if (rating >= 6) return '#10b981';
    if (rating >= 4) return '#f59e0b';
    return '#ef4444';
  };

  // Filter saved outfits
  const filteredOutfits = savedOutfits.filter(outfit => {
    const matchesSearch = outfit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         outfit.feedback.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOccasion = filterOccasion === 'all' || outfit.occasion === filterOccasion;
    return matchesSearch && matchesOccasion;
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1>AI Outfit Rater</h1>
          <span className={`tier-badge ${userTier}`}>{userTier.toUpperCase()}</span>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={toggleDarkMode} title="Toggle Dark Mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" onClick={() => navigate('/settings')} title="Settings">
            ⚙️
          </button>
          <button className="icon-btn" onClick={() => navigate('/pricing')} title="Upgrade">
            💎
          </button>
          <span className="user-email">{userEmail}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      {userTier === 'free' && (
        <div className="daily-limit">
          Ratings today: {ratingsToday}/3 | <button onClick={() => navigate('/pricing')} className="upgrade-link">Upgrade for unlimited</button>
        </div>
      )}

      <div className="main-content">
        <div className="mode-selector">
          <button 
            className={!comparisonMode ? 'active' : ''} 
            onClick={() => { setComparisonMode(false); setImages([]); setComparisonResults(null); }}
          >
            Single Outfit
          </button>
          <button 
            className={comparisonMode ? 'active' : ''} 
            onClick={() => { setComparisonMode(true); setImage(null); setRating(null); }}
          >
            Compare Outfits
          </button>
        </div>

        <div className="controls">
          <select value={occasion} onChange={(e) => setOccasion(e.target.value)}>
            <option value="casual">Casual</option>
            <option value="work">Work</option>
            <option value="date">Date</option>
            <option value="interview">Interview</option>
            <option value="formal">Formal Event</option>
            <option value="workout">Workout</option>
          </select>

          {userTier === 'premium' && !comparisonMode && (
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="helpful">Helpful</option>
              <option value="honest">Honest</option>
              <option value="roast">Roast Mode</option>
            </select>
          )}

          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload}
            id="fileInput"
            style={{ display: 'none' }}
          />
          <label htmlFor="fileInput" className="upload-btn">
            Upload Image
          </label>

          <button onClick={() => setShowHistory(!showHistory)} className="secondary-btn">
            History ({history.length})
          </button>

          <button onClick={() => setShowSaved(!showSaved)} className="secondary-btn">
            Saved ({savedOutfits.length})
          </button>
        </div>

        {comparisonMode ? (
          <div className="comparison-container">
            <div className="image-grid">
              {images.map((img, idx) => (
                <div key={idx} className="image-preview-small">
                  <img src={img} alt={`Outfit ${idx + 1}`} />
                  <button onClick={() => removeImage(idx)} className="remove-btn">×</button>
                </div>
              ))}
            </div>
            {images.length < 5 && (
              <p className="hint">Upload {images.length < 2 ? '2-5' : `${5 - images.length} more`} outfits</p>
            )}
          </div>
        ) : (
          image && (
            <div className="image-preview">
              <img src={image} alt="Outfit" />
            </div>
          )
        )}

        <button 
          onClick={handleSubmit} 
          disabled={loading || (comparisonMode ? images.length < 2 : !image)}
          className="rate-btn"
        >
          {loading ? 'Analyzing...' : comparisonMode ? 'Compare Outfits' : 'Rate My Outfit'}
        </button>

        {comparisonResults && (
          <div className="results">
            <h2>Comparison Results</h2>
            <div className="best-choice" style={{ borderColor: getRatingColor(comparisonResults.ratings[comparisonResults.bestIndex]) }}>
              <h3>Best Choice: Outfit {comparisonResults.bestIndex + 1}</h3>
              <p>{comparisonResults.analysis}</p>
            </div>
            <div className="ratings-grid">
              {comparisonResults.ratings.map((r, idx) => (
                <div key={idx} className="mini-rating" style={{ borderColor: getRatingColor(r) }}>
                  <strong>Outfit {idx + 1}</strong>
                  <div className="rating-number" style={{ color: getRatingColor(r) }}>{r}/10</div>
                </div>
              ))}
            </div>
            {comparisonResults.mixSuggestion && (
              <div className="mix-suggestion">
                <h4>Mix & Match Suggestion</h4>
                <p>{comparisonResults.mixSuggestion}</p>
              </div>
            )}
          </div>
        )}

        {rating && (
          <div className="results">
            <div className="rating-display" style={{ borderColor: getRatingColor(rating) }}>
              <div className="rating-number" style={{ color: getRatingColor(rating) }}>{rating}/10</div>
              <p className="feedback">{feedback}</p>
            </div>
            <button onClick={saveOutfit} className="save-btn">Save This Outfit</button>
          </div>
        )}

        {showHistory && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Rating History</h2>
                <button onClick={() => setShowHistory(false)} className="close-btn">×</button>
              </div>
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item" style={{ borderLeftColor: getRatingColor(item.rating) }}>
                    <div className="history-rating">{item.rating}/10</div>
                    <div className="history-details">
                      <p className="history-occasion">{item.occasion}</p>
                      <p className="history-feedback">{item.feedback.substring(0, 100)}...</p>
                      <p className="history-date">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showSaved && (
          <div className="modal">
            <div className="modal-content wide">
              <div className="modal-header">
                <h2>Saved Outfits ({savedOutfits.length}/{userTier === 'premium' ? '∞' : '10'})</h2>
                <button onClick={() => setShowSaved(false)} className="close-btn">×</button>
              </div>
              
              <div className="saved-filters">
                <input 
                  type="text" 
                  placeholder="Search outfits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <select 
                  value={filterOccasion} 
                  onChange={(e) => setFilterOccasion(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Occasions</option>
                  <option value="casual">Casual</option>
                  <option value="work">Work</option>
                  <option value="date">Date</option>
                  <option value="interview">Interview</option>
                  <option value="formal">Formal Event</option>
                  <option value="workout">Workout</option>
                </select>
              </div>

              <div className="saved-grid">
                {filteredOutfits.map((outfit) => (
                  <div key={outfit.id} className="saved-item">
                    <img src={outfit.image_data} alt={outfit.name} />
                    <div className="saved-info">
                      <h4>{outfit.name}</h4>
                      <div className="saved-rating" style={{ color: getRatingColor(outfit.rating) }}>
                        {outfit.rating}/10
                      </div>
                      <p className="saved-occasion">{outfit.occasion}</p>
                      <p className="saved-date">{new Date(outfit.created_at).toLocaleDateString()}</p>
                      <button onClick={() => deleteOutfit(outfit.id)} className="delete-btn">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}

export default App;