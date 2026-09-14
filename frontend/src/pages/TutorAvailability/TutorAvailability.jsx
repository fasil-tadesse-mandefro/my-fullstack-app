import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { tutorsApi } from "../../lib/api";
import "./TutorAvailability.css";

const emptySlot = () => ({ date: new Date().toISOString().slice(0, 10), start: "09:00", end: "17:00", status: "available" });
const formatTime = (time) => new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${String(time).slice(0, 5)}:00`));

function TutorAvailability() {
  const { user } = useAuth();
  const tutorId = user?.id;
  const [availability, setAvailability] = useState([]);
  const [slot, setSlot] = useState(emptySlot);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAvailability = useCallback(async () => {
    if (!tutorId) { setNotice("Your tutor account could not be identified."); setLoading(false); return; }
    try {
      setLoading(true);
      const response = await tutorsApi.getAvailability(tutorId);
      setAvailability(Array.isArray(response?.availability) ? response.availability : []);
    } catch (error) { setNotice(error.message || "Failed to load availability."); }
    finally { setLoading(false); }
  }, [tutorId]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const updateSlot = (event) => { setNotice(""); setSlot((current) => ({ ...current, [event.target.name]: event.target.value })); };
  const handleAddOrUpdate = async () => {
    if (slot.start >= slot.end) { setNotice("The end time must be later than the start time."); return; }
    if (!tutorId) return;
    try {
      setSaving(true);
      const response = editingId ? await tutorsApi.updateAvailability(tutorId, editingId, slot) : await tutorsApi.createAvailability(tutorId, slot);
      const savedSlot = response?.availability;
      setAvailability((current) => editingId ? current.map((item) => String(item.id) === String(editingId) ? savedSlot : item) : [...current, savedSlot]);
      setNotice(editingId ? "Availability updated successfully." : "Availability added successfully.");
      setEditingId(null); setSlot(emptySlot());
    } catch (error) { setNotice(error.message || "Failed to save availability."); }
    finally { setSaving(false); }
  };
  const editSlot = (item) => { setSlot({ date: String(item.date).slice(0, 10), start: String(item.startTime).slice(0, 5), end: String(item.endTime).slice(0, 5), status: item.status || "available" }); setEditingId(item.id); setNotice(""); };
  const deleteSlot = async (id) => {
    if (!tutorId) return;
    try {
      setSaving(true); await tutorsApi.deleteAvailability(tutorId, id);
      setAvailability((current) => current.filter((item) => String(item.id) !== String(id)));
      if (String(editingId) === String(id)) { setEditingId(null); setSlot(emptySlot()); }
      setNotice("Availability deleted successfully.");
    } catch (error) { setNotice(error.message || "Failed to delete availability."); }
    finally { setSaving(false); }
  };

  return <Layout><main className="availability-page"><div className="container availability-container">
    <div className="availability-heading"><div><p className="availability-kicker">Tutor workspace</p><h1>Manage availability</h1><p>Set the dates and hours when students can request a session with you.</p></div><Link to="/tutor/dashboard" className="availability-back">Back to dashboard</Link></div>
    <div className="availability-layout"><section className="availability-editor-card"><div className="editor-heading"><span className="editor-number">1</span><div><h2>{editingId ? "Edit availability" : "Add availability"}</h2><p>Choose a date and your available hours.</p></div></div>
      <div className="availability-fields"><label><span>Date</span><input type="date" name="date" value={slot.date} onChange={updateSlot} /></label><label><span>Status</span><select name="status" value={slot.status} onChange={updateSlot}><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label><label><span>Start time</span><input type="time" name="start" value={slot.start} onChange={updateSlot} /></label><label><span>End time</span><input type="time" name="end" value={slot.end} onChange={updateSlot} /></label></div>
      <div className="editor-actions"><button type="button" className="add-availability-button" disabled={saving} onClick={handleAddOrUpdate}>{saving ? "Saving..." : editingId ? "Update availability" : "Add availability"}</button>{editingId && <button type="button" className="cancel-edit-button" onClick={() => { setEditingId(null); setSlot(emptySlot()); }}>Cancel edit</button>}</div>
    </section><aside className="availability-guide"><h2>Booking tip</h2><p>Adding at least three time windows gives students more flexibility to book you.</p><div><strong>{availability.filter((item) => item.status === "available").length}</strong><span>available time windows</span></div></aside></div>
    <section className="availability-list-card"><div className="list-heading"><div><p className="availability-kicker">Your schedule</p><h2>Availability list</h2></div><span>{availability.length} time windows</span></div>
      {loading ? <div className="empty-availability"><p>Loading your availability...</p></div> : availability.length ? <div className="availability-list">{availability.map((item) => <article className="availability-item" key={item.id}><div className="day-badge"><strong>{item.day?.slice(0, 3)}</strong><span>{item.day}</span></div><div className="availability-item-details"><h3>{formatTime(item.startTime)} – {formatTime(item.endTime)}</h3><p>{item.date} · {item.status}</p></div><div className="availability-item-actions"><button type="button" disabled={saving} onClick={() => editSlot(item)}>Edit</button><button type="button" disabled={saving} className="delete-button" onClick={() => deleteSlot(item.id)}>Delete</button></div></article>)}</div> : <div className="empty-availability"><h3>No availability yet</h3><p>Add your first available time window above.</p></div>}
      <div className="availability-save-row">{notice && <p className={notice.includes("successfully") ? "availability-success" : "availability-error"} role="status">{notice}</p>}<button type="button" className="save-availability-button" disabled={loading || saving} onClick={fetchAvailability}>Refresh availability</button></div>
    </section>
  </div></main></Layout>;
}

export default TutorAvailability;
