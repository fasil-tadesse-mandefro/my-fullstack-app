import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../layout/Layout";
import TutorCard from "../../components/common/TutorCard";
import { tutorsApi } from "../../lib/api";
import "./FindTutors.css";

const SUBJECT_OPTIONS = [
  "All",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Computer Science",
  "Economics",
  "History",
];

const EDUCATION_LEVEL_OPTIONS = [
  "All",
  "Primary",
  "Secondary",
  "Preparatory",
  "University",
];

const PRICE_RANGE_OPTIONS = [
  { label: "All Prices", value: "all" },
  { label: "Under $20/hr", value: "under20" },
  { label: "$20 - $30/hr", value: "20to30" },
  { label: "Above $30/hr", value: "above30" },
];

const RATING_OPTIONS = [
  { label: "All Ratings", value: "all" },
  { label: "4.5+ ★", value: "4.5" },
  { label: "4.8+ ★", value: "4.8" },
  { label: "5.0 ★ Top Rated", value: "5.0" },
];

const AVAILABILITY_OPTIONS = [
  "All",
  "Has available slots",
];

const INITIAL_PAGE_SIZE = 6;
const PAGE_SIZE_INCREMENT = 6;

function FindTutors() {
  const navigate = useNavigate();

  // Dynamic API state
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tutorsApi.getAll();
      const list = response?.tutors || response || [];
      setTutors(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load tutors:", err);
      setError(err.message || "Failed to load tutors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // Search input state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Filters state
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  // Trigger search on form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setVisibleCount(INITIAL_PAGE_SIZE);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput("");
    setActiveSearch("");
    setSelectedSubject("All");
    setSelectedLevel("All");
    setSelectedPriceRange("all");
    setSelectedRating("all");
    setSelectedAvailability("All");
    setSortBy("recommended");
    setVisibleCount(INITIAL_PAGE_SIZE);
  };

  // Filter & sort logic
  const filteredTutors = useMemo(() => {
    return tutors.filter((tutor) => {
      // 1. Search Query
      if (activeSearch) {
        const query = activeSearch.toLowerCase();
        const matchesName = tutor.name?.toLowerCase().includes(query);
        const matchesSubject = tutor.subject?.toLowerCase().includes(query);
        const matchesTagline = tutor.tagline?.toLowerCase().includes(query);
        const matchesLevel = tutor.educationLevel?.toLowerCase().includes(query);

        if (!matchesName && !matchesSubject && !matchesTagline && !matchesLevel) {
          return false;
        }
      }

      // 2. Subject Filter
      if (selectedSubject !== "All") {
        if (!tutor.subject?.toLowerCase().includes(selectedSubject.toLowerCase())) {
          return false;
        }
      }

      // 3. Education Level Filter
      if (selectedLevel !== "All") {
        const levelStr = (tutor.educationLevel || "").toLowerCase();
        if (!levelStr.includes(selectedLevel.toLowerCase())) {
          return false;
        }
      }

      // 4. Price Filter
      if (selectedPriceRange === "under20" && tutor.price >= 20) return false;
      if (selectedPriceRange === "20to30" && (tutor.price < 20 || tutor.price > 30)) return false;
      if (selectedPriceRange === "above30" && tutor.price <= 30) return false;

      // 5. Rating Filter
      if (selectedRating !== "all") {
        const minRating = parseFloat(selectedRating);
        if ((tutor.rating || 0) < minRating) return false;
      }

      // 6. Availability Filter
      if (selectedAvailability !== "All") {
        if (tutor.availability !== selectedAvailability) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "ratingHigh") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === "priceLow") {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === "priceHigh") {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === "reviews") {
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      }
      return 0; // Default recommended
    });
  }, [
    tutors,
    activeSearch,
    selectedSubject,
    selectedLevel,
    selectedPriceRange,
    selectedRating,
    selectedAvailability,
    sortBy,
  ]);

  const displayedTutors = filteredTutors.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTutors.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE_INCREMENT);
  };

  // Active filter count for badge
  const activeFiltersCount =
    (activeSearch ? 1 : 0) +
    (selectedSubject !== "All" ? 1 : 0) +
    (selectedLevel !== "All" ? 1 : 0) +
    (selectedPriceRange !== "all" ? 1 : 0) +
    (selectedRating !== "all" ? 1 : 0) +
    (selectedAvailability !== "All" ? 1 : 0);

  return (
    <Layout>
      <div className="find-tutors-page">
        {/* ── HERO BANNER & SEARCH ── */}
        <section className="find-tutors-hero">
          <div className="container find-tutors-hero-content">
            <div className="hero-badge">
              <span>👨‍🏫 Verified Ethiopian Educators</span>
            </div>
            <h1 className="hero-title">Find Your Perfect 1-on-1 Tutor</h1>
            <p className="hero-subtitle">
              Connect with top-rated tutors for primary, high school, university entrance exam prep, and specialized skills.
            </p>

            {/* Main Search Bar */}
            <form className="hero-search-form" onSubmit={handleSearchSubmit}>
              <div className="hero-search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by subject, tutor name, or skill (e.g. Calculus, Physics, Python)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="hero-search-input"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => {
                      setSearchInput("");
                      setActiveSearch("");
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button type="submit" className="hero-search-submit-btn">
                <span>Search Tutors</span>
              </button>
            </form>
          </div>
        </section>

        {/* ── MAIN CONTENT CONTAINER ── */}
        <div className="container find-tutors-container">
          {/* ── FILTER CONTROLS BAR ── */}
          <div className="filter-controls-panel">
            <div className="filter-panel-header">
              <div className="filter-panel-title">
                <span className="filter-icon">⚡</span>
                <h3>Filter Tutors</h3>
                {activeFiltersCount > 0 && (
                  <span className="active-filters-badge">
                    {activeFiltersCount} active
                  </span>
                )}
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="reset-filters-btn"
                  onClick={handleResetFilters}
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Filter Selectors Grid */}
            <div className="filters-grid">
              {/* 1. Subject Filter */}
              <div className="filter-group">
                <label className="filter-label">Subject</label>
                <select
                  className="filter-select"
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setVisibleCount(INITIAL_PAGE_SIZE);
                  }}
                >
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub === "All" ? "All Subjects" : sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Education Level Filter */}
              <div className="filter-group">
                <label className="filter-label">Education Level</label>
                <select
                  className="filter-select"
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setVisibleCount(INITIAL_PAGE_SIZE);
                  }}
                >
                  {EDUCATION_LEVEL_OPTIONS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl === "All" ? "All Levels" : lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Price Filter */}
              <div className="filter-group">
                <label className="filter-label">Hourly Rate</label>
                <select
                  className="filter-select"
                  value={selectedPriceRange}
                  onChange={(e) => {
                    setSelectedPriceRange(e.target.value);
                    setVisibleCount(INITIAL_PAGE_SIZE);
                  }}
                >
                  {PRICE_RANGE_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Rating Filter */}
              <div className="filter-group">
                <label className="filter-label">Minimum Rating</label>
                <select
                  className="filter-select"
                  value={selectedRating}
                  onChange={(e) => {
                    setSelectedRating(e.target.value);
                    setVisibleCount(INITIAL_PAGE_SIZE);
                  }}
                >
                  {RATING_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Availability Filter */}
              <div className="filter-group">
                <label className="filter-label">Availability</label>
                <select
                  className="filter-select"
                  value={selectedAvailability}
                  onChange={(e) => {
                    setSelectedAvailability(e.target.value);
                    setVisibleCount(INITIAL_PAGE_SIZE);
                  }}
                >
                  {AVAILABILITY_OPTIONS.map((avail) => (
                    <option key={avail} value={avail}>
                      {avail === "All" ? "Any Availability" : avail}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filter Badges Pills */}
            {activeFiltersCount > 0 && (
              <div className="active-pills-row">
                <span className="pills-label">Active:</span>
                {activeSearch && (
                  <span className="filter-pill">
                    Keyword: "{activeSearch}"
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSearch("");
                        setSearchInput("");
                      }}
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedSubject !== "All" && (
                  <span className="filter-pill">
                    Subject: {selectedSubject}
                    <button
                      type="button"
                      onClick={() => setSelectedSubject("All")}
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedLevel !== "All" && (
                  <span className="filter-pill">
                    Level: {selectedLevel}
                    <button
                      type="button"
                      onClick={() => setSelectedLevel("All")}
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedPriceRange !== "all" && (
                  <span className="filter-pill">
                    Price: {PRICE_RANGE_OPTIONS.find((p) => p.value === selectedPriceRange)?.label}
                    <button
                      type="button"
                      onClick={() => setSelectedPriceRange("all")}
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedRating !== "all" && (
                  <span className="filter-pill">
                    Rating: {RATING_OPTIONS.find((r) => r.value === selectedRating)?.label}
                    <button
                      type="button"
                      onClick={() => setSelectedRating("all")}
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedAvailability !== "All" && (
                  <span className="filter-pill">
                    Availability: {selectedAvailability}
                    <button
                      type="button"
                      onClick={() => setSelectedAvailability("All")}
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── RESULTS HEADER BAR ── */}
          <div className="results-header-bar">
            <div className="results-count-info">
              Showing <strong>{displayedTutors.length}</strong> of{" "}
              <strong>{filteredTutors.length}</strong> tutors available
            </div>

            <div className="sort-controls">
              <label htmlFor="sort-by-select" className="sort-label">
                Sort by:
              </label>
              <select
                id="sort-by-select"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recommended">Recommended</option>
                <option value="ratingHigh">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* ── TUTORS CARDS GRID ── */}
          {loading ? (
            <div className="tutors-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="section-skeleton-card">
                  <div className="skeleton-shimmer" />
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div className="skeleton-avatar" />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div className="skeleton-line-title" />
                      <div className="skeleton-line-sub" />
                    </div>
                  </div>
                  <div className="skeleton-line skeleton-line-full" style={{ marginTop: "1rem" }} />
                  <div className="skeleton-line skeleton-line-full" />
                  <div className="skeleton-footer">
                    <div className="skeleton-line-sub" />
                    <div className="skeleton-line" style={{ width: "80px", height: "32px", borderRadius: "6px" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="tutors-empty-state">
              <div className="empty-state-icon">⚠️</div>
              <h3>Failed to Load Tutors</h3>
              <p>{error}</p>
              <button
                type="button"
                className="empty-state-reset-btn"
                onClick={fetchTutors}
              >
                Try Again
              </button>
            </div>
          ) : displayedTutors.length > 0 ? (
            <div className="tutors-grid">
              {displayedTutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
          ) : (
            /* ── EMPTY STATE ── */
            <div className="tutors-empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No Tutors Found</h3>
              <p>
                We couldn't find any tutors matching your current search or filter criteria.
                Try adjusting your filters or resetting them to explore all available instructors.
              </p>
              <button
                type="button"
                className="empty-state-reset-btn"
                onClick={handleResetFilters}
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* ── LOAD MORE BUTTON ── */}
          {hasMore && (
            <div className="load-more-wrapper">
              <button
                type="button"
                className="load-more-btn"
                onClick={handleLoadMore}
              >
                <span>Load More Tutors</span>
                <span className="load-more-count">
                  ({filteredTutors.length - visibleCount} remaining)
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default FindTutors;
