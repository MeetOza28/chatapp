import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Room(Base):
    __tablename__ = "room"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )
    owner_id: Mapped[str | None] = mapped_column(
        String(36),
        # Use just the table name — SQLAlchemy resolves it.
        # "user" is a reserved word in PostgreSQL but SQLAlchemy
        # handles quoting automatically when it sees the mapped table.
        ForeignKey("user.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    members: Mapped[list["RoomMember"]] = relationship(
        "RoomMember",
        back_populates="room",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Room id={self.id} name={self.name}>"


class RoomMember(Base):
    __tablename__ = "room_member"

    room_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("room.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        # Same fix — just "user.id" not '"user".id'
        ForeignKey("user.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    room: Mapped["Room"] = relationship(
        "Room",
        back_populates="members",
    )
    user: Mapped["User"] = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<RoomMember room={self.room_id} user={self.user_id}>"