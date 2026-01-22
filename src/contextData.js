// contextData.js - COMPLETE WORLDWIDE CITIES AND COUNTRIES

// ========== ALL MAJOR CITIES WORLDWIDE (500+) ==========
export const cities = [
  // ==================== EUROPE ====================
  
  // === PORTUGAL ===
  { value: 'lisbon', label: 'Lisbon, Portugal', climate: 'warm', culture: 'Mediterranean casual', country: 'Portugal' },
  { value: 'porto', label: 'Porto, Portugal', climate: 'mild', culture: 'Traditional European', country: 'Portugal' },
  { value: 'faro', label: 'Faro, Portugal', climate: 'warm', culture: 'Beach casual', country: 'Portugal' },
  { value: 'braga', label: 'Braga, Portugal', climate: 'mild', culture: 'Traditional', country: 'Portugal' },
  { value: 'coimbra', label: 'Coimbra, Portugal', climate: 'mild', culture: 'Academic casual', country: 'Portugal' },
  
  // === SPAIN ===
  { value: 'madrid', label: 'Madrid, Spain', climate: 'warm', culture: 'Relaxed elegant', country: 'Spain' },
  { value: 'barcelona', label: 'Barcelona, Spain', climate: 'warm', culture: 'Mediterranean trendy', country: 'Spain' },
  { value: 'valencia', label: 'Valencia, Spain', climate: 'warm', culture: 'Beach casual', country: 'Spain' },
  { value: 'seville', label: 'Seville, Spain', climate: 'hot', culture: 'Traditional Spanish', country: 'Spain' },
  { value: 'bilbao', label: 'Bilbao, Spain', climate: 'mild', culture: 'Modern Basque', country: 'Spain' },
  { value: 'malaga', label: 'Málaga, Spain', climate: 'warm', culture: 'Beach resort', country: 'Spain' },
  { value: 'zaragoza', label: 'Zaragoza, Spain', climate: 'warm', culture: 'Traditional', country: 'Spain' },
  { value: 'palma', label: 'Palma, Spain', climate: 'warm', culture: 'Island casual', country: 'Spain' },
  { value: 'granada', label: 'Granada, Spain', climate: 'warm', culture: 'Traditional Andalusian', country: 'Spain' },
  { value: 'cordoba', label: 'Córdoba, Spain', climate: 'hot', culture: 'Historic elegant', country: 'Spain' },
  
  // === ITALY ===
  { value: 'rome', label: 'Rome, Italy', climate: 'warm', culture: 'Classic Italian style', country: 'Italy' },
  { value: 'milan', label: 'Milan, Italy', climate: 'mild', culture: 'Fashion capital chic', country: 'Italy' },
  { value: 'florence', label: 'Florence, Italy', climate: 'warm', culture: 'Renaissance elegant', country: 'Italy' },
  { value: 'venice', label: 'Venice, Italy', climate: 'mild', culture: 'Romantic elegant', country: 'Italy' },
  { value: 'naples', label: 'Naples, Italy', climate: 'warm', culture: 'Relaxed southern', country: 'Italy' },
  { value: 'turin', label: 'Turin, Italy', climate: 'mild', culture: 'Industrial chic', country: 'Italy' },
  { value: 'bologna', label: 'Bologna, Italy', climate: 'mild', culture: 'Academic elegant', country: 'Italy' },
  { value: 'genoa', label: 'Genoa, Italy', climate: 'mild', culture: 'Maritime casual', country: 'Italy' },
  { value: 'palermo', label: 'Palermo, Italy', climate: 'warm', culture: 'Sicilian casual', country: 'Italy' },
  { value: 'verona', label: 'Verona, Italy', climate: 'mild', culture: 'Romantic classic', country: 'Italy' },
  
  // === FRANCE ===
  { value: 'paris', label: 'Paris, France', climate: 'mild', culture: 'Fashion-forward chic', country: 'France' },
  { value: 'lyon', label: 'Lyon, France', climate: 'mild', culture: 'Classic French', country: 'France' },
  { value: 'marseille', label: 'Marseille, France', climate: 'warm', culture: 'Mediterranean casual', country: 'France' },
  { value: 'toulouse', label: 'Toulouse, France', climate: 'mild', culture: 'Southern French', country: 'France' },
  { value: 'nice', label: 'Nice, France', climate: 'warm', culture: 'Riviera chic', country: 'France' },
  { value: 'nantes', label: 'Nantes, France', climate: 'mild', culture: 'Atlantic casual', country: 'France' },
  { value: 'bordeaux', label: 'Bordeaux, France', climate: 'mild', culture: 'Wine country elegant', country: 'France' },
  { value: 'lille', label: 'Lille, France', climate: 'cool', culture: 'Northern French', country: 'France' },
  { value: 'strasbourg', label: 'Strasbourg, France', climate: 'mild', culture: 'Franco-German', country: 'France' },
  { value: 'cannes', label: 'Cannes, France', climate: 'warm', culture: 'Glamorous resort', country: 'France' },
  
  // === UNITED KINGDOM ===
  { value: 'london', label: 'London, UK', climate: 'cool', culture: 'Smart casual formal', country: 'United Kingdom' },
  { value: 'manchester', label: 'Manchester, UK', climate: 'cool', culture: 'Urban casual', country: 'United Kingdom' },
  { value: 'birmingham', label: 'Birmingham, UK', climate: 'cool', culture: 'Industrial casual', country: 'United Kingdom' },
  { value: 'liverpool', label: 'Liverpool, UK', climate: 'cool', culture: 'Maritime casual', country: 'United Kingdom' },
  { value: 'leeds', label: 'Leeds, UK', climate: 'cool', culture: 'Northern casual', country: 'United Kingdom' },
  { value: 'glasgow', label: 'Glasgow, UK', climate: 'cool', culture: 'Scottish urban', country: 'United Kingdom' },
  { value: 'edinburgh', label: 'Edinburgh, UK', climate: 'cool', culture: 'Traditional smart', country: 'United Kingdom' },
  { value: 'bristol', label: 'Bristol, UK', climate: 'mild', culture: 'Creative casual', country: 'United Kingdom' },
  { value: 'cardiff', label: 'Cardiff, UK', climate: 'mild', culture: 'Welsh casual', country: 'United Kingdom' },
  { value: 'belfast', label: 'Belfast, UK', climate: 'cool', culture: 'Irish casual', country: 'United Kingdom' },
  { value: 'newcastle', label: 'Newcastle, UK', climate: 'cool', culture: 'Northern industrial', country: 'United Kingdom' },
  { value: 'nottingham', label: 'Nottingham, UK', climate: 'cool', culture: 'Midlands casual', country: 'United Kingdom' },
  { value: 'oxford', label: 'Oxford, UK', climate: 'cool', culture: 'Academic traditional', country: 'United Kingdom' },
  { value: 'cambridge', label: 'Cambridge, UK', climate: 'cool', culture: 'University smart', country: 'United Kingdom' },
  
  // === GERMANY ===
  { value: 'berlin', label: 'Berlin, Germany', climate: 'cool', culture: 'Alternative edgy', country: 'Germany' },
  { value: 'munich', label: 'Munich, Germany', climate: 'cool', culture: 'Traditional smart', country: 'Germany' },
  { value: 'frankfurt', label: 'Frankfurt, Germany', climate: 'cool', culture: 'Business formal', country: 'Germany' },
  { value: 'hamburg', label: 'Hamburg, Germany', climate: 'cool', culture: 'Maritime cosmopolitan', country: 'Germany' },
  { value: 'cologne', label: 'Cologne, Germany', climate: 'cool', culture: 'Rhineland casual', country: 'Germany' },
  { value: 'stuttgart', label: 'Stuttgart, Germany', climate: 'cool', culture: 'Industrial smart', country: 'Germany' },
  { value: 'dusseldorf', label: 'Düsseldorf, Germany', climate: 'cool', culture: 'Fashion forward', country: 'Germany' },
  { value: 'dortmund', label: 'Dortmund, Germany', climate: 'cool', culture: 'Industrial casual', country: 'Germany' },
  { value: 'essen', label: 'Essen, Germany', climate: 'cool', culture: 'Ruhr valley casual', country: 'Germany' },
  { value: 'leipzig', label: 'Leipzig, Germany', climate: 'cool', culture: 'East German trendy', country: 'Germany' },
  { value: 'dresden', label: 'Dresden, Germany', climate: 'cool', culture: 'Historic elegant', country: 'Germany' },
  { value: 'nuremberg', label: 'Nuremberg, Germany', climate: 'cool', culture: 'Bavarian traditional', country: 'Germany' },
  
  // === NETHERLANDS ===
  { value: 'amsterdam', label: 'Amsterdam, Netherlands', climate: 'cool', culture: 'Practical casual', country: 'Netherlands' },
  { value: 'rotterdam', label: 'Rotterdam, Netherlands', climate: 'cool', culture: 'Modern minimalist', country: 'Netherlands' },
  { value: 'the-hague', label: 'The Hague, Netherlands', climate: 'cool', culture: 'Diplomatic formal', country: 'Netherlands' },
  { value: 'utrecht', label: 'Utrecht, Netherlands', climate: 'cool', culture: 'Academic casual', country: 'Netherlands' },
  { value: 'eindhoven', label: 'Eindhoven, Netherlands', climate: 'cool', culture: 'Tech casual', country: 'Netherlands' },
  
  // === BELGIUM ===
  { value: 'brussels', label: 'Brussels, Belgium', climate: 'cool', culture: 'European formal', country: 'Belgium' },
  { value: 'antwerp', label: 'Antwerp, Belgium', climate: 'cool', culture: 'Fashion forward', country: 'Belgium' },
  { value: 'ghent', label: 'Ghent, Belgium', climate: 'cool', culture: 'Historic casual', country: 'Belgium' },
  { value: 'bruges', label: 'Bruges, Belgium', climate: 'cool', culture: 'Medieval charming', country: 'Belgium' },
  
  // === SWITZERLAND ===
  { value: 'zurich', label: 'Zurich, Switzerland', climate: 'cool', culture: 'Polished professional', country: 'Switzerland' },
  { value: 'geneva', label: 'Geneva, Switzerland', climate: 'cool', culture: 'International chic', country: 'Switzerland' },
  { value: 'basel', label: 'Basel, Switzerland', climate: 'cool', culture: 'Cultural refined', country: 'Switzerland' },
  { value: 'bern', label: 'Bern, Switzerland', climate: 'cool', culture: 'Traditional Swiss', country: 'Switzerland' },
  { value: 'lausanne', label: 'Lausanne, Switzerland', climate: 'cool', culture: 'Lakeside elegant', country: 'Switzerland' },
  
  // === AUSTRIA ===
  { value: 'vienna', label: 'Vienna, Austria', climate: 'cool', culture: 'Classic elegant', country: 'Austria' },
  { value: 'salzburg', label: 'Salzburg, Austria', climate: 'cool', culture: 'Alpine traditional', country: 'Austria' },
  { value: 'innsbruck', label: 'Innsbruck, Austria', climate: 'cool', culture: 'Mountain casual', country: 'Austria' },
  { value: 'graz', label: 'Graz, Austria', climate: 'cool', culture: 'Historic charming', country: 'Austria' },
  
  // === SCANDINAVIA ===
  { value: 'copenhagen', label: 'Copenhagen, Denmark', climate: 'cool', culture: 'Scandinavian minimalist', country: 'Denmark' },
  { value: 'aarhus', label: 'Aarhus, Denmark', climate: 'cool', culture: 'Danish casual', country: 'Denmark' },
  { value: 'stockholm', label: 'Stockholm, Sweden', climate: 'cool', culture: 'Nordic chic', country: 'Sweden' },
  { value: 'gothenburg', label: 'Gothenburg, Sweden', climate: 'cool', culture: 'West coast casual', country: 'Sweden' },
  { value: 'malmo', label: 'Malmö, Sweden', climate: 'cool', culture: 'Southern Swedish', country: 'Sweden' },
  { value: 'oslo', label: 'Oslo, Norway', climate: 'cool', culture: 'Outdoor functional', country: 'Norway' },
  { value: 'bergen', label: 'Bergen, Norway', climate: 'cool', culture: 'Fjord casual', country: 'Norway' },
  { value: 'helsinki', label: 'Helsinki, Finland', climate: 'cool', culture: 'Nordic practical', country: 'Finland' },
  { value: 'tampere', label: 'Tampere, Finland', climate: 'cool', culture: 'Finnish industrial', country: 'Finland' },
  { value: 'reykjavik', label: 'Reykjavik, Iceland', climate: 'cool', culture: 'Nordic outdoor', country: 'Iceland' },
  
  // === IRELAND ===
  { value: 'dublin', label: 'Dublin, Ireland', climate: 'cool', culture: 'Relaxed casual', country: 'Ireland' },
  { value: 'cork', label: 'Cork, Ireland', climate: 'cool', culture: 'Southern Irish', country: 'Ireland' },
  { value: 'galway', label: 'Galway, Ireland', climate: 'cool', culture: 'Bohemian casual', country: 'Ireland' },
  
  // === EASTERN EUROPE ===
  { value: 'prague', label: 'Prague, Czech Republic', climate: 'cool', culture: 'European casual', country: 'Czech Republic' },
  { value: 'brno', label: 'Brno, Czech Republic', climate: 'cool', culture: 'Moravian casual', country: 'Czech Republic' },
  { value: 'warsaw', label: 'Warsaw, Poland', climate: 'cool', culture: 'Modern European', country: 'Poland' },
  { value: 'krakow', label: 'Krakow, Poland', climate: 'cool', culture: 'Historic Polish', country: 'Poland' },
  { value: 'gdansk', label: 'Gdansk, Poland', climate: 'cool', culture: 'Baltic maritime', country: 'Poland' },
  { value: 'budapest', label: 'Budapest, Hungary', climate: 'mild', culture: 'Traditional formal', country: 'Hungary' },
  { value: 'bucharest', label: 'Bucharest, Romania', climate: 'mild', culture: 'Eastern European', country: 'Romania' },
  { value: 'sofia', label: 'Sofia, Bulgaria', climate: 'mild', culture: 'Balkan casual', country: 'Bulgaria' },
  { value: 'zagreb', label: 'Zagreb, Croatia', climate: 'mild', culture: 'Croatian casual', country: 'Croatia' },
  { value: 'belgrade', label: 'Belgrade, Serbia', climate: 'mild', culture: 'Serbian urban', country: 'Serbia' },
  { value: 'bratislava', label: 'Bratislava, Slovakia', climate: 'mild', culture: 'Central European', country: 'Slovakia' },
  { value: 'ljubljana', label: 'Ljubljana, Slovenia', climate: 'mild', culture: 'Alpine casual', country: 'Slovenia' },
  { value: 'tallinn', label: 'Tallinn, Estonia', climate: 'cool', culture: 'Baltic modern', country: 'Estonia' },
  { value: 'riga', label: 'Riga, Latvia', climate: 'cool', culture: 'Latvian elegant', country: 'Latvia' },
  { value: 'vilnius', label: 'Vilnius, Lithuania', climate: 'cool', culture: 'Lithuanian casual', country: 'Lithuania' },
  
  // === GREECE ===
  { value: 'athens', label: 'Athens, Greece', climate: 'warm', culture: 'Mediterranean casual', country: 'Greece' },
  { value: 'thessaloniki', label: 'Thessaloniki, Greece', climate: 'warm', culture: 'Northern Greek', country: 'Greece' },
  { value: 'heraklion', label: 'Heraklion, Greece', climate: 'warm', culture: 'Cretan casual', country: 'Greece' },
  
  // === RUSSIA ===
  { value: 'moscow', label: 'Moscow, Russia', climate: 'cool', culture: 'Formal traditional', country: 'Russia' },
  { value: 'st-petersburg', label: 'St. Petersburg, Russia', climate: 'cool', culture: 'Imperial elegant', country: 'Russia' },
  { value: 'novosibirsk', label: 'Novosibirsk, Russia', climate: 'cool', culture: 'Siberian practical', country: 'Russia' },
  { value: 'yekaterinburg', label: 'Yekaterinburg, Russia', climate: 'cool', culture: 'Ural industrial', country: 'Russia' },
  { value: 'kazan', label: 'Kazan, Russia', climate: 'cool', culture: 'Tatar cultural', country: 'Russia' },
  
  // === TURKEY ===
  { value: 'istanbul', label: 'Istanbul, Turkey', climate: 'mild', culture: 'East meets West', country: 'Turkey' },
  { value: 'ankara', label: 'Ankara, Turkey', climate: 'mild', culture: 'Modern Turkish', country: 'Turkey' },
  { value: 'izmir', label: 'Izmir, Turkey', climate: 'warm', culture: 'Aegean casual', country: 'Turkey' },
  { value: 'antalya', label: 'Antalya, Turkey', climate: 'warm', culture: 'Mediterranean resort', country: 'Turkey' },
  
  // ==================== NORTH AMERICA ====================
  
  // === UNITED STATES - East Coast ===
  { value: 'new-york', label: 'New York, USA', climate: 'variable', culture: 'Urban trendy', country: 'USA' },
  { value: 'boston', label: 'Boston, USA', climate: 'cool', culture: 'Preppy professional', country: 'USA' },
  { value: 'philadelphia', label: 'Philadelphia, USA', climate: 'variable', culture: 'East coast casual', country: 'USA' },
  { value: 'washington-dc', label: 'Washington DC, USA', climate: 'variable', culture: 'Political formal', country: 'USA' },
  { value: 'baltimore', label: 'Baltimore, USA', climate: 'variable', culture: 'Maritime casual', country: 'USA' },
  { value: 'miami', label: 'Miami, USA', climate: 'hot', culture: 'Beach glamorous', country: 'USA' },
  { value: 'atlanta', label: 'Atlanta, USA', climate: 'warm', culture: 'Southern metropolitan', country: 'USA' },
  { value: 'charlotte', label: 'Charlotte, USA', climate: 'warm', culture: 'New South professional', country: 'USA' },
  { value: 'orlando', label: 'Orlando, USA', climate: 'hot', culture: 'Theme park casual', country: 'USA' },
  { value: 'tampa', label: 'Tampa, USA', climate: 'hot', culture: 'Gulf coast casual', country: 'USA' },
  
  // === UNITED STATES - Midwest ===
  { value: 'chicago', label: 'Chicago, USA', climate: 'variable', culture: 'Midwest urban', country: 'USA' },
  { value: 'detroit', label: 'Detroit, USA', climate: 'cool', culture: 'Motor city casual', country: 'USA' },
  { value: 'minneapolis', label: 'Minneapolis, USA', climate: 'cool', culture: 'North midwest', country: 'USA' },
  { value: 'cleveland', label: 'Cleveland, USA', climate: 'cool', culture: 'Rust belt casual', country: 'USA' },
  { value: 'milwaukee', label: 'Milwaukee, USA', climate: 'cool', culture: 'Great Lakes casual', country: 'USA' },
  { value: 'indianapolis', label: 'Indianapolis, USA', climate: 'variable', culture: 'Heartland casual', country: 'USA' },
  { value: 'columbus', label: 'Columbus, USA', climate: 'variable', culture: 'Ohio casual', country: 'USA' },
  { value: 'st-louis', label: 'St. Louis, USA', climate: 'variable', culture: 'Gateway casual', country: 'USA' },
  { value: 'kansas-city', label: 'Kansas City, USA', climate: 'variable', culture: 'Midwest casual', country: 'USA' },
  
  // === UNITED STATES - South ===
  { value: 'dallas', label: 'Dallas, USA', climate: 'warm', culture: 'Texas urban', country: 'USA' },
  { value: 'houston', label: 'Houston, USA', climate: 'hot', culture: 'Texas metropolitan', country: 'USA' },
  { value: 'austin', label: 'Austin, USA', climate: 'warm', culture: 'Quirky casual', country: 'USA' },
  { value: 'san-antonio', label: 'San Antonio, USA', climate: 'warm', culture: 'Tex-Mex casual', country: 'USA' },
  { value: 'nashville', label: 'Nashville, USA', climate: 'warm', culture: 'Music city casual', country: 'USA' },
  { value: 'new-orleans', label: 'New Orleans, USA', climate: 'hot', culture: 'Cajun eclectic', country: 'USA' },
  { value: 'memphis', label: 'Memphis, USA', climate: 'warm', culture: 'Blues casual', country: 'USA' },
  
  // === UNITED STATES - West Coast ===
  { value: 'los-angeles', label: 'Los Angeles, USA', climate: 'warm', culture: 'Laid-back chic', country: 'USA' },
  { value: 'san-francisco', label: 'San Francisco, USA', climate: 'mild', culture: 'Tech casual', country: 'USA' },
  { value: 'san-diego', label: 'San Diego, USA', climate: 'warm', culture: 'SoCal beach', country: 'USA' },
  { value: 'seattle', label: 'Seattle, USA', climate: 'cool', culture: 'Pacific Northwest casual', country: 'USA' },
  { value: 'portland', label: 'Portland, USA', climate: 'mild', culture: 'Hipster casual', country: 'USA' },
  { value: 'san-jose', label: 'San Jose, USA', climate: 'mild', culture: 'Silicon Valley tech', country: 'USA' },
  { value: 'sacramento', label: 'Sacramento, USA', climate: 'warm', culture: 'California capital', country: 'USA' },
  
  // === UNITED STATES - Mountain/Southwest ===
  { value: 'denver', label: 'Denver, USA', climate: 'variable', culture: 'Mountain casual', country: 'USA' },
  { value: 'phoenix', label: 'Phoenix, USA', climate: 'hot', culture: 'Desert casual', country: 'USA' },
  { value: 'las-vegas', label: 'Las Vegas, USA', climate: 'hot', culture: 'Entertainment glam', country: 'USA' },
  { value: 'salt-lake-city', label: 'Salt Lake City, USA', climate: 'variable', culture: 'Mountain west', country: 'USA' },
  { value: 'albuquerque', label: 'Albuquerque, USA', climate: 'warm', culture: 'Southwest casual', country: 'USA' },
  { value: 'tucson', label: 'Tucson, USA', climate: 'hot', culture: 'Desert southwest', country: 'USA' },
  
  // === UNITED STATES - Other ===
  { value: 'honolulu', label: 'Honolulu, USA', climate: 'hot', culture: 'Island aloha', country: 'USA' },
  { value: 'anchorage', label: 'Anchorage, USA', climate: 'cool', culture: 'Alaska outdoor', country: 'USA' },
  
  // === CANADA ===
  { value: 'toronto', label: 'Toronto, Canada', climate: 'cool', culture: 'Multicultural urban', country: 'Canada' },
  { value: 'montreal', label: 'Montreal, Canada', climate: 'cool', culture: 'European influenced', country: 'Canada' },
  { value: 'vancouver', label: 'Vancouver, Canada', climate: 'mild', culture: 'West coast casual', country: 'Canada' },
  { value: 'calgary', label: 'Calgary, Canada', climate: 'cool', culture: 'Western Canadian', country: 'Canada' },
  { value: 'ottawa', label: 'Ottawa, Canada', climate: 'cool', culture: 'Capital formal', country: 'Canada' },
  { value: 'edmonton', label: 'Edmonton, Canada', climate: 'cool', culture: 'Prairie casual', country: 'Canada' },
  { value: 'winnipeg', label: 'Winnipeg, Canada', climate: 'cool', culture: 'Central Canadian', country: 'Canada' },
  { value: 'quebec-city', label: 'Quebec City, Canada', climate: 'cool', culture: 'French Canadian', country: 'Canada' },
  { value: 'halifax', label: 'Halifax, Canada', climate: 'cool', culture: 'Maritime casual', country: 'Canada' },
  
  // === MEXICO ===
  { value: 'mexico-city', label: 'Mexico City, Mexico', climate: 'mild', culture: 'Colorful vibrant', country: 'Mexico' },
  { value: 'guadalajara', label: 'Guadalajara, Mexico', climate: 'warm', culture: 'Mariachi cultural', country: 'Mexico' },
  { value: 'monterrey', label: 'Monterrey, Mexico', climate: 'warm', culture: 'Northern industrial', country: 'Mexico' },
  { value: 'cancun', label: 'Cancun, Mexico', climate: 'hot', culture: 'Beach resort', country: 'Mexico' },
  { value: 'tijuana', label: 'Tijuana, Mexico', climate: 'warm', culture: 'Border city', country: 'Mexico' },
  { value: 'puebla', label: 'Puebla, Mexico', climate: 'mild', culture: 'Colonial traditional', country: 'Mexico' },
  
  // ==================== CENTRAL & SOUTH AMERICA ====================
  
  // === CENTRAL AMERICA ===
  { value: 'san-jose-cr', label: 'San Jose, Costa Rica', climate: 'warm', culture: 'Tropical casual', country: 'Costa Rica' },
  { value: 'panama-city', label: 'Panama City, Panama', climate: 'hot', culture: 'Tropical business', country: 'Panama' },
  { value: 'guatemala-city', label: 'Guatemala City, Guatemala', climate: 'warm', culture: 'Central American', country: 'Guatemala' },
  { value: 'san-salvador', label: 'San Salvador, El Salvador', climate: 'hot', culture: 'Tropical urban', country: 'El Salvador' },
  { value: 'managua', label: 'Managua, Nicaragua', climate: 'hot', culture: 'Nicaraguan casual', country: 'Nicaragua' },
  { value: 'tegucigalpa', label: 'Tegucigalpa, Honduras', climate: 'warm', culture: 'Honduran casual', country: 'Honduras' },
  
  // === CARIBBEAN ===
  { value: 'havana', label: 'Havana, Cuba', climate: 'hot', culture: 'Caribbean colonial', country: 'Cuba' },
  { value: 'santo-domingo', label: 'Santo Domingo, Dominican Rep.', climate: 'hot', culture: 'Caribbean vibrant', country: 'Dominican Republic' },
  { value: 'san-juan', label: 'San Juan, Puerto Rico', climate: 'hot', culture: 'Caribbean American', country: 'Puerto Rico' },
  { value: 'kingston', label: 'Kingston, Jamaica', climate: 'hot', culture: 'Reggae casual', country: 'Jamaica' },
  { value: 'port-au-prince', label: 'Port-au-Prince, Haiti', climate: 'hot', culture: 'Haitian colorful', country: 'Haiti' },
  
  // === SOUTH AMERICA ===
  { value: 'sao-paulo', label: 'São Paulo, Brazil', climate: 'warm', culture: 'Urban trendy', country: 'Brazil' },
  { value: 'rio-de-janeiro', label: 'Rio de Janeiro, Brazil', climate: 'hot', culture: 'Beach casual', country: 'Brazil' },
  { value: 'brasilia', label: 'Brasilia, Brazil', climate: 'warm', culture: 'Modern capital', country: 'Brazil' },
  { value: 'salvador', label: 'Salvador, Brazil', climate: 'hot', culture: 'Afro-Brazilian', country: 'Brazil' },
  { value: 'fortaleza', label: 'Fortaleza, Brazil', climate: 'hot', culture: 'Northeast beach', country: 'Brazil' },
  { value: 'belo-horizonte', label: 'Belo Horizonte, Brazil', climate: 'warm', culture: 'Mining city', country: 'Brazil' },
  { value: 'buenos-aires', label: 'Buenos Aires, Argentina', climate: 'mild', culture: 'European elegant', country: 'Argentina' },
  { value: 'cordoba-ar', label: 'Córdoba, Argentina', climate: 'mild', culture: 'Argentine casual', country: 'Argentina' },
  { value: 'rosario', label: 'Rosario, Argentina', climate: 'mild', culture: 'Riverfront casual', country: 'Argentina' },
  { value: 'santiago', label: 'Santiago, Chile', climate: 'mild', culture: 'Modern casual', country: 'Chile' },
  { value: 'valparaiso', label: 'Valparaíso, Chile', climate: 'mild', culture: 'Bohemian port', country: 'Chile' },
  { value: 'bogota', label: 'Bogotá, Colombia', climate: 'mild', culture: 'Urban casual', country: 'Colombia' },
  { value: 'medellin', label: 'Medellín, Colombia', climate: 'warm', culture: 'Eternal spring', country: 'Colombia' },
  { value: 'cali', label: 'Cali, Colombia', climate: 'hot', culture: 'Salsa vibrant', country: 'Colombia' },
  { value: 'cartagena', label: 'Cartagena, Colombia', climate: 'hot', culture: 'Colonial coastal', country: 'Colombia' },
  { value: 'lima', label: 'Lima, Peru', climate: 'mild', culture: 'Coastal elegant', country: 'Peru' },
  { value: 'cusco', label: 'Cusco, Peru', climate: 'mild', culture: 'Andean traditional', country: 'Peru' },
  { value: 'quito', label: 'Quito, Ecuador', climate: 'mild', culture: 'Andean capital', country: 'Ecuador' },
  { value: 'guayaquil', label: 'Guayaquil, Ecuador', climate: 'hot', culture: 'Tropical port', country: 'Ecuador' },
  { value: 'caracas', label: 'Caracas, Venezuela', climate: 'warm', culture: 'Venezuelan urban', country: 'Venezuela' },
  { value: 'la-paz', label: 'La Paz, Bolivia', climate: 'cool', culture: 'High altitude', country: 'Bolivia' },
  { value: 'asuncion', label: 'Asunción, Paraguay', climate: 'hot', culture: 'Paraguayan casual', country: 'Paraguay' },
  { value: 'montevideo', label: 'Montevideo, Uruguay', climate: 'mild', culture: 'Uruguayan relaxed', country: 'Uruguay' },
  
  // ==================== ASIA ====================
  
  // === CHINA ===
  { value: 'beijing', label: 'Beijing, China', climate: 'variable', culture: 'Modern urban', country: 'China' },
  { value: 'shanghai', label: 'Shanghai, China', climate: 'mild', culture: 'Cosmopolitan chic', country: 'China' },
  { value: 'guangzhou', label: 'Guangzhou, China', climate: 'hot', culture: 'Cantonese modern', country: 'China' },
  { value: 'shenzhen', label: 'Shenzhen, China', climate: 'hot', culture: 'Tech hub casual', country: 'China' },
  { value: 'chengdu', label: 'Chengdu, China', climate: 'mild', culture: 'Sichuan relaxed', country: 'China' },
  { value: 'chongqing', label: 'Chongqing, China', climate: 'warm', culture: 'Mountain city', country: 'China' },
  { value: 'wuhan', label: 'Wuhan, China', climate: 'variable', culture: 'Central Chinese', country: 'China' },
  { value: 'xian', label: "Xi'an, China", climate: 'variable', culture: 'Ancient capital', country: 'China' },
  { value: 'hangzhou', label: 'Hangzhou, China', climate: 'mild', culture: 'Lake city elegant', country: 'China' },
  { value: 'nanjing', label: 'Nanjing, China', climate: 'variable', culture: 'Historic capital', country: 'China' },
  
  // === JAPAN ===
  { value: 'tokyo', label: 'Tokyo, Japan', climate: 'variable', culture: 'Street fashion forward', country: 'Japan' },
  { value: 'osaka', label: 'Osaka, Japan', climate: 'variable', culture: 'Casual urban', country: 'Japan' },
  { value: 'kyoto', label: 'Kyoto, Japan', climate: 'variable', culture: 'Traditional elegant', country: 'Japan' },
  { value: 'yokohama', label: 'Yokohama, Japan', climate: 'variable', culture: 'Port city modern', country: 'Japan' },
  { value: 'nagoya', label: 'Nagoya, Japan', climate: 'variable', culture: 'Industrial casual', country: 'Japan' },
  { value: 'sapporo', label: 'Sapporo, Japan', climate: 'cool', culture: 'Northern casual', country: 'Japan' },
  { value: 'fukuoka', label: 'Fukuoka, Japan', climate: 'mild', culture: 'Kyushu trendy', country: 'Japan' },
  { value: 'kobe', label: 'Kobe, Japan', climate: 'mild', culture: 'Cosmopolitan port', country: 'Japan' },
  
  // === SOUTH KOREA ===
  { value: 'seoul', label: 'Seoul, South Korea', climate: 'variable', culture: 'K-fashion trendy', country: 'South Korea' },
  { value: 'busan', label: 'Busan, South Korea', climate: 'mild', culture: 'Coastal casual', country: 'South Korea' },
  { value: 'incheon', label: 'Incheon, South Korea', climate: 'variable', culture: 'Modern port', country: 'South Korea' },
  { value: 'daegu', label: 'Daegu, South Korea', climate: 'variable', culture: 'Textile city', country: 'South Korea' },
  
  // === INDIA ===
  { value: 'mumbai', label: 'Mumbai, India', climate: 'hot', culture: 'Colorful vibrant', country: 'India' },
  { value: 'delhi', label: 'Delhi, India', climate: 'hot', culture: 'Traditional modern', country: 'India' },
  { value: 'bangalore', label: 'Bangalore, India', climate: 'warm', culture: 'Tech casual', country: 'India' },
  { value: 'hyderabad', label: 'Hyderabad, India', climate: 'hot', culture: 'Tech traditional', country: 'India' },
  { value: 'chennai', label: 'Chennai, India', climate: 'hot', culture: 'South Indian', country: 'India' },
  { value: 'kolkata', label: 'Kolkata, India', climate: 'hot', culture: 'Cultural traditional', country: 'India' },
  { value: 'pune', label: 'Pune, India', climate: 'warm', culture: 'Educational modern', country: 'India' },
  { value: 'ahmedabad', label: 'Ahmedabad, India', climate: 'hot', culture: 'Gujarati traditional', country: 'India' },
  { value: 'jaipur', label: 'Jaipur, India', climate: 'hot', culture: 'Pink city royal', country: 'India' },
  
  // === SOUTHEAST ASIA ===
  { value: 'bangkok', label: 'Bangkok, Thailand', climate: 'hot', culture: 'Tropical casual', country: 'Thailand' },
  { value: 'chiang-mai', label: 'Chiang Mai, Thailand', climate: 'warm', culture: 'Northern Thai', country: 'Thailand' },
  { value: 'phuket', label: 'Phuket, Thailand', climate: 'hot', culture: 'Beach resort', country: 'Thailand' },
  { value: 'singapore', label: 'Singapore', climate: 'hot', culture: 'Tropical smart casual', country: 'Singapore' },
  { value: 'kuala-lumpur', label: 'Kuala Lumpur, Malaysia', climate: 'hot', culture: 'Multicultural modest', country: 'Malaysia' },
  { value: 'penang', label: 'Penang, Malaysia', climate: 'hot', culture: 'Island cultural', country: 'Malaysia' },
  { value: 'jakarta', label: 'Jakarta, Indonesia', climate: 'hot', culture: 'Tropical urban', country: 'Indonesia' },
  { value: 'bali', label: 'Bali, Indonesia', climate: 'hot', culture: 'Island resort', country: 'Indonesia' },
  { value: 'surabaya', label: 'Surabaya, Indonesia', climate: 'hot', culture: 'East Java', country: 'Indonesia' },
  { value: 'manila', label: 'Manila, Philippines', climate: 'hot', culture: 'Tropical casual', country: 'Philippines' },
  { value: 'cebu', label: 'Cebu, Philippines', climate: 'hot', culture: 'Island casual', country: 'Philippines' },
  { value: 'hanoi', label: 'Hanoi, Vietnam', climate: 'warm', culture: 'Vietnamese traditional', country: 'Vietnam' },
  { value: 'ho-chi-minh', label: 'Ho Chi Minh City, Vietnam', climate: 'hot', culture: 'Southern casual', country: 'Vietnam' },
  { value: 'phnom-penh', label: 'Phnom Penh, Cambodia', climate: 'hot', culture: 'Cambodian casual', country: 'Cambodia' },
  { value: 'yangon', label: 'Yangon, Myanmar', climate: 'hot', culture: 'Burmese traditional', country: 'Myanmar' },
  { value: 'vientiane', label: 'Vientiane, Laos', climate: 'hot', culture: 'Lao casual', country: 'Laos' },
  
  // === MIDDLE EAST ===
  { value: 'dubai', label: 'Dubai, UAE', climate: 'hot', culture: 'Modest luxury', country: 'UAE' },
  { value: 'abu-dhabi', label: 'Abu Dhabi, UAE', climate: 'hot', culture: 'Traditional modest', country: 'UAE' },
  { value: 'sharjah', label: 'Sharjah, UAE', climate: 'hot', culture: 'Cultural conservative', country: 'UAE' },
  { value: 'doha', label: 'Doha, Qatar', climate: 'hot', culture: 'Modest formal', country: 'Qatar' },
  { value: 'riyadh', label: 'Riyadh, Saudi Arabia', climate: 'hot', culture: 'Conservative formal', country: 'Saudi Arabia' },
  { value: 'jeddah', label: 'Jeddah, Saudi Arabia', climate: 'hot', culture: 'Coastal modest', country: 'Saudi Arabia' },
  { value: 'kuwait-city', label: 'Kuwait City, Kuwait', climate: 'hot', culture: 'Gulf modest', country: 'Kuwait' },
  { value: 'manama', label: 'Manama, Bahrain', climate: 'hot', culture: 'Gulf cosmopolitan', country: 'Bahrain' },
  { value: 'muscat', label: 'Muscat, Oman', climate: 'hot', culture: 'Omani traditional', country: 'Oman' },
  { value: 'tel-aviv', label: 'Tel Aviv, Israel', climate: 'warm', culture: 'Mediterranean casual', country: 'Israel' },
  { value: 'jerusalem', label: 'Jerusalem, Israel', climate: 'warm', culture: 'Historic formal', country: 'Israel' },
  { value: 'beirut', label: 'Beirut, Lebanon', climate: 'warm', culture: 'Mediterranean chic', country: 'Lebanon' },
  { value: 'amman', label: 'Amman, Jordan', climate: 'warm', culture: 'Middle Eastern', country: 'Jordan' },
  { value: 'tehran', label: 'Tehran, Iran', climate: 'variable', culture: 'Persian modest', country: 'Iran' },
  { value: 'baghdad', label: 'Baghdad, Iraq', climate: 'hot', culture: 'Mesopotamian', country: 'Iraq' },
  { value: 'damascus', label: 'Damascus, Syria', climate: 'warm', culture: 'Ancient traditional', country: 'Syria' },
  
  // === CENTRAL ASIA ===
  { value: 'almaty', label: 'Almaty, Kazakhstan', climate: 'cool', culture: 'Central Asian', country: 'Kazakhstan' },
  { value: 'tashkent', label: 'Tashkent, Uzbekistan', climate: 'variable', culture: 'Uzbek traditional', country: 'Uzbekistan' },
  { value: 'astana', label: 'Astana, Kazakhstan', climate: 'cool', culture: 'Modern capital', country: 'Kazakhstan' },
  
  // === OTHER ASIA ===
  { value: 'hong-kong', label: 'Hong Kong', climate: 'warm', culture: 'East-West fusion', country: 'Hong Kong' },
  { value: 'macau', label: 'Macau', climate: 'warm', culture: 'Portuguese-Chinese', country: 'Macau' },
  { value: 'taipei', label: 'Taipei, Taiwan', climate: 'warm', culture: 'Taiwanese modern', country: 'Taiwan' },
  { value: 'kathmandu', label: 'Kathmandu, Nepal', climate: 'mild', culture: 'Himalayan traditional', country: 'Nepal' },
  { value: 'dhaka', label: 'Dhaka, Bangladesh', climate: 'hot', culture: 'Bengali modest', country: 'Bangladesh' },
  { value: 'colombo', label: 'Colombo, Sri Lanka', climate: 'hot', culture: 'Sri Lankan casual', country: 'Sri Lanka' },
  { value: 'kabul', label: 'Kabul, Afghanistan', climate: 'variable', culture: 'Afghan traditional', country: 'Afghanistan' },
  { value: 'islamabad', label: 'Islamabad, Pakistan', climate: 'warm', culture: 'Pakistani modern', country: 'Pakistan' },
  { value: 'karachi', label: 'Karachi, Pakistan', climate: 'hot', culture: 'Coastal Pakistani', country: 'Pakistan' },
  { value: 'lahore', label: 'Lahore, Pakistan', climate: 'hot', culture: 'Punjabi cultural', country: 'Pakistan' },
  { value: 'ulaanbaatar', label: 'Ulaanbaatar, Mongolia', climate: 'cool', culture: 'Mongolian', country: 'Mongolia' },
  
  // ==================== OCEANIA ====================
  
  // === AUSTRALIA ===
  { value: 'sydney', label: 'Sydney, Australia', climate: 'mild', culture: 'Beach casual', country: 'Australia' },
  { value: 'melbourne', label: 'Melbourne, Australia', climate: 'mild', culture: 'Artistic casual', country: 'Australia' },
  { value: 'brisbane', label: 'Brisbane, Australia', climate: 'warm', culture: 'Relaxed casual', country: 'Australia' },
  { value: 'perth', label: 'Perth, Australia', climate: 'warm', culture: 'West coast beach', country: 'Australia' },
  { value: 'adelaide', label: 'Adelaide, Australia', climate: 'mild', culture: 'Wine city elegant', country: 'Australia' },
  { value: 'gold-coast', label: 'Gold Coast, Australia', climate: 'warm', culture: 'Surf casual', country: 'Australia' },
  { value: 'canberra', label: 'Canberra, Australia', climate: 'mild', culture: 'Capital formal', country: 'Australia' },
  { value: 'hobart', label: 'Hobart, Australia', climate: 'cool', culture: 'Tasmanian casual', country: 'Australia' },
  
  // === NEW ZEALAND ===
  { value: 'auckland', label: 'Auckland, New Zealand', climate: 'mild', culture: 'Outdoor casual', country: 'New Zealand' },
  { value: 'wellington', label: 'Wellington, New Zealand', climate: 'mild', culture: 'Creative capital', country: 'New Zealand' },
  { value: 'christchurch', label: 'Christchurch, New Zealand', climate: 'mild', culture: 'Garden city', country: 'New Zealand' },
  { value: 'queenstown', label: 'Queenstown, New Zealand', climate: 'cool', culture: 'Adventure casual', country: 'New Zealand' },
  
  // === PACIFIC ISLANDS ===
  { value: 'suva', label: 'Suva, Fiji', climate: 'hot', culture: 'Pacific island', country: 'Fiji' },
  { value: 'port-moresby', label: 'Port Moresby, Papua New Guinea', climate: 'hot', culture: 'Melanesian', country: 'Papua New Guinea' },
  { value: 'noumea', label: 'Nouméa, New Caledonia', climate: 'warm', culture: 'French Pacific', country: 'New Caledonia' },
  
  // ==================== AFRICA ====================
  
  // === NORTH AFRICA ===
  { value: 'cairo', label: 'Cairo, Egypt', climate: 'hot', culture: 'Traditional modest', country: 'Egypt' },
  { value: 'alexandria', label: 'Alexandria, Egypt', climate: 'warm', culture: 'Mediterranean Egyptian', country: 'Egypt' },
  { value: 'casablanca', label: 'Casablanca, Morocco', climate: 'warm', culture: 'Moroccan modern', country: 'Morocco' },
  { value: 'marrakech', label: 'Marrakech, Morocco', climate: 'warm', culture: 'Traditional Moroccan', country: 'Morocco' },
  { value: 'rabat', label: 'Rabat, Morocco', climate: 'warm', culture: 'Capital formal', country: 'Morocco' },
  { value: 'tunis', label: 'Tunis, Tunisia', climate: 'warm', culture: 'Tunisian Mediterranean', country: 'Tunisia' },
  { value: 'algiers', label: 'Algiers, Algeria', climate: 'warm', culture: 'Algerian coastal', country: 'Algeria' },
  { value: 'tripoli', label: 'Tripoli, Libya', climate: 'hot', culture: 'Libyan Mediterranean', country: 'Libya' },
  
  // === WEST AFRICA ===
  { value: 'lagos', label: 'Lagos, Nigeria', climate: 'hot', culture: 'Vibrant colorful', country: 'Nigeria' },
  { value: 'abuja', label: 'Abuja, Nigeria', climate: 'hot', culture: 'Capital modern', country: 'Nigeria' },
  { value: 'accra', label: 'Accra, Ghana', climate: 'hot', culture: 'Ghanaian vibrant', country: 'Ghana' },
  { value: 'dakar', label: 'Dakar, Senegal', climate: 'warm', culture: 'West African chic', country: 'Senegal' },
  { value: 'abidjan', label: 'Abidjan, Ivory Coast', climate: 'hot', culture: 'Ivorian urban', country: 'Ivory Coast' },
  { value: 'bamako', label: 'Bamako, Mali', climate: 'hot', culture: 'Malian traditional', country: 'Mali' },
  
  // === EAST AFRICA ===
  { value: 'nairobi', label: 'Nairobi, Kenya', climate: 'warm', culture: 'Urban casual', country: 'Kenya' },
  { value: 'mombasa', label: 'Mombasa, Kenya', climate: 'hot', culture: 'Coastal Swahili', country: 'Kenya' },
  { value: 'addis-ababa', label: 'Addis Ababa, Ethiopia', climate: 'mild', culture: 'Ethiopian highland', country: 'Ethiopia' },
  { value: 'dar-es-salaam', label: 'Dar es Salaam, Tanzania', climate: 'hot', culture: 'Tanzanian coastal', country: 'Tanzania' },
  { value: 'kampala', label: 'Kampala, Uganda', climate: 'warm', culture: 'Ugandan casual', country: 'Uganda' },
  { value: 'kigali', label: 'Kigali, Rwanda', climate: 'warm', culture: 'Rwandan modern', country: 'Rwanda' },
  
  // === SOUTHERN AFRICA ===
  { value: 'johannesburg', label: 'Johannesburg, South Africa', climate: 'mild', culture: 'Urban diverse', country: 'South Africa' },
  { value: 'cape-town', label: 'Cape Town, South Africa', climate: 'mild', culture: 'Cosmopolitan casual', country: 'South Africa' },
  { value: 'durban', label: 'Durban, South Africa', climate: 'warm', culture: 'Beach multicultural', country: 'South Africa' },
  { value: 'pretoria', label: 'Pretoria, South Africa', climate: 'warm', culture: 'Capital formal', country: 'South Africa' },
  { value: 'harare', label: 'Harare, Zimbabwe', climate: 'warm', culture: 'Zimbabwean urban', country: 'Zimbabwe' },
  { value: 'lusaka', label: 'Lusaka, Zambia', climate: 'warm', culture: 'Zambian casual', country: 'Zambia' },
  { value: 'maputo', label: 'Maputo, Mozambique', climate: 'warm', culture: 'Portuguese African', country: 'Mozambique' },
  { value: 'windhoek', label: 'Windhoek, Namibia', climate: 'warm', culture: 'Namibian casual', country: 'Namibia' },
  { value: 'gaborone', label: 'Gaborone, Botswana', climate: 'warm', culture: 'Botswanan modern', country: 'Botswana' },
  
  // === CENTRAL AFRICA ===
  { value: 'kinshasa', label: 'Kinshasa, DR Congo', climate: 'hot', culture: 'Congolese vibrant', country: 'DR Congo' },
  { value: 'luanda', label: 'Luanda, Angola', climate: 'warm', culture: 'Angolan coastal', country: 'Angola' },
  { value: 'yaounde', label: 'Yaoundé, Cameroon', climate: 'hot', culture: 'Cameroonian', country: 'Cameroon' },
  
  // === OTHER / NOT LISTED ===
  { value: 'other', label: 'My city is not listed', climate: 'variable', culture: 'General', country: 'Other' }
]

