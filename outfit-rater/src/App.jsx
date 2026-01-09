import { useState } from 'react';

function App() {
  // State variables (these store our data)
  const [image, setImage] = useState(null); // The photo
  const [imagePreview, setImagePreview] = useState(null); // Preview of photo
  const [context, setContext] = useState(''); // Occasion
  const [loading, setLoading] = useState(false); // Is AI thinking?
  const [result, setResult] = useState(null); // The rating result
  const [error, setError] = useState(null); // Any errors

  // Different occasions for outfits
  const contexts = [
    'No specific occasion',
    'Casual hangout',
    'First date',
    'Job interview',
    'Wedding',
    'Gym/Workout',
    'Night out',
    'Work/Office',
    'Beach/Vacation'
  ];

  // When user selects a photo
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file!');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large! Please use an image under 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Convert to base64 for API
    const apiReader = new FileReader();
    apiReader.onload = (e) => {
      // Remove the data:image/jpeg;base64, part
      const base64 = e.target.result.split(',')[1];
      setImage(base64);
    };
    apiReader.readAsDataURL(file);

    setError(null);
  };

  // Send photo to AI for rating
  const handleSubmit = async () => {
    if (!image) {
      setError('Please select an image first!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call our backend API
      const response = await fetch('/api/rate-outfit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: image,
          context: context || 'No specific occasion'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rate outfit');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  // Start over
  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setContext('');
    setResult(null);
    setError(null);
  };

  // Get emoji based on rating
  const getRatingEmoji = (rating) => {
    if (rating <= 3) return '😬';
    if (rating <= 6) return '😐';
    if (rating <= 8) return '😊';
    return '🔥';
  };

  return (
    <div className="app">
      <div className="header">
        <h1>👔 AI Outfit Rater</h1>
        <p>Get honest fashion feedback in seconds</p>
      </div>

      <div className="card">
        {/* Show upload screen if no image */}
        {!imagePreview && !result && (
          <div className="upload-section">
            <label htmlFor="file-input" className="upload-zone">
              <div className="upload-icon">📸</div>
              <div className="upload-text">
                <h3>Upload Your Outfit</h3>
                <p>Take or choose a photo to get started</p>
              </div>
            </label>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="file-input"
            />
          </div>
        )}

        {/* Show image preview and context selector */}
        {imagePreview && !result && (
          <div>
            <img src={imagePreview} alt="Your outfit" className="preview-image" />
            
            <div className="context-section">
              <label htmlFor="context">What's the occasion?</label>
              <select
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="context-select"
              >
                {contexts.map((ctx) => (
                  <option key={ctx} value={ctx}>
                    {ctx}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="loading">
                <div className="loading-icon">👔</div>
                <p className="loading-text">AI is analyzing your outfit...</p>
              </div>
            ) : (
              <>
                <button onClick={handleSubmit} className="btn btn-primary">
                  Rate My Outfit
                </button>
                <button onClick={handleReset} className="btn btn-secondary">
                  Choose Different Photo
                </button>
              </>
            )}
          </div>
        )}

        {/* Show results */}
        {result && (
          <div className="results">
            <img src={imagePreview} alt="Your outfit" className="preview-image" />
            
            <div className="rating-display">
              <div className={`rating-number rating-${result.rating}`}>
                {result.rating}/10 {getRatingEmoji(result.rating)}
              </div>
              <div className="rating-label">Your Rating</div>
            </div>

            <div className="feedback">
              <p className="feedback-text">{result.feedback}</p>
            </div>

            <button onClick={handleReset} className="btn btn-primary">
              Rate Another Outfit
            </button>
          </div>
        )}

        {/* Show errors */}
        {error && (
          <div className="error">
            <strong>Oops!</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;