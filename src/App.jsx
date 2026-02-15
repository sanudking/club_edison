import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './supabaseClient';

const CLUB_OPTIONS = ['Coding Club', 'Music Club', 'Dance Club', 'Drama Club', 'Sports Club', 'Photography Club'];
const PLACEHOLDER_VENUES = [
  { id: 'placeholder-1', name: 'BH1', campus_area: 'North Campus', capacity: null, image_url: '/venues/BH1.jpeg', isPlaceholder: true },
  { id: 'placeholder-2', name: 'Canteen', campus_area: 'Main Campus', capacity: null, image_url: '/venues/Canteen.jpeg', isPlaceholder: true },
  { id: 'placeholder-3', name: 'Central Seminar Hall', campus_area: 'Seminar Block', capacity: null, image_url: '/venues/Central Seminar Hall.jpeg', isPlaceholder: true },
  { id: 'placeholder-4', name: 'IT Building', campus_area: 'Tech Park', capacity: null, image_url: '/venues/IT Building.jpeg', isPlaceholder: true },
  { id: 'placeholder-5', name: 'Library', campus_area: 'Library Zone', capacity: null, image_url: '/venues/Library.jpeg', isPlaceholder: true },
  { id: 'placeholder-6', name: 'SAC Building', campus_area: 'South Campus', capacity: null, image_url: '/venues/SAC Building.jpeg', isPlaceholder: true },
  { id: 'placeholder-7', name: 'Science Block', campus_area: 'Research Wing', capacity: null, image_url: '/venues/Science Block.jpeg', isPlaceholder: true },
];