// ========== ALL COUNTRIES (195 recognized + territories) ==========
export const countries = [
  // === EUROPE ===
  { value: 'albania', label: 'Albania', climate: 'mild', culture: 'Balkan casual' },
  { value: 'andorra', label: 'Andorra', climate: 'cool', culture: 'Mountain resort' },
  { value: 'armenia', label: 'Armenia', climate: 'mild', culture: 'Caucasian traditional' },
  { value: 'austria', label: 'Austria', climate: 'cool', culture: 'Classic elegant' },
  { value: 'azerbaijan', label: 'Azerbaijan', climate: 'mild', culture: 'Caucasian modern' },
  { value: 'belarus', label: 'Belarus', climate: 'cool', culture: 'Eastern European' },
  { value: 'belgium', label: 'Belgium', climate: 'cool', culture: 'European formal' },
  { value: 'bosnia', label: 'Bosnia and Herzegovina', climate: 'mild', culture: 'Balkan' },
  { value: 'bulgaria', label: 'Bulgaria', climate: 'mild', culture: 'Balkan casual' },
  { value: 'croatia', label: 'Croatia', climate: 'mild', culture: 'Adriatic casual' },
  { value: 'cyprus', label: 'Cyprus', climate: 'warm', culture: 'Mediterranean island' },
  { value: 'czech', label: 'Czech Republic', climate: 'cool', culture: 'Central European' },
  { value: 'denmark', label: 'Denmark', climate: 'cool', culture: 'Scandinavian minimalist' },
  { value: 'estonia', label: 'Estonia', climate: 'cool', culture: 'Baltic modern' },
  { value: 'finland', label: 'Finland', climate: 'cool', culture: 'Nordic practical' },
  { value: 'france', label: 'France', climate: 'mild', culture: 'Fashion-forward' },
  { value: 'georgia', label: 'Georgia', climate: 'mild', culture: 'Caucasian traditional' },
  { value: 'germany', label: 'Germany', climate: 'cool', culture: 'Practical formal' },
  { value: 'greece', label: 'Greece', climate: 'warm', culture: 'Mediterranean casual' },
  { value: 'hungary', label: 'Hungary', climate: 'mild', culture: 'Central European formal' },
  { value: 'iceland', label: 'Iceland', climate: 'cool', culture: 'Nordic outdoor' },
  { value: 'ireland', label: 'Ireland', climate: 'cool', culture: 'Irish casual' },
  { value: 'italy', label: 'Italy', climate: 'warm', culture: 'Classic style' },
  { value: 'kosovo', label: 'Kosovo', climate: 'mild', culture: 'Balkan' },
  { value: 'latvia', label: 'Latvia', climate: 'cool', culture: 'Baltic elegant' },
  { value: 'liechtenstein', label: 'Liechtenstein', climate: 'cool', culture: 'Alpine formal' },
  { value: 'lithuania', label: 'Lithuania', climate: 'cool', culture: 'Baltic casual' },
  { value: 'luxembourg', label: 'Luxembourg', climate: 'cool', culture: 'European professional' },
  { value: 'malta', label: 'Malta', climate: 'warm', culture: 'Mediterranean island' },
  { value: 'moldova', label: 'Moldova', climate: 'mild', culture: 'Eastern European' },
  { value: 'monaco', label: 'Monaco', climate: 'warm', culture: 'Luxury glamorous' },
  { value: 'montenegro', label: 'Montenegro', climate: 'mild', culture: 'Adriatic casual' },
  { value: 'netherlands', label: 'Netherlands', climate: 'cool', culture: 'Practical casual' },
  { value: 'north-macedonia', label: 'North Macedonia', climate: 'mild', culture: 'Balkan' },
  { value: 'norway', label: 'Norway', climate: 'cool', culture: 'Outdoor functional' },
  { value: 'poland', label: 'Poland', climate: 'cool', culture: 'Modern European' },
  { value: 'portugal', label: 'Portugal', climate: 'warm', culture: 'Mediterranean casual' },
  { value: 'romania', label: 'Romania', climate: 'mild', culture: 'Eastern European' },
  { value: 'russia', label: 'Russia', climate: 'cool', culture: 'Formal traditional' },
  { value: 'san-marino', label: 'San Marino', climate: 'mild', culture: 'Italian influenced' },
  { value: 'serbia', label: 'Serbia', climate: 'mild', culture: 'Balkan urban' },
  { value: 'slovakia', label: 'Slovakia', climate: 'cool', culture: 'Central European' },
  { value: 'slovenia', label: 'Slovenia', climate: 'mild', culture: 'Alpine casual' },
  { value: 'spain', label: 'Spain', climate: 'warm', culture: 'Mediterranean casual' },
  { value: 'sweden', label: 'Sweden', climate: 'cool', culture: 'Minimalist chic' },
  { value: 'switzerland', label: 'Switzerland', climate: 'cool', culture: 'Polished professional' },
  { value: 'turkey', label: 'Turkey', climate: 'mild', culture: 'East meets West' },
  { value: 'ukraine', label: 'Ukraine', climate: 'cool', culture: 'Eastern European' },
  { value: 'uk', label: 'United Kingdom', climate: 'cool', culture: 'Smart casual' },
  { value: 'vatican', label: 'Vatican City', climate: 'warm', culture: 'Formal traditional' },
  
  // === AMERICAS ===
  { value: 'antigua', label: 'Antigua and Barbuda', climate: 'hot', culture: 'Caribbean casual' },
  { value: 'argentina', label: 'Argentina', climate: 'mild', culture: 'European elegant' },
  { value: 'bahamas', label: 'Bahamas', climate: 'hot', culture: 'Island resort' },
  { value: 'barbados', label: 'Barbados', climate: 'hot', culture: 'Caribbean chic' },
  { value: 'belize', label: 'Belize', climate: 'hot', culture: 'Caribbean casual' },
  { value: 'bolivia', label: 'Bolivia', climate: 'variable', culture: 'Andean traditional' },
  { value: 'brazil', label: 'Brazil', climate: 'warm', culture: 'Beach casual' },
  { value: 'canada', label: 'Canada', climate: 'cool', culture: 'Casual practical' },
  { value: 'chile', label: 'Chile', climate: 'mild', culture: 'Modern casual' },
  { value: 'colombia', label: 'Colombia', climate: 'warm', culture: 'Urban casual' },
  { value: 'costa-rica', label: 'Costa Rica', climate: 'warm', culture: 'Tropical casual' },
  { value: 'cuba', label: 'Cuba', climate: 'hot', culture: 'Caribbean colonial' },
  { value: 'dominica', label: 'Dominica', climate: 'hot', culture: 'Island casual' },
  { value: 'dominican-rep', label: 'Dominican Republic', climate: 'hot', culture: 'Caribbean vibrant' },
  { value: 'ecuador', label: 'Ecuador', climate: 'variable', culture: 'Andean coastal' },
  { value: 'el-salvador', label: 'El Salvador', climate: 'hot', culture: 'Central American' },
  { value: 'grenada', label: 'Grenada', climate: 'hot', culture: 'Caribbean island' },
  { value: 'guatemala', label: 'Guatemala', climate: 'warm', culture: 'Mayan traditional' },
  { value: 'guyana', label: 'Guyana', climate: 'hot', culture: 'Caribbean South American' },
  { value: 'haiti', label: 'Haiti', climate: 'hot', culture: 'Haitian colorful' },
  { value: 'honduras', label: 'Honduras', climate: 'hot', culture: 'Central American' },
  { value: 'jamaica', label: 'Jamaica', climate: 'hot', culture: 'Reggae casual' },
  { value: 'mexico', label: 'Mexico', climate: 'warm', culture: 'Colorful vibrant' },
  { value: 'nicaragua', label: 'Nicaragua', climate: 'hot', culture: 'Central American' },
  { value: 'panama', label: 'Panama', climate: 'hot', culture: 'Tropical business' },
  { value: 'paraguay', label: 'Paraguay', climate: 'warm', culture: 'South American' },
  { value: 'peru', label: 'Peru', climate: 'variable', culture: 'Andean traditional' },
  { value: 'st-kitts', label: 'Saint Kitts and Nevis', climate: 'hot', culture: 'Caribbean island' },
  { value: 'st-lucia', label: 'Saint Lucia', climate: 'hot', culture: 'Caribbean resort' },
  { value: 'st-vincent', label: 'Saint Vincent and the Grenadines', climate: 'hot', culture: 'Island casual' },
  { value: 'suriname', label: 'Suriname', climate: 'hot', culture: 'Caribbean South American' },
  { value: 'trinidad', label: 'Trinidad and Tobago', climate: 'hot', culture: 'Caribbean vibrant' },
  { value: 'usa', label: 'United States', climate: 'variable', culture: 'Diverse casual' },
  { value: 'uruguay', label: 'Uruguay', climate: 'mild', culture: 'Uruguayan relaxed' },
  { value: 'venezuela', label: 'Venezuela', climate: 'warm', culture: 'Caribbean South American' },
  
  // === AFRICA ===
  { value: 'algeria', label: 'Algeria', climate: 'warm', culture: 'North African' },
  { value: 'angola', label: 'Angola', climate: 'warm', culture: 'Portuguese African' },
  { value: 'benin', label: 'Benin', climate: 'hot', culture: 'West African' },
  { value: 'botswana', label: 'Botswana', climate: 'warm', culture: 'Southern African' },
  { value: 'burkina-faso', label: 'Burkina Faso', climate: 'hot', culture: 'West African' },
  { value: 'burundi', label: 'Burundi', climate: 'warm', culture: 'East African' },
  { value: 'cameroon', label: 'Cameroon', climate: 'hot', culture: 'Central African' },
  { value: 'cape-verde', label: 'Cape Verde', climate: 'warm', culture: 'Island African' },
  { value: 'central-african-rep', label: 'Central African Republic', climate: 'hot', culture: 'Central African' },
  { value: 'chad', label: 'Chad', climate: 'hot', culture: 'Sahel African' },
  { value: 'comoros', label: 'Comoros', climate: 'hot', culture: 'Island African' },
  { value: 'congo', label: 'Congo', climate: 'hot', culture: 'Central African' },
  { value: 'dr-congo', label: 'DR Congo', climate: 'hot', culture: 'Central African' },
  { value: 'djibouti', label: 'Djibouti', climate: 'hot', culture: 'Horn of Africa' },
  { value: 'egypt', label: 'Egypt', climate: 'hot', culture: 'North African' },
  { value: 'equatorial-guinea', label: 'Equatorial Guinea', climate: 'hot', culture: 'Central African' },
  { value: 'eritrea', label: 'Eritrea', climate: 'hot', culture: 'Horn of Africa' },
  { value: 'eswatini', label: 'Eswatini', climate: 'warm', culture: 'Southern African' },
  { value: 'ethiopia', label: 'Ethiopia', climate: 'mild', culture: 'Highland African' },
  { value: 'gabon', label: 'Gabon', climate: 'hot', culture: 'Central African' },
  { value: 'gambia', label: 'Gambia', climate: 'hot', culture: 'West African' },
  { value: 'ghana', label: 'Ghana', climate: 'hot', culture: 'West African vibrant' },
  { value: 'guinea', label: 'Guinea', climate: 'hot', culture: 'West African' },
  { value: 'guinea-bissau', label: 'Guinea-Bissau', climate: 'hot', culture: 'West African' },
  { value: 'ivory-coast', label: 'Ivory Coast', climate: 'hot', culture: 'West African' },
  { value: 'kenya', label: 'Kenya', climate: 'warm', culture: 'East African' },
  { value: 'lesotho', label: 'Lesotho', climate: 'cool', culture: 'Mountain kingdom' },
  { value: 'liberia', label: 'Liberia', climate: 'hot', culture: 'West African' },
  { value: 'libya', label: 'Libya', climate: 'hot', culture: 'North African' },
  { value: 'madagascar', label: 'Madagascar', climate: 'warm', culture: 'Island African' },
  { value: 'malawi', label: 'Malawi', climate: 'warm', culture: 'Southern African' },
  { value: 'mali', label: 'Mali', climate: 'hot', culture: 'West African' },
  { value: 'mauritania', label: 'Mauritania', climate: 'hot', culture: 'Saharan African' },
  { value: 'mauritius', label: 'Mauritius', climate: 'warm', culture: 'Island cosmopolitan' },
  { value: 'morocco', label: 'Morocco', climate: 'warm', culture: 'North African' },
  { value: 'mozambique', label: 'Mozambique', climate: 'warm', culture: 'Portuguese African' },
  { value: 'namibia', label: 'Namibia', climate: 'warm', culture: 'Southern African' },
  { value: 'niger', label: 'Niger', climate: 'hot', culture: 'Sahel African' },
  { value: 'nigeria', label: 'Nigeria', climate: 'hot', culture: 'West African vibrant' },
  { value: 'rwanda', label: 'Rwanda', climate: 'warm', culture: 'East African highland' },
  { value: 'sao-tome', label: 'São Tomé and Príncipe', climate: 'hot', culture: 'Island African' },
  { value: 'senegal', label: 'Senegal', climate: 'hot', culture: 'West African' },
  { value: 'seychelles', label: 'Seychelles', climate: 'hot', culture: 'Island resort' },
  { value: 'sierra-leone', label: 'Sierra Leone', climate: 'hot', culture: 'West African' },
  { value: 'somalia', label: 'Somalia', climate: 'hot', culture: 'Horn of Africa' },
  { value: 'south-africa', label: 'South Africa', climate: 'mild', culture: 'Diverse cosmopolitan' },
  { value: 'south-sudan', label: 'South Sudan', climate: 'hot', culture: 'East African' },
  { value: 'sudan', label: 'Sudan', climate: 'hot', culture: 'North African' },
  { value: 'tanzania', label: 'Tanzania', climate: 'warm', culture: 'East African' },
  { value: 'togo', label: 'Togo', climate: 'hot', culture: 'West African' },
  { value: 'tunisia', label: 'Tunisia', climate: 'warm', culture: 'North African Mediterranean' },
  { value: 'uganda', label: 'Uganda', climate: 'warm', culture: 'East African' },
  { value: 'zambia', label: 'Zambia', climate: 'warm', culture: 'Southern African' },
  { value: 'zimbabwe', label: 'Zimbabwe', climate: 'warm', culture: 'Southern African' },
  
  // === ASIA ===
  { value: 'afghanistan', label: 'Afghanistan', climate: 'variable', culture: 'Traditional modest' },
  { value: 'bahrain', label: 'Bahrain', climate: 'hot', culture: 'Gulf modest' },
  { value: 'bangladesh', label: 'Bangladesh', climate: 'hot', culture: 'South Asian modest' },
  { value: 'bhutan', label: 'Bhutan', climate: 'cool', culture: 'Himalayan traditional' },
  { value: 'brunei', label: 'Brunei', climate: 'hot', culture: 'Islamic modest' },
  { value: 'cambodia', label: 'Cambodia', climate: 'hot', culture: 'Southeast Asian' },
  { value: 'china', label: 'China', climate: 'variable', culture: 'Modern urban' },
  { value: 'india', label: 'India', climate: 'hot', culture: 'Colorful traditional' },
  { value: 'indonesia', label: 'Indonesia', climate: 'hot', culture: 'Tropical modest' },
  { value: 'iran', label: 'Iran', climate: 'variable', culture: 'Persian modest' },
  { value: 'iraq', label: 'Iraq', climate: 'hot', culture: 'Middle Eastern' },
  { value: 'israel', label: 'Israel', climate: 'warm', culture: 'Mediterranean casual' },
  { value: 'japan', label: 'Japan', climate: 'variable', culture: 'Street fashion' },
  { value: 'jordan', label: 'Jordan', climate: 'warm', culture: 'Middle Eastern' },
  { value: 'kazakhstan', label: 'Kazakhstan', climate: 'cool', culture: 'Central Asian' },
  { value: 'kuwait', label: 'Kuwait', climate: 'hot', culture: 'Gulf modest' },
  { value: 'kyrgyzstan', label: 'Kyrgyzstan', climate: 'cool', culture: 'Central Asian' },
  { value: 'laos', label: 'Laos', climate: 'hot', culture: 'Southeast Asian' },
  { value: 'lebanon', label: 'Lebanon', climate: 'warm', culture: 'Mediterranean Middle Eastern' },
  { value: 'malaysia', label: 'Malaysia', climate: 'hot', culture: 'Multicultural' },
  { value: 'maldives', label: 'Maldives', climate: 'hot', culture: 'Island resort' },
  { value: 'mongolia', label: 'Mongolia', climate: 'cool', culture: 'Nomadic traditional' },
  { value: 'myanmar', label: 'Myanmar', climate: 'hot', culture: 'Southeast Asian traditional' },
  { value: 'nepal', label: 'Nepal', climate: 'cool', culture: 'Himalayan traditional' },
  { value: 'north-korea', label: 'North Korea', climate: 'variable', culture: 'Traditional formal' },
  { value: 'oman', label: 'Oman', climate: 'hot', culture: 'Gulf traditional' },
  { value: 'pakistan', label: 'Pakistan', climate: 'hot', culture: 'South Asian modest' },
  { value: 'palestine', label: 'Palestine', climate: 'warm', culture: 'Middle Eastern' },
  { value: 'philippines', label: 'Philippines', climate: 'hot', culture: 'Tropical casual' },
  { value: 'qatar', label: 'Qatar', climate: 'hot', culture: 'Gulf modern' },
  { value: 'saudi-arabia', label: 'Saudi Arabia', climate: 'hot', culture: 'Gulf conservative' },
  { value: 'singapore', label: 'Singapore', climate: 'hot', culture: 'Tropical smart casual' },
  { value: 'south-korea', label: 'South Korea', climate: 'variable', culture: 'K-fashion trendy' },
  { value: 'sri-lanka', label: 'Sri Lanka', climate: 'hot', culture: 'South Asian island' },
  { value: 'syria', label: 'Syria', climate: 'warm', culture: 'Middle Eastern' },
  { value: 'taiwan', label: 'Taiwan', climate: 'warm', culture: 'East Asian modern' },
  { value: 'tajikistan', label: 'Tajikistan', climate: 'variable', culture: 'Central Asian' },
  { value: 'thailand', label: 'Thailand', climate: 'hot', culture: 'Southeast Asian casual' },
  { value: 'timor-leste', label: 'Timor-Leste', climate: 'hot', culture: 'Southeast Asian' },
  { value: 'turkmenistan', label: 'Turkmenistan', climate: 'hot', culture: 'Central Asian' },
  { value: 'uae', label: 'United Arab Emirates', climate: 'hot', culture: 'Gulf luxury' },
  { value: 'uzbekistan', label: 'Uzbekistan', climate: 'variable', culture: 'Central Asian' },
  { value: 'vietnam', label: 'Vietnam', climate: 'hot', culture: 'Southeast Asian' },
  { value: 'yemen', label: 'Yemen', climate: 'hot', culture: 'Arabian traditional' },
  
  // === OCEANIA ===
  { value: 'australia', label: 'Australia', climate: 'warm', culture: 'Beach casual' },
  { value: 'fiji', label: 'Fiji', climate: 'hot', culture: 'Pacific island' },
  { value: 'kiribati', label: 'Kiribati', climate: 'hot', culture: 'Pacific island' },
  { value: 'marshall-islands', label: 'Marshall Islands', climate: 'hot', culture: 'Pacific island' },
  { value: 'micronesia', label: 'Micronesia', climate: 'hot', culture: 'Pacific island' },
  { value: 'nauru', label: 'Nauru', climate: 'hot', culture: 'Pacific island' },
  { value: 'new-zealand', label: 'New Zealand', climate: 'mild', culture: 'Outdoor casual' },
  { value: 'palau', label: 'Palau', climate: 'hot', culture: 'Pacific island' },
  { value: 'papua-new-guinea', label: 'Papua New Guinea', climate: 'hot', culture: 'Melanesian' },
  { value: 'samoa', label: 'Samoa', climate: 'hot', culture: 'Pacific island' },
  { value: 'solomon-islands', label: 'Solomon Islands', climate: 'hot', culture: 'Pacific island' },
  { value: 'tonga', label: 'Tonga', climate: 'hot', culture: 'Pacific island' },
  { value: 'tuvalu', label: 'Tuvalu', climate: 'hot', culture: 'Pacific island' },
  { value: 'vanuatu', label: 'Vanuatu', climate: 'hot', culture: 'Pacific island' },
  
  // === OTHER ===
  { value: 'other-country', label: 'Other Country', climate: 'variable', culture: 'General' }
]

