"use client";

import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";

interface Member {
  id: string;
  username: string;
  name: string;
  joined_at: string;
}

export interface RoomMembersProps {
  roomId: string;
  isOwner?: boolean;
  ownerId?: string | null;
}

export function RoomMembers({ roomId, isOwner = false, ownerId = null }: RoomMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingUser, setAddingUser] = useState<string | null>(null);

  useEffect(() => {
    async function loadMembers() {
      try {
        const data = await apiGet<Member[]>(`/api/rooms/${roomId}/members`);
        setMembers(data);
      } catch (err) {
        setError("Failed to load members");
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [roomId]);

  // Fetch available users when add dialog opens
  useEffect(() => {
    if (!showAddDialog || !isOwner) return;

    const fetch = async () => {
      try {
        setLoadingUsers(true);
        const data = await apiGet(`/api/rooms/${roomId}/available-users`);
        setAvailableUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setAvailableUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetch();
  }, [showAddDialog, roomId, isOwner]);

  const filteredUsers = availableUsers.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = async (userId: string) => {
    try {
      setAddingUser(userId);
      await apiPost(`/api/rooms/${roomId}/add-member`, { user_id: userId });
      const updated = await apiGet<Member[]>(`/api/rooms/${roomId}/members`);
      setMembers(updated);
      const avail = await apiGet(`/api/rooms/${roomId}/available-users`);
      setAvailableUsers(Array.isArray(avail) ? avail : []);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingUser(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "16px", textAlign: "center" }}>
        <Loader2 className="h-4 w-4 animate-spin inline" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "16px", fontSize: "12px", color: "hsl(var(--destructive))" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      borderLeft: "1px solid hsl(var(--border))",
      background: "hsl(var(--card))",
      display: "flex",
      flexDirection: "column",
      minWidth: "280px",
      maxWidth: "280px",
    }}>
      {/* Header */}
        <div style={{
          padding: "16px",
          borderBottom: "1px solid hsl(var(--border))",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          fontWeight: "600",
        }}>
        <Users className="h-4 w-4" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Members ({members.length})</span>
          {isOwner && (
            <button onClick={() => setShowAddDialog(true)} style={{
              marginLeft: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--muted-foreground))'
            }}>Add</button>
          )}
        </div>
      </div>

      {/* Members list */}
      <div style={{ overflow: "auto", flex: 1 }}>
        {members.length === 0 ? (
          <div style={{
            padding: "16px",
            textAlign: "center",
            fontSize: "12px",
            color: "hsl(var(--muted-foreground))",
          }}>
            No members
          </div>
        ) : (
          members.map((member) => {
            const isRoomOwner = ownerId === member.id;

            return (
            <div
              key={member.id}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid hsl(var(--border))",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "13px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(var(--muted))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {/* Avatar */}
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "600",
                fontSize: "12px",
                flexShrink: 0,
              }}>
                {member.username.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: "500",
                  color: "hsl(var(--foreground))",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <span>{member.username}</span>
                  {isRoomOwner && (
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "hsl(var(--primary))",
                      background: "hsl(var(--primary) / 0.12)",
                      borderRadius: "999px",
                      padding: "2px 6px",
                      flexShrink: 0,
                    }}>
                      Owner
                    </span>
                  )}
                </div>
                {member.name && (
                  <div style={{
                    fontSize: "11px",
                    color: "hsl(var(--muted-foreground))",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {member.name}
                  </div>
                )}
              </div>

              {/* Online indicator */}
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981",
                flexShrink: 0,
              }} title="Online" />
            </div>
            )
          })
        )}
      </div>

      {isOwner && showAddDialog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }} onClick={() => setShowAddDialog(false)}>
          <div
            style={{
              background: 'hsl(var(--background))',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              width: '90%',
              maxWidth: '400px',
              maxHeight: '500px',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: '16px',
              borderBottom: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: '600', fontSize: '15px' }}>Add Member</span>
              <button
                onClick={() => setShowAddDialog(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid hsl(var(--border))',
                    padding: '8px',
                    borderRadius: '6px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {loadingUsers ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                  {availableUsers.length === 0 ? 'All users are already members' : 'No users found'}
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid hsl(var(--border))' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{user.username?.[0]?.toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{user.username}</div>
                        <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{user.name}</div>
                      </div>
                    </div>
                    <button onClick={() => handleAddMember(user.id)} disabled={addingUser === user.id} style={{ padding: '6px 10px', borderRadius: 6, background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', border: 'none' }}>{addingUser === user.id ? 'Adding...' : 'Add'}</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