function getGreetingLabel() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function AuthGate({ children, session }) {
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function GuestGate({ children, session }) {
  if (session) return <Navigate to="/dashboard" replace />;
  return children;
}

function HomePage() {
  return (
    <div className="page-center">
      <div>
        <h1>Club Management</h1>
        <div className="button-row">
          <Link className="btn" to="/login">
            I have an account
          </Link>
          <Link className="btn secondary" to="/register-type">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

function RegisterTypePage() {
  return (
    <div className="page-center">
      <div className="card form-grid">
        <h2>Register As</h2>
        <Link className="btn" to="/register?role=coordinator">
          Coordinator
        </Link>
        <Link className="btn secondary" to="/register?role=student">
          Student
        </Link>
        <p className="helper-text">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const role = roleParam === 'student' ? 'student' : roleParam === 'coordinator' ? 'coordinator' : '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roll, setRoll] = useState('');
  const [clubs, setClubs] = useState([]);
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedClubs = useMemo(() => clubs.join(', '), [clubs]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('Select register type first.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          roll,
          year,
          clubs,
          role,
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      await supabase.from('profiles').upsert(
        {
          id: userId,
          full_name: name,
          email,
          role,
        },
        { onConflict: 'id' }
      );

      if (clubs.length > 0) {
        await supabase
          .from('club_memberships')
          .upsert(
            clubs.map((club) => ({
              user_id: userId,
              club_name: club,
            })),
            { onConflict: 'user_id,club_name' }
          );
      }
    }

    setLoading(false);
    navigate('/login', { state: { justRegistered: true } });
  };

  return (
    <div className="page-center">
      <form className="card form-grid" onSubmit={handleRegister}>
        <h2>Register</h2>
        <p className="note">Role: {role || 'Not selected'}</p>

        <label>
          Your Name
          <input type="text" placeholder="Enter your name" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Email
          <input type="email" placeholder="Enter email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Roll
          <input type="text" placeholder="Enter roll number" required value={roll} onChange={(e) => setRoll(e.target.value)} />
        </label>

        <label>
          Your Clubs (multi-select)
          <select multiple size={5} required value={clubs} onChange={(e) => setClubs(Array.from(e.target.selectedOptions).map((option) => option.value))}>
            {CLUB_OPTIONS.map((club) => (
              <option key={club} value={club}>
                {club}
              </option>
            ))}
          </select>
        </label>

        {selectedClubs ? <p className="note">Selected: {selectedClubs}</p> : null}

        <label>
          Year
          <select required value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="" disabled>
              Select year
            </option>
            <option value="1">1st</option>
            <option value="2">2nd</option>
            <option value="3">3rd</option>
            <option value="4">4th</option>
          </select>
        </label>

        <label>
          Create Password
          <input type="password" placeholder="Create password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <label>
          Re-enter Password
          <input
            type="password"
            placeholder="Re-enter password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        {error ? <p className="error-message">{error}</p> : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : 'Register'}
        </button>

        <p className="helper-text">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const info = location.state?.justRegistered ? 'Registration successful. Please login with your credentials.' : '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    navigate('/dashboard');
  };

  return (
    <div className="page-center">
      <form className="card form-grid" onSubmit={handleLogin}>
        <h2>Login</h2>

        <label>
          Email
          <input type="email" placeholder="Enter email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Password
          <input type="password" placeholder="Enter password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {info ? <p className="status-message">{info}</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : 'Login'}
        </button>

        <p className="helper-text">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <p className="helper-text">
          New user? <Link to="/register-type">Register</Link>
        </p>
      </form>
    </div>
  );
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage('Password reset link sent to your email.');
  };

  return (
    <div className="page-center">
      <form className="card form-grid" onSubmit={handleForgotPassword}>
        <h2>Forgot Password</h2>
        <label>
          Email
          <input
            type="email"
            placeholder="Enter your registered email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {message ? <p className="status-message">{message}</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : 'Send reset link'}
        </button>
        <p className="helper-text">
          Back to <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

function VenuePickerModal({ open, venues, unavailableVenueIds, selectedVenue, onSelect, onClose }) {
  const [pendingVenue, setPendingVenue] = useState(selectedVenue || null);

  useEffect(() => {
    if (open) {
      setPendingVenue(selectedVenue || null);
    }
  }, [open, selectedVenue]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal-card large" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>Select Venue</h2>
        <p className="note">Unavailable venues are greyed out for selected date and time.</p>

        <div className="venue-grid">
          {venues.map((venue) => {
            const unavailable = unavailableVenueIds.has(venue.id);
            return (
              <button
                key={venue.id}
                type="button"
                disabled={unavailable}
                className={`venue-tile ${unavailable ? 'unavailable' : ''} ${pendingVenue?.id === venue.id ? 'selected' : ''}`}
                onClick={() => setPendingVenue(venue)}
              >
                <div className="venue-image-wrap">
                  {venue.image_url ? <img src={venue.image_url} alt={venue.name} className="venue-image" /> : <div className="venue-image placeholder" />}
                </div>
                <div className="venue-meta">
                  <h4>{venue.name}</h4>
                  <p>{venue.campus_area || 'Campus area TBD'}</p>
                  <p>{unavailable ? 'Not Available' : 'Available'}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="button-row end">
          <button
            className="btn"
            type="button"
            disabled={!pendingVenue}
            onClick={() => onSelect(pendingVenue)}
          >
            Save
          </button>
          <button className="btn secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AddVenueModal({ open, onClose, onAdd, loading }) {
  const [name, setName] = useState('');
  const [campusArea, setCampusArea] = useState('');
  const [capacity, setCapacity] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!open) {
      setName('');
      setCampusArea('');
      setCapacity('');
      setImageUrl('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>Add Venue</h2>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            onAdd({
              name,
              campus_area: campusArea,
              capacity: capacity ? Number(capacity) : null,
              image_url: imageUrl || null,
            });
          }}
        >
          <label>
            Venue Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Campus Area
            <input value={campusArea} onChange={(e) => setCampusArea(e.target.value)} required />
          </label>
          <label>
            Capacity
            <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} min="1" />
          </label>
          <label>
            Image URL
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="You can paste venue image URL later" />
          </label>

          <div className="button-row end">
            <button className="btn secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CoordinatorDashboardPage({ session }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('event');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const [events, setEvents] = useState([]);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [venues, setVenues] = useState([]);
  const [clubMembers, setClubMembers] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVenuePickerOpen, setIsVenuePickerOpen] = useState(false);
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);

  const [eventForm, setEventForm] = useState({
    eventName: '',
    description: '',
    eventDate: '',
    eventTime: '',
    selectedVenue: null,
    roomNo: '',
  });
  const [eventFormError, setEventFormError] = useState('');
  const [editingEventId, setEditingEventId] = useState(null);

  const [unavailableVenueIds, setUnavailableVenueIds] = useState(new Set());

  const [eventSearch, setEventSearch] = useState('');
  const displayName = session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Coordinator';
  const coordinatorClubs = Array.isArray(session?.user?.user_metadata?.clubs) ? session.user.user_metadata.clubs : [];
  const coordinatorSubtitle =
    coordinatorClubs.length > 0
      ? `Coordinator of ${coordinatorClubs.join(', ')}`
      : 'Coordinator - club assignment pending';
  const displayVenues =
    venues.length > 0
      ? venues.map((venue, index) => ({
          ...venue,
          image_url: venue.image_url || PLACEHOLDER_VENUES[index % PLACEHOLDER_VENUES.length].image_url,
        }))
      : PLACEHOLDER_VENUES;

  const fetchEvents = async () => {
    const { data, error: fetchError } = await supabase
      .from('events')
      .select('id,event_name,event_date,event_time,room,venue_id,created_at')
      .order('event_date', { ascending: false })
      .order('event_time', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setEvents(data ?? []);
  };

  const fetchFeedback = async () => {
    const { data, error: fetchError } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setFeedbackItems(data ?? []);
  };

  const fetchHistory = async () => {
    const { data, error: fetchError } = await supabase.from('history').select('*').order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setHistoryItems(data ?? []);
  };

  const fetchVenues = async () => {
    const { data, error: fetchError } = await supabase.from('venues').select('*').eq('is_active', true).order('name', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setVenues(data ?? []);
  };

  const fetchClubMembers = async () => {
    const { data: memberships, error: membershipError } = await supabase
      .from('club_memberships')
      .select('id,user_id,club_name,created_at')
      .order('club_name', { ascending: true });

    if (membershipError) {
      setError(membershipError.message);
      return;
    }

    const userIds = Array.from(new Set((memberships ?? []).map((item) => item.user_id)));
    if (userIds.length === 0) {
      setClubMembers([]);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id,full_name,email,role')
      .in('id', userIds);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const merged = (memberships ?? []).map((m) => ({
      ...m,
      profile: profileById.get(m.user_id) || null,
    }));
    setClubMembers(merged);
  };

  useEffect(() => {
    setError('');
    fetchVenues();

    if (activeTab === 'event') fetchEvents();
    if (activeTab === 'feedback') fetchFeedback();
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'venues') fetchVenues();
    if (activeTab === 'members') fetchClubMembers();
  }, [activeTab]);

  useEffect(() => {
    const closeOnEscape = (e) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsVenuePickerOpen(false);
        setIsAddVenueOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const loadVenueAvailability = async (dateValue, timeValue, excludeEventId = null) => {
    if (!dateValue || !timeValue) {
      setUnavailableVenueIds(new Set());
      return;
    }

    const { data, error: availabilityError } = await supabase
      .from('events')
      .select('venue_id')
      .eq('event_date', dateValue)
      .eq('event_time', timeValue)
      .not('venue_id', 'is', null)
      .neq('id', excludeEventId || '');

    if (availabilityError) {
      setError(availabilityError.message);
      return;
    }

    setUnavailableVenueIds(new Set((data ?? []).map((item) => item.venue_id)));
  };

  const openCreateModal = () => {
    setEditingEventId(null);
    setEventForm({ eventName: '', description: '', eventDate: '', eventTime: '', selectedVenue: null, roomNo: '' });
    setEventFormError('');
    setIsCreateModalOpen(true);
  };

  const parseVenueAndRoom = (roomValue) => {
    if (!roomValue) return { venueName: '', roomNo: '' };
    const marker = ' | Room ';
    const index = roomValue.indexOf(marker);
    if (index === -1) return { venueName: roomValue, roomNo: '' };
    return {
      venueName: roomValue.slice(0, index),
      roomNo: roomValue.slice(index + marker.length),
    };
  };

  const openEditModal = async (item) => {
    const parsed = parseVenueAndRoom(item.room);
    const selectedVenue =
      displayVenues.find((venue) => venue.id === item.venue_id) || displayVenues.find((venue) => venue.name === parsed.venueName) || null;

    setEditingEventId(item.id);
    setEventForm({
      eventName: item.event_name || '',
      description: '',
      eventDate: item.event_date || '',
      eventTime: item.event_time || '',
      selectedVenue,
      roomNo: parsed.roomNo,
    });
    setEventFormError('');
    setIsCreateModalOpen(true);
    await loadVenueAvailability(item.event_date, item.event_time, item.id);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setEventFormError('');
    setStatus('');
    setError('');

    if (!eventForm.eventName || !eventForm.eventDate || !eventForm.eventTime || !eventForm.selectedVenue) {
      setEventFormError('Event Name, Date, Time and Venue are required.');
      return;
    }

    if (!eventForm.selectedVenue.isPlaceholder && unavailableVenueIds.has(eventForm.selectedVenue.id)) {
      setEventFormError('Selected venue is not available for this slot.');
      return;
    }

    setLoading(true);

    const payload = {
      coordinator_id: session.user.id,
      event_name: eventForm.eventName,
      event_date: eventForm.eventDate,
      event_time: eventForm.eventTime,
      room: `${eventForm.selectedVenue.name}${eventForm.roomNo ? ` | Room ${eventForm.roomNo}` : ''}`,
      venue_id: eventForm.selectedVenue.isPlaceholder ? null : eventForm.selectedVenue.id,
    };

    let newEventId = editingEventId;

    if (editingEventId) {
      const { error: updateError } = await supabase.from('events').update(payload).eq('id', editingEventId);
      if (updateError) {
        setLoading(false);
        setEventFormError(updateError.message);
        return;
      }
    } else {
      const { data: insertedRows, error: insertError } = await supabase.from('events').insert(payload).select('id').limit(1);
      if (insertError) {
        setLoading(false);
        setEventFormError(insertError.message);
        return;
      }
      newEventId = insertedRows?.[0]?.id;
    }

    if (!newEventId && !editingEventId) {
      setLoading(false);
      setEventFormError('Unable to save event.');
      return;
    }
    await supabase.from('history').insert({
      coordinator_id: session.user.id,
      event_id: newEventId,
      action: editingEventId ? 'UPDATED_EVENT' : 'CREATED_EVENT',
      details: {
        event_name: eventForm.eventName,
        event_date: eventForm.eventDate,
        event_time: eventForm.eventTime,
        venue: eventForm.selectedVenue.name,
        room_no: eventForm.roomNo || null,
        description: eventForm.description,
      },
    });

    setLoading(false);
    setIsCreateModalOpen(false);
    setEditingEventId(null);
    setStatus(editingEventId ? 'Event updated successfully.' : 'Event created successfully.');
    fetchEvents();
    fetchHistory();
  };

  const handleDeleteEvent = async (item) => {
    const confirmed = window.confirm(`Delete "${item.event_name}"?`);
    if (!confirmed) return;
    setLoading(true);
    setStatus('');
    setError('');
    const { error: deleteError } = await supabase.from('events').delete().eq('id', item.id);
    if (deleteError) {
      setLoading(false);
      setError(deleteError.message);
      return;
    }
    await supabase.from('history').insert({
      coordinator_id: session.user.id,
      event_id: item.id,
      action: 'DELETED_EVENT',
      details: {
        event_name: item.event_name,
        event_date: item.event_date,
        event_time: item.event_time,
        venue: item.room,
      },
    });
    setLoading(false);
    setStatus('Event deleted successfully.');
    fetchEvents();
    fetchHistory();
  };

  const handleAddVenue = async (payload) => {
    setStatus('');
    setError('');
    setLoading(true);

    const { error: addVenueError } = await supabase.from('venues').insert(payload);

    setLoading(false);

    if (addVenueError) {
      setError(addVenueError.message);
      return;
    }

    setIsAddVenueOpen(false);
    setStatus('Venue added successfully.');
    fetchVenues();
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate('/login');
  };

  const filteredEvents = events.filter((item) => item.event_name.toLowerCase().includes(eventSearch.toLowerCase()));

  const statCards = [
    { label: 'Total Events', value: events.length },
    { label: 'Venues', value: displayVenues.length },
    { label: 'Feedback', value: feedbackItems.length },
    { label: 'History Logs', value: historyItems.length },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div>
          <h2 className="sidebar-title">Coordinator Dashboard</h2>
          <nav className="sidebar-nav" aria-label="Dashboard Navigation">
            {['event', 'feedback', 'history', 'venues', 'members'].map((tab) => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} type="button" onClick={() => setActiveTab(tab)}>
                {tab === 'event' ? 'Event' : tab === 'feedback' ? 'Feedback' : tab === 'history' ? 'History' : tab === 'venues' ? 'Venues' : 'Club Members'}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <p className="sidebar-email">{session?.user?.email}</p>
          <button className="btn" type="button" onClick={handleLogout} disabled={loading}>
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <section className="hero-banner">
          <h1 className="hero-title">
            {getGreetingLabel()}, {displayName}
          </h1>
          <p className="hero-subtitle">{coordinatorSubtitle}</p>
        </section>

        <div className="stats-grid">
          {statCards.map((stat) => (
            <article key={stat.label} className="stat-card">
              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
            </article>
          ))}
        </div>

        <div className="dashboard-main-header">
          <h1 className="main-title">
            {activeTab === 'event'
              ? 'Events'
              : activeTab === 'feedback'
                ? 'Feedback'
                : activeTab === 'history'
                  ? 'History'
                  : activeTab === 'venues'
                    ? 'Venue Management'
                    : 'Club Members'}
          </h1>

          {activeTab === 'event' ? (
            <button className="btn" type="button" onClick={openCreateModal}>
              Create New Event
            </button>
          ) : null}

          {activeTab === 'venues' ? (
            <button className="btn" type="button" onClick={() => setIsAddVenueOpen(true)}>
              Add Venue
            </button>
          ) : null}
        </div>

        {status ? <p className="status-message">{status}</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        {activeTab === 'event' ? (
          <section className="data-panel event-list">
            <input
              className="search-input compact"
              placeholder="Search events"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
            />

            {filteredEvents.length === 0 ? <p className="muted">No events yet.</p> : null}
            {filteredEvents.map((item) => (
              <article className="data-card" key={item.id}>
                <div className="event-card-layout">
                  <div className="event-thumb-wrap">
                    <img
                      className="event-thumb"
                      src={
                        displayVenues.find((venue) => venue.id === item.venue_id)?.image_url ||
                        displayVenues.find((venue) => venue.name === parseVenueAndRoom(item.room).venueName)?.image_url ||
                        '/venues/BH1.jpeg'
                      }
                      alt={item.room || 'Venue'}
                    />
                  </div>
                  <div className="event-card-content">
                    <h3>{item.event_name}</h3>
                    <p>
                      {item.event_date} at {item.event_time}
                    </p>
                    <p>Venue: {item.room}</p>
                    <div className="event-actions">
                      <button className="btn small" type="button" onClick={() => openEditModal(item)}>
                        Edit
                      </button>
                      <button className="btn small secondary" type="button" onClick={() => handleDeleteEvent(item)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === 'feedback' ? (
          <section className="data-panel">
            {feedbackItems.length === 0 ? <p className="muted">No feedback records yet.</p> : null}
            {feedbackItems.map((item) => (
              <article className="data-card" key={item.id}>
                <h3>{item.student_name || 'Anonymous Student'}</h3>
                <p>{item.message}</p>
                <p>Rating: {item.rating ?? 'N/A'}</p>
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === 'history' ? (
          <section className="data-panel">
            {historyItems.length === 0 ? <p className="muted">No history records yet.</p> : null}
            {historyItems.map((item) => (
              <article className="data-card" key={item.id}>
                <h3>{item.action}</h3>
                <p>{item.created_at}</p>
                <p className="code-ish">{JSON.stringify(item.details)}</p>
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === 'venues' ? (
          <section className="venue-grid">
            {displayVenues.length === 0 ? <p className="muted">No venues available. Add your first venue.</p> : null}
            {displayVenues.map((venue) => (
              <article className="venue-card" key={venue.id}>
                {venue.image_url ? <img src={venue.image_url} alt={venue.name} className="venue-image" /> : <div className="venue-image placeholder" />}
                <h3>{venue.name}</h3>
                <p>{venue.campus_area || 'Campus area TBD'}</p>
                <p>Capacity: {venue.capacity || 'N/A'}</p>
                {venue.isPlaceholder ? <p className="note">Placeholder venue</p> : null}
              </article>
            ))}
          </section>
        ) : null}

        {activeTab === 'members' ? (
          <section className="data-panel">
            {clubMembers.length === 0 ? <p className="muted">No club members found yet.</p> : null}
            {Array.from(new Set(clubMembers.map((m) => m.club_name))).map((clubName) => (
              <article className="data-card" key={clubName}>
                <h3>{clubName}</h3>
                <div className="member-list">
                  {clubMembers
                    .filter((m) => m.club_name === clubName)
                    .map((member) => (
                      <div className="member-item" key={member.id}>
                        <p>{member.profile?.full_name || 'Unnamed User'}</p>
                        <p className="note">{member.profile?.email || member.user_id}</p>
                        <p className="note">{member.profile?.role || 'member'}</p>
                      </div>
                    ))}
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </main>

      {isCreateModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-card xlarge" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Event</h2>
            <form className="form-grid" onSubmit={handleSaveEvent}>
              <label>
                Event Name
                <input
                  value={eventForm.eventName}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, eventName: e.target.value }))}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  className="text-area"
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </label>

              <div className="two-col-inputs">
                <label>
                  Date
                  <input
                    type="date"
                    value={eventForm.eventDate}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      setEventForm((prev) => ({ ...prev, eventDate: nextDate }));
                      loadVenueAvailability(nextDate, eventForm.eventTime, editingEventId);
                    }}
                    required
                  />
                </label>

                <label>
                  Time
                  <input
                    type="time"
                    value={eventForm.eventTime}
                    onChange={(e) => {
                      const nextTime = e.target.value;
                      setEventForm((prev) => ({ ...prev, eventTime: nextTime }));
                      loadVenueAvailability(eventForm.eventDate, nextTime, editingEventId);
                    }}
                    required
                  />
                </label>
              </div>

              <label>
                Venue
                <div className="input-action-row">
                  <input value={eventForm.selectedVenue?.name || ''} placeholder="Select venue" readOnly required />
                  <button className="btn small" type="button" onClick={() => setIsVenuePickerOpen(true)}>
                    Choose Venue
                  </button>
                </div>
              </label>

              <label>
                Room No (Optional)
                <input
                  value={eventForm.roomNo}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, roomNo: e.target.value }))}
                  placeholder="e.g. 204, A-12"
                />
              </label>

              <p className="note">Set date and time first. Unavailable venues will appear disabled.</p>

              {eventFormError ? <p className="error-message">{eventFormError}</p> : null}

              <div className="button-row end">
                <button className="btn secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingEventId ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <VenuePickerModal
        open={isVenuePickerOpen}
        venues={displayVenues}
        unavailableVenueIds={unavailableVenueIds}
        selectedVenue={eventForm.selectedVenue}
        onSelect={(venue) => {
          setEventForm((prev) => ({ ...prev, selectedVenue: venue }));
          setIsVenuePickerOpen(false);
        }}
        onClose={() => setIsVenuePickerOpen(false)}
      />

      <AddVenueModal open={isAddVenueOpen} onClose={() => setIsAddVenueOpen(false)} onAdd={handleAddVenue} loading={loading} />
    </div>
  );
}

function StudentDashboardPage({ session }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clubs');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [clubToJoin, setClubToJoin] = useState('');
  const displayName = session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Student';

  const fetchUpcoming = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toTimeString().slice(0, 8);

    const { data, error: fetchError } = await supabase
      .from('events')
      .select('event_name,event_date,event_time,room')
      .or(`event_date.gt.${today},and(event_date.eq.${today},event_time.gte.${now})`)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true })
      .limit(5);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setUpcomingEvents(data ?? []);
  };

  const fetchHistory = async () => {
    const { data, error: fetchError } = await supabase
      .from('history')
      .select('*')
      .eq('coordinator_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(15);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setHistoryItems(data ?? []);
  };

  useEffect(() => {
    const metadataClubs = session.user.user_metadata?.clubs;
    setJoinedClubs(Array.isArray(metadataClubs) ? metadataClubs : []);

    if (activeTab === 'schedule') fetchUpcoming();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, session.user.user_metadata?.clubs]);

  const handleJoinClub = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');

    if (!clubToJoin) {
      setError('Select a club.');
      return;
    }

    if (joinedClubs.includes(clubToJoin)) {
      setError('You are already in this club.');
      return;
    }

    setLoading(true);

    const updatedClubs = [...joinedClubs, clubToJoin];

    const { error: updateUserError } = await supabase.auth.updateUser({
      data: {
        ...session.user.user_metadata,
        clubs: updatedClubs,
      },
    });

    if (updateUserError) {
      setLoading(false);
      setError(updateUserError.message);
      return;
    }

    await supabase.from('history').insert({
      coordinator_id: session.user.id,
      action: 'JOINED_CLUB',
      details: { club: clubToJoin },
    });

    await supabase
      .from('club_memberships')
      .upsert(
        {
          user_id: session.user.id,
          club_name: clubToJoin,
        },
        { onConflict: 'user_id,club_name' }
      );

    setJoinedClubs(updatedClubs);
    setClubToJoin('');
    setIsJoinModalOpen(false);
    setLoading(false);
    setStatus('Joined club successfully.');
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    navigate('/login');
  };

  const filteredClubs = joinedClubs.filter((club) => club.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="student-layout">
      <header className="student-header">
        <input
          className="search-input"
          type="text"
          placeholder="Search clubs, schedule, history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      <main className="student-main">
        <section className="hero-banner">
          <h1 className="hero-title">
            {getGreetingLabel()}, {displayName}
          </h1>
          <p className="hero-subtitle">
            {joinedClubs.length > 0 ? `Member of ${joinedClubs.join(', ')}` : 'No clubs joined yet'}
          </p>
        </section>

        {status ? <p className="status-message">{status}</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        {activeTab === 'clubs' ? (
          <section>
            <div className="student-main-header">
              <h1 className="main-title">My Clubs</h1>
              <button className="btn" type="button" onClick={() => setIsJoinModalOpen(true)}>
                Join Club
              </button>
            </div>

            <div className="data-panel two-col">
              {filteredClubs.length === 0 ? <p className="muted">No joined clubs found.</p> : null}
              {filteredClubs.map((club) => (
                <article className="data-card" key={club}>
                  <h3>{club}</h3>
                  <p>Active Member</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'schedule' ? (
          <section>
            <h1 className="main-title">Next Class Schedule</h1>
            <div className="data-panel">
              {upcomingEvents.length === 0 ? <p className="muted">No upcoming classes.</p> : null}
              {upcomingEvents.map((item, index) => (
                <article className="data-card" key={`${item.event_name}-${index}`}>
                  <h3>{item.event_name}</h3>
                  <p>
                    {item.event_date} at {item.event_time}
                  </p>
                  <p>Venue: {item.room}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'history' ? (
          <section>
            <h1 className="main-title">History</h1>
            <div className="data-panel">
              {historyItems.length === 0 ? <p className="muted">No history records.</p> : null}
              {historyItems.map((item) => (
                <article className="data-card" key={item.id}>
                  <h3>{item.action}</h3>
                  <p>{item.created_at}</p>
                  <p className="code-ish">{JSON.stringify(item.details)}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <aside className="student-sidebar">
        <nav className="sidebar-nav" aria-label="Student Navigation">
          <button className={`tab-btn ${activeTab === 'clubs' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('clubs')}>
            Clubs
          </button>
          <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('schedule')}>
            Next Class Schedule
          </button>
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('history')}>
            History
          </button>
        </nav>

        <button className="btn secondary" type="button" onClick={handleLogout} disabled={loading}>
          Logout
        </button>
      </aside>

      {isJoinModalOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsJoinModalOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Join Club</h2>
            <form className="form-grid" onSubmit={handleJoinClub}>
              <label>
                Select Club
                <select value={clubToJoin} onChange={(e) => setClubToJoin(e.target.value)} required>
                  <option value="" disabled>
                    Choose club
                  </option>
                  {CLUB_OPTIONS.map((club) => (
                    <option key={club} value={club}>
                      {club}
                    </option>
                  ))}
                </select>
              </label>

              <div className="button-row end">
                <button className="btn secondary" type="button" onClick={() => setIsJoinModalOpen(false)}>
                  Cancel
                </button>
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? 'Please wait...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DashboardPage({ session }) {
  const [role, setRole] = useState(session?.user?.user_metadata?.role || '');

  useEffect(() => {
    if (role) return;

    const fetchRole = async () => {
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
      if (data?.role) setRole(data.role);
    };

    fetchRole();
  }, [role, session.user.id]);

  if (role === 'student') return <StudentDashboardPage session={session} />;
  return <CoordinatorDashboardPage session={session} />;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoadingSession) {
    return (
      <div className="page-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <GuestGate session={session}>
            <HomePage />
          </GuestGate>
        }
      />
      <Route
        path="/register-type"
        element={
          <GuestGate session={session}>
            <RegisterTypePage />
          </GuestGate>
        }
      />
      <Route
        path="/register"
        element={
          <GuestGate session={session}>
            <RegisterPage />
          </GuestGate>
        }
      />
      <Route
        path="/login"
        element={
          <GuestGate session={session}>
            <LoginPage />
          </GuestGate>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestGate session={session}>
            <ForgotPasswordPage />
          </GuestGate>
        }
      />
      <Route
        path="/dashboard"
        element={
          <AuthGate session={session}>
            <DashboardPage session={session} />
          </AuthGate>
        }
      />
      <Route path="*" element={<Navigate to={session ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}