// Workplaces remain the same
export const workplaces = [
  { value: 'corporate', label: 'Corporate Office', formality: 'high', description: 'Suits, formal shoes, conservative colors' },
  { value: 'tech-startup', label: 'Tech Startup', formality: 'low', description: 'Hoodies, jeans, sneakers OK' },
  { value: 'creative', label: 'Creative Agency', formality: 'medium', description: 'Express yourself, stylish casual' },
  { value: 'retail', label: 'Retail/Customer Service', formality: 'medium', description: 'Presentable, professional' },
  { value: 'healthcare', label: 'Healthcare', formality: 'high', description: 'Clean, professional, practical' },
  { value: 'education', label: 'Education/Teaching', formality: 'medium', description: 'Business casual, approachable' },
  { value: 'hospitality', label: 'Hospitality/Restaurant', formality: 'medium', description: 'Neat, customer-facing' },
  { value: 'remote', label: 'Remote Work', formality: 'low', description: 'Comfortable, video-call ready' },
  { value: 'student', label: 'Student', formality: 'low', description: 'Casual, comfortable, trendy' },
  { value: 'freelance', label: 'Freelancer', formality: 'low', description: 'Flexible, personal style' },
  { value: 'not-working', label: 'Not Currently Working', formality: 'low', description: 'Personal preference' },
  { value: 'finance', label: 'Finance/Banking', formality: 'high', description: 'Formal business attire' },
  { value: 'law', label: 'Law/Legal', formality: 'high', description: 'Conservative professional' },
  { value: 'government', label: 'Government/Public Service', formality: 'high', description: 'Professional formal' },
  { value: 'construction', label: 'Construction/Trades', formality: 'low', description: 'Practical, durable clothing' },
  { value: 'entertainment', label: 'Entertainment/Media', formality: 'low', description: 'Creative, trendy' }
]

