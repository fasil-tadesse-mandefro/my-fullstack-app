import { useState, useEffect } from "react";
import AdminLayout from "../../layout/AdminLayout";
import { usersApi } from "../../lib/api";
import "./UserManagement.css";

function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await usersApi.getAll();
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const res = await usersApi.updateStatus(userId, newStatus);
      if (res.success) {
        fetchUsers();
      }
    } catch (err) {
      alert("Failed to update status: " + (err.message || "Error"));
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "All" ||
      (user.role || "").toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage student, tutor, and admin accounts on the platform.</p>
        </div>
      </div>

      <div className="admin-filters-bar">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="admin-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="admin-filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="student">Student</option>
          <option value="tutor">Tutor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="admin-table-container card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact Info</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-table-state">
                  Loading users from database...
                </td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="table-user-cell">
                      <img
                        src={
                          user.avatar ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                        }
                        alt={user.name}
                        className="table-avatar"
                      />
                      <div className="table-user-info">
                        <strong>{user.name}</strong>
                        <span>{user.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="table-contact-cell">
                      <span>{user.email}</span>
                      <span className="text-muted">{user.phone || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${(user.role || "student").toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        backgroundColor:
                          user.status === "approved"
                            ? "#dcfce7"
                            : user.status === "pending"
                            ? "#fef9c3"
                            : "#fee2e2",
                        color:
                          user.status === "approved"
                            ? "#166534"
                            : user.status === "pending"
                            ? "#854d0e"
                            : "#991b1b",
                      }}
                    >
                      {user.status || "approved"}
                    </span>
                  </td>
                  <td>
                    {user.joinedDate || user.joined_at
                      ? new Date(user.joinedDate || user.joined_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <div className="admin-action-btns">
                      {user.status === "pending" && (
                        <button
                          className="btn-icon"
                          style={{ color: "#16a34a" }}
                          onClick={() => handleStatusChange(user.id, "approved")}
                          title="Approve User"
                        >
                          ✓
                        </button>
                      )}
                      {user.status !== "suspended" && (
                        <button
                          className="btn-icon danger"
                          onClick={() => handleStatusChange(user.id, "suspended")}
                          title="Suspend User"
                        >
                          🚫
                        </button>
                      )}
                      {user.status === "suspended" && (
                        <button
                          className="btn-icon"
                          onClick={() => handleStatusChange(user.id, "approved")}
                          title="Reactivate User"
                        >
                          🔄
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-table-state">
                  No users found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default UserManagement;