// Social scenes remain the same
export const socialScenes = [
  { value: 'university', label: 'University/College', style: 'casual-trendy', description: 'Trendy, experimental, brand-aware' },
  { value: 'young-professional', label: 'Young Professional', style: 'smart-casual', description: 'Polished, put-together, quality' },
  { value: 'nightlife', label: 'Active Nightlife', style: 'trendy', description: 'Fashion-forward, bold, stylish' },
  { value: 'athletic', label: 'Athletic/Sporty', style: 'athletic', description: 'Athleisure, functional, active' },
  { value: 'artistic', label: 'Artistic/Creative', style: 'expressive', description: 'Unique, expressive, individualistic' },
  { value: 'family', label: 'Family-Oriented', style: 'practical', description: 'Comfortable, practical, appropriate' },
  { value: 'minimalist', label: 'Minimalist', style: 'clean', description: 'Simple, clean lines, neutral' },
  { value: 'luxury', label: 'Luxury/High-End', style: 'designer', description: 'Designer brands, high quality' },
  { value: 'outdoor', label: 'Outdoor/Adventure', style: 'functional', description: 'Performance gear, practical' },
  { value: 'professional', label: 'Professional Networking', style: 'polished', description: 'Business casual to formal' }
]

// Age groups remain the same
export const ageGroups = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55+', label: '55+' }
]

// Helper function to find location (city or country)
export const findLocation = (searchValue) => {
  // Try to find city first
  let location = cities.find(c => c.value === searchValue)
  
  // If not found, try countries
  if (!location) {
    location = countries.find(c => c.value === searchValue)
  }
  
  return location
}